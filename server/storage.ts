import session from "express-session";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { users, shops, products, User, Shop, Product, InsertUser, InsertShop, InsertProduct } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getShops(): Promise<Shop[]>;
  getShop(id: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop | undefined>;
  deleteShop(id: string): Promise<boolean>;
  
  getProducts(shopId?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  testShopConnection(mongoUri: string): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    // Use memory store for sessions in development (no persistence between restarts)
    const MemoryStore = session.MemoryStore;
    this.sessionStore = new MemoryStore();
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getShops(): Promise<Shop[]> {
    return await db.select().from(shops);
  }

  async getShop(id: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.id, id));
    return shop || undefined;
  }

  async createShop(shopData: InsertShop): Promise<Shop> {
    const [shop] = await db
      .insert(shops)
      .values({
        ...shopData,
        updatedAt: new Date(),
      })
      .returning();
    return shop;
  }

  async updateShop(id: string, shopData: Partial<InsertShop>): Promise<Shop | undefined> {
    const [shop] = await db
      .update(shops)
      .set({
        ...shopData,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, id))
      .returning();
    return shop || undefined;
  }

  async deleteShop(id: string): Promise<boolean> {
    // First delete all products for this shop
    await db.delete(products).where(eq(products.shopId, id));
    
    // Then delete the shop
    const result = await db.delete(shops).where(eq(shops.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getProducts(shopId?: string): Promise<Product[]> {
    if (shopId) {
      return await db.select().from(products).where(eq(products.shopId, shopId));
    }
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...productData,
        updatedAt: new Date(),
      })
      .returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({
        ...productData,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async testShopConnection(mongoUri: string): Promise<boolean> {
    // Since we're using PostgreSQL now, this method can just return true
    // or implement actual MongoDB connection testing if still needed for shop databases
    try {
      // For now, just validate the URI format
      new URL(mongoUri);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const storage = new DatabaseStorage();