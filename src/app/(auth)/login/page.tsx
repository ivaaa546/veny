'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false) // Alternar entre Login y Registro
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (isSignUp) {
                // REGISTRO
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                alert('¡Registro exitoso! Revisa tu correo para confirmar (o inicia sesión si deshabilitaste confirmación).')
            } else {
                // LOGIN
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                // Redirigir al dashboard al entrar
                router.push('/dashboard')
                router.refresh() // Actualizar rutas del servidor
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</CardTitle>
                    <CardDescription>
                        Ingresa tus datos para gestionar tu tienda en LinkStore.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignUp ? 'Registrarse' : 'Entrar'}
                        </Button>

                        <p className="text-sm text-center text-gray-500">
                            {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
                            <button
                                type="button"
                                className="text-blue-600 hover:underline font-medium"
                                onClick={() => setIsSignUp(!isSignUp)}
                            >
                                {isSignUp ? 'Inicia Sesión' : 'Regístrate'}
                            </button>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}