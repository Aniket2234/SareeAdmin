import { z } from "zod";

// MongoDB schema definitions using Zod

export const userSchema = z.object({
  _id: z.string(),
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user"]).default("admin"),
  createdAt: z.date().default(() => new Date()),
});

export const shopSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Shop name is required"),
  location: z.string().min(1, "Location is required"),
  mongoUri: z.string().min(1, "MongoDB URI is required"),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["active", "pending", "inactive"]).default("pending"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Category schema for individual shop databases
export const categorySchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Category name is required"),
  slug: z.string().min(1, "Category slug is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Product schema for individual shop databases (based on actual structure found)
export const productSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category slug is required"),
  price: z.number().min(0, "Price must be positive"),
  originalPrice: z.number().min(0, "Original price must be positive").optional(),
  discountPercentage: z.number().min(0).max(100, "Discount must be between 0 and 100").optional(),
  material: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  images: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
  inStock: z.boolean().default(true),
  collectionType: z.string().optional(),
  rating: z.number().min(0).max(5, "Rating must be between 0 and 5").optional(),
  reviewCount: z.number().min(0, "Review count must be positive").optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Insert schemas (without _id and timestamps)
export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true });
export const insertShopSchema = shopSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const insertCategorySchema = categorySchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const insertProductSchema = productSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// Types
export type User = z.infer<typeof userSchema>;
export type Shop = z.infer<typeof shopSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShop = z.infer<typeof insertShopSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
