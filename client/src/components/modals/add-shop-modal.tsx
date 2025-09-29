import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { insertShopSchema, InsertShop, Shop } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopToEdit?: Shop;
}

export function AddShopModal({ open, onOpenChange, shopToEdit }: AddShopModalProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertShop>({
    resolver: zodResolver(insertShopSchema),
    defaultValues: shopToEdit ? {
      name: shopToEdit.name,
      location: shopToEdit.location,
      mongoUri: shopToEdit.mongoUri,
      description: shopToEdit.description || "",
      status: shopToEdit.status,
    } : {
      name: "",
      location: "",
      mongoUri: "",
      description: "",
      status: "pending",
    },
  });

  const createShopMutation = useMutation({
    mutationFn: async (shopData: InsertShop) => {
      if (shopToEdit) {
        const response = await apiRequest("PUT", `/api/shops/${shopToEdit._id}`, shopData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/shops", shopData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: shopToEdit ? "Shop updated" : "Shop created",
        description: shopToEdit ? "Shop has been updated successfully." : "Shop has been added successfully and MongoDB connection verified.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: shopToEdit ? "Failed to update shop" : "Failed to create shop",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form when shopToEdit changes
  useEffect(() => {
    if (shopToEdit) {
      form.reset({
        name: shopToEdit.name,
        location: shopToEdit.location,
        mongoUri: shopToEdit.mongoUri,
        description: shopToEdit.description || "",
        status: shopToEdit.status,
      });
    } else {
      form.reset({
        name: "",
        location: "",
        mongoUri: "",
        description: "",
        status: "pending",
      });
    }
  }, [shopToEdit, form]);

  const onSubmit = (data: InsertShop) => {
    createShopMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shopToEdit ? "Edit Shop" : "Add New Shop"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop-name">Shop Name *</Label>
            <Input
              id="shop-name"
              placeholder="Enter shop name"
              data-testid="input-shop-name"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shop-location">Location *</Label>
            <Input
              id="shop-location"
              placeholder="City, State"
              data-testid="input-shop-location"
              {...form.register("location")}
            />
            {form.formState.errors.location && (
              <p className="text-sm text-destructive">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shop-mongo-uri">MongoDB URI *</Label>
            <Input
              id="shop-mongo-uri"
              placeholder="mongodb://localhost:27017/shop_db"
              data-testid="input-shop-mongo-uri"
              {...form.register("mongoUri")}
            />
            <p className="text-xs text-muted-foreground">
              This URI will be used to connect to shop's product database
            </p>
            {form.formState.errors.mongoUri && (
              <p className="text-sm text-destructive">
                {form.formState.errors.mongoUri.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="shop-description">Description</Label>
            <Textarea
              id="shop-description"
              rows={3}
              placeholder="Brief description about the shop"
              data-testid="textarea-shop-description"
              {...form.register("description")}
            />
          </div>
          
          <div className="flex items-center space-x-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createShopMutation.isPending}
              data-testid="button-submit-shop"
            >
              {createShopMutation.isPending ? (shopToEdit ? "Updating Shop..." : "Adding Shop...") : (shopToEdit ? "Update Shop" : "Add Shop")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-shop"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
