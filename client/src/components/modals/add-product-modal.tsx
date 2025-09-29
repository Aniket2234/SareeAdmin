import { useForm } from "react-hook-form";
import { useEffect } from "react";
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

const categories = ["Shirts", "Pants", "Dresses", "Accessories", "Shoes", "Jackets"];
const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

export function AddProductModal({ open, onOpenChange, shops, productToEdit }: AddProductModalProps) {
  const { toast } = useToast();
  
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

  // Reset form when productToEdit changes
  useEffect(() => {
    if (productToEdit) {
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
    createProductMutation.mutate(data);
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
                onValueChange={(value) => form.setValue("shopId", value)}
                value={form.watch("shopId")}
              >
                <SelectTrigger data-testid="select-product-shop">
                  <SelectValue placeholder="Select Shop" />
                </SelectTrigger>
                <SelectContent>
                  {shops.map((shop) => (
                    <SelectItem key={shop._id} value={shop._id}>
                      {shop.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.shopId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.shopId.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-category">Category *</Label>
              <Select
                onValueChange={(value) => form.setValue("category", value)}
                value={form.watch("category")}
              >
                <SelectTrigger data-testid="select-product-category">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="product-size">Size</Label>
              <Select
                onValueChange={(value) => form.setValue("size", value)}
                value={form.watch("size")}
              >
                <SelectTrigger data-testid="select-product-size">
                  <SelectValue placeholder="Select Size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-color">Color</Label>
              <Input
                id="product-color"
                placeholder="e.g., Blue, Red"
                data-testid="input-product-color"
                {...form.register("color")}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-stock">Stock Quantity *</Label>
              <Input
                id="product-stock"
                type="number"
                placeholder="0"
                data-testid="input-product-stock"
                {...form.register("stock", { valueAsNumber: true })}
              />
              {form.formState.errors.stock && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.stock.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createProductMutation.isPending}
              data-testid="button-submit-product"
            >
              {createProductMutation.isPending ? "Adding Product..." : "Add Product"}
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
