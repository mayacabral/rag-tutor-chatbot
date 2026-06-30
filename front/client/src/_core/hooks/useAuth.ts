// =============================================================================
// useAuth — versão LOCAL (mock)
//
// O `_core` original era injetado pela plataforma Manus (OAuth) e não veio
// nesta cópia do projeto. Para rodar localmente sem o servidor OAuth da Manus,
// este hook devolve um usuário autenticado fixo. Assim o app entra direto no
// dashboard e podemos ver a UI + o chat (que fala com a API Python).
//
// Para simular um usuário comum (layout de coluna única), troque role para "user".
// =============================================================================

export interface AuthUser {
  id: number;
  openId: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

export interface UseAuthResult {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: unknown;
  login: () => void;
  logout: () => void;
}

const MOCK_USER: AuthUser = {
  id: 1,
  openId: "local-dev",
  name: "Dev Local",
  email: "dev@local.test",
  role: "admin",
};

export function useAuth(): UseAuthResult {
  return {
    user: MOCK_USER,
    isAuthenticated: true,
    loading: false,
    error: null,
    login: () => {
      // no-op em modo local
    },
    logout: () => {
      // sem OAuth local: apenas recarrega a página
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
  };
}
