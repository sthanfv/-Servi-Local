
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

export const initializeMonitoring = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        nodeProfilingIntegration(),
        Sentry.httpIntegration({ tracing: true }),
        Sentry.postgresIntegration(),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 0.1,
      beforeSend(event) {
        // Filtrar información sensible
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });

    console.log('✅ Sentry monitoring initialized');
  }
};

export const logSecurityEvent = (event: string, details: any, level: 'info' | 'warning' | 'error' = 'warning') => {
  const logData = {
    event,
    details: {
      ...details,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    }
  };

  // Log to console
  console.log(`[SECURITY-${level.toUpperCase()}]`, JSON.stringify(logData));

  // Send to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message: event,
      category: 'security',
      level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
      data: details,
    });

    if (level === 'error') {
      Sentry.captureException(new Error(`Security Event: ${event}`));
    }
  }
};

export const captureError = (error: Error, context?: any) => {
  console.error('Application Error:', error);
  
  if (process.env.SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('error_context', context);
      }
      Sentry.captureException(error);
    });
  }
};

export { Sentry };
