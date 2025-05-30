import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Service } from "@shared/schema";

interface ServiceCardProps {
  service: Service;
  category?: { name: string };
  provider?: { firstName?: string; lastName?: string; fullName?: string; profileImageUrl?: string };
}

export default function ServiceCard({ service, category, provider }: ServiceCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const getProviderName = () => {
    if (provider?.fullName) return provider.fullName;
    if (provider?.firstName && provider?.lastName) {
      return `${provider.firstName} ${provider.lastName}`;
    }
    if (provider?.firstName) return provider.firstName;
    return 'Proveedor';
  };

  const getProviderInitials = () => {
    const name = getProviderName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Link href={`/services/${service.id}`}>
      <Card className="service-card group cursor-pointer border border-border overflow-hidden hover:shadow-lg transition-all">
        {/* Service Image Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {service.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              Destacado
            </Badge>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            {category && (
              <Badge variant="secondary" className="capitalize">
                {category.name}
              </Badge>
            )}
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium">
                {service.rating ? Number(service.rating).toFixed(1) : '4.5'}
              </span>
              <span className="text-sm text-muted-foreground">
                ({service.reviewCount || 0})
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {service.title}
          </h3>
          
          <p className="text-muted-foreground mb-4 line-clamp-2">
            {service.description}
          </p>

          {service.location && (
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <MapPin className="w-4 h-4 mr-1" />
              {service.location}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={provider?.profileImageUrl} alt={getProviderName()} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getProviderInitials()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground font-medium">
                {getProviderName()}
              </span>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Desde</div>
              <div className="text-lg font-bold text-primary">
                {service.price ? formatPrice(service.price) : 'Consultar'}
              </div>
            </div>
          </div>

          {service.availability && (
            <div className="flex items-center text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
              <Clock className="w-4 h-4 mr-1" />
              {service.availability}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
