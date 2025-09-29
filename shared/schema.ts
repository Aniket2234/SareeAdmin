import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { pgTable, varchar, text, timestamp, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Drizzle table definitions for PostgreSQL
export const users = pgTable("users", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shops = pgTable("shops", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  mongoUri: varchar("mongo_uri", { length: 500 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shopId: varchar("shop_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  size: varchar("size", { length: 100 }),
  color: varchar("color", { length: 100 }),
  stock: integer("stock").notNull().default(0),
  images: jsonb("images").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const shopsRelations = relations(shops, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  shop: one(shops, {
    fields: [products.shopId],
    references: [shops.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user"]).default("admin"),
});

export const insertShopSchema = createInsertSchema(shops, {
  name: z.string().min(1, "Shop name is required"),
  location: z.string().min(1, "Location is required"),
  mongoUri: z.string().min(1, "MongoDB URI is required"),
  status: z.enum(["active", "pending", "inactive"]).default("pending"),
});

export const insertProductSchema = createInsertSchema(products, {
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().transform((val) => parseFloat(val)),
  stock: z.number().min(0, "Stock must be positive").default(0),
  images: z.array(z.string()).default([]),
});

// Types
export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Product = typeof products.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type InsertShop = typeof shops.$inferInsert;
export type InsertProduct = typeof products.$inferInsert;
