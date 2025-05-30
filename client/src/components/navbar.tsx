import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Menu, User, Settings, LogOut, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDisplayName, getInitials, isAdmin, isProvider } from "@/lib/auth";
import { useState } from "react";

export default function Navbar() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/services", label: "Servicios" },
    { href: "/support", label: "Soporte" },
    { href: "/about", label: "Nosotros" }
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    return location.startsWith(href) && href !== "/";
  };

  return (
    <nav className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">ServiLocal</span>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <span className={`transition-colors cursor-pointer ${
                  isActive(item.href) 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-3">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <a href="/api/login">Iniciar Sesión</a>
                </Button>
                <Button className="btn-primary" asChild>
                  <a href="/api/login">Registrarse</a>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                {isProvider(user) && (
                  <Button size="sm" className="btn-accent hidden sm:inline-flex" asChild>
                    <Link href="/dashboard">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Servicio
                    </Link>
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.profileImageUrl || undefined} alt={getDisplayName(user)} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{getDisplayName(user)}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {isProvider(user) && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Mis Servicios</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {isAdmin(user) && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Administración</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <a href="/api/logout" className="cursor-pointer text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div 
                  className={`block px-3 py-2 text-base cursor-pointer rounded-md transition-colors ${
                    isActive(item.href) 
                      ? "text-primary bg-primary/10 font-medium" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </div>
              </Link>
            ))}
            
            {isAuthenticated && isProvider(user) && (
              <Link href="/dashboard">
                <div 
                  className="block px-3 py-2 text-base cursor-pointer rounded-md text-accent hover:bg-accent/10 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Nuevo Servicio
                </div>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
