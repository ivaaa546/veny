'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { reactivateAccount } from '@/actions/stores'
import { supabase } from '@/lib/supabase'
import { Loader2, AlertTriangle, RotateCcw, LogOut } from 'lucide-react'
import { toast } from 'sonner'

interface RecoverAccountCardProps {
    storeId: string
    storeName: string
    daysRemaining: number
}

export default function RecoverAccountCard({ storeId, storeName, daysRemaining }: RecoverAccountCardProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const handleReactivate = async () => {
        setLoading(true)
        try {
            await reactivateAccount(storeId)
            toast.success('¡Cuenta reactivada exitosamente!')
            router.push('/dashboard')
        } catch (error) {
            console.error('Error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al reactivar la cuenta')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = async () => {
        setLoggingOut(true)
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <Card className="max-w-md w-full border-orange-300 shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-2xl text-orange-700">
                    Cuenta Programada para Eliminación
                </CardTitle>
                <CardDescription className="text-base">
                    Tu tienda <strong>{storeName}</strong> será eliminada permanentemente
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Contador de días */}
                <div className="text-center p-6 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-5xl font-bold text-orange-600 mb-2">
                        {daysRemaining}
                    </div>
                    <p className="text-orange-700 font-medium">
                        {daysRemaining === 1 ? 'día restante' : 'días restantes'}
                    </p>
                </div>

                {/* Información */}
                <div className="text-sm text-muted-foreground space-y-2">
                    <p>Después de este período, se eliminarán permanentemente:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Tu tienda y toda su configuración</li>
                        <li>Todos tus productos e imágenes</li>
                        <li>Todas tus categorías</li>
                    </ul>
                </div>

                {/* Botones */}
                <div className="space-y-3">
                    <Button
                        onClick={handleReactivate}
                        disabled={loading || loggingOut}
                        className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Reactivando...
                            </>
                        ) : (
                            <>
                                <RotateCcw className="mr-2 h-5 w-5" />
                                Recuperar mi cuenta
                            </>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        disabled={loading || loggingOut}
                        className="w-full"
                    >
                        {loggingOut ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cerrando sesión...
                            </>
                        ) : (
                            <>
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar sesión
                            </>
                        )}
                    </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                    Si no reactivas tu cuenta, todos los datos serán eliminados de forma permanente.
                </p>
            </CardContent>
        </Card>
    )
}
