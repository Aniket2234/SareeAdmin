import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertProductSchema, InsertProduct, Shop, Product } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shops: Shop[];
  productToEdit?: Product;
}

// Categories will be fetched from the selected shop's database
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

export function AddProductModal({ open, onOpenChange, shops, productToEdit }: AddProductModalProps) {
  const { toast } = useToast();
  const [selectedShopId, setSelectedShopId] = useState<string>(productToEdit ? (productToEdit as any).shopId || "" : "");
  
  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: productToEdit ? {
      name: productToEdit.name,
      description: productToEdit.description,
      category: productToEdit.category,
      price: productToEdit.price,
      material: productToEdit.material || "",
      colors: productToEdit.colors || [],
      inStock: productToEdit.inStock,
      images: productToEdit.images || [],
    } : {
      name: "",
      description: "",
      category: "",
      price: 0,
      material: "",
      colors: [],
      inStock: true,
      images: [],
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: InsertProduct & { shopId?: string }) => {
      const selectedShopId = productData.shopId || (productToEdit as any)?.shopId;
      if (!selectedShopId) {
        throw new Error("Please select a shop");
      }
      
      if (productToEdit) {
        const response = await apiRequest("PUT", `/api/shops/${selectedShopId}/products/${productToEdit._id}`, productData);
        return response.json();
      } else {
        const response = await apiRequest("POST", `/api/shops/${selectedShopId}/products`, productData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: productToEdit ? "Product updated" : "Product created",
        description: productToEdit ? "Product has been updated successfully." : "Product has been added successfully.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: productToEdit ? "Failed to update product" : "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch categories from selected shop
  const { data: categories = [] } = useQuery({
    queryKey: ["shop-categories", selectedShopId],
    queryFn: async () => {
      if (!selectedShopId) return [];
      const response = await fetch(`/api/shops/${selectedShopId}/categories`, { credentials: "include" });
      if (!response.ok) return [];
      const cats = await response.json();
      return cats.map((cat: any) => ({ slug: cat.slug, name: cat.name }));
    },
    enabled: !!selectedShopId,
  });

  // Reset form when productToEdit changes
  useEffect(() => {
    if (productToEdit) {
      const shopId = (productToEdit as any).shopId || "";
      setSelectedShopId(shopId);
      form.reset({
        name: productToEdit.name,
        description: productToEdit.description,
        category: productToEdit.category,
        price: productToEdit.price,
        material: productToEdit.material || "",
        colors: productToEdit.colors || [],
        inStock: productToEdit.inStock,
        images: productToEdit.images || [],
      });
    } else {
      setSelectedShopId("");
      form.reset({
        name: "",
        description: "",
        category: "",
        price: 0,
        material: "",
        colors: [],
        inStock: true,
        images: [],
      });
    }
  }, [productToEdit, form]);

  const onSubmit = (data: InsertProduct & { shopId?: string }) => {
    const submitData = { ...data, shopId: selectedShopId };
    createProductMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productToEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {productToEdit ? "Update the product details below." : "Fill in the details below to add a new product to your selected shop."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="Enter product name"
                data-testid="input-product-name"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-shop">Shop *</Label>
              <Select
                onValueChange={(value) => setSelectedShopId(value)}
                value={selectedShopId}
                disabled={!!productToEdit}
              >
                <SelectTrigger data-testid="select-product-shop">
                  <SelectValue placeholder={productToEdit ? shops.find(s => s._id === selectedShopId)?.name || "Shop" : "Select Shop"} />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop._id} value={shop._id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {productToEdit && (
                <p className="text-xs text-muted-foreground">Shop cannot be changed when editing</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-category">Category *</Label>
              <Select
                onValueChange={(value) => form.setValue("category", value)}
                value={form.watch("category")}
                disabled={!selectedShopId}
              >
                <SelectTrigger data-testid="select-product-category">
                  <SelectValue placeholder={!selectedShopId ? "Select shop first" : "Select Category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: { slug: string; name: string }) => (
                    <SelectItem key={category.slug} value={category.slug}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedShopId && (
                <p className="text-xs text-muted-foreground">Please select a shop to see categories</p>
              )}
              {form.formState.errors.category && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-price">Price (₹) *</Label>
              <Input
                id="product-price"
                type="number"
                placeholder="0.00"
                data-testid="input-product-price"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="product-description">Description *</Label>
            <Textarea
              id="product-description"
              rows={3}
              placeholder="Product description"
              data-testid="textarea-product-description"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-material">Material</Label>
              <Input
                id="product-material"
                placeholder="Cotton, Silk, etc."
                {...form.register("material")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-colors">Colors (comma-separated)</Label>
              <Input
                id="product-colors"
                placeholder="e.g., Blue, Red, Green"
                data-testid="input-product-colors"
                value={form.watch("colors")?.join(", ") || ""}
                onChange={(e) => {
                  const colorsString = e.target.value;
                  const colorsArray = colorsString.split(",").map(c => c.trim()).filter(c => c.length > 0);
                  form.setValue("colors", colorsArray);
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-stock">In Stock</Label>
              <Select
                onValueChange={(value) => form.setValue("inStock", value === "true")}
                value={form.watch("inStock") ? "true" : "false"}
              >
                <SelectTrigger data-testid="select-product-stock">
                  <SelectValue placeholder="Select stock status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="product-images">Image URLs (comma-separated)</Label>
            <Textarea
              id="product-images"
              rows={2}
              placeholder="e.g., https://example.com/image1.jpg, https://example.com/image2.jpg"
              data-testid="textarea-product-images"
              value={form.watch("images")?.join(", ") || ""}
              onChange={(e) => {
                const imagesString = e.target.value;
                const imagesArray = imagesString.split(",").map(url => url.trim()).filter(url => url.length > 0);
                form.setValue("images", imagesArray);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Add image URLs separated by commas. The first image will be used as the main product image.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createProductMutation.isPending}
              data-testid="button-submit-product"
            >
              {createProductMutation.isPending ? (productToEdit ? "Updating Product..." : "Adding Product...") : (productToEdit ? "Update Product" : "Add Product")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-product"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
