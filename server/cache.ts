
import NodeCache from 'node-cache';
import { storage } from './storage';

// In-memory cache for development (Redis alternative for Replit)
const cache = new NodeCache({ 
  stdTTL: 600, // 10 minutes default
  checkperiod: 120, // Check for expired keys every 2 minutes
  useClones: false 
});

export class CacheManager {
  private static instance: CacheManager;
  private cache: NodeCache;

  constructor() {
    this.cache = cache;
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Services cache
  async getServices(key: string, fetcher: () => Promise<any>, ttl: number = 300): Promise<any> {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const data = await fetcher();
    this.cache.set(key, data, ttl);
    return data;
  }

  // User-specific rate limiting
  async checkUserRateLimit(userId: string, action: string, maxAttempts: number = 10, windowMs: number = 15 * 60 * 1000): Promise<boolean> {
    const key = `rate_limit:${userId}:${action}`;
    const attempts = this.cache.get(key) as number || 0;
    
    if (attempts >= maxAttempts) {
      return false; // Rate limit exceeded
    }

    this.cache.set(key, attempts + 1, Math.ceil(windowMs / 1000));
    return true;
  }

  // Clear caches when data changes
  invalidatePattern(pattern: string): void {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    this.cache.del(matchingKeys);
  }

  // Cache user sessions
  setUserSession(userId: string, sessionData: any, ttl: number = 24 * 60 * 60): void {
    this.cache.set(`session:${userId}`, sessionData, ttl);
  }

  getUserSession(userId: string): any {
    return this.cache.get(`session:${userId}`);
  }

  clearUserSession(userId: string): void {
    this.cache.del(`session:${userId}`);
  }

  // Statistics cache
  async getCachedStats(): Promise<any> {
    return this.getServices('stats:global', async () => {
      const [services, categories] = await Promise.all([
        storage.getServices({ approved: true }),
        storage.getCategories(),
      ]);
      
      const providers = new Set(services.map(s => s.userId)).size;
      const totalReviews = services.reduce((sum, service) => sum + (service.reviewCount || 0), 0);
      
      return {
        services: services.length,
        providers,
        reviews: totalReviews,
        categories: categories.length,
        lastUpdated: new Date().toISOString(),
      };
    }, 600); // Cache for 10 minutes
  }
}

export const cacheManager = CacheManager.getInstance();
