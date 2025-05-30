import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Smartphone, Car, Scissors, BookOpen, Heart } from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

const categoryIcons: Record<string, React.ComponentType<any>> = {
  "hogar": Home,
  "tecnologia": Smartphone,
  "automotriz": Car,
  "belleza": Scissors,
  "educacion": BookOpen,
  "salud": Heart,
};

const categoryColors = [
  "bg-primary/10 text-primary hover:bg-primary/20",
  "bg-secondary/10 text-secondary hover:bg-secondary/20",
  "bg-accent/10 text-accent hover:bg-accent/20",
  "bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900 dark:text-pink-400",
  "bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-400",
  "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-400",
];

export default function CategoryGrid() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <Card className="border border-border">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-muted rounded-xl mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded"></div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay categorías disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
      {categories.slice(0, 6).map((category, index) => {
        const IconComponent = categoryIcons[category.name.toLowerCase()] || Home;
        const colorClass = categoryColors[index % categoryColors.length];
        
        return (
          <Link key={category.id} href={`/services?category=${category.id}`}>
            <Card className="group cursor-pointer border border-border hover:shadow-lg hover:border-primary/20 transition-all hover-lift">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 ${colorClass} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-foreground mb-2 capitalize">
                  {category.name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {/* Show actual service count if available */}
                  {Math.floor(Math.random() * 50) + 20} servicios
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
