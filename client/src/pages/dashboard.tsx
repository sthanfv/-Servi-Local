import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ServiceCard from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getDisplayName, isProvider } from "@/lib/auth";
import { Plus, Edit, Trash2, Clock, CheckCircle, XCircle, Star, Users, Activity, TrendingUp } from "lucide-react";
import type { Service, Category, InsertService } from "@shared/schema";

const serviceSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  categoryId: z.string().min(1, "La categoría es requerida"),
  price: z.string().optional(),
  location: z.string().min(1, "La ubicación es requerida"),
  contactPhone: z.string().min(1, "El teléfono es requerido"),
  contactEmail: z.string().email("Email inválido"),
  availability: z.string().min(1, "La disponibilidad es requerida"),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: userServices, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/user/services"],
    enabled: !!user,
  });

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      price: "",
      location: "",
      contactPhone: "",
      contactEmail: user?.email || "",
      availability: "",
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const serviceData: InsertService = {
        ...data,
        categoryId: parseInt(data.categoryId),
        price: data.price ? parseInt(data.price) * 100 : null, // Convert to cents
        userId: user!.id,
      };
      return apiRequest("POST", "/api/services", serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/services"] });
      toast({
        title: "Servicio creado",
        description: "Tu servicio ha sido enviado para revisión.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el servicio",
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: { id: number; service: Partial<ServiceFormData> }) => {
      const serviceData = {
        ...data.service,
        categoryId: data.service.categoryId ? parseInt(data.service.categoryId) : undefined,
        price: data.service.price ? parseInt(data.service.price) * 100 : null,
      };
      return apiRequest("PUT", `/api/services/${data.id}`, serviceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/services"] });
      toast({
        title: "Servicio actualizado",
        description: "Los cambios han sido guardados.",
      });
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el servicio",
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/services"] });
      toast({
        title: "Servicio eliminado",
        description: "El servicio ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el servicio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateServiceMutation.mutate({ id: editingService.id, service: data });
    } else {
      createServiceMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    const category = categories?.find(c => c.id === service.categoryId);
    form.reset({
      title: service.title,
      description: service.description || "",
      categoryId: service.categoryId.toString(),
      price: service.price ? (service.price / 100).toString() : "",
      location: service.location || "",
      contactPhone: service.contactPhone || "",
      contactEmail: service.contactEmail || "",
      availability: service.availability || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este servicio?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  const stats = {
    total: userServices?.length || 0,
    approved: userServices?.filter(s => s.isApproved).length || 0,
    pending: userServices?.filter(s => !s.isApproved).length || 0,
    featured: userServices?.filter(s => s.isFeatured).length || 0,
  };

  if (!isProvider(user)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Acceso Restringido
            </h1>
            <p className="text-muted-foreground mb-8">
              Necesitas permisos de proveedor para acceder a esta sección.
            </p>
            <Button asChild>
              <a href="/api/logout">Cambiar de Cuenta</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Mi Panel de Control
              </h1>
              <p className="text-lg text-muted-foreground">
                Bienvenido, {getDisplayName(user)}
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary" onClick={() => {
                  setEditingService(null);
                  form.reset({
                    title: "",
                    description: "",
                    categoryId: "",
                    price: "",
                    location: "",
                    contactPhone: "",
                    contactEmail: user?.email || "",
                    availability: "",
                  });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingService ? "Editar Servicio" : "Crear Nuevo Servicio"}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título del Servicio</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Reparación de electrodomésticos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoría</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona una categoría" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories?.map((category) => (
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
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe tu servicio en detalle..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Precio (COP) - Opcional</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="50000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ubicación</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Cúcuta, Centro" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Teléfono de Contacto</FormLabel>
                            <FormControl>
                              <Input placeholder="+57 300 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Contacto</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="availability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disponibilidad</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Lunes a Viernes 8:00 AM - 6:00 PM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingService(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        className="btn-primary"
                        disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
                      >
                        {createServiceMutation.isPending || updateServiceMutation.isPending ? (
                          <div className="loading-spinner mr-2" />
                        ) : null}
                        {editingService ? "Actualizar" : "Crear"} Servicio
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="services">Mis Servicios</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stats.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Servicios</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stats.approved}
                    </div>
                    <div className="text-sm text-muted-foreground">Aprobados</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stats.pending}
                    </div>
                    <div className="text-sm text-muted-foreground">Pendientes</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stats.featured}
                    </div>
                    <div className="text-sm text-muted-foreground">Destacados</div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Servicios Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="animate-pulse flex items-center space-x-4">
                          <div className="w-12 h-12 bg-muted rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/3"></div>
                            <div className="h-3 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userServices && userServices.length > 0 ? (
                    <div className="space-y-4">
                      {userServices.slice(0, 5).map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                              <Activity className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">{service.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {service.location} • {service.availability}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {service.isApproved ? (
                              <Badge className="bg-secondary text-secondary-foreground">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Aprobado
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                            {service.isFeatured && (
                              <Badge className="bg-purple-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Destacado
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Plus className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Aún no tienes servicios
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Crea tu primer servicio para empezar a recibir clientes
                      </p>
                      <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Primer Servicio
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <Card>
                        <div className="w-full h-48 bg-muted"></div>
                        <CardContent className="p-6 space-y-3">
                          <div className="h-4 bg-muted rounded w-1/4"></div>
                          <div className="h-6 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-full"></div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              ) : userServices && userServices.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userServices.map((service) => {
                    const category = categories?.find(c => c.id === service.categoryId);
                    return (
                      <div key={service.id} className="relative">
                        <ServiceCard service={service} category={category} />
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {service.isApproved ? (
                            <Badge className="bg-secondary text-secondary-foreground">
                              Aprobado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-background">
                              Pendiente
                            </Badge>
                          )}
                          {service.isFeatured && (
                            <Badge className="bg-purple-500 text-white">
                              Destacado
                            </Badge>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(service)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Aún no tienes servicios
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Crea tu primer servicio para empezar a recibir clientes
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Servicio
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
