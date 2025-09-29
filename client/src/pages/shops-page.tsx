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
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-6 py-4 text-muted-foreground font-medium">Shop Name</th>
                      <th className="text-left px-6 py-4 text-muted-foreground font-medium">Location</th>
                      <th className="text-left px-6 py-4 text-muted-foreground font-medium">MongoDB Status</th>
                      <th className="text-left px-6 py-4 text-muted-foreground font-medium">Status</th>
                      <th className="text-left px-6 py-4 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                          Loading shops...
                        </td>
                      </tr>
                    ) : shops.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center">
                            <Store className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No shops added yet</p>
                            <Button 
                              variant="outline" 
                              className="mt-4" 
                              onClick={() => setShowAddModal(true)}
                              data-testid="button-add-first-shop"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Your First Shop
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      shops.map((shop) => (
                        <tr key={shop._id} className="hover:bg-muted/50" data-testid={`row-shop-${shop._id}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                                <Store className="w-5 h-5 text-primary-foreground" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground" data-testid={`text-shop-name-${shop._id}`}>
                                  {shop.name}
                                </p>
                                <p className="text-sm text-muted-foreground">ID: {shop._id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-foreground" data-testid={`text-shop-location-${shop._id}`}>
                            {shop.location}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-green-800 border-green-200 bg-green-50">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Connected
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge 
                              variant={
                                shop.status === "active" ? "default" : 
                                shop.status === "pending" ? "secondary" : "destructive"
                              }
                              data-testid={`status-${shop._id}`}
                            >
                              {shop.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                title="View Catalog"
                                data-testid={`button-view-catalog-${shop._id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Edit Shop"
                                data-testid={`button-edit-shop-${shop._id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Delete Shop"
                                onClick={() => handleDeleteShop(shop)}
                                disabled={deleteShopMutation.isPending}
                                data-testid={`button-delete-shop-${shop._id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
