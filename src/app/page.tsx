import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, MessageCircle, BarChart3, ArrowRight, Zap, ShieldCheck, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10">
      {/* Background Gradients & Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 opacity-20 blur-[100px]"></div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">goveny</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Iniciar Sesión</Button>
            </Link>
            <Link href="/login">
              <Button className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                Crear Tienda
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section - 2 Columns */}
        <section className="w-full py-12 md:py-24 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-6 md:px-12 lg:px-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left Column: Text Content */}
              <div className="flex flex-col space-y-8 text-left">
                <div className="space-y-4 relative">
                  <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl text-foreground">
                    Crea tu tienda<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary bg-300% animate-gradient">
                      Online en minutos
                    </span>
                  </h1>
                  <p className="max-w-[540px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                    Crea tu catálogo digital, comparte tu link y recibe pedidos directamente en tu WhatsApp. Todo gestionado desde un panel simple y poderoso.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link href="/login" className="w-full sm:w-auto">
                    <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto rounded-full shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 border-0">
                      Comenzar Gratis <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#features" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="h-14 px-8 text-lg w-full sm:w-auto rounded-full border-border hover:bg-muted/50 hover:text-foreground bg-background/50 backdrop-blur-sm">
                      Saber más
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Hero Image */}
              <div className="relative group perspective-1000 animate-in fade-in zoom-in duration-1000 flex justify-center lg:justify-start">
                <div className="relative max-w-md md:max-w-lg">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

                  {/* Image Wrapper */}
                  <div className="relative">
                    <Image
                      src="/images/imagenespresenteacion.png"
                      alt="Goveny Dashboard Preview"
                      width={500}
                      height={500}
                      className="rounded-2xl shadow-2xl transform lg:rotate-2 group-hover:rotate-0 transition-transform duration-500 ease-out border border-white/20"
                      priority
                    />

                    {/* Floating Element: New Order Notification */}
                    <div className="absolute -bottom-4 -left-4 bg-background p-3 rounded-xl shadow-xl border border-border animate-bounce-slow hidden md:block">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Nuevo Pedido</p>
                          <p className="text-sm font-bold">Q 250.00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="w-full py-20 bg-card relative">
          <div className="absolute inset-0 bg-muted/30 skew-y-1 transform origin-bottom-left -z-10 translate-y-20"></div>

          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl text-foreground">
                Todo lo que necesitas
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Olvídate de configurar servidores o plugins complejos. Goveny te da todo listo para vender.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="group relative overflow-hidden border-border bg-background hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all"></div>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Tu Propia URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Obtén una dirección web personalizada (goveny.com/tu-marca) para compartir en Instagram, TikTok y Facebook.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="group relative overflow-hidden border-border bg-background hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all"></div>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Pedidos a WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    El cliente arma su carrito y al finalizar, se genera un mensaje automático a tu WhatsApp con el detalle completo.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="group relative overflow-hidden border-border bg-background hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-all"></div>
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Gestión Simple</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    Controla inventario, variantes (tallas, colores) y precios desde un panel diseñado para humanos, no robots.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-foreground"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-4xl bg-primary/20 blur-[120px]"></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl md:text-5xl mb-6">
              ¿Listo para vender más?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground text-lg mb-8">
              Únete a los emprendedores que ya están usando Goveny para profesionalizar su negocio.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 rounded-full bg-background text-primary hover:bg-muted font-bold text-lg w-full sm:w-auto shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-6 text-muted-foreground text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Datos Seguros
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" /> Acceso Mundial
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-8 bg-background border-t border-border/50">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row px-4 md:px-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} <span className="font-bold text-foreground">goveny</span>.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Términos
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
