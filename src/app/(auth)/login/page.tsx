'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AuthPage() {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    
    // Login State
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')

    // Register State
    const [registerEmail, setRegisterEmail] = useState('')
    const [registerPassword, setRegisterPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: loginEmail,
                password: loginPassword,
            })
            if (error) throw error

            toast.success('¡Bienvenido de nuevo!')
            router.push('/dashboard')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (registerPassword !== confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        if (registerPassword.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.signUp({
                email: registerEmail,
                password: registerPassword,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            })
            if (error) throw error
            
            toast.success('¡Cuenta creada!', {
                description: 'Por favor verifica tu correo electrónico para continuar.'
            })
        } catch (error: any) {
            toast.error(error.message || 'Error al crear cuenta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 relative">
            {/* Background Decor */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            <div className="absolute top-8 left-8">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </Button>
                </Link>
            </div>

            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-primary">goveny</h1>
                <p className="text-muted-foreground mt-2">Tu plataforma de comercio electrónico</p>
            </div>

            <Card className="w-full max-w-[400px] border-border shadow-lg pt-2">
                <Tabs defaultValue="login" className="w-full">
                    <div className="px-6 pt-6 mb-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Ingresar</TabsTrigger>
                            <TabsTrigger value="register">Crear Cuenta</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* LOGIN FORM */}
                    <TabsContent value="login" className="mt-0">
                        <form onSubmit={handleLogin}>
                            <CardContent className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email">Correo Electrónico</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="ejemplo@goveny.com"
                                        required
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2 pb-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="login-password">Contraseña</Label>
                                        <Link 
                                            href="/forgot-password" 
                                            className="text-xs text-primary hover:underline"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="login-password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                            className="pr-10 bg-background/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4">
                                <Button className="w-full h-11 shadow-lg shadow-primary/20" disabled={loading} type="submit">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Entrar a mi Tienda
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>

                    {/* REGISTER FORM */}
                    <TabsContent value="register" className="mt-0">
                        <form onSubmit={handleRegister}>
                            <CardContent className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-email">Correo Electrónico</Label>
                                    <Input
                                        id="register-email"
                                        type="email"
                                        placeholder="ejemplo@goveny.com"
                                        required
                                        value={registerEmail}
                                        onChange={(e) => setRegisterEmail(e.target.value)}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-password">Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            id="register-password"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            minLength={6}
                                            value={registerPassword}
                                            onChange={(e) => setRegisterPassword(e.target.value)}
                                            className="pr-10 bg-background/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 pb-2">
                                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-background/50"
                                        placeholder="Repite tu contraseña"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="pt-4">
                                <Button className="w-full h-11 shadow-lg shadow-primary/20" disabled={loading} type="submit">
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Crear mi Tienda
                                </Button>
                            </CardFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    )
}
