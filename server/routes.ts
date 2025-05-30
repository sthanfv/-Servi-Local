import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import { body, validationResult } from "express-validator";
import { encode } from "html-entities";
import { storage } from "./storage";
import { authenticate, requireAdmin, requireProvider, hashPassword, comparePassword, generateToken, type AuthRequest } from "./auth";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import {
  insertCategorySchema,
  insertServiceSchema,
  insertContentSchema,
  insertSuggestionSchema,
  insertDonationSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertAdvertisementSchema,
  insertSupportCategorySchema,
  insertSupportArticleSchema,
  insertFaqItemSchema,
  insertSupportTicketSchema,
} from "@shared/schema";

// Nuevas importaciones para funcionalidades avanzadas
import { initializeMonitoring, logSecurityEvent, captureError } from './monitoring';
import { 
  generate2FASecret, 
  verify2FAToken, 
  enable2FA, 
  validate2FALogin, 
  disable2FA 
} from './twoFactorAuth';
import { 
  createStripePayment, 
  createPSEPayment, 
  handlePaymentWebhook, 
  generateInvoice 
} from './payments';

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize monitoring system
  initializeMonitoring();
  
  // Configure trust proxy for rate limiting
  app.set('trust proxy', 1);
  
  // Security middlewares
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://auth.util.repl.co", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "wss:", "ws:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
  }));

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:5000', 'https://*.replit.dev'],
    credentials: true,
  }));

  // Rate limiting - Configuración mejorada
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 100 req/15min en producción
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50 : 5, // 5 intentos en producción
    message: {
      error: "Too many login attempts, please try again later.",
      retryAfter: "15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: true,
    keyGenerator: (req) => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    skipSuccessfulRequests: true,
  });

  app.use('/api/', apiLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/register', authLimiter);

  // Session configuration for JWT + Express Sessions
  const PgSession = connectPgSimple(session);
  
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: 'session',
      schemaName: 'public',
    }),
    secret: process.env.SESSION_SECRET || 'fallback_session_secret_for_development_change_in_production',
    name: 'servilocal_session',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on each request
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict', // CSRF protection
    },
  }));

  // Authentication routes according to technical documentation
  const registerSchema = insertUserSchema.pick({
    username: true,
    email: true,
    password: true,
    fullName: true,
    phone: true,
  });

  const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
  });

  // Validation middleware
  const validateRegistration = [
    body('username')
      .isLength({ min: 3, max: 50 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-50 characters and contain only letters, numbers, and underscores'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Must be a valid email address'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be 8-128 characters with uppercase, lowercase, number, and special character'),
    body('fullName')
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
      .withMessage('Full name must be 2-100 characters and contain only letters and spaces'),
    body('phone')
      .matches(/^\+?[\d\s\-\(\)]{7,15}$/)
      .withMessage('Phone must be a valid format'),
  ];

  const validateLogin = [
    body('username')
      .isLength({ min: 3, max: 50 })
      .escape(),
    body('password')
      .isLength({ min: 1, max: 128 })
  ];

  const sanitizeInput = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input data',
        errors: errors.array()
      });
    }
    
    // Sanitize string fields
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = encode(req.body[key].trim());
      }
    }
    
    next();
  };

  // POST /api/register - User registration
  app.post('/api/register', validateRegistration, sanitizeInput, async (req, res) => {
    try {
      const validated = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const existingEmail = await storage.getUserByEmail(validated.email);
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validated.password);
      const user = await storage.createUser({
        ...validated,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = generateToken(user.id);
      
      // Store session
      if (req.session) {
        req.session.userId = user.id;
      }

      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json({
        user: userWithoutPassword,
        token,
        message: 'User registered successfully'
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // POST /api/login - User login
  app.post('/api/login', validateLogin, sanitizeInput, async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validated.username);
      if (!user || !user.isActive) {
        logSecurityEvent('failed_login_attempt', {
          username: validated.username,
          ip: req.ip,
          reason: 'user_not_found_or_inactive'
        }, 'warning');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await comparePassword(validated.password, user.password);
      if (!validPassword) {
        logSecurityEvent('failed_login_attempt', {
          username: validated.username,
          ip: req.ip,
          reason: 'invalid_password'
        }, 'warning');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      logSecurityEvent('successful_login', {
        username: validated.username,
        ip: req.ip,
        userId: user.id
      }, 'info');

      // Generate JWT token
      const token = generateToken(user.id);
      
      // Store session
      if (req.session) {
        req.session.userId = user.id;
      }

      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
        message: 'Login successful'
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
      }
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // POST /api/logout - User logout
  app.post('/api/logout', (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout successful' });
      });
    } else {
      res.json({ message: 'Logout successful' });
    }
  });

  // GET /api/user - Get current user
  app.get('/api/user', authenticate, async (req: any, res) => {
    try {
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // GET /api/auth/user - Alternative endpoint for authentication check
  app.get('/api/auth/user', authenticate, async (req: any, res) => {
    try {
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Categories
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', authenticate, requireAdmin, async (req: any, res) => {
    try {
      
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/categories/:id', authenticate, requireAdmin, async (req: any, res) => {
    try {
      
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/categories/:id', authenticate, requireAdmin, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteCategory(id);
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Services
  app.get('/api/services', async (req, res) => {
    try {
      const { categoryId, search, location, approved = 'true' } = req.query;
      const filters = {
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        search: search as string,
        location: location as string,
        approved: approved === 'true',
      };
      const services = await storage.getServices(filters);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get('/api/services/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getServiceById(id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post('/api/services', authenticate, async (req: any, res) => {
    try {
      const serviceData = insertServiceSchema.parse({
        ...req.body,
        userId: req.user!.id.toString(),
      });
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put('/api/services/:id', authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user!.id.toString());
      const service = await storage.getServiceById(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      if (service.userId !== req.user!.id.toString() && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const updatedService = await storage.updateService(id, serviceData);
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete('/api/services/:id', authenticate, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(req.user!.id.toString());
      const service = await storage.getServiceById(id);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      if (service.userId !== req.user!.id.toString() && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteService(id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  app.patch('/api/services/:id/approve', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const service = await storage.approveService(id);
      res.json(service);
    } catch (error) {
      console.error("Error approving service:", error);
      res.status(500).json({ message: "Failed to approve service" });
    }
  });

  app.patch('/api/services/:id/feature', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const { featured } = req.body;
      const service = await storage.featureService(id, featured);
      res.json(service);
    } catch (error) {
      console.error("Error featuring service:", error);
      res.status(500).json({ message: "Failed to feature service" });
    }
  });

  app.get('/api/user/services', authenticate, async (req: any, res) => {
    try {
      const services = await storage.getServicesByUserId(req.user!.id.toString());
      res.json(services);
    } catch (error) {
      console.error("Error fetching user services:", error);
      res.status(500).json({ message: "Failed to fetch user services" });
    }
  });

  app.get('/api/admin/services/pending', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const services = await storage.getServices({ approved: false });
      res.json(services);
    } catch (error) {
      console.error("Error fetching pending services:", error);
      res.status(500).json({ message: "Failed to fetch pending services" });
    }
  });

  // Content
  app.get('/api/content', async (req, res) => {
    try {
      const content = await storage.getContent();
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get('/api/content/:key', async (req, res) => {
    try {
      const content = await storage.getContentByKey(req.params.key);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/content', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const contentData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(contentData);
      res.json(content);
    } catch (error) {
      console.error("Error creating content:", error);
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  app.put('/api/content/:id', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const contentData = insertContentSchema.partial().parse(req.body);
      const content = await storage.updateContent(id, contentData);
      res.json(content);
    } catch (error) {
      console.error("Error updating content:", error);
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // Suggestions
  app.get('/api/suggestions', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const suggestions = await storage.getSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  app.post('/api/suggestions', async (req, res) => {
    try {
      const suggestionData = insertSuggestionSchema.parse(req.body);
      const suggestion = await storage.createSuggestion(suggestionData);
      res.json(suggestion);
    } catch (error) {
      console.error("Error creating suggestion:", error);
      res.status(500).json({ message: "Failed to create suggestion" });
    }
  });

  app.patch('/api/suggestions/:id/status', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const { status, adminResponse } = req.body;
      const suggestion = await storage.updateSuggestionStatus(id, status, adminResponse);
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      res.status(500).json({ message: "Failed to update suggestion status" });
    }
  });

  // Donations
  app.get('/api/donations', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const donations = await storage.getDonations();
      res.json(donations);
    } catch (error) {
      console.error("Error fetching donations:", error);
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  app.post('/api/donations', async (req, res) => {
    try {
      const donationData = insertDonationSchema.parse(req.body);
      const donation = await storage.createDonation(donationData);
      res.json(donation);
    } catch (error) {
      console.error("Error creating donation:", error);
      res.status(500).json({ message: "Failed to create donation" });
    }
  });

  // Reviews
  app.get('/api/services/:id/reviews', async (req, res) => {
    try {
      const serviceId = parseInt(req.params.id);
      const reviews = await storage.getReviewsByServiceId(serviceId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.post('/api/reviews', authenticate, async (req: any, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        userId: req.user!.id.toString(),
      });
      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.patch('/api/reviews/:id/approve', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      const review = await storage.approveReview(id);
      res.json(review);
    } catch (error) {
      console.error("Error approving review:", error);
      res.status(500).json({ message: "Failed to approve review" });
    }
  });

  // Messages
  app.post('/api/messages', async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Support System
  app.get('/api/support/categories', async (req, res) => {
    try {
      const categories = await storage.getSupportCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching support categories:", error);
      res.status(500).json({ message: "Failed to fetch support categories" });
    }
  });

  app.get('/api/support/articles', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const articles = await storage.getSupportArticles(
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(articles);
    } catch (error) {
      console.error("Error fetching support articles:", error);
      res.status(500).json({ message: "Failed to fetch support articles" });
    }
  });

  app.get('/api/support/articles/:slug', async (req, res) => {
    try {
      const article = await storage.getSupportArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching support article:", error);
      res.status(500).json({ message: "Failed to fetch support article" });
    }
  });

  app.get('/api/support/faq', async (req, res) => {
    try {
      const { categoryId } = req.query;
      const faqItems = await storage.getFaqItems(
        categoryId ? parseInt(categoryId as string) : undefined
      );
      res.json(faqItems);
    } catch (error) {
      console.error("Error fetching FAQ items:", error);
      res.status(500).json({ message: "Failed to fetch FAQ items" });
    }
  });

  app.post('/api/support/tickets', async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse(req.body);
      const ticket = await storage.createSupportTicket(ticketData);
      res.json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  app.get('/api/support/tickets', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const tickets = await storage.getSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Statistics endpoint
  app.get('/api/stats', async (req, res) => {
    try {
      const [services, categories] = await Promise.all([
        storage.getServices({ approved: true }),
        storage.getCategories(),
      ]);
      
      const providers = new Set(services.map(s => s.userId)).size;
      const totalReviews = services.reduce((sum, service) => sum + (service.reviewCount || 0), 0);
      
      res.json({
        services: services.length,
        providers,
        reviews: totalReviews,
        categories: categories.length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // ==========================================
  // NUEVAS RUTAS - FUNCIONALIDADES AVANZADAS
  // ==========================================

  // Two-Factor Authentication Routes
  app.post('/api/auth/2fa/setup', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required for 2FA" });
      }

      const setup = await generate2FASecret(req.user!.id.toString(), user.email);
      
      logSecurityEvent('2fa_setup_initiated', {
        userId: req.user!.id,
        email: user.email
      }, 'info');

      res.json({
        qrCode: setup.qrCodeUrl,
        backupCodes: setup.backupCodes,
        message: "Scan QR code with your authenticator app"
      });
    } catch (error) {
      captureError(error as Error, { userId: req.user?.id });
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  app.post('/api/auth/2fa/enable', authenticate, async (req: any, res) => {
    try {
      const { token } = req.body;
      const success = await enable2FA(req.user!.id.toString(), token);
      
      if (success) {
        logSecurityEvent('2fa_enabled', {
          userId: req.user!.id
        }, 'info');
        res.json({ message: "2FA enabled successfully" });
      } else {
        res.status(400).json({ message: "Invalid verification token" });
      }
    } catch (error) {
      captureError(error as Error, { userId: req.user?.id });
      res.status(500).json({ message: "Failed to enable 2FA" });
    }
  });

  app.post('/api/auth/2fa/disable', authenticate, async (req: any, res) => {
    try {
      const { password } = req.body;
      const success = await disable2FA(req.user!.id.toString(), password);
      
      if (success) {
        logSecurityEvent('2fa_disabled', {
          userId: req.user!.id
        }, 'warning');
        res.json({ message: "2FA disabled successfully" });
      } else {
        res.status(400).json({ message: "Invalid password" });
      }
    } catch (error) {
      captureError(error as Error, { userId: req.user?.id });
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  // Enhanced Payments Routes
  app.post('/api/payments/stripe', authenticate, async (req: any, res) => {
    try {
      const { amount, currency, serviceId } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(400).json({ message: "Stripe not configured" });
      }

      const payment = await createStripePayment(amount, currency, serviceId);
      res.json(payment);
    } catch (error) {
      captureError(error as Error, { userId: req.user?.id });
      res.status(500).json({ message: "Failed to create Stripe payment" });
    }
  });

  app.post('/api/payments/pse', async (req, res) => {
    try {
      const { bank, documentType, documentNumber, amount, description } = req.body;
      
      const payment = await createPSEPayment({
        bank,
        documentType,
        documentNumber,
        amount,
        description,
      });
      
      res.json(payment);
    } catch (error) {
      captureError(error as Error);
      res.status(500).json({ message: "Failed to create PSE payment" });
    }
  });

  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      await handlePaymentWebhook(req.body, signature);
      res.json({ received: true });
    } catch (error) {
      captureError(error as Error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  app.post('/api/invoices/generate', authenticate, async (req: any, res) => {
    try {
      const invoiceData = req.body;
      const invoiceNumber = await generateInvoice(invoiceData);
      
      logSecurityEvent('invoice_generated', {
        invoiceNumber,
        userId: req.user!.id
      }, 'info');
      
      res.json({ invoiceNumber, message: "Invoice generated successfully" });
    } catch (error) {
      captureError(error as Error, { userId: req.user?.id });
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  // Health Check and Monitoring
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
    });
  });

  app.get('/api/monitoring/errors', authenticate, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user!.id.toString());
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      // En producción, esto conectaría con Sentry API
      res.json({
        message: "Error monitoring data would be fetched from Sentry",
        sentryConfigured: !!process.env.SENTRY_DSN,
      });
    } catch (error) {
      captureError(error as Error);
      res.status(500).json({ message: "Failed to fetch monitoring data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
