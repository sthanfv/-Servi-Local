import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isAdmin } from "@/lib/auth";
import { CheckCircle, XCircle, Users, Activity, Star, Plus, Edit, Trash2, Eye, MessageCircle, Heart } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Service, Category, Suggestion, Donation, SupportTicket } from "@shared/schema";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: pendingServices } = useQuery<Service[]>({
    queryKey: ["/api/admin/services/pending"],
    enabled: isAdmin(user),
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: suggestions } = useQuery<Suggestion[]>({
    queryKey: ["/api/suggestions"],
    enabled: isAdmin(user),
  });

  const { data: donations } = useQuery<Donation[]>({
    queryKey: ["/api/donations"],
    enabled: isAdmin(user),
  });

  const { data: supportTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    enabled: isAdmin(user),
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
    },
  });

  const approveServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/services/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services/pending"] });
      toast({
        title: "Servicio aprobado",
        description: "El servicio ha sido aprobado exitosamente.",
      });
    },
  });

  const featureServiceMutation = useMutation({
    mutationFn: async ({ id, featured }: { id: number; featured: boolean }) => {
      return apiRequest("PATCH", `/api/services/${id}/feature`, { featured });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services/pending"] });
      toast({
        title: featured ? "Servicio destacado" : "Servicio no destacado",
        description: "El estado del servicio ha sido actualizado.",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      return apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente.",
      });
      setCategoryDialogOpen(false);
      categoryForm.reset();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CategoryFormData }) => {
      return apiRequest("PUT", `/api/categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente.",
      });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente.",
      });
    },
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: number; status: string; response?: string }) => {
      return apiRequest("PATCH", `/api/suggestions/${id}/status`, { status, adminResponse: response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      toast({
        title: "Sugerencia actualizada",
        description: "El estado de la sugerencia ha sido actualizado.",
      });
    },
  });

  const onCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
    });
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  if (!isAdmin(user)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Acceso Restringido
            </h1>
            <p className="text-muted-foreground mb-8">
              Solo los administradores pueden acceder a esta sección.
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
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Panel de Administración
          </h1>
          <p className="text-lg text-muted-foreground">
            Gestiona la plataforma ServiLocal
          </p>
        </div>
      </section>

      {/* Dashboard Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="services">Servicios</TabsTrigger>
              <TabsTrigger value="categories">Categorías</TabsTrigger>
              <TabsTrigger value="suggestions">Sugerencias</TabsTrigger>
              <TabsTrigger value="donations">Donaciones</TabsTrigger>
              <TabsTrigger value="support">Soporte</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stats?.services || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Servicios</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stats?.providers || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Proveedores</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 text-accent" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stats?.reviews || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Reseñas</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {suggestions?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Sugerencias</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {donations?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Donaciones</div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Services */}
              <Card>
                <CardHeader>
                  <CardTitle>Servicios Pendientes de Aprobación</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingServices && pendingServices.length > 0 ? (
                    <div className="space-y-4">
                      {pendingServices.slice(0, 5).map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                          <div>
                            <h4 className="font-semibold text-foreground">{service.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {service.location} • {service.contactEmail}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              className="btn-secondary"
                              onClick={() => approveServiceMutation.mutate(service.id)}
                              disabled={approveServiceMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => featureServiceMutation.mutate({ id: service.id, featured: true })}
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Destacar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No hay servicios pendientes de aprobación.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Servicios Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingServices && pendingServices.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Ubicación</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell className="font-medium">{service.title}</TableCell>
                            <TableCell>{service.contactEmail}</TableCell>
                            <TableCell>{service.location}</TableCell>
                            <TableCell>
                              {format(new Date(service.createdAt!), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  className="btn-secondary"
                                  onClick={() => approveServiceMutation.mutate(service.id)}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => featureServiceMutation.mutate({ id: service.id, featured: true })}
                                >
                                  <Star className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No hay servicios pendientes.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Gestión de Categorías</h2>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="btn-primary" onClick={() => {
                      setEditingCategory(null);
                      categoryForm.reset();
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <Form {...categoryForm}>
                      <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input placeholder="Ej: Tecnología" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={categoryForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Descripción de la categoría..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={categoryForm.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Icono (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del icono" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCategoryDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            className="btn-primary"
                            disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                          >
                            {editingCategory ? "Actualizar" : "Crear"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories?.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? "default" : "secondary"}>
                              {category.isActive ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sugerencias de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  {suggestions && suggestions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Asunto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suggestions.map((suggestion) => (
                          <TableRow key={suggestion.id}>
                            <TableCell>{suggestion.name}</TableCell>
                            <TableCell>{suggestion.email}</TableCell>
                            <TableCell>{suggestion.subject}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  suggestion.status === 'resolved' ? 'default' :
                                  suggestion.status === 'reviewed' ? 'secondary' : 'outline'
                                }
                              >
                                {suggestion.status === 'pending' ? 'Pendiente' :
                                 suggestion.status === 'reviewed' ? 'Revisado' : 'Resuelto'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(suggestion.createdAt!), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateSuggestionMutation.mutate({ 
                                    id: suggestion.id, 
                                    status: 'reviewed' 
                                  })}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="btn-secondary"
                                  onClick={() => updateSuggestionMutation.mutate({ 
                                    id: suggestion.id, 
                                    status: 'resolved' 
                                  })}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No hay sugerencias disponibles.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Donaciones Recibidas</CardTitle>
                </CardHeader>
                <CardContent>
                  {donations && donations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donante</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donations.map((donation) => (
                          <TableRow key={donation.id}>
                            <TableCell>{donation.donorName}</TableCell>
                            <TableCell>{donation.donorEmail}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                minimumFractionDigits: 0,
                              }).format(donation.amount / 100)}
                            </TableCell>
                            <TableCell className="capitalize">{donation.paymentMethod || "-"}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  donation.status === 'completed' ? 'default' :
                                  donation.status === 'pending' ? 'secondary' : 'destructive'
                                }
                              >
                                {donation.status === 'pending' ? 'Pendiente' :
                                 donation.status === 'completed' ? 'Completada' : 'Fallida'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(donation.createdAt!), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No hay donaciones registradas.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets de Soporte</CardTitle>
                </CardHeader>
                <CardContent>
                  {supportTickets && supportTickets.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket #</TableHead>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Asunto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Prioridad</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supportTickets.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-mono">{ticket.ticketNumber}</TableCell>
                            <TableCell>{ticket.name}</TableCell>
                            <TableCell>{ticket.email}</TableCell>
                            <TableCell>{ticket.subject}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  ticket.status === 'resolved' ? 'default' :
                                  ticket.status === 'in_progress' ? 'secondary' : 'outline'
                                }
                              >
                                {ticket.status === 'open' ? 'Abierto' :
                                 ticket.status === 'in_progress' ? 'En Progreso' :
                                 ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  ticket.priority === 'urgent' ? 'destructive' :
                                  ticket.priority === 'high' ? 'secondary' : 'outline'
                                }
                              >
                                {ticket.priority === 'low' ? 'Baja' :
                                 ticket.priority === 'medium' ? 'Media' :
                                 ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(ticket.createdAt!), "dd/MM/yyyy", { locale: es })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No hay tickets de soporte.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
