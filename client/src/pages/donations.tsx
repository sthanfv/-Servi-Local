import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Heart, CreditCard, Banknote, Smartphone, Users, Server, Coffee, CheckCircle } from "lucide-react";

const donationSchema = z.object({
  donorName: z.string().min(1, "El nombre es requerido"),
  donorEmail: z.string().email("Email inválido"),
  amount: z.string().min(1, "El monto es requerido").refine((val) => {
    const amount = parseFloat(val);
    return amount >= 5000; // Minimum 5,000 COP
  }, "El monto mínimo es $5,000 COP"),
  message: z.string().optional(),
  paymentMethod: z.string().min(1, "Selecciona un método de pago"),
});

type DonationFormData = z.infer<typeof donationSchema>;

export default function Donations() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<string>("");

  const form = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donorName: "",
      donorEmail: "",
      amount: "",
      message: "",
      paymentMethod: "",
    },
  });

  const createDonationMutation = useMutation({
    mutationFn: async (data: DonationFormData) => {
      return apiRequest("POST", "/api/donations", {
        ...data,
        amount: parseInt(data.amount) * 100, // Convert to cents
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Donación registrada!",
        description: "Gracias por tu generosa contribución. Recibirás información de pago por email.",
      });
      setIsSubmitted(true);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la donación",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DonationFormData) => {
    createDonationMutation.mutate(data);
  };

  const predefinedAmounts = [
    { value: "10000", label: "$10,000" },
    { value: "25000", label: "$25,000" },
    { value: "50000", label: "$50,000" },
    { value: "100000", label: "$100,000" },
  ];

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    form.setValue("amount", amount);
  };

  const usageAreas = [
    {
      icon: Server,
      title: "Infraestructura y Hosting",
      percentage: 40,
      description: "Servidores, bases de datos y herramientas de desarrollo",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Users,
      title: "Desarrollo y Mejoras",
      percentage: 35,
      description: "Nuevas funcionalidades y mejoras de la plataforma",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Coffee,
      title: "Equipo y Operaciones",
      percentage: 20,
      description: "Costos operativos y apoyo al equipo de desarrollo",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: Heart,
      title: "Programas Comunitarios",
      percentage: 5,
      description: "Iniciativas para apoyar a la comunidad local",
      color: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
    }
  ];

  const paymentMethods = [
    {
      value: "card",
      label: "Tarjeta de Crédito/Débito",
      icon: CreditCard,
      description: "Visa, Mastercard, American Express"
    },
    {
      value: "transfer",
      label: "Transferencia Bancaria",
      icon: Banknote,
      description: "Transferencia directa a nuestra cuenta"
    },
    {
      value: "paypal",
      label: "PayPal",
      icon: Smartphone,
      description: "Pago seguro con PayPal"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
            <Heart className="w-4 h-4 mr-2" />
            Apoya nuestro crecimiento
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Ayuda a mantener
            <span className="gradient-text"> ServiLocal</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tu donación nos permite seguir conectando a la comunidad de Cúcuta con 
            servicios locales de calidad, manteniendo la plataforma gratuita y accesible para todos.
          </p>

          {/* Impact Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Transparente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">0%</div>
              <div className="text-sm text-muted-foreground">Comisiones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">Local</div>
              <div className="text-sm text-muted-foreground">Impacto</div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Breakdown */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              ¿Cómo usamos las donaciones?
            </h2>
            <p className="text-lg text-muted-foreground">
              Transparencia total en el uso de los fondos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {usageAreas.map((area, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow hover-lift">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${area.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <area.icon className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-2">
                    {area.percentage}%
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{area.title}</h3>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
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
                    ¡Gracias por tu donación!
                  </h3>
                  <p className="text-muted-foreground">
                    Hemos recibido tu solicitud de donación. Te enviaremos la información de pago por email.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Donation Form */}
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent" />
                  Realizar Donación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Amount Selection */}
                    <div>
                      <FormLabel className="text-base font-medium mb-4 block">
                        Selecciona un monto
                      </FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {predefinedAmounts.map((amount) => (
                          <Button
                            key={amount.value}
                            type="button"
                            variant={selectedAmount === amount.value ? "default" : "outline"}
                            className="h-12"
                            onClick={() => handleAmountSelect(amount.value)}
                          >
                            {amount.label}
                          </Button>
                        ))}
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>O ingresa otro monto (COP)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Monto en pesos colombianos"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  setSelectedAmount("");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Donor Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="donorName"
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
                        name="donorEmail"
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

                    {/* Payment Method */}
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Método de Pago Preferido</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un método de pago" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  <div className="flex items-center gap-2">
                                    <method.icon className="w-4 h-4" />
                                    <div>
                                      <div className="font-medium">{method.label}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {method.description}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Optional Message */}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mensaje (Opcional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Comparte tus pensamientos o motivación para donar..."
                              className="min-h-[80px]"
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
                      disabled={createDonationMutation.isPending}
                    >
                      {createDonationMutation.isPending ? (
                        <div className="loading-spinner mr-2" />
                      ) : (
                        <Heart className="w-4 h-4 mr-2" />
                      )}
                      Proceder con la Donación
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Recibirás un email con los detalles de pago y confirmación de tu donación.
                      Todas las donaciones son voluntarias y no reembolsables.
                    </p>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Donate */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">
                Por qué tu donación importa
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Plataforma Gratuita para Todos
                    </h3>
                    <p className="text-muted-foreground">
                      Mantenemos ServiLocal completamente gratuito para usuarios y proveedores, 
                      eliminando barreras para el acceso a servicios de calidad.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mt-1">
                    <Server className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Infraestructura Confiable
                    </h3>
                    <p className="text-muted-foreground">
                      Tus donaciones nos permiten mantener servidores rápidos y seguros, 
                      garantizando que la plataforma esté siempre disponible.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mt-1">
                    <Heart className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Apoyo a la Economía Local
                    </h3>
                    <p className="text-muted-foreground">
                      Cada donación contribuye directamente al crecimiento de pequeños negocios 
                      y emprendedores en nuestra región.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Heart className="w-10 h-10 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Impacto Directo
                </h3>
                <p className="text-muted-foreground mb-6">
                  Con tu apoyo, hemos logrado conectar a más de 500 proveedores 
                  con miles de clientes, generando oportunidades reales de crecimiento.
                </p>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">500+</div>
                    <div className="text-sm text-muted-foreground">Proveedores activos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">2,000+</div>
                    <div className="text-sm text-muted-foreground">Conexiones realizadas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recognition */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Reconocimientos Especiales
            </h2>
            <p className="text-lg text-muted-foreground">
              Agradecemos profundamente a quienes hacen posible nuestro trabajo
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Patrocinadores
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Donaciones de $100,000+ COP anuales
                </p>
                <div className="text-sm text-muted-foreground">
                  • Logo en la página principal<br/>
                  • Mención en redes sociales<br/>
                  • Certificado de reconocimiento
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Colaboradores
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Donaciones de $50,000+ COP anuales
                </p>
                <div className="text-sm text-muted-foreground">
                  • Mención en página de donaciones<br/>
                  • Acceso a estadísticas exclusivas<br/>
                  • Newsletter mensual
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Contribuidores
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Cualquier donación
                </p>
                <div className="text-sm text-muted-foreground">
                  • Agradecimiento personalizado<br/>
                  • Badge especial en el perfil<br/>
                  • Satisfacción de apoyar lo local
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
