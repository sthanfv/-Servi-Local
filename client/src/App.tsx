import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "react-error-boundary";
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
          <p className="text-muted-foreground">Cargando ServiLocal...</p>
          <div className="text-xs text-muted-foreground/70">
            Conectando con la comunidad local
          </div>
        </div>
      </div>
    );
  }

  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto flex items-center justify-center">
          <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Oops! Algo salió mal
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Ha ocurrido un error inesperado. Por favor, recarga la página o contacta soporte.
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={resetErrorBoundary}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Reintentar
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Recargar Página
            </button>
          </div>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              Detalles del error (desarrollo)
            </summary>
            <pre className="text-xs text-destructive mt-2 p-2 bg-muted rounded overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );

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
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Error boundary caught an error:', error, errorInfo);
        // En producción, aquí enviarías el error a un servicio de logging
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
    <div className="text-center space-y-6 max-w-md">
      <div className="w-16 h-16 bg-destructive/10 rounded-full mx-auto flex items-center justify-center">
        <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Oops! Algo salió mal
        </h2>
        <p className="text-muted-foreground text-sm mb-4">
          Ha ocurrido un error inesperado. Por favor, recarga la página o contacta soporte.
        </p>
        <div className="flex gap-3 justify-center">
          <button 
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Recargar Página
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default App;
