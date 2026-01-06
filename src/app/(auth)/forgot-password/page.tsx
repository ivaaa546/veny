'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/auth/update-password`,
            })

            if (error) throw error

            setSubmitted(true)
            toast.success('Correo enviado correctamente')
        } catch (error: any) {
            toast.error(error.message || 'Error al enviar el correo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4 relative">
            {/* Background Decor */}
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            <div className="absolute top-8 left-8">
                <Link href="/login">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Volver al Login
                    </Button>
                </Link>
            </div>

            <Card className="w-full max-w-[400px] border-border shadow-lg">
                <CardHeader>
                    <CardTitle>Recuperar Contraseña</CardTitle>
                    <CardDescription>
                        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {submitted ? (
                        <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
                            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                <Mail className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg">¡Correo Enviado!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Revisa tu bandeja de entrada (y spam) en <strong>{email}</strong>. El enlace expirará pronto.
                                </p>
                            </div>
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link href="/login">Volver a intentar</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="ejemplo@goveny.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-background/50"
                                />
                            </div>
                            <Button className="w-full" disabled={loading} type="submit">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enviar enlace de recuperación
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
