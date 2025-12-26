import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, MessageCircle, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">TuMarca</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Crear Tienda Gratis</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-white dark:bg-black">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Crea tu Tienda Online en minutos <br className="hidden md:inline" />
                  y vende por WhatsApp
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Sin comisiones, sin complicaciones. Gestiona pedidos e inventario desde un solo lugar y conecta directamente con tus clientes.
                </p>
              </div>
              <div className="space-x-4 pt-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8">
                    Comenzar Ahora <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Saber más
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-zinc-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-zinc-800">
                Características
              </div>
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Todo lo que necesitas para vender
              </h2>
              <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                Diseñado para emprendedores que quieren simplicidad y potencia.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <ShoppingBag className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Catálogo Digital</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    Sube tus productos, variantes y precios fácilmente. Comparte tu enlace y deja que tus clientes exploren tu oferta.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md">
                <CardHeader>
                  <MessageCircle className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Pedidos por WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    Recibe órdenes directas a tu chat de WhatsApp con todos los detalles listos para confirmar y enviar.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md">
                <CardHeader>
                  <BarChart3 className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>Panel de Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 dark:text-gray-400">
                    Gestiona tu inventario, sigue el estado de tus ventas y obtén métricas claras para hacer crecer tu negocio.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Social Proof / Trust (Optional but good for Landing Pages) */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white dark:bg-black">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Empieza gratis hoy mismo
              </h2>
              <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed dark:text-gray-400">
                No necesitas tarjeta de crédito. Configura tu tienda en menos de 5 minutos.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                <Link href="/register">
                  <Button size="lg">Crear mi cuenta</Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-8">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Plan gratuito disponible
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Sin comisiones ocultas
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-6 bg-white dark:bg-black">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row px-4 md:px-6">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left dark:text-gray-400">
            © {new Date().getFullYear()} TuMarca. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Términos
            </Link>
            <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}