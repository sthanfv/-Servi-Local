import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import HeroSection from "@/components/hero-section";
import SearchBar from "@/components/search-bar";
import CategoryGrid from "@/components/category-grid";
import ServiceCard from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, CheckCircle, HelpCircle, BookOpen, MessageCircle, Lightbulb, UserPlus, TrendingUp, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import type { Service } from "@shared/schema";

export default function Landing() {
  const { data: featuredServices, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services", { featured: true }],
    queryFn: async () => {
      const res = await fetch("/api/services?approved=true");
      const services = await res.json();
      return services.filter((s: Service) => s.isFeatured).slice(0, 3);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Search Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">¿Qué servicio necesitas?</h2>
            <p className="text-lg text-muted-foreground">Busca entre cientos de servicios profesionales en tu área</p>
          </div>

          <SearchBar className="mb-12" />

          {/* Categories */}
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-foreground text-center">Categorías Populares</h3>
            <CategoryGrid />
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Servicios Destacados</h2>
            <p className="text-lg text-muted-foreground">Los proveedores mejor calificados en tu área</p>
          </div>

          {servicesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => (
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
          ) : featuredServices && featuredServices.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredServices.map((service) => (
                <ServiceCard 
                  key={service.id} 
                  service={service}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay servicios destacados disponibles.</p>
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

      {/* How It Works */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">¿Cómo Funciona?</h2>
            <p className="text-lg text-muted-foreground">Conectarte con servicios locales nunca fue tan fácil</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">1. Busca</h3>
              <p className="text-muted-foreground">Explora cientos de servicios locales categorizados por especialidad y ubicación.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-secondary/20 transition-colors">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">2. Conecta</h3>
              <p className="text-muted-foreground">Contacta directamente con proveedores verificados y lee reseñas de otros usuarios.</p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-accent/20 transition-colors">
                <CheckCircle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">3. Contrata</h3>
              <p className="text-muted-foreground">Recibe el servicio que necesitas y deja tu reseña para ayudar a otros usuarios.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Centro de Soporte</h2>
            <p className="text-lg text-muted-foreground">Encuentra respuestas rápidas o contacta nuestro equipo</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/support#faq">
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover-lift">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">FAQ</h3>
                  <p className="text-sm text-muted-foreground mb-4">Preguntas frecuentes sobre nuestros servicios</p>
                  <span className="text-primary hover:text-primary/80 font-medium text-sm">
                    Ver FAQ →
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/support#guides">
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover-lift">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Guías</h3>
                  <p className="text-sm text-muted-foreground mb-4">Tutoriales paso a paso para usar la plataforma</p>
                  <span className="text-primary hover:text-primary/80 font-medium text-sm">
                    Ver Guías →
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/support#contact">
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover-lift">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                    <MessageCircle className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Contacto</h3>
                  <p className="text-sm text-muted-foreground mb-4">Envía un ticket de soporte directamente</p>
                  <span className="text-primary hover:text-primary/80 font-medium text-sm">
                    Contactar →
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/suggestions">
              <Card className="hover:shadow-md transition-shadow cursor-pointer hover-lift">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    <Lightbulb className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">Sugerencias</h3>
                  <p className="text-sm text-muted-foreground mb-4">Comparte ideas para mejorar la plataforma</p>
                  <span className="text-primary hover:text-primary/80 font-medium text-sm">
                    Sugerir →
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Provider CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="text-3xl font-bold mb-4">¿Tienes un Servicio que Ofrecer?</h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Únete a nuestra comunidad de proveedores y conecta con cientos de clientes potenciales en Cúcuta
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Registro Gratis</h3>
                <p className="text-primary-100 text-sm">Crea tu perfil y empieza a recibir clientes</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Haz Crecer tu Negocio</h3>
                <p className="text-primary-100 text-sm">Aumenta tu visibilidad y clientes recurrentes</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Confianza y Seguridad</h3>
                <p className="text-primary-100 text-sm">Plataforma segura con sistema de reseñas</p>
              </div>
            </div>

            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <a href="/api/login">
                Registrarme como Proveedor
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
