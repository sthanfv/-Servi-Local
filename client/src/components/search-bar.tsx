import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import { useLocation } from "wouter";

interface SearchBarProps {
  onSearch?: (query: string, location: string) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className = "" }: SearchBarProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("cucuta");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(query, selectedLocation);
    } else {
      // Navigate to services page with search params
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (selectedLocation !== 'cucuta') params.set('location', selectedLocation);
      
      const searchString = params.toString();
      setLocation(`/services${searchString ? `?${searchString}` : ''}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="relative">
        <div className="flex bg-card border border-border rounded-2xl shadow-lg overflow-hidden trust-shadow">
          <div className="flex-1 flex items-center px-6">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <Input 
              type="text" 
              placeholder="Buscar servicios..." 
              className="w-full py-4 text-lg border-none outline-none bg-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <div className="flex items-center px-6 border-l border-border">
            <MapPin className="w-5 h-5 text-muted-foreground mr-3" />
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="border-none bg-transparent text-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cucuta">Cúcuta</SelectItem>
                <SelectItem value="los-patios">Los Patios</SelectItem>
                <SelectItem value="villa-del-rosario">Villa del Rosario</SelectItem>
                <SelectItem value="otra">Otra ubicación</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 font-semibold transition-colors rounded-none"
            onClick={handleSearch}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
