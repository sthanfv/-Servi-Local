
import { storage } from './storage';
import { cacheManager } from './cache';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: HealthCheck;
    cache: HealthCheck;
    storage: HealthCheck;
    auth: HealthCheck;
  };
  metrics: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
  };
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
  error?: string;
}

class HealthMonitor {
  private lastHealthCheck: HealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  startMonitoring(intervalMs: number = 30000): void {
    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);
    
    console.log('✅ Health monitoring started');
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    const [dbCheck, cacheCheck, storageCheck, authCheck] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkStorage(),
      this.checkAuth(),
    ]);

    const services = {
      database: this.getHealthCheckResult(dbCheck),
      cache: this.getHealthCheckResult(cacheCheck),
      storage: this.getHealthCheckResult(storageCheck),
      auth: this.getHealthCheckResult(authCheck),
    };

    const overallStatus = this.determineOverallStatus(services);
    const metrics = await this.getSystemMetrics();

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '3.0.0',
      environment: process.env.NODE_ENV || 'development',
      services,
      metrics,
    };

    this.lastHealthCheck = healthStatus;
    
    // Log critical issues
    if (overallStatus === 'unhealthy') {
      console.error('🚨 System health check failed:', healthStatus);
    }

    return healthStatus;
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Simple query to test database connectivity
      await storage.getCategories();
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  private async checkCache(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Test cache operations
      const testKey = 'health_check_' + Date.now();
      cacheManager.setUserSession(testKey, { test: true }, 10);
      const result = cacheManager.getUserSession(testKey);
      cacheManager.clearUserSession(testKey);
      
      if (!result) throw new Error('Cache test failed');
      
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown cache error',
      };
    }
  }

  private async checkStorage(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Test basic storage operations
      const stats = await storage.getServices({ approved: true });
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown storage error',
      };
    }
  }

  private async checkAuth(): Promise<HealthCheck> {
    const start = Date.now();
    try {
      // Test JWT operations
      const { generateToken, verifyToken } = await import('./auth');
      const testToken = generateToken(999999); // Test user ID
      const decoded = verifyToken(testToken);
      
      if (!decoded || decoded.userId !== 999999) {
        throw new Error('JWT test failed');
      }
      
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown auth error',
      };
    }
  }

  private getHealthCheckResult(settledResult: PromiseSettledResult<HealthCheck>): HealthCheck {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    } else {
      return {
        status: 'unhealthy',
        responseTime: 0,
        lastCheck: new Date().toISOString(),
        error: settledResult.reason?.message || 'Check failed',
      };
    }
  }

  private determineOverallStatus(services: HealthStatus['services']): HealthStatus['status'] {
    const serviceStatuses = Object.values(services);
    const unhealthyCount = serviceStatuses.filter(s => s.status === 'unhealthy').length;
    
    if (unhealthyCount === 0) return 'healthy';
    if (unhealthyCount <= 1) return 'degraded';
    return 'unhealthy';
  }

  private async getSystemMetrics(): Promise<HealthStatus['metrics']> {
    const memUsage = process.memoryUsage();
    
    return {
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpu: {
        usage: process.cpuUsage().system / 1000000, // Convert to seconds
      },
    };
  }

  getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck;
  }
}

export const healthMonitor = new HealthMonitor();
