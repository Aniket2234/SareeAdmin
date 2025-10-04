import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddShopModal } from "@/components/modals/add-shop-modal";
import { Plus, Store, Eye, Edit, Trash2, CheckCircle, TriangleAlert } from "lucide-react";
import { Shop } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ShopsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [viewingShop, setViewingShop] = useState<Shop | null>(null);
  const { toast } = useToast();

  const { data: shops = [], isLoading } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  const deleteShopMutation = useMutation({
    mutationFn: async (shopId: string) => {
      await apiRequest("DELETE", `/api/shops/${shopId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shops"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Shop deleted",
        description: "Shop and all its products have been removed.",
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

  const handleDeleteShop = (shop: Shop) => {
    if (window.confirm(`Are you sure you want to delete "${shop.name}"? This will also delete all products in this shop.`)) {
      deleteShopMutation.mutate(shop._id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Manage Shops</h2>
              <p className="text-sm text-muted-foreground">Add, edit, and manage cloth shops with MongoDB connections</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} data-testid="button-add-shop">
              <Plus className="w-4 h-4 mr-2" />
              Add New Shop
            </Button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading shops...
            </div>
          ) : shops.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-12">
                <Store className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No shops added yet</p>
                <p className="text-sm text-muted-foreground mb-4">Create your first shop to get started</p>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  data-testid="button-add-first-shop"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Shop
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shops.map((shop) => (
                <Card key={shop._id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-shop-${shop._id}`}>
                  <div className="aspect-video w-full bg-muted relative overflow-hidden">
                    {shop.imageUrl ? (
                      <img 
                        src={shop.imageUrl} 
                        alt={shop.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.querySelector('.fallback-icon')?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`fallback-icon absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 ${shop.imageUrl ? 'hidden' : ''}`}>
                      <Store className="w-16 h-16 text-primary/40" />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge 
                        variant={
                          shop.status === "active" ? "default" : 
                          shop.status === "pending" ? "secondary" : "destructive"
                        }
                        data-testid={`status-${shop._id}`}
                      >
                        {shop.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground truncate" data-testid={`text-shop-name-${shop._id}`}>
                          {shop.name}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center mt-1" data-testid={`text-shop-location-${shop._id}`}>
                          📍 {shop.location}
                        </p>
                      </div>
                      
                      {shop.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {shop.description}
                        </p>
                      )}
                      
                      <div className="flex items-center pt-2">
                        <Badge variant="outline" className="text-green-800 border-green-200 bg-green-50 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setViewingShop(shop)}
                          data-testid={`button-view-catalog-${shop._id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingShop(shop)}
                          data-testid={`button-edit-shop-${shop._id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShop(shop)}
                          disabled={deleteShopMutation.isPending}
                          data-testid={`button-delete-shop-${shop._id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
      
      <AddShopModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
      />
      
      {/* Edit Shop Modal */}
      {editingShop && (
        <AddShopModal 
          open={!!editingShop} 
          onOpenChange={(open) => !open && setEditingShop(null)}
          shopToEdit={editingShop}
        />
      )}
      
      {/* View Shop Details Modal */}
      {viewingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card border border-border rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Shop Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingShop(null)}>
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Shop Name</p>
                <p className="font-medium text-foreground">{viewingShop.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium text-foreground">{viewingShop.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={viewingShop.status === "active" ? "default" : "secondary"}>
                  {viewingShop.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium text-foreground">{viewingShop.description || "No description"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">{new Date(viewingShop.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
