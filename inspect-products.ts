import { MongoClient } from "mongodb";

async function inspectProducts() {
  const mainMongoUri = process.env.MONGODB_URI;
  if (!mainMongoUri) {
    console.error("MONGODB_URI is not set");
    process.exit(1);
  }

  const mainClient = new MongoClient(mainMongoUri);
  
  try {
    await mainClient.connect();
    console.log("Connected to main MongoDB");
    
    const mainDb = mainClient.db();
    const shopsCollection = mainDb.collection("shops");
    
    const shops = await shopsCollection.find({}).limit(5).toArray();
    console.log(`\nFound ${shops.length} shop(s):\n`);
    
    for (const shop of shops) {
      console.log(`\n=== Shop: ${shop.name} ===`);
      console.log(`ID: ${shop._id}`);
      console.log(`Location: ${shop.location}`);
      console.log(`Status: ${shop.status}`);
      console.log(`MongoDB URI: ${shop.mongoUri ? '[CONFIGURED]' : '[NOT SET]'}`);
      
      if (shop.mongoUri) {
        try {
          const shopClient = new MongoClient(shop.mongoUri);
          await shopClient.connect();
          
          const shopDb = shopClient.db();
          const collections = await shopDb.listCollections().toArray();
          console.log(`\nCollections in shop database:`);
          collections.forEach(col => console.log(`  - ${col.name}`));
          
          const productsCollection = shopDb.collection("products");
          const productCount = await productsCollection.countDocuments();
          console.log(`\nTotal products: ${productCount}`);
          
          if (productCount > 0) {
            const sampleProducts = await productsCollection.find({}).limit(3).toArray();
            console.log(`\nSample products structure:`);
            sampleProducts.forEach((product, index) => {
              console.log(`\nProduct ${index + 1}:`);
              console.log(JSON.stringify(product, null, 2));
            });
          }
          
          await shopClient.close();
        } catch (error: any) {
          console.error(`Error connecting to shop database: ${error.message}`);
        }
      }
    }
    
  } catch (error: any) {
    console.error("Error:", error.message);
  } finally {
    await mainClient.close();
  }
}

inspectProducts();
