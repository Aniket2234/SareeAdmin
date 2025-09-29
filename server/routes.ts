import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertShopSchema, insertProductSchema } from "@shared/schema";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Shop management routes
  app.get("/api/shops", requireAuth, async (req, res, next) => {
    try {
      const shops = await storage.getShops();
      res.json(shops);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/shops", requireAuth, async (req, res, next) => {
    try {
      const shopData = insertShopSchema.parse(req.body);
      
      // Test MongoDB connection before creating shop
      const isConnected = await storage.testShopConnection(shopData.mongoUri);
      if (!isConnected) {
        return res.status(400).json({ message: "Cannot connect to provided MongoDB URI" });
      }
      
      const shop = await storage.createShop({
        ...shopData,
        status: "active"
      });
      res.status(201).json(shop);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/shops/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const shopData = insertShopSchema.partial().parse(req.body);
      
      if (shopData.mongoUri) {
        const isConnected = await storage.testShopConnection(shopData.mongoUri);
        if (!isConnected) {
          return res.status(400).json({ message: "Cannot connect to provided MongoDB URI" });
        }
      }
      
      const shop = await storage.updateShop(id, shopData);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/shops/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteShop(id);
      if (!deleted) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Product management routes
  app.get("/api/products", requireAuth, async (req, res, next) => {
    try {
      const { shopId } = req.query;
      const products = await storage.getProducts(shopId as string);
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/products", requireAuth, async (req, res, next) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteProduct(id);
      if (!deleted) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Statistics endpoint
  app.get("/api/stats", requireAuth, async (req, res, next) => {
    try {
      const shops = await storage.getShops();
      const products = await storage.getProducts();
      
      const stats = {
        totalShops: shops.length,
        totalProducts: products.length,
        activeConnections: shops.filter(shop => shop.status === "active").length,
        systemStatus: "online",
      };
      
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  // Test MongoDB connection endpoint
  app.post("/api/test-connection", requireAuth, async (req, res, next) => {
    try {
      const { mongoUri } = req.body;
      const isConnected = await storage.testShopConnection(mongoUri);
      res.json({ connected: isConnected });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
