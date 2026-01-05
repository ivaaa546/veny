import Link from "next/link";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings, 
  LogOut, 
  Store,
  Menu,
  Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LogoutButton from "@/components/ui/dashboard/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex bg-muted/30">
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-background fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary/10 p-1.5 rounded-lg">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <span>goveny</span>
          </Link>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1">
           <NavLinks />
        </div>

        <div className="p-4 border-t">
          <div className="bg-primary/5 rounded-xl p-4 mb-4">
             <h4 className="font-semibold text-sm mb-1">Plan Gratuito</h4>
             <p className="text-xs text-muted-foreground mb-3">Estás usando la versión básica.</p>
             <Button size="sm" variant="outline" className="w-full text-xs h-8 bg-background">
               Ver Planes
             </Button>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen transition-all duration-300">
        
        {/* HEADER (Mobile & Breadcrumbs) */}
        <header className="h-16 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-40 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="h-16 flex items-center px-6 border-b">
                  <span className="font-bold text-xl">goveny</span>
                </div>
                <div className="py-6 px-3 space-y-1">
                  <NavLinks />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <LogoutButton />
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Breadcrumb / Title placeholder */}
            <h1 className="font-semibold text-lg hidden sm:block">Panel de Control</h1>
          </div>

          <div className="flex items-center gap-4">
             {/* User Profile Placeholder */}
             <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs border border-primary/20">
                ME
             </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLinks() {
  return (
    <>
      <NavItem href="/dashboard" icon={LayoutDashboard}>Resumen</NavItem>
      <NavItem href="/dashboard/products" icon={Package}>Productos</NavItem>
      <NavItem href="/dashboard/categories" icon={Tags}>Categorías</NavItem>
      <NavItem href="/dashboard/orders" icon={ShoppingBag}>Pedidos</NavItem>
      <NavItem href="/dashboard/settings" icon={Settings}>Configuración</NavItem>
    </>
  )
}

function NavItem({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-muted-foreground hover:text-primary hover:bg-primary/5 font-medium">
        <Icon className="h-4 w-4" />
        {children}
      </Button>
    </Link>
  )
}
