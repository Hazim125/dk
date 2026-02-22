import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUser, useLogout } from "@/hooks/use-auth";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import Settings from "@/pages/Settings"; // استيراد صفحة الإعدادات
import NotFound from "@/pages/not-found";
import { Loader2, LogOut, Settings as SettingsIcon, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect } from "react";

// Protected Route Wrapper
function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (adminOnly && user.role !== "admin") {
    return <div className="p-8 text-center text-red-500">غير مصرح لك بالوصول لهذه الصفحة</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold cursor-pointer hover:rotate-6 transition-transform">
                D
              </div>
            </Link>
            <h1 className="font-bold text-lg hidden sm:block">إدارة المهام</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium ml-2 hidden sm:inline-block">
               {user.name} ({user.role === 'admin' ? 'مدير' : 'موظف'})
            </span>
            
            <Link href="/">
              <Button variant="ghost" size="icon" title="الرئيسية">
                <Home className="h-5 w-5" />
              </Button>
            </Link>

            <Link href="/settings">
              <Button variant="ghost" size="icon" title="الإعدادات">
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </Link>

            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 py-8">
        <Component />
      </main>
    </div>
  );
}

function LogoutButton() {
  const { mutate: logout } = useLogout();
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => logout()}
      title="تسجيل الخروج"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>
      <Route path="/">
        {() => {
          const { data: user, isLoading } = useUser();
          if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
          if (!user) return <Login />;
          return user.role === 'admin' ? 
            <ProtectedRoute component={AdminDashboard} adminOnly /> : 
            <ProtectedRoute component={EmployeeDashboard} />;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
