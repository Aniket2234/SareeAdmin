import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Store, Package, Database, CheckCircle, ArrowUp, TriangleAlert } from "lucide-react";
import { Shop } from "@shared/schema";

export default function HomePage() {
  const { data: stats } = useQuery<{
    totalShops: number;
    totalProducts: number;
    activeConnections: number;
    systemStatus: string;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: shops = [] } = useQuery<Shop[]>({
    queryKey: ["/api/shops"],
  });

  const recentShops = shops.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground">Welcome to Cloth Shop Management System</p>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Shops</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-shops">
                      {stats?.totalShops ?? 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    +2.5%
                  </span>
                  <span className="text-muted-foreground ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Products</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-total-products">
                      {stats?.totalProducts ?? 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    +12.3%
                  </span>
                  <span className="text-muted-foreground ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Connections</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="text-active-connections">
                      {stats?.activeConnections ?? 0}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Database className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-green-600 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    All healthy
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">System Status</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-system-status">
                      {stats?.systemStatus === "online" ? "Online" : "Offline"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-muted-foreground">Uptime: 99.9%</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Shops</CardTitle>
              </CardHeader>
              <CardContent>
                {recentShops.length > 0 ? (
                  <div className="space-y-4">
                    {recentShops.map((shop) => (
                      <div key={shop._id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mr-3">
                            <Store className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground" data-testid={`text-shop-name-${shop._id}`}>
                              {shop.name}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-shop-location-${shop._id}`}>
                              {shop.location}
                            </p>
                          </div>
                        </div>
                        <span 
                          className={`px-2 py-1 text-xs rounded-full ${
                            shop.status === "active" 
                              ? "bg-green-100 text-green-800" 
                              : shop.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                          data-testid={`status-${shop._id}`}
                        >
                          {shop.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No shops added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Database Connections</span>
                  <span className="text-foreground font-medium" data-testid="text-db-connections">
                    {stats?.activeConnections ?? 0}/10
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${((stats?.activeConnections ?? 0) / 10) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Storage Used</span>
                  <span className="text-foreground font-medium">2.4 GB / 10 GB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: "24%" }}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Requests (24h)</span>
                  <span className="text-foreground font-medium">45,231</span>
                </div>
              </CardContent>
            </Card>
          </div>
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
    </div>
  );
}
