import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Send, CheckCircle, Users, TrendingUp, Heart, MessageSquare, Sparkles } from "lucide-react";

const suggestionSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  subject: z.string().min(1, "El asunto es requerido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

type SuggestionFormData = z.infer<typeof suggestionSchema>;

export default function Suggestions() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<SuggestionFormData>({
    resolver: zodResolver(suggestionSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const createSuggestionMutation = useMutation({
    mutationFn: async (data: SuggestionFormData) => {
      return apiRequest("POST", "/api/suggestions", data);
    },
    onSuccess: () => {
      toast({
        title: "¡Sugerencia enviada!",
        description: "Gracias por ayudarnos a mejorar ServiLocal. Revisaremos tu sugerencia pronto.",
      });
      setIsSubmitted(true);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la sugerencia",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SuggestionFormData) => {
    createSuggestionMutation.mutate(data);
  };

  const suggestionTypes = [
    {
      icon: TrendingUp,
      title: "Nuevas Funcionalidades",
      description: "Ideas para mejorar la plataforma con nuevas características",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Users,
      title: "Experiencia de Usuario",
      description: "Sugerencias para hacer la plataforma más fácil de usar",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Heart,
      title: "Servicios y Categorías",
      description: "Propuestas de nuevos servicios o categorías",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: MessageSquare,
      title: "Comunicación",
      description: "Ideas para mejorar la comunicación entre usuarios",
      color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Tu opinión importa
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Comparte tus 
            <span className="gradient-text"> Ideas</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ayúdanos a hacer de ServiLocal una plataforma aún mejor. 
            Tus sugerencias nos permiten evolucionar y servir mejor a nuestra comunidad.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">150+</div>
              <div className="text-sm text-muted-foreground">Sugerencias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">85%</div>
              <div className="text-sm text-muted-foreground">Implementadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">24h</div>
              <div className="text-sm text-muted-foreground">Respuesta</div>
            </div>
          </div>
        </div>
      </section>

      {/* Suggestion Types */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              ¿Qué tipo de sugerencia tienes?
            </h2>
            <p className="text-lg text-muted-foreground">
              Nos interesan todas las ideas que puedan mejorar ServiLocal
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {suggestionTypes.map((type, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow hover-lift">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${type.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Success Message */}
          {isSubmitted && (
            <div className="mb-8 animate-fade-in">
              <Card className="border-secondary bg-secondary/5">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    ¡Gracias por tu sugerencia!
                  </h3>
                  <p className="text-muted-foreground">
                    Hemos recibido tu idea y la revisaremos pronto. Te contactaremos si necesitamos más información.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suggestion Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Enviar Sugerencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre Completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu nombre" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="tu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asunto</FormLabel>
                          <FormControl>
                            <Input placeholder="Resumen breve de tu sugerencia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Describe tu Sugerencia</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Cuéntanos en detalle tu idea. ¿Qué problema resolvería? ¿Cómo mejoraría la experiencia?"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full btn-primary"
                      disabled={createSuggestionMutation.isPending}
                    >
                      {createSuggestionMutation.isPending ? (
                        <div className="loading-spinner mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Enviar Sugerencia
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Suggestions Matter */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Construyendo ServiLocal Juntos
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Impacto Real en la Comunidad
                    </h3>
                    <p className="text-muted-foreground">
                      Cada sugerencia implementada mejora la experiencia de miles de usuarios 
                      y proveedores en Cúcuta y Norte de Santander.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mt-1">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Innovación Continua
                    </h3>
                    <p className="text-muted-foreground">
                      Tus ideas nos ayudan a identificar oportunidades de mejora y 
                      nuevas funcionalidades que realmente necesita nuestra comunidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mt-1">
                    <Heart className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Reconocimiento a Contribuidores
                    </h3>
                    <p className="text-muted-foreground">
                      Valoramos y reconocemos a quienes nos ayudan a mejorar. 
                      Las mejores sugerencias son implementadas y sus autores destacados.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Lightbulb className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Tu Voz Importa
                </h3>
                <p className="text-muted-foreground mb-6">
                  Cada sugerencia es leída y considerada por nuestro equipo. 
                  Juntos estamos construyendo la mejor plataforma de servicios locales.
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">72h</div>
                    <div className="text-sm text-muted-foreground">Tiempo promedio de respuesta</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">85%</div>
                    <div className="text-sm text-muted-foreground">Sugerencias implementadas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Improvements */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Mejoras Recientes Implementadas
            </h2>
            <p className="text-lg text-muted-foreground">
              Estas funcionalidades nacieron de sugerencias de nuestra comunidad
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Sistema de Reseñas Mejorado
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Implementado basado en sugerencias para mayor transparencia
                </p>
                <Badge variant="secondary" className="text-xs">
                  Sugerencia de María G.
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Filtros Avanzados de Búsqueda
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Búsqueda por ubicación y rango de precios
                </p>
                <Badge variant="secondary" className="text-xs">
                  Sugerencia de Carlos M.
                </Badge>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Panel de Control Mejorado
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Interface más intuitiva para proveedores
                </p>
                <Badge variant="secondary" className="text-xs">
                  Sugerencia de Ana R.
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
