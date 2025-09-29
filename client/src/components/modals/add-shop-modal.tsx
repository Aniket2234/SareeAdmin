import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { insertShopSchema, InsertShop } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddShopModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddShopModal({ open, onOpenChange }: AddShopModalProps) {
  const { toast } = useToast();
  
  const form = useForm<InsertShop>({
    resolver: zodResolver(insertShopSchema),
    defaultValues: {
      name: "",
      location: "",
      mongoUri: "",
      description: "",
      status: "pending",
    },
  });

  const createShopMutation = useMutation({
    mutationFn: async (shopData: InsertShop) => {
      const response = await apiRequest("POST", "/api/shops", shopData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Shop created",
        description: "Shop has been added successfully and MongoDB connection verified.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create shop",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertShop) => {
    createShopMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Shop</DialogTitle>
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
              {createShopMutation.isPending ? "Adding Shop..." : "Add Shop"}
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
