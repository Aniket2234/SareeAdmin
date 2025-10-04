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
import { Plus, Trash2 } from "lucide-react";

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
  const [imageUrls, setImageUrls] = useState<string[]>(productToEdit?.images || [""]);
  
  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: productToEdit ? {
      name: productToEdit.name,
      description: productToEdit.description,
      category: productToEdit.category,
      price: productToEdit.price,
      originalPrice: productToEdit.originalPrice,
      discountPercentage: productToEdit.discountPercentage,
      material: productToEdit.material || "",
      colors: productToEdit.colors || [],
      inStock: productToEdit.inStock,
      images: productToEdit.images || [],
      collectionType: productToEdit.collectionType,
      rating: productToEdit.rating,
      reviewCount: productToEdit.reviewCount,
    } : {
      name: "",
      description: "",
      category: "",
      price: 0,
      originalPrice: undefined,
      discountPercentage: undefined,
      material: "",
      colors: [],
      inStock: true,
      images: [],
      collectionType: undefined,
      rating: undefined,
      reviewCount: undefined,
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
      setImageUrls(productToEdit.images && productToEdit.images.length > 0 ? productToEdit.images : [""]);
      form.reset({
        name: productToEdit.name,
        description: productToEdit.description,
        category: productToEdit.category,
        price: productToEdit.price,
        originalPrice: productToEdit.originalPrice,
        discountPercentage: productToEdit.discountPercentage,
        material: productToEdit.material || "",
        colors: productToEdit.colors || [],
        inStock: productToEdit.inStock,
        images: productToEdit.images || [],
        collectionType: productToEdit.collectionType,
        rating: productToEdit.rating,
        reviewCount: productToEdit.reviewCount,
      });
    } else {
      setSelectedShopId("");
      setImageUrls([""]);
      form.reset({
        name: "",
        description: "",
        category: "",
        price: 0,
        originalPrice: undefined,
        discountPercentage: undefined,
        material: "",
        colors: [],
        inStock: true,
        images: [],
        collectionType: undefined,
        rating: undefined,
        reviewCount: undefined,
      });
    }
  }, [productToEdit, form]);

  const onSubmit = (data: InsertProduct & { shopId?: string }) => {
    const filteredImages = imageUrls.filter(url => url.trim().length > 0);
    const submitData = { ...data, images: filteredImages, shopId: selectedShopId };
    createProductMutation.mutate(submitData);
  };

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ""]);
  };

  const removeImageUrl = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    setImageUrls(newUrls.length > 0 ? newUrls : [""]);
  };

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-original-price">Original Price (₹)</Label>
              <Input
                id="product-original-price"
                type="number"
                placeholder="0.00"
                {...form.register("originalPrice", { valueAsNumber: true })}
              />
              {form.formState.errors.originalPrice && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.originalPrice.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-discount">Discount Percentage (%)</Label>
              <Input
                id="product-discount"
                type="number"
                placeholder="0"
                min="0"
                max="100"
                {...form.register("discountPercentage", { valueAsNumber: true })}
              />
              {form.formState.errors.discountPercentage && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.discountPercentage.message}
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product-collection-type">Collection Type</Label>
              <Input
                id="product-collection-type"
                placeholder="e.g., trending, exclusive, new"
                {...form.register("collectionType")}
              />
              <p className="text-xs text-muted-foreground">
                Tag for grouping products (trending, exclusive, etc.)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-rating">Rating (0-5)</Label>
              <Input
                id="product-rating"
                type="number"
                placeholder="0"
                min="0"
                max="5"
                step="0.1"
                {...form.register("rating", { valueAsNumber: true })}
              />
              {form.formState.errors.rating && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.rating.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product-review-count">Review Count</Label>
              <Input
                id="product-review-count"
                type="number"
                placeholder="0"
                min="0"
                {...form.register("reviewCount", { valueAsNumber: true })}
              />
              {form.formState.errors.reviewCount && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.reviewCount.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Product Images</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addImageUrl}
                className="h-8"
                data-testid="button-add-image"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Image
              </Button>
            </div>
            <div className="space-y-2">
              {imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={`Image URL ${index + 1}${index === 0 ? ' (Main)' : ''}`}
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      data-testid={`input-product-image-${index}`}
                    />
                  </div>
                  {imageUrls.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImageUrl(index)}
                      className="h-10 px-3"
                      data-testid={`button-remove-image-${index}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              The first image will be used as the main product image. Click "Add Image" to add more images.
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
