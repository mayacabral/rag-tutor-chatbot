import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function Header() {
  const { user, logout } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      logout();
      toast.success("Desconectado com sucesso");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">RAG</span>
        </div>
        <h1 className="text-xl font-bold text-white">RAG Tutor System</h1>
      </div>

      <div className="flex items-center gap-4">
        {user?.role === "admin" && (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full border border-blue-500/30">
            Admin
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm text-slate-300">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
            <div className="px-2 py-1.5">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <DropdownMenuSeparator className="bg-slate-700" />
            {user?.role === "admin" && (
              <>
                <DropdownMenuItem className="text-slate-300 cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
              </>
            )}
            <DropdownMenuItem className="text-slate-300 cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 cursor-pointer focus:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
