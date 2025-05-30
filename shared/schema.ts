import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table according to technical documentation
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role", { enum: ["user", "provider", "admin"] }).default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price"), // in cents
  location: text("location"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  availability: text("availability"),
  isApproved: boolean("is_approved").default(false),
  isFeatured: boolean("is_featured").default(false),
  rating: numeric("rating"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  title: text("title"),
  content: text("content"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: varchar("status", { enum: ['pending', 'reviewed', 'resolved'] }).default('pending'),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email").notNull(),
  amount: integer("amount").notNull(), // in cents
  message: text("message"),
  paymentMethod: varchar("payment_method", { enum: ['card', 'transfer', 'paypal'] }),
  status: varchar("status", { enum: ['pending', 'completed', 'failed'] }).default('pending'),
  transactionId: text("transaction_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id),
  senderName: text("sender_name").notNull(),
  senderEmail: text("sender_email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").notNull().references(() => services.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isApproved: boolean("is_approved").default(false),
  isActive: boolean("is_active").default(true),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const advertisements = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  position: varchar("position", { 
    enum: ['header', 'sidebar', 'footer', 'between_services', 'home_hero', 'home_categories'] 
  }),
  status: varchar("status", { enum: ['active', 'paused', 'expired'] }).default('active'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  companyName: text("company_name"),
  contactEmail: text("contact_email"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Support System Tables
export const supportCategories = pgTable("support_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportArticles = pgTable("support_articles", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => supportCategories.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  tags: text("tags").array(),
  isPublished: boolean("is_published").default(false),
  isPinned: boolean("is_pinned").default(false),
  views: integer("views").default(0),
  helpful: integer("helpful").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => supportCategories.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  views: integer("views").default(0),
  helpful: integer("helpful").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: varchar("status", { enum: ['open', 'in_progress', 'resolved', 'closed'] }).default('open'),
  priority: varchar("priority", { enum: ['low', 'medium', 'high', 'urgent'] }).default('medium'),
  categoryId: integer("category_id").references(() => supportCategories.id),
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  services: many(services),
  reviews: many(reviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  user: one(users, {
    fields: [services.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
  messages: many(messages),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  service: one(services, {
    fields: [reviews.serviceId],
    references: [services.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  service: one(services, {
    fields: [messages.serviceId],
    references: [services.id],
  }),
}));

export const supportCategoriesRelations = relations(supportCategories, ({ many }) => ({
  articles: many(supportArticles),
  faqItems: many(faqItems),
  tickets: many(supportTickets),
}));

export const supportArticlesRelations = relations(supportArticles, ({ one }) => ({
  category: one(supportCategories, {
    fields: [supportArticles.categoryId],
    references: [supportCategories.id],
  }),
}));

export const faqItemsRelations = relations(faqItems, ({ one }) => ({
  category: one(supportCategories, {
    fields: [faqItems.categoryId],
    references: [supportCategories.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  category: one(supportCategories, {
    fields: [supportTickets.categoryId],
    references: [supportCategories.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users);
export const insertCategorySchema = createInsertSchema(categories);
export const insertServiceSchema = createInsertSchema(services);
export const insertContentSchema = createInsertSchema(content);
export const insertSuggestionSchema = createInsertSchema(suggestions);
export const insertDonationSchema = createInsertSchema(donations);
export const insertMessageSchema = createInsertSchema(messages);
export const insertReviewSchema = createInsertSchema(reviews);
export const insertAdvertisementSchema = createInsertSchema(advertisements);
export const insertSupportCategorySchema = createInsertSchema(supportCategories);
export const insertSupportArticleSchema = createInsertSchema(supportArticles);
export const insertFaqItemSchema = createInsertSchema(faqItems);
export const insertSupportTicketSchema = createInsertSchema(supportTickets);

// Types
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Advertisement = typeof advertisements.$inferSelect;
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type SupportCategory = typeof supportCategories.$inferSelect;
export type InsertSupportCategory = z.infer<typeof insertSupportCategorySchema>;
export type SupportArticle = typeof supportArticles.$inferSelect;
export type InsertSupportArticle = z.infer<typeof insertSupportArticleSchema>;
export type FaqItem = typeof faqItems.$inferSelect;
export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
