'use client'

import { useState } from 'react'
import { updateStore } from '@/actions/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Store as StoreIcon } from 'lucide-react'

// Recibimos los datos actuales (si existen) para rellenar el formulario
export default function StoreForm({ userId, store }: { userId: string, store?: any }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            formData.set('user_id', userId) // Aseguramos que viaja el ID

            await updateStore(formData)
            alert('¡Tienda guardada correctamente!')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <StoreIcon className="h-6 w-6" />
                    {store ? 'Configuración de Tienda' : 'Crea tu Tienda'}
                </CardTitle>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">

                    <div className="space-y-2">
                        <Label>Nombre del Negocio</Label>
                        <Input name="name" defaultValue={store?.name} placeholder="Ej: Hamburguesas Don Pepe" required />
                    </div>

                    <div className="space-y-2">
                        <Label>Tu Link Personalizado (Slug)</Label>
                        <div className="flex items-center">
                            <span className="bg-gray-100 border border-r-0 rounded-l-md px-3 py-2 text-sm text-gray-500">
                                linkstore.app/
                            </span>
                            <Input
                                name="slug"
                                defaultValue={store?.slug}
                                placeholder="hamburguesas-pepe"
                                className="rounded-l-none"
                                required
                                pattern="[a-z0-9-]+"
                                title="Solo letras minúsculas, números y guiones"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Este será el enlace que compartirás.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>WhatsApp de Pedidos</Label>
                        <Input name="phone" defaultValue={store?.phone} placeholder="Ej: 50212345678" required type="tel" />
                    </div>

                </CardContent>

                <CardFooter>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {store ? 'Guardar Cambios' : 'Crear Tienda y Comenzar'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}