import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Key, Info, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [mongoUri, setMongoUri] = useState("");
  const [testResult, setTestResult] = useState<{ connected: boolean } | null>(null);
  const { toast } = useToast();

  const testConnectionMutation = useMutation({
    mutationFn: async (uri: string) => {
      const response = await apiRequest("POST", "/api/test-connection", { mongoUri: uri });
      return response.json();
    },
    onSuccess: (result) => {
      setTestResult(result);
      toast({
        title: result.connected ? "Connection successful" : "Connection failed",
        description: result.connected 
          ? "Successfully connected to MongoDB" 
          : "Unable to connect to the provided MongoDB URI",
        variant: result.connected ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Test failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = () => {
    if (!mongoUri.trim()) {
      toast({
        title: "URI required",
        description: "Please enter a MongoDB URI to test",
        variant: "destructive",
      });
      return;
    }
    testConnectionMutation.mutate(mongoUri);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="ml-64">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">System Settings</h2>
              <p className="text-sm text-muted-foreground">Configure MongoDB connections and environment variables</p>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-4xl space-y-6">
            {/* MongoDB Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  MongoDB Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="admin-mongo-uri">Admin Panel MongoDB URI</Label>
                  <Input
                    id="admin-mongo-uri"
                    type="password"
                    placeholder="mongodb://localhost:27017/admin_panel"
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    className="mt-2"
                    data-testid="input-mongo-uri"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This URI is stored in .env file for admin panel database
                  </p>
                </div>
                
                {testResult && (
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                    testResult.connected 
                      ? "bg-green-50 text-green-800 border border-green-200" 
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}>
                    {testResult.connected ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {testResult.connected 
                        ? "Connection successful" 
                        : "Connection failed"
                      }
                    </span>
                  </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <Button 
                    onClick={handleTestConnection}
                    disabled={testConnectionMutation.isPending || !mongoUri.trim()}
                    data-testid="button-test-connection"
                  >
                    {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                  </Button>
                  <Button variant="outline" data-testid="button-update-config">
                    Update Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Environment Variables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Environment Variables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm">
                  <div className="space-y-1 text-muted-foreground">
                    <div># .env file for Admin Panel</div>
                    <div>ADMIN_MONGODB_URI=mongodb://localhost:27017/cloth_admin</div>
                    <div>JWT_SECRET=your_jwt_secret_key_here</div>
                    <div>SESSION_SECRET=your_session_secret_here</div>
                    <div>ADMIN_EMAIL=admin@airavata.tech</div>
                    <div>ADMIN_PASSWORD=hashed_password_here</div>
                    <div>PORT=5000</div>
                    <div>NODE_ENV=production</div>
                  </div>
                </div>
                <div className="flex items-start space-x-2 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Info className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Make sure to keep your .env file secure and never commit it to version control.
                    Update these values according to your environment setup.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Version</p>
                    <p className="font-medium text-foreground" data-testid="text-version">v1.0.0</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Developer</p>
                    <p className="font-medium text-foreground" data-testid="text-developer">Airavata Technologies</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Database Type</p>
                    <p className="font-medium text-foreground" data-testid="text-database-type">MongoDB Only</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium text-foreground" data-testid="text-last-updated">December 2024</p>
                  </div>
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
