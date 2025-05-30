import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Search, UserPlus, Star, Clock } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";

export default function HeroSection() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  return (
    <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-4">
              <Badge variant="secondary" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Conectando Cúcuta
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                Encuentra los mejores
                <span className="gradient-text block mt-2">
                  servicios locales
                </span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Conectamos a personas con proveedores de servicios confiables en Cúcuta y Norte de Santander. 
                Desde reparaciones del hogar hasta servicios profesionales.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="btn-primary">
                <Link href="/services">
                  <Search className="w-5 h-5 mr-2" />
                  Explorar Servicios
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="hover-lift">
                <a href="/api/login">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Ser Proveedor
                </a>
              </Button>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {stats?.services || '500+'}
                </div>
                <div className="text-sm text-muted-foreground">Servicios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {stats?.providers || '150+'}
                </div>
                <div className="text-sm text-muted-foreground">Proveedores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {stats?.reviews || '2,000+'}
                </div>
                <div className="text-sm text-muted-foreground">Reseñas</div>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <img 
              src="https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Proveedor de servicios profesional" 
              className="rounded-2xl shadow-2xl w-full h-auto trust-shadow"
            />
            
            {/* Floating cards */}
            <div className="absolute -top-4 -left-4 bg-card rounded-lg shadow-lg p-4 transform rotate-3 animate-scale-in trust-shadow">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <div className="font-semibold text-sm">4.9/5</div>
                  <div className="text-xs text-muted-foreground">Calificación</div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-card rounded-lg shadow-lg p-4 transform -rotate-3 animate-scale-in action-shadow">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="font-semibold text-sm">24h</div>
                  <div className="text-xs text-muted-foreground">Respuesta</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
