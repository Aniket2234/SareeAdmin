import { MongoClient, Db, Collection, ObjectId, WithId, Document } from "mongodb";
import session from "express-session";
import MongoStore from "connect-mongo";
import { User, Shop, Product, Category, InsertUser, InsertShop, InsertProduct, InsertCategory } from "@shared/schema";

// MongoDB document types with ObjectId
type UserDoc = Omit<User, '_id'> & { _id: ObjectId };
type ShopDoc = Omit<Shop, '_id'> & { _id: ObjectId };
type CategoryDoc = Omit<Category, '_id'> & { _id: ObjectId };
type ProductDoc = Omit<Product, '_id'> & { _id: ObjectId };

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getShops(): Promise<Omit<Shop, 'mongoUri'>[]>;
  getShop(id: string): Promise<Omit<Shop, 'mongoUri'> | undefined>;
  createShop(shop: InsertShop): Promise<Omit<Shop, 'mongoUri'>>;
  updateShop(id: string, shop: Partial<InsertShop>): Promise<Omit<Shop, 'mongoUri'> | undefined>;
  deleteShop(id: string): Promise<boolean>;
  
  // Internal method for accessing shop with mongoUri (not in public interface)
  getShopInternal(id: string): Promise<Shop | undefined>;
  
  // Shop-specific database operations
  getShopCategories(shopMongoUri: string): Promise<Category[]>;
  getShopCategory(shopMongoUri: string, id: string): Promise<Category | undefined>;
  createShopCategory(shopMongoUri: string, category: InsertCategory): Promise<Category>;
  updateShopCategory(shopMongoUri: string, id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteShopCategory(shopMongoUri: string, id: string): Promise<boolean>;
  
  getShopProducts(shopMongoUri: string, categorySlug?: string): Promise<Product[]>;
  getShopProduct(shopMongoUri: string, id: string): Promise<Product | undefined>;
  createShopProduct(shopMongoUri: string, product: InsertProduct): Promise<Product>;
  updateShopProduct(shopMongoUri: string, id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteShopProduct(shopMongoUri: string, id: string): Promise<boolean>;
  
  testShopConnection(mongoUri: string): Promise<boolean>;
  
  sessionStore: session.Store;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private users: Collection<UserDoc>;
  private shops: Collection<ShopDoc>;
  public sessionStore: session.Store;

  constructor() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is required");
    }
    
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db();
    this.users = this.db.collection("users");
    this.shops = this.db.collection("shops");
    
    this.sessionStore = MongoStore.create({
      client: this.client,
      dbName: this.db.databaseName,
    });
    
    this.initialize();
  }

  private async initialize() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB");
      
      // Create indexes
      await this.users.createIndex({ email: 1 }, { unique: true });
      await this.shops.createIndex({ name: 1 });
    } catch (error) {
      console.error("MongoDB connection error:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.users.findOne({ _id: new ObjectId(id) });
    return user ? { ...user, _id: user._id.toString() } : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.users.findOne({ email });
    return user ? { ...user, _id: user._id.toString() } : undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await this.users.insertOne({
      ...userData,
      _id: new ObjectId(),
      createdAt: new Date(),
    } as UserDoc);
    
    const user = await this.users.findOne({ _id: result.insertedId });
    if (!user) throw new Error("Failed to create user");
    
    return { ...user, _id: user._id.toString() };
  }

  // Helper method to sanitize shop data for client responses (remove sensitive mongoUri)
  private sanitizeShop(shop: Shop): Omit<Shop, 'mongoUri'> {
    const { mongoUri, ...sanitizedShop } = shop;
    return sanitizedShop;
  }

  private sanitizeShops(shops: Shop[]): Omit<Shop, 'mongoUri'>[] {
    return shops.map(shop => this.sanitizeShop(shop));
  }

  async getShops(): Promise<Omit<Shop, 'mongoUri'>[]> {
    const shops = await this.shops.find({}).toArray();
    const shopsWithStringId = shops.map(shop => ({ ...shop, _id: shop._id.toString() }));
    return this.sanitizeShops(shopsWithStringId);
  }

  // Internal method that returns shop with mongoUri (for internal use only)
  async getShopInternal(id: string): Promise<Shop | undefined> {
    const shop = await this.shops.findOne({ _id: new ObjectId(id) });
    return shop ? { ...shop, _id: shop._id.toString() } : undefined;
  }

  async getShop(id: string): Promise<Omit<Shop, 'mongoUri'> | undefined> {
    const shop = await this.getShopInternal(id);
    return shop ? this.sanitizeShop(shop) : undefined;
  }

  async createShop(shopData: InsertShop): Promise<Omit<Shop, 'mongoUri'>> {
    const result = await this.shops.insertOne({
      ...shopData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ShopDoc);
    
    const shop = await this.shops.findOne({ _id: result.insertedId });
    if (!shop) throw new Error("Failed to create shop");
    
    const shopWithStringId = { ...shop, _id: shop._id.toString() };
    return this.sanitizeShop(shopWithStringId);
  }

  async updateShop(id: string, shopData: Partial<InsertShop>): Promise<Omit<Shop, 'mongoUri'> | undefined> {
    const result = await this.shops.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...shopData, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    if (!result) return undefined;
    const shopWithStringId = { ...result, _id: result._id.toString() };
    return this.sanitizeShop(shopWithStringId);
  }

  async deleteShop(id: string): Promise<boolean> {
    const result = await this.shops.deleteOne({ _id: new ObjectId(id) });
    // Note: Products are now stored in individual shop databases, not in the main database
    return result.deletedCount > 0;
  }

  // Helper method to get connection to a specific shop's database
  private async getShopDatabase(shopMongoUri: string): Promise<{ client: MongoClient; db: Db }> {
    const client = new MongoClient(shopMongoUri);
    await client.connect();
    return { client, db: client.db() };
  }

  // Category CRUD operations for individual shop databases
  async getShopCategories(shopMongoUri: string): Promise<Category[]> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const categories = await db.collection<CategoryDoc>("categories").find({}).toArray();
      return categories.map(cat => ({ ...cat, _id: cat._id.toString() }));
    } finally {
      await client.close();
    }
  }

  async getShopCategory(shopMongoUri: string, id: string): Promise<Category | undefined> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const category = await db.collection<CategoryDoc>("categories").findOne({ _id: new ObjectId(id) });
      return category ? { ...category, _id: category._id.toString() } : undefined;
    } finally {
      await client.close();
    }
  }

  async createShopCategory(shopMongoUri: string, categoryData: InsertCategory): Promise<Category> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const result = await db.collection<CategoryDoc>("categories").insertOne({
        ...categoryData,
        _id: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CategoryDoc);
      
      const category = await db.collection<CategoryDoc>("categories").findOne({ _id: result.insertedId });
      if (!category) throw new Error("Failed to create category");
      
      return { ...category, _id: category._id.toString() };
    } finally {
      await client.close();
    }
  }

  async updateShopCategory(shopMongoUri: string, id: string, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const result = await db.collection<CategoryDoc>("categories").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...categoryData, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      
      return result ? { ...result, _id: result._id.toString() } : undefined;
    } finally {
      await client.close();
    }
  }

  async deleteShopCategory(shopMongoUri: string, id: string): Promise<boolean> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const result = await db.collection<CategoryDoc>("categories").deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } finally {
      await client.close();
    }
  }

  // Product CRUD operations for individual shop databases
  async getShopProducts(shopMongoUri: string, categorySlug?: string): Promise<Product[]> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const filter = categorySlug ? { category: categorySlug } : {};
      const products = await db.collection<ProductDoc>("products").find(filter).toArray();
      return products.map(product => ({ ...product, _id: product._id.toString() }));
    } finally {
      await client.close();
    }
  }

  async getShopProduct(shopMongoUri: string, id: string): Promise<Product | undefined> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const product = await db.collection<ProductDoc>("products").findOne({ _id: new ObjectId(id) });
      return product ? { ...product, _id: product._id.toString() } : undefined;
    } finally {
      await client.close();
    }
  }

  async createShopProduct(shopMongoUri: string, productData: InsertProduct): Promise<Product> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const result = await db.collection<ProductDoc>("products").insertOne({
        ...productData,
        _id: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ProductDoc);
      
      const product = await db.collection<ProductDoc>("products").findOne({ _id: result.insertedId });
      if (!product) throw new Error("Failed to create product");
      
      return { ...product, _id: product._id.toString() };
    } finally {
      await client.close();
    }
  }

  async updateShopProduct(shopMongoUri: string, id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const result = await db.collection<ProductDoc>("products").findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...productData, updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      
      return result ? { ...result, _id: result._id.toString() } : undefined;
    } finally {
      await client.close();
    }
  }

  async deleteShopProduct(shopMongoUri: string, id: string): Promise<boolean> {
    const { client, db } = await this.getShopDatabase(shopMongoUri);
    try {
      const result = await db.collection<ProductDoc>("products").deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } finally {
      await client.close();
    }
  }

  async testShopConnection(mongoUri: string): Promise<boolean> {
    try {
      const client = new MongoClient(mongoUri);
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const storage = new MongoStorage();