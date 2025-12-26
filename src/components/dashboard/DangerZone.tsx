'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toggleStoreActive, deleteAccount, reactivateAccount } from '@/actions/stores'
import { Loader2, AlertTriangle, Power, Trash2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

interface DangerZoneProps {
    storeId: string
    isActive: boolean
    deletedAt?: string | null
}

// Calcular días restantes
function getDaysRemaining(deletedAt: string | null): number {
    if (!deletedAt) return 30
    const deletedDate = new Date(deletedAt)
    const now = new Date()
    const daysSinceDelete = Math.floor((now.getTime() - deletedDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(0, 30 - daysSinceDelete)
}

export default function DangerZone({ storeId, isActive, deletedAt }: DangerZoneProps) {
    const router = useRouter()
    const [active, setActive] = useState(isActive)
    const [loadingToggle, setLoadingToggle] = useState(false)
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [loadingReactivate, setLoadingReactivate] = useState(false)
    const [isDeleted, setIsDeleted] = useState(!!deletedAt)

    const daysRemaining = getDaysRemaining(deletedAt ?? null)

    const handleToggleActive = async () => {
        setLoadingToggle(true)
        try {
            await toggleStoreActive(storeId, !active)
            setActive(!active)
            toast.success(active ? 'Tienda desactivada' : 'Tienda activada')
        } catch (error) {
            console.error('Error:', error)
            toast.error('Error al cambiar el estado')
        } finally {
            setLoadingToggle(false)
        }
    }

    const handleDeleteAccount = async () => {
        setLoadingDelete(true)
        try {
            await deleteAccount(storeId)
            // Cerrar sesión y redirigir a login
            const { supabase } = await import('@/lib/supabase')
            await supabase.auth.signOut()
            toast.success('Cuenta desactivada. Tienes 30 días para reactivarla.')
            router.push('/login')
        } catch (error) {
            console.error('Error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al desactivar la cuenta')
            setLoadingDelete(false)
        }
    }

    const handleReactivateAccount = async () => {
        setLoadingReactivate(true)
        try {
            await reactivateAccount(storeId)
            setIsDeleted(false)
            setActive(true)
            toast.success('¡Cuenta reactivada exitosamente!')
            router.refresh()
        } catch (error) {
            console.error('Error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al reactivar la cuenta')
        } finally {
            setLoadingReactivate(false)
        }
    }

    // Si la cuenta está marcada para eliminación
    if (isDeleted) {
        return (
            <Card className="border-orange-300 bg-orange-50">
                <CardHeader>
                    <CardTitle className="text-orange-700 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Cuenta Programada para Eliminación
                    </CardTitle>
                    <CardDescription>
                        Tu cuenta se eliminará permanentemente en <strong className="text-orange-700">{daysRemaining} días</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 border border-orange-300 rounded-lg bg-white">
                        <p className="text-sm text-muted-foreground mb-4">
                            Después de los 30 días, se eliminarán permanentemente:
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                            <li>Tu tienda y toda su configuración</li>
                            <li>Todos tus productos e imágenes</li>
                            <li>Todas tus categorías</li>
                        </ul>
                        <Button
                            onClick={handleReactivateAccount}
                            disabled={loadingReactivate}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {loadingReactivate ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Reactivando...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Reactivar mi cuenta
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Zona de Peligro
                </CardTitle>
                <CardDescription>
                    Estas acciones pueden afectar tu tienda y cuenta
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Estado de la tienda */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
                    <div className="flex items-center gap-3">
                        <Power className={`h-5 w-5 ${active ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                            <Label className="text-base font-medium">Estado de la Tienda</Label>
                            <p className="text-sm text-muted-foreground">
                                {active ? 'Tu tienda está visible para clientes' : 'Tu tienda está oculta para clientes'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {loadingToggle && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Switch
                            checked={active}
                            onCheckedChange={handleToggleActive}
                            disabled={loadingToggle}
                        />
                    </div>
                </div>

                {/* Eliminar cuenta */}
                <div className="p-4 border border-red-300 rounded-lg bg-white">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                                <Label className="text-base font-medium text-red-700">Eliminar Cuenta</Label>
                                <p className="text-sm text-muted-foreground">
                                    Tu cuenta se desactivará y tendrás <strong>30 días</strong> para reactivarla.
                                    Después de ese período, todos los datos se eliminarán permanentemente.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={loadingDelete}>
                                    {loadingDelete ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Eliminar mi cuenta
                                        </>
                                    )}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Deseas eliminar tu cuenta?</AlertDialogTitle>
                                    <AlertDialogDescription asChild>
                                        <div className="text-sm text-muted-foreground">
                                            <p className="mb-2">
                                                Tu cuenta se desactivará inmediatamente. Tendrás <strong>30 días</strong> para cambiar de opinión y reactivarla.
                                            </p>
                                            <p>
                                                Después de 30 días, se eliminarán permanentemente:
                                            </p>
                                            <ul className="list-disc list-inside mt-2 space-y-1">
                                                <li>Tu tienda y toda su configuración</li>
                                                <li>Todos tus productos e imágenes</li>
                                                <li>Todas tus categorías</li>
                                            </ul>
                                        </div>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Sí, eliminar cuenta
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
