import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, BookOpen, MessageCircle, Search, Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import type { SupportCategory, SupportArticle, FaqItem } from "@shared/schema";

const contactSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  subject: z.string().min(1, "El asunto es requerido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
  categoryId: z.string().optional(),
  priority: z.string().default("medium"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Support() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: supportCategories } = useQuery<SupportCategory[]>({
    queryKey: ["/api/support/categories"],
  });

  const { data: supportArticles } = useQuery<SupportArticle[]>({
    queryKey: ["/api/support/articles"],
  });

  const { data: faqItems } = useQuery<FaqItem[]>({
    queryKey: ["/api/support/faq"],
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
      categoryId: "",
      priority: "medium",
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/support/tickets", {
        ...data,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
      });
    },
    onSuccess: (response) => {
      const ticket = response;
      toast({
        title: "Ticket creado exitosamente",
        description: `Tu ticket #${ticket.ticketNumber} ha sido enviado. Te contactaremos pronto.`,
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el ticket",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    createTicketMutation.mutate(data);
  };

  const filteredFAQs = faqItems?.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredArticles = supportArticles?.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Centro de Soporte
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Encuentra respuestas a tus preguntas o contacta con nuestro equipo de soporte
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar en FAQ y artículos..."
              className="pl-12 pr-4 py-3 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Support Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="faq" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="guides">Guías</TabsTrigger>
              <TabsTrigger value="contact">Contacto</TabsTrigger>
              <TabsTrigger value="info">Información</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" id="faq">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Preguntas Frecuentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredFAQs.length > 0 ? (
                    <Accordion type="single" collapsible className="space-y-2">
                      {filteredFAQs.map((faq) => (
                        <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : searchQuery ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No se encontraron preguntas que coincidan con "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="animate-pulse space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-12 bg-muted rounded"></div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guides" id="guides">
              <div className="grid md:grid-cols-2 gap-6">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          {article.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          {article.excerpt || article.content.substring(0, 150) + "..."}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {article.views || 0} visualizaciones
                          </span>
                          <Button variant="outline" size="sm">
                            Leer más →
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : searchQuery ? (
                  <div className="col-span-2 text-center py-8">
                    <p className="text-muted-foreground">
                      No se encontraron artículos que coincidan con "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 bg-muted rounded"></div>
                          <div className="h-4 bg-muted rounded w-2/3"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="contact" id="contact">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Contact Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Enviar Ticket de Soporte
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
                                <Input placeholder="Breve descripción del problema" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Categoría (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona una categoría" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {supportCategories?.map((category) => (
                                      <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Prioridad</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="low">Baja</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">Urgente</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mensaje</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe tu problema o consulta en detalle..."
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
                          disabled={createTicketMutation.isPending}
                        >
                          {createTicketMutation.isPending ? (
                            <div className="loading-spinner mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Enviar Ticket
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información de Contacto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-muted-foreground">soporte@servilocal.com</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                          <Phone className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">Teléfono</p>
                          <p className="text-muted-foreground">+57 (7) 123-4567</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">Dirección</p>
                          <p className="text-muted-foreground">Cúcuta, Norte de Santander</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">Horario de Atención</p>
                          <p className="text-muted-foreground">Lun - Vie: 8:00 AM - 6:00 PM</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tiempo de Respuesta</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Prioridad Baja:</span>
                          <span className="text-sm text-muted-foreground">2-3 días hábiles</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Prioridad Media:</span>
                          <span className="text-sm text-muted-foreground">1-2 días hábiles</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Prioridad Alta:</span>
                          <span className="text-sm text-muted-foreground">4-8 horas</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Prioridad Urgente:</span>
                          <span className="text-sm text-muted-foreground">1-2 horas</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="info">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Acerca de ServiLocal</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      ServiLocal es la plataforma líder en Cúcuta para conectar usuarios con 
                      proveedores de servicios locales confiables. Nuestra misión es facilitar 
                      el acceso a servicios de calidad mientras apoyamos el crecimiento de los 
                      negocios locales.
                    </p>
                    <p className="text-muted-foreground">
                      Desde servicios del hogar hasta consultoría profesional, en ServiLocal 
                      encontrarás exactamente lo que necesitas con la garantía de calidad que 
                      mereces.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>¿Por qué elegir ServiLocal?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">Proveedores Verificados</p>
                          <p className="text-sm text-muted-foreground">
                            Todos nuestros proveedores pasan por un proceso de verificación
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">Sistema de Reseñas</p>
                          <p className="text-sm text-muted-foreground">
                            Lee opiniones reales de otros usuarios antes de contratar
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-accent rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">Soporte 24/7</p>
                          <p className="text-sm text-muted-foreground">
                            Nuestro equipo está aquí para ayudarte cuando lo necesites
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></div>
                        </div>
                        <div>
                          <p className="font-medium">Precios Transparentes</p>
                          <p className="text-sm text-muted-foreground">
                            Sin costos ocultos, precios claros desde el inicio
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
