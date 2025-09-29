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
  status: z.enum(["active", "pending", "inactive"]).default("pending"),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export const productSchema = z.object({
  _id: z.string(),
  shopId: z.string(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  size: z.string().optional(),
  color: z.string().optional(),
  stock: z.number().min(0, "Stock must be positive").default(0),
  images: z.array(z.string()).default([]),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Insert schemas (without _id and timestamps)
export const insertUserSchema = userSchema.omit({ _id: true, createdAt: true });
export const insertShopSchema = shopSchema.omit({ _id: true, createdAt: true, updatedAt: true });
export const insertProductSchema = productSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// Types
export type User = z.infer<typeof userSchema>;
export type Shop = z.infer<typeof shopSchema>;
export type Product = z.infer<typeof productSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertShop = z.infer<typeof insertShopSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
