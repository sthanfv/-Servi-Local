import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Target, Heart, Award, TrendingUp, Shield, Clock, Star, Globe, Mail, Phone } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  const stats = [
    { icon: Users, value: "500+", label: "Proveedores Activos", color: "text-primary" },
    { icon: Star, value: "2,000+", label: "Reseñas Positivas", color: "text-secondary" },
    { icon: MapPin, value: "15+", label: "Barrios Cubiertos", color: "text-accent" },
    { icon: Clock, value: "24/7", label: "Disponibilidad", color: "text-purple-600" },
  ];

  const values = [
    {
      icon: Heart,
      title: "Compromiso Local",
      description: "Creemos en el poder de la comunidad local para generar crecimiento económico sostenible.",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Shield,
      title: "Confianza y Seguridad",
      description: "Verificamos cada proveedor y protegemos la información de nuestros usuarios.",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Target,
      title: "Excelencia en Servicio",
      description: "Nos esforzamos por conectar usuarios con los mejores proveedores de servicios.",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: TrendingUp,
      title: "Innovación Continua",
      description: "Mejoramos constantemente nuestra plataforma basándonos en feedback de la comunidad.",
      color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
    }
  ];

  const team = [
    {
      name: "Carlos Mendoza",
      role: "Fundador & CEO",
      description: "Ingeniero de sistemas con 8 años de experiencia en desarrollo de plataformas digitales.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=300&h=300&fit=crop&crop=face",
      skills: ["Liderazgo", "Estrategia", "Tecnología"]
    },
    {
      name: "María González",
      role: "Directora de Operaciones",
      description: "Especialista en gestión de comunidades y desarrollo de negocios locales.",
      image: "https://images.unsplash.com/photo-1494790108755-2616c0763c0c?ixlib=rb-4.0.3&w=300&h=300&fit=crop&crop=face",
      skills: ["Operaciones", "Comunidad", "Procesos"]
    },
    {
      name: "Ana Rodríguez",
      role: "Desarrolladora Principal",
      description: "Full-stack developer con pasión por crear experiencias de usuario excepcionales.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&w=300&h=300&fit=crop&crop=face",
      skills: ["Frontend", "Backend", "UX/UI"]
    }
  ];

  const milestones = [
    {
      year: "2023",
      title: "Fundación de ServiLocal",
      description: "Inicio del proyecto con la misión de conectar la comunidad de Cúcuta"
    },
    {
      year: "2023",
      title: "Primeros 100 Proveedores",
      description: "Alcanzamos nuestro primer hito con servicios en todas las categorías principales"
    },
    {
      year: "2024",
      title: "Expansión Regional",
      description: "Ampliamos cobertura a Los Patios y Villa del Rosario"
    },
    {
      year: "2024",
      title: "500+ Proveedores Activos",
      description: "Consolidación como la plataforma líder de servicios locales en la región"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Cúcuta, Norte de Santander
                </Badge>
                
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Conectando
                  <span className="gradient-text block mt-2">
                    nuestra comunidad
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  ServiLocal nació de la visión de fortalecer la economía local de Cúcuta, 
                  conectando personas con servicios de calidad mientras apoyamos el crecimiento 
                  de emprendedores y pequeños negocios de nuestra región.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="btn-primary">
                  <Link href="/services">
                    Explorar Servicios
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="hover-lift">
                  <a href="/api/login">
                    Únete a Nosotros
                  </a>
                </Button>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1529400971008-f566de0e6dfc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
                alt="Comunidad de Cúcuta" 
                className="rounded-2xl shadow-2xl w-full h-auto trust-shadow"
              />
              
              {/* Floating cards */}
              <div className="absolute -top-4 -left-4 bg-card rounded-lg shadow-lg p-4 transform rotate-3 animate-scale-in">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">500+</div>
                    <div className="text-xs text-muted-foreground">Proveedores</div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-card rounded-lg shadow-lg p-4 transform -rotate-3 animate-scale-in">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">15+</div>
                    <div className="text-xs text-muted-foreground">Barrios</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestro Impacto</h2>
            <p className="text-lg text-muted-foreground">
              Números que reflejan nuestro compromiso con la comunidad
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-current/10 rounded-xl flex items-center justify-center mx-auto mb-4 ${stat.color}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Nuestra Misión</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Facilitar el acceso a servicios locales de calidad en Cúcuta y Norte de Santander, 
                  creando un ecosistema digital que impulse el crecimiento económico de pequeños 
                  emprendedores y mejore la calidad de vida de nuestra comunidad.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-secondary">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">Nuestra Visión</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Ser la plataforma líder en Colombia para la conexión de servicios locales, 
                  reconocida por la calidad de nuestros proveedores, la confianza de nuestros 
                  usuarios y nuestro impacto positivo en las economías locales.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestros Valores</h2>
            <p className="text-lg text-muted-foreground">
              Los principios que guían cada decisión que tomamos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow hover-lift">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${value.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <value.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestro Equipo</h2>
            <p className="text-lg text-muted-foreground">
              Las personas que hacen posible ServiLocal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow hover-lift">
                <CardContent className="p-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {member.description}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {member.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nuestra Historia</h2>
            <p className="text-lg text-muted-foreground">
              El camino que nos ha traído hasta aquí
            </p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">{milestone.year}</Badge>
                    <h3 className="text-xl font-semibold text-foreground">{milestone.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Contacta con Nosotros</h2>
            <p className="text-lg text-muted-foreground">
              Estamos aquí para responder tus preguntas y escuchar tus ideas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Email</h3>
                <p className="text-muted-foreground mb-4">Respuesta en 24 horas</p>
                <a href="mailto:contacto@servilocal.com" className="text-primary hover:underline">
                  contacto@servilocal.com
                </a>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Teléfono</h3>
                <p className="text-muted-foreground mb-4">Lun - Vie, 8 AM - 6 PM</p>
                <a href="tel:+573001234567" className="text-primary hover:underline">
                  +57 (300) 123-4567
                </a>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Oficina</h3>
                <p className="text-muted-foreground mb-4">Centro de Cúcuta</p>
                <p className="text-primary">
                  Cúcuta, Norte de Santander<br/>
                  Colombia
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-white">
            <h2 className="text-3xl font-bold mb-4">¿Listo para Formar Parte?</h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Únete a ServiLocal y sé parte de la transformación digital de nuestra comunidad
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link href="/services">
                  Buscar Servicios
                </Link>
              </Button>
              
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <a href="/api/login">
                  Ofrecer Servicios
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
