import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertShopSchema, insertProductSchema, insertCategorySchema } from "@shared/schema";

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

  // Category management routes for individual shops
  app.get("/api/shops/:shopId/categories", requireAuth, async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const categories = await storage.getShopCategories(shop.mongoUri);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/shops/:shopId/categories", requireAuth, async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createShopCategory(shop.mongoUri, categoryData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/shops/:shopId/categories/:categoryId", requireAuth, async (req, res, next) => {
    try {
      const { shopId, categoryId } = req.params;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateShopCategory(shop.mongoUri, categoryId, categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/shops/:shopId/categories/:categoryId", requireAuth, async (req, res, next) => {
    try {
      const { shopId, categoryId } = req.params;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const deleted = await storage.deleteShopCategory(shop.mongoUri, categoryId);
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  });

  // Product management routes for individual shops
  app.get("/api/shops/:shopId/products", requireAuth, async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const { category } = req.query;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const products = await storage.getShopProducts(shop.mongoUri, category as string);
      res.json(products);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/shops/:shopId/products", requireAuth, async (req, res, next) => {
    try {
      const { shopId } = req.params;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createShopProduct(shop.mongoUri, productData);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/shops/:shopId/products/:productId", requireAuth, async (req, res, next) => {
    try {
      const { shopId, productId } = req.params;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateShopProduct(shop.mongoUri, productId, productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/shops/:shopId/products/:productId", requireAuth, async (req, res, next) => {
    try {
      const { shopId, productId } = req.params;
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      
      const deleted = await storage.deleteShopProduct(shop.mongoUri, productId);
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
      
      // Calculate total products across all shop databases
      let totalProducts = 0;
      for (const shop of shops.filter(s => s.status === "active")) {
        try {
          const products = await storage.getShopProducts(shop.mongoUri);
          totalProducts += products.length;
        } catch (error) {
          // Skip shops with connection issues
          console.error(`Failed to get products for shop ${shop.name}:`, error);
        }
      }
      
      const stats = {
        totalShops: shops.length,
        totalProducts,
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
