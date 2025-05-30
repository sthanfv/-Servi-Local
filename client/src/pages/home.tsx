import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import SearchBar from "@/components/search-bar";
import CategoryGrid from "@/components/category-grid";
import ServiceCard from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getDisplayName } from "@/lib/auth";
import { Plus, Star, TrendingUp, Users, Activity, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Service } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();

  const { data: recentServices, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services", { recent: true }],
    queryFn: async () => {
      const res = await fetch("/api/services?approved=true");
      const services = await res.json();
      return services.slice(0, 6);
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: userServices } = useQuery<Service[]>({
    queryKey: ["/api/user/services"],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Welcome Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              ¡Bienvenido de vuelta, {getDisplayName(user)}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Descubre servicios locales o gestiona tu negocio en ServiLocal
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link href="/services">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Explorar Servicios</h3>
                  <p className="text-sm text-muted-foreground">Encuentra proveedores en tu área</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Ofrecer Servicio</h3>
                  <p className="text-sm text-muted-foreground">Publica tu servicio profesional</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/support">
              <Card className="hover:shadow-lg transition-all cursor-pointer hover-lift">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Centro de Ayuda</h3>
                  <p className="text-sm text-muted-foreground">Obtén soporte cuando lo necesites</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Search Bar */}
          <SearchBar />
        </div>
      </section>

      {/* Stats & Categories */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Platform Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-primary mb-2">
                  {stats?.services || '0'}
                </div>
                <div className="text-sm text-muted-foreground">Servicios Activos</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-secondary mb-2">
                  {stats?.providers || '0'}
                </div>
                <div className="text-sm text-muted-foreground">Proveedores</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-accent mb-2">
                  {stats?.reviews || '0'}
                </div>
                <div className="text-sm text-muted-foreground">Reseñas</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {stats?.categories || '0'}
                </div>
                <div className="text-sm text-muted-foreground">Categorías</div>
              </CardContent>
            </Card>
          </div>

          {/* Categories */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Categorías Populares</h2>
              <p className="text-lg text-muted-foreground">Encuentra servicios por categoría</p>
            </div>
            <CategoryGrid />
          </div>
        </div>
      </section>

      {/* User's Services or Recent Services */}
      {userServices && userServices.length > 0 ? (
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Tus Servicios</h2>
                <p className="text-muted-foreground">Gestiona y mejora tus servicios publicados</p>
              </div>
              <Button asChild className="btn-primary">
                <Link href="/dashboard">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Servicio
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userServices.slice(0, 3).map((service) => (
                <div key={service.id} className="relative">
                  <ServiceCard service={service} />
                  <div className="absolute top-3 right-3">
                    {service.isApproved ? (
                      <Badge className="bg-secondary text-secondary-foreground">
                        Aprobado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-background">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {userServices.length > 3 && (
              <div className="text-center mt-8">
                <Button asChild variant="outline">
                  <Link href="/dashboard">Ver Todos Mis Servicios</Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Servicios Recientes</h2>
              <p className="text-lg text-muted-foreground">Los servicios más recientes en la plataforma</p>
            </div>

            {servicesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <Card>
                      <div className="w-full h-48 bg-muted"></div>
                      <CardContent className="p-6 space-y-3">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : recentServices && recentServices.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay servicios disponibles.</p>
              </div>
            )}

            <div className="text-center mt-12">
              <Button asChild size="lg" className="btn-primary">
                <Link href="/services">
                  Ver Todos los Servicios
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
