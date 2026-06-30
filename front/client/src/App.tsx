import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/PaginaNaoEncontrada";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./pages/Autenticacao";
import Dashboard from "./pages/Painel";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {isAuthenticated
        ? [
            <Route key="root" path={"/"} component={Dashboard} />,
            <Route key="dashboard" path={"/dashboard"} component={Dashboard} />,
            <Route key="not-found-404" path={"/404"} component={NotFound} />,
            <Route key="catch-all" component={NotFound} />,
          ]
        : [
            <Route key="root" path={"/"} component={Login} />,
            <Route key="login" path={"/login"} component={Login} />,
            <Route key="not-found-404" path={"/404"} component={NotFound} />,
            <Route key="catch-all" component={Login} />,
          ]}
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
