import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddProductModal } from "@/components/modals/add-product-modal";
import { Plus, Search, Eye, Edit, Trash2, Package } from "lucide-react";
import { Product, Shop } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CatalogPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSize, setSelectedSize] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { data: shops = [] } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", selectedShop],
    queryFn: async () => {
      if (selectedShop && selectedShop !== "all") {
        // Fetch products from specific shop
        const response = await fetch(`/api/shops/${selectedShop}/products`, { credentials: "include" });
        if (!response.ok) throw new Error("Failed to fetch products");
        const products = await response.json();
        // Add shopId to each product for tracking
        return products.map((product: Product) => ({ ...product, shopId: selectedShop }));
      } else {
        // Fetch products from all shops
        const shopsResponse = await fetch("/api/shops", { credentials: "include" });
        if (!shopsResponse.ok) throw new Error("Failed to fetch shops");
        const shops = await shopsResponse.json();
        
        const allProducts = [];
        for (const shop of shops) {
          try {
            const response = await fetch(`/api/shops/${shop._id}/products`, { credentials: "include" });
            if (response.ok) {
              const shopProducts = await response.json();
              // Add shopId to each product for tracking
              const productsWithShopId = shopProducts.map((product: Product) => ({ ...product, shopId: shop._id }));
              allProducts.push(...productsWithShopId);
            }
          } catch (error) {
            console.warn(`Failed to fetch products for shop ${shop.name}:`, error);
          }
        }
        return allProducts;
      }
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async ({ productId, shopId }: { productId: string; shopId: string }) => {
      await apiRequest("DELETE", `/api/shops/${shopId}/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Product deleted",
        description: "Product has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate({ productId: product._id, shopId: (product as any).shopId || selectedShop });
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSize = selectedSize === "all" || (product.colors && product.colors.includes(selectedSize));
    
    return matchesSearch && matchesCategory && matchesSize;
  });

  // Get unique categories and colors for filters
  const categories = Array.from(new Set(products.map(p => p.category)));
  const sizes = Array.from(new Set(products.flatMap(p => p.colors || []).filter(Boolean)));

  const getShopName = (shopId: string) => {
    const shop = shops.find(s => s._id === shopId);
    return shop?.name || "Unknown Shop";
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Product Catalog</h2>
              <p className="text-sm text-muted-foreground">Manage products across all connected shops</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedShop} onValueChange={setSelectedShop}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Shops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shops</SelectItem>
                  {shops.map((shop) => (
                    <SelectItem key={shop._id} value={shop._id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAddModal(true)} data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </header>
        
        {/* Search and Filters */}
        <div className="bg-card border-b border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-products"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger>
                <SelectValue placeholder="All Sizes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                {sizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedSize("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        
        {/* Products Grid */}
        <main className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                {products.length === 0 
                  ? "Start by adding products to your shops" 
                  : "Try adjusting your search or filters"
                }
              </p>
              <Button onClick={() => setShowAddModal(true)} data-testid="button-add-first-product">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-product-${product._id}`}>
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    <Package className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getShopName((product as any).shopId)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2" data-testid={`text-product-name-${product._id}`}>
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-foreground" data-testid={`text-product-price-${product._id}`}>
                        ₹{product.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        In Stock: <span data-testid={`text-product-stock-${product._id}`}>{product.inStock ? 'Yes' : 'No'}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      {product.colors && product.colors.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.colors.map((color, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <Button 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => setEditingProduct(product)}
                        data-testid={`button-edit-product-${product._id}`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setViewingProduct(product)}
                        data-testid={`button-view-product-${product._id}`}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product)}
                        disabled={deleteProductMutation.isPending}
                        data-testid={`button-delete-product-${product._id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className="bg-card border-t border-border px-6 py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <span>© 2024 Made by </span>
              <span className="font-semibold text-primary ml-1">Airavata Technologies</span>
              <span className="ml-4">All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>v1.0.0</span>
              <span>•</span>
              <span>MongoDB Admin Panel</span>
            </div>
          </div>
        </footer>
      </div>
      
      <AddProductModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        shops={shops}
      />
      
      {/* Edit Product Modal */}
      {editingProduct && (
        <AddProductModal 
          open={!!editingProduct} 
          onOpenChange={(open) => !open && setEditingProduct(null)}
          shops={shops}
          productToEdit={editingProduct}
        />
      )}
      
      {/* View Product Details Modal */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Product Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingProduct(null)}>
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Product Name</p>
                <p className="font-medium text-foreground">{viewingProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium text-foreground">{viewingProduct.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium text-foreground">₹{viewingProduct.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium text-foreground">{viewingProduct.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Material</p>
                <p className="font-medium text-foreground">{viewingProduct.material || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Colors</p>
                <div className="flex flex-wrap gap-1">
                  {viewingProduct.colors?.map((color, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {color}
                    </Badge>
                  )) || <p className="text-muted-foreground text-sm">No colors specified</p>}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <Badge variant={viewingProduct.inStock ? "default" : "destructive"}>
                  {viewingProduct.inStock ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Shop</p>
                <p className="font-medium text-foreground">{getShopName((viewingProduct as any).shopId)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
