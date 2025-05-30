import { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SearchBar from "@/components/search-bar";
import ServiceCard from "@/components/service-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Filter, SlidersHorizontal, X, MapPin, DollarSign } from "lucide-react";
import type { Service, Category } from "@shared/schema";

export default function Services() {
  const [location, setLocation] = useLocation();
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'recent'
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: services, isLoading, refetch } = useQuery<Service[]>({
    queryKey: ["/api/services", localFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (localFilters.search) params.set('search', localFilters.search);
      if (localFilters.categoryId) params.set('categoryId', localFilters.categoryId);
      if (localFilters.location) params.set('location', localFilters.location);
      params.set('approved', 'true');
      
      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();
      
      // Apply client-side filtering for price range
      let filtered = data;
      if (localFilters.minPrice) {
        const minPrice = parseInt(localFilters.minPrice) * 100; // Convert to cents
        filtered = filtered.filter((s: Service) => !s.price || s.price >= minPrice);
      }
      if (localFilters.maxPrice) {
        const maxPrice = parseInt(localFilters.maxPrice) * 100; // Convert to cents
        filtered = filtered.filter((s: Service) => !s.price || s.price <= maxPrice);
      }
      
      // Apply sorting
      if (localFilters.sortBy === 'price-low') {
        filtered.sort((a: Service, b: Service) => (a.price || 0) - (b.price || 0));
      } else if (localFilters.sortBy === 'price-high') {
        filtered.sort((a: Service, b: Service) => (b.price || 0) - (a.price || 0));
      } else if (localFilters.sortBy === 'rating') {
        filtered.sort((a: Service, b: Service) => Number(b.rating || 0) - Number(a.rating || 0));
      }
      
      return filtered;
    },
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (localFilters.search) params.set('search', localFilters.search);
    if (localFilters.categoryId) params.set('category', localFilters.categoryId);
    if (localFilters.location) params.set('location', localFilters.location);
    
    const newUrl = params.toString() ? `/services?${params.toString()}` : '/services';
    if (newUrl !== location) {
      window.history.replaceState({}, '', newUrl);
    }
  }, [localFilters.search, localFilters.categoryId, localFilters.location, location]);

  const handleSearch = (query: string, searchLocation: string) => {
    setLocalFilters(prev => ({
      ...prev,
      search: query,
      location: searchLocation === 'cucuta' ? '' : searchLocation
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setLocalFilters({
      search: '',
      categoryId: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'recent'
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id.toString() === categoryId);
    return category?.name || '';
  };

  const activeFiltersCount = [
    localFilters.search,
    localFilters.categoryId,
    localFilters.location,
    localFilters.minPrice,
    localFilters.maxPrice
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Servicios Locales
            </h1>
            <p className="text-lg text-muted-foreground">
              Encuentra proveedores confiables en Cúcuta y Norte de Santander
            </p>
          </div>

          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Filters and Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-80">
              <div className="lg:sticky lg:top-24">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-foreground">Filtros</h3>
                      <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                          <Badge variant="secondary">{activeFiltersCount}</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFilters(!showFilters)}
                          className="lg:hidden"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                      {/* Category Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Categoría</Label>
                        <Select
                          value={localFilters.categoryId}
                          onValueChange={(value) => handleFilterChange('categoryId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todas las categorías" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas las categorías</SelectItem>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Location Filter */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Ubicación</Label>
                        <Select
                          value={localFilters.location}
                          onValueChange={(value) => handleFilterChange('location', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Todas las ubicaciones" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Todas las ubicaciones</SelectItem>
                            <SelectItem value="cucuta">Cúcuta</SelectItem>
                            <SelectItem value="los-patios">Los Patios</SelectItem>
                            <SelectItem value="villa-del-rosario">Villa del Rosario</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Price Range */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Rango de Precios (COP)</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Mínimo</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={localFilters.minPrice}
                              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Máximo</Label>
                            <Input
                              type="number"
                              placeholder="Sin límite"
                              value={localFilters.maxPrice}
                              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Sort Options */}
                      <div>
                        <Label className="text-sm font-medium mb-3 block">Ordenar por</Label>
                        <Select
                          value={localFilters.sortBy}
                          onValueChange={(value) => handleFilterChange('sortBy', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent">Más recientes</SelectItem>
                            <SelectItem value="rating">Mejor calificados</SelectItem>
                            <SelectItem value="price-low">Precio: menor a mayor</SelectItem>
                            <SelectItem value="price-high">Precio: mayor a menor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {activeFiltersCount > 0 && (
                        <>
                          <Separator />
                          <Button
                            variant="outline"
                            onClick={clearFilters}
                            className="w-full"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Limpiar Filtros
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Results */}
            <div className="flex-1">
              {/* Active Filters */}
              {activeFiltersCount > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {localFilters.search && (
                      <Badge variant="secondary" className="gap-2">
                        Búsqueda: {localFilters.search}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleFilterChange('search', '')}
                        />
                      </Badge>
                    )}
                    {localFilters.categoryId && (
                      <Badge variant="secondary" className="gap-2">
                        {getCategoryName(localFilters.categoryId)}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleFilterChange('categoryId', '')}
                        />
                      </Badge>
                    )}
                    {localFilters.location && (
                      <Badge variant="secondary" className="gap-2">
                        <MapPin className="w-3 h-3" />
                        {localFilters.location}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleFilterChange('location', '')}
                        />
                      </Badge>
                    )}
                    {(localFilters.minPrice || localFilters.maxPrice) && (
                      <Badge variant="secondary" className="gap-2">
                        <DollarSign className="w-3 h-3" />
                        {localFilters.minPrice || '0'} - {localFilters.maxPrice || '∞'}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => {
                            handleFilterChange('minPrice', '');
                            handleFilterChange('maxPrice', '');
                          }}
                        />
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {isLoading ? 'Cargando...' : `${services?.length || 0} servicios encontrados`}
                  </h2>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Services Grid */}
              {isLoading ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              ) : services && services.length > 0 ? (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {services.map((service) => {
                    const category = categories?.find(c => c.id === service.categoryId);
                    return (
                      <ServiceCard 
                        key={service.id} 
                        service={service}
                        category={category}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Filter className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No se encontraron servicios
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Intenta ajustar tus filtros o buscar con términos diferentes
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Limpiar Filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
