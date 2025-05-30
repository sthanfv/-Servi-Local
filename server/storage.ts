import {
  users,
  categories,
  services,
  content,
  suggestions,
  donations,
  messages,
  reviews,
  advertisements,
  supportCategories,
  supportArticles,
  faqItems,
  supportTickets,
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Service,
  type InsertService,
  type Content,
  type InsertContent,
  type Suggestion,
  type InsertSuggestion,
  type Donation,
  type InsertDonation,
  type Message,
  type InsertMessage,
  type Review,
  type InsertReview,
  type Advertisement,
  type InsertAdvertisement,
  type SupportCategory,
  type InsertSupportCategory,
  type SupportArticle,
  type InsertSupportArticle,
  type FaqItem,
  type InsertFaqItem,
  type SupportTicket,
  type InsertSupportTicket,
} from "@shared/schema";
import { db } from "./db";
import { cacheManager } from "./cache";
import { wsManager } from "./websocket";
import { eq, desc, and, like, sql, ilike } from "drizzle-orm";

export interface IStorage {
  // User operations (required for JWT Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Services
  getServices(filters?: { categoryId?: number; search?: string; location?: string; approved?: boolean }): Promise<Service[]>;
  getServiceById(id: number): Promise<Service | undefined>;
  getServicesByUserId(userId: string): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: number): Promise<void>;
  approveService(id: number): Promise<Service>;
  featureService(id: number, featured: boolean): Promise<Service>;

  // Content
  getContent(): Promise<Content[]>;
  getContentByKey(key: string): Promise<Content | undefined>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<InsertContent>): Promise<Content>;
  deleteContent(id: number): Promise<void>;

  // Suggestions
  getSuggestions(): Promise<Suggestion[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  updateSuggestionStatus(id: number, status: string, adminResponse?: string): Promise<Suggestion>;

  // Donations
  getDonations(): Promise<Donation[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  updateDonationStatus(id: number, status: string): Promise<Donation>;

  // Messages
  getMessagesByServiceId(serviceId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Reviews
  getReviewsByServiceId(serviceId: number): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;
  approveReview(id: number): Promise<Review>;
  deleteReview(id: number): Promise<void>;

  // Advertisements
  getAdvertisements(): Promise<Advertisement[]>;
  getActiveAdvertisements(): Promise<Advertisement[]>;
  getAdvertisementsByPosition(position: string): Promise<Advertisement[]>;
  createAdvertisement(advertisement: InsertAdvertisement): Promise<Advertisement>;
  updateAdvertisement(id: number, advertisement: Partial<InsertAdvertisement>): Promise<Advertisement>;
  updateAdvertisementStatus(id: number, status: string): Promise<Advertisement>;
  deleteAdvertisement(id: number): Promise<void>;

  // Support System
  getSupportCategories(): Promise<SupportCategory[]>;
  createSupportCategory(category: InsertSupportCategory): Promise<SupportCategory>;
  getSupportArticles(categoryId?: number): Promise<SupportArticle[]>;
  getSupportArticleBySlug(slug: string): Promise<SupportArticle | undefined>;
  createSupportArticle(article: InsertSupportArticle): Promise<SupportArticle>;
  updateSupportArticle(id: number, article: Partial<InsertSupportArticle>): Promise<SupportArticle>;
  getFaqItems(categoryId?: number): Promise<FaqItem[]>;
  createFaqItem(faq: InsertFaqItem): Promise<FaqItem>;
  getSupportTickets(): Promise<SupportTicket[]>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for JWT Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.name);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Services
  async getServices(filters?: { categoryId?: number; search?: string; location?: string; approved?: boolean }): Promise<Service[]> {
    let query = db.select().from(services);

    const conditions = [];

    if (filters?.approved !== undefined) {
      conditions.push(eq(services.isApproved, filters.approved));
    }

    if (filters?.categoryId) {
      conditions.push(eq(services.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      conditions.push(
        sql`(${services.title} ILIKE ${'%' + filters.search + '%'} OR ${services.description} ILIKE ${'%' + filters.search + '%'})`
      );
    }

    if (filters?.location) {
      conditions.push(ilike(services.location, `%${filters.location}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(services.createdAt));
  }

  async getServiceById(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getServicesByUserId(userId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.userId, userId)).orderBy(desc(services.createdAt));
  }

  async createService(data: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(data)
      .returning();

    // Invalidate related caches
    cacheManager.invalidatePattern('services');
    cacheManager.invalidatePattern('stats');

    // Send WebSocket notification
    wsManager.broadcastServiceUpdate(service.id, 'created');

    return service;
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service> {
    const [updatedService] = await db
      .update(services)
      .set({ ...service, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return updatedService;
  }

  async deleteService(id: number): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async approveService(id: number): Promise<Service> {
    const [approvedService] = await db
      .update(services)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return approvedService;
  }

  async featureService(id: number, featured: boolean): Promise<Service> {
    const [featuredService] = await db
      .update(services)
      .set({ isFeatured: featured, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return featuredService;
  }

  // Content
  async getContent(): Promise<Content[]> {
    return await db.select().from(content).where(eq(content.isActive, true));
  }

  async getContentByKey(key: string): Promise<Content | undefined> {
    const [contentItem] = await db.select().from(content).where(eq(content.key, key));
    return contentItem;
  }

  async createContent(contentData: InsertContent): Promise<Content> {
    const [newContent] = await db.insert(content).values(contentData).returning();
    return newContent;
  }

  async updateContent(id: number, contentData: Partial<InsertContent>): Promise<Content> {
    const [updatedContent] = await db
      .update(content)
      .set({ ...contentData, updatedAt: new Date() })
      .where(eq(content.id, id))
      .returning();
    return updatedContent;
  }

  async deleteContent(id: number): Promise<void> {
    await db.delete(content).where(eq(content.id, id));
  }

  // Suggestions
  async getSuggestions(): Promise<Suggestion[]> {
    return await db.select().from(suggestions).orderBy(desc(suggestions.createdAt));
  }

  async createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion> {
    const [newSuggestion] = await db.insert(suggestions).values(suggestion).returning();
    return newSuggestion;
  }

  async updateSuggestionStatus(id: number, status: string, adminResponse?: string): Promise<Suggestion> {
    const [updatedSuggestion] = await db
      .update(suggestions)
      .set({ status, adminResponse, updatedAt: new Date() })
      .where(eq(suggestions.id, id))
      .returning();
    return updatedSuggestion;
  }

  // Donations
  async getDonations(): Promise<Donation[]> {
    return await db.select().from(donations).orderBy(desc(donations.createdAt));
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [newDonation] = await db.insert(donations).values(donation).returning();
    return newDonation;
  }

  async updateDonationStatus(id: number, status: string): Promise<Donation> {
    const [updatedDonation] = await db
      .update(donations)
      .set({ status, updatedAt: new Date() })
      .where(eq(donations.id, id))
      .returning();
    return updatedDonation;
  }

  // Messages
  async getMessagesByServiceId(serviceId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.serviceId, serviceId)).orderBy(desc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Reviews
  async getReviewsByServiceId(serviceId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(and(eq(reviews.serviceId, serviceId), eq(reviews.isApproved, true), eq(reviews.isActive, true))).orderBy(desc(reviews.createdAt));
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async approveReview(id: number): Promise<Review> {
    const [approvedReview] = await db
      .update(reviews)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(reviews.id, id))
      .returning();
    return approvedReview;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  // Advertisements
  async getAdvertisements(): Promise<Advertisement[]> {
    return await db.select().from(advertisements).orderBy(desc(advertisements.createdAt));
  }

  async getActiveAdvertisements(): Promise<Advertisement[]> {
    const now = new Date();
    return await db.select().from(advertisements)
      .where(and(
        eq(advertisements.status, 'active'),
        sql`${advertisements.startDate} <= ${now}`,
        sql`${advertisements.endDate} >= ${now}`
      ))
      .orderBy(desc(advertisements.priority));
  }

  async getAdvertisementsByPosition(position: string): Promise<Advertisement[]> {
    const now = new Date();
    return await db.select().from(advertisements)
      .where(and(
        eq(advertisements.position, position),
        eq(advertisements.status, 'active'),
        sql`${advertisements.startDate} <= ${now}`,
        sql`${advertisements.endDate} >= ${now}`
      ))
      .orderBy(desc(advertisements.priority));
  }

  async createAdvertisement(advertisement: InsertAdvertisement): Promise<Advertisement> {
    const [newAdvertisement] = await db.insert(advertisements).values(advertisement).returning();
    return newAdvertisement;
  }

  async updateAdvertisement(id: number, advertisement: Partial<InsertAdvertisement>): Promise<Advertisement> {
    const [updatedAdvertisement] = await db
      .update(advertisements)
      .set({ ...advertisement, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return updatedAdvertisement;
  }

  async updateAdvertisementStatus(id: number, status: string): Promise<Advertisement> {
    const [updatedAdvertisement] = await db
      .update(advertisements)
      .set({ status, updatedAt: new Date() })
      .where(eq(advertisements.id, id))
      .returning();
    return updatedAdvertisement;
  }

  async deleteAdvertisement(id: number): Promise<void> {
    await db.delete(advertisements).where(eq(advertisements.id, id));
  }

  // Support System
  async getSupportCategories(): Promise<SupportCategory[]> {
    return await db.select().from(supportCategories).where(eq(supportCategories.isActive, true)).orderBy(supportCategories.order);
  }

  async createSupportCategory(category: InsertSupportCategory): Promise<SupportCategory> {
    const [newCategory] = await db.insert(supportCategories).values(category).returning();
    return newCategory;
  }

  async getSupportArticles(categoryId?: number): Promise<SupportArticle[]> {
    let query = db.select().from(supportArticles).where(eq(supportArticles.isPublished, true));

    if (categoryId) {
      query = query.where(and(eq(supportArticles.isPublished, true), eq(supportArticles.categoryId, categoryId)));
    }

    return await query.orderBy(desc(supportArticles.isPinned), desc(supportArticles.createdAt));
  }

  async getSupportArticleBySlug(slug: string): Promise<SupportArticle | undefined> {
    const [article] = await db.select().from(supportArticles).where(eq(supportArticles.slug, slug));
    return article;
  }

  async createSupportArticle(article: InsertSupportArticle): Promise<SupportArticle> {
    const [newArticle] = await db.insert(supportArticles).values(article).returning();
    return newArticle;
  }

  async updateSupportArticle(id: number, article: Partial<InsertSupportArticle>): Promise<SupportArticle> {
    const [updatedArticle] = await db
      .update(supportArticles)
      .set({ ...article, updatedAt: new Date() })
      .where(eq(supportArticles.id, id))
      .returning();
    return updatedArticle;
  }

  async getFaqItems(categoryId?: number): Promise<FaqItem[]> {
    let query = db.select().from(faqItems).where(eq(faqItems.isActive, true));

    if (categoryId) {
      query = query.where(and(eq(faqItems.isActive, true), eq(faqItems.categoryId, categoryId)));
    }

    return await query.orderBy(faqItems.order);
  }

  async createFaqItem(faq: InsertFaqItem): Promise<FaqItem> {
    const [newFaq] = await db.insert(faqItems).values(faq).returning();
    return newFaq;
  }

  async getSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const ticketNumber = `ST-${Date.now()}`;
    const [newTicket] = await db.insert(supportTickets).values({ ...ticket, ticketNumber }).returning();
    return newTicket;
  }

  async updateSupportTicket(id: number, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket> {
    const [updatedTicket] = await db
      .update(supportTickets)
      .set({ ...ticket, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket;
  }
}

export const storage = new DatabaseStorage();