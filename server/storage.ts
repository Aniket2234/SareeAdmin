import { MongoClient, Db, Collection, ObjectId, WithId, Document } from "mongodb";
import session from "express-session";
import MongoStore from "connect-mongo";
import { User, Shop, Product, InsertUser, InsertShop, InsertProduct } from "@shared/schema";

// MongoDB document types with ObjectId
type UserDoc = Omit<User, '_id'> & { _id: ObjectId };
type ShopDoc = Omit<Shop, '_id'> & { _id: ObjectId };
type ProductDoc = Omit<Product, '_id'> & { _id: ObjectId };

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

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private users: Collection<UserDoc>;
  private shops: Collection<ShopDoc>;
  private products: Collection<ProductDoc>;
  public sessionStore: session.Store;

  constructor() {
    const mongoUri = process.env.ADMIN_MONGODB_URI || "mongodb://localhost:27017/cloth_admin";
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db();
    this.users = this.db.collection("users");
    this.shops = this.db.collection("shops");
    this.products = this.db.collection("products");
    
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
      await this.products.createIndex({ shopId: 1 });
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

  async getShops(): Promise<Shop[]> {
    const shops = await this.shops.find({}).toArray();
    return shops.map(shop => ({ ...shop, _id: shop._id.toString() }));
  }

  async getShop(id: string): Promise<Shop | undefined> {
    const shop = await this.shops.findOne({ _id: new ObjectId(id) });
    return shop ? { ...shop, _id: shop._id.toString() } : undefined;
  }

  async createShop(shopData: InsertShop): Promise<Shop> {
    const result = await this.shops.insertOne({
      ...shopData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ShopDoc);
    
    const shop = await this.shops.findOne({ _id: result.insertedId });
    if (!shop) throw new Error("Failed to create shop");
    
    return { ...shop, _id: shop._id.toString() };
  }

  async updateShop(id: string, shopData: Partial<InsertShop>): Promise<Shop | undefined> {
    const result = await this.shops.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...shopData, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    return result ? { ...result, _id: result._id.toString() } : undefined;
  }

  async deleteShop(id: string): Promise<boolean> {
    const result = await this.shops.deleteOne({ _id: new ObjectId(id) });
    // Also delete all products for this shop
    await this.products.deleteMany({ shopId: id });
    return result.deletedCount > 0;
  }

  async getProducts(shopId?: string): Promise<Product[]> {
    const filter = shopId ? { shopId } : {};
    const products = await this.products.find(filter).toArray();
    return products.map(product => ({ ...product, _id: product._id.toString() }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const product = await this.products.findOne({ _id: new ObjectId(id) });
    return product ? { ...product, _id: product._id.toString() } : undefined;
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const result = await this.products.insertOne({
      ...productData,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ProductDoc);
    
    const product = await this.products.findOne({ _id: result.insertedId });
    if (!product) throw new Error("Failed to create product");
    
    return { ...product, _id: product._id.toString() };
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await this.products.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...productData, updatedAt: new Date() } },
      { returnDocument: "after" }
    );
    
    return result ? { ...result, _id: result._id.toString() } : undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.products.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
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
