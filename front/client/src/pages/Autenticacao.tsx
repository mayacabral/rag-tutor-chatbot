import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { navigateToLogin } from "@/const";
import { Loader2, BookOpen } from "lucide-react";

export default function Login() {
  const { loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RAG Tutor</h1>
          <p className="text-slate-400">Sistema Inteligente de Tutoria Baseado em IA</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="space-y-2">
            <CardTitle className="text-white">Bem-vindo</CardTitle>
            <CardDescription className="text-slate-400">
              Faça login para acessar o sistema de tutoria inteligente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                navigateToLogin();
              }}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 h-auto"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Entrar com Manus"
              )}
            </Button>

            {/* Features */}
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Funcionalidades:</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Chat inteligente com IA
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Histórico de conversas
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
                  Painel administrativo (para admins)
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-8">
          Ao fazer login, você concorda com nossos Termos de Serviço
        </p>
      </div>
    </div>
  );
}
