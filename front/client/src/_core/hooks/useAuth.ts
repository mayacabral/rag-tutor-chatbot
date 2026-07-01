// =============================================================================
// useAuth — autenticação LOCAL com credenciais mocadas
//
// Substitui o OAuth original da plataforma Manus. Mantém um store simples
// (módulo + useSyncExternalStore) compartilhado entre os componentes, com a
// sessão persistida em localStorage. Começa DESLOGADO -> a tela de login aparece.
//
// Credenciais de teste:
//   admin@tutor.com / admin123   (admin — vê sidebar + painel)
//   aluno@tutor.com / aluno123   (user  — só o chat)
// =============================================================================
import { useSyncExternalStore } from "react";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface MockUser extends AuthUser {
  password: string;
}

const MOCK_USERS: MockUser[] = [
  { id: 1, name: "Administrador", email: "admin@tutor.com", password: "admin123", role: "admin" },
  { id: 2, name: "Aluno", email: "aluno@tutor.com", password: "aluno123", role: "user" },
];

const STORAGE_KEY = "tutor-auth-user";

function readStored(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

let currentUser: AuthUser | null = readStored();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setUser(user: AuthUser | null) {
  currentUser = user;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage indisponível — segue só em memória
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export interface LoginResult {
  ok: boolean;
  error?: string;
}

export function login(email: string, password: string): LoginResult {
  const found = MOCK_USERS.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
  );
  if (!found) {
    return { ok: false, error: "E-mail ou senha inválidos." };
  }
  const { password: _omit, ...user } = found;
  setUser(user);
  return { ok: true };
}

export function logout() {
  setUser(null);
}

export interface UseAuthResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: unknown;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const user = useSyncExternalStore(
    subscribe,
    () => currentUser,
    () => currentUser,
  );
  return {
    user,
    isAuthenticated: !!user,
    loading: false,
    error: null,
    login,
    logout,
  };
}
