import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration for JWT + Express Sessions
  const PgSession = connectPgSimple(session);
  
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'fallback_session_secret_for_development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

  // POST /api/register - User registration
  app.post('/api/register', async (req, res) => {
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
  app.post('/api/login', async (req, res) => {
    try {
      const validated = loginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(validated.username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const validPassword = await comparePassword(validated.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

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

  const httpServer = createServer(app);
  return httpServer;
}
