import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Services from "@/pages/services";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";
import Support from "@/pages/support";
import Suggestions from "@/pages/suggestions";
import Donations from "@/pages/donations";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="loading-spinner w-8 h-8 mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/services" component={Services} />
          <Route path="/support" component={Support} />
          <Route path="/suggestions" component={Suggestions} />
          <Route path="/donations" component={Donations} />
          <Route path="/about" component={About} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/services" component={Services} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={Admin} />
          <Route path="/support" component={Support} />
          <Route path="/suggestions" component={Suggestions} />
          <Route path="/donations" component={Donations} />
          <Route path="/about" component={About} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
