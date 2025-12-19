import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success("Logout realizado com sucesso");
      window.location.href = "/";
    } catch {
      toast.error("Erro ao fazer logout");
    }
  };

  const navItems = [
    { href: "/", label: "Início" },
    { href: "/about", label: "Sobre" },
    { href: "/plans", label: "Planos" },
    { href: "/contact", label: "Contato" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex cursor-pointer items-center space-x-2 hover:opacity-80">
            <img
              src="/logo.jpeg"
              alt="Saúde e Pilates"
              className="h-12 w-12 rounded-full object-cover"
            />
            <span className="hidden text-lg font-semibold sm:inline-block">
              Saúde e Pilates
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span
                className={`cursor-pointer text-sm font-medium transition hover:text-primary ${
                  isActive(item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden items-center space-x-4 md:flex">
          {isAuthenticated ? (
            <>
              {user?.role === "admin" && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {user?.name || "Usuário"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <span className="w-full cursor-pointer">
                        Meu Painel
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/my-appointments">
                      <span className="w-full cursor-pointer">
                        Meus Agendamentos
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/my-plan">
                      <span className="w-full cursor-pointer">
                        Meu Plano
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <span className="w-full cursor-pointer">
                        Perfil
                      </span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-gradient-primary">
                  Cadastrar
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container space-y-4 py-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span
                  className={`block cursor-pointer text-sm font-medium ${
                    isActive(item.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </span>
              </Link>
            ))}

            <div className="space-y-2 border-t pt-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Meu Painel
                    </Button>
                  </Link>

                  <Link href="/my-appointments">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Meus Agendamentos
                    </Button>
                  </Link>

                  <Link href="/my-plan">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Meu Plano
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Entrar
                    </Button>
                  </Link>

                  <Link href="/register">
                    <Button
                      size="sm"
                      className="w-full bg-gradient-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Cadastrar
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

