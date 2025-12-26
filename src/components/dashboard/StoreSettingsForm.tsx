'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateStoreSettings } from '@/actions/stores'
import { supabase } from '@/lib/supabase'
import { Loader2, Upload, Store, Check, ImageIcon } from 'lucide-react'

interface StoreData {
    id: string
    name: string
    description?: string | null
    phone?: string | null
    logo_url?: string | null
    banner_url?: string | null
    slug: string
}

interface StoreSettingsFormProps {
    store: StoreData
    userId: string
}

export default function StoreSettingsForm({ store, userId }: StoreSettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Estados del formulario
    const [name, setName] = useState(store.name || '')
    const [slug, setSlug] = useState(store.slug || '')
    const [description, setDescription] = useState(store.description || '')
    const [phone, setPhone] = useState(store.phone || '')

    // Estados para el logo
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(store.logo_url || null)

    // Estados para el banner
    const [bannerFile, setBannerFile] = useState<File | null>(null)
    const [bannerPreview, setBannerPreview] = useState<string | null>(store.banner_url || null)

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            setLogoPreview(URL.createObjectURL(file))
        }
    }

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setBannerFile(file)
            setBannerPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setSuccess(false)

        try {
            const formData = new FormData()
            formData.set('store_id', store.id)
            formData.set('name', name)
            formData.set('slug', slug)
            formData.set('description', description)
            formData.set('phone', phone)

            // Subir logo si hay uno nuevo
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop()
                const fileName = `logo-${Date.now()}.${fileExt}`
                const filePath = `${userId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('store-images')
                    .upload(filePath, logoFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from('store-images')
                    .getPublicUrl(filePath)

                formData.set('logo_url', data.publicUrl)
            }

            // Subir banner si hay uno nuevo
            if (bannerFile) {
                const fileExt = bannerFile.name.split('.').pop()
                const fileName = `banner-${Date.now()}.${fileExt}`
                const filePath = `${userId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('store-images')
                    .upload(filePath, bannerFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from('store-images')
                    .getPublicUrl(filePath)

                formData.set('banner_url', data.publicUrl)
            }

            await updateStoreSettings(formData)
            setSuccess(true)

            // Ocultar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(false), 3000)

        } catch (error) {
            console.error('Error:', error)
            alert(error instanceof Error ? error.message : 'Error al guardar')
        } finally {
            setLoading(false)
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Configuración de la Tienda</CardTitle>
                    <CardDescription>
                        Personaliza la información de tu tienda que verán tus clientes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Sección del Banner */}
                    <div className="space-y-2">
                        <Label>Banner de la Tienda</Label>
                        <div className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-muted/30">
                            {bannerPreview ? (
                                <Image
                                    src={bannerPreview}
                                    alt="Banner"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <ImageIcon className="h-10 w-10 mb-2" />
                                    <span className="text-sm">Sin banner</span>
                                </div>
                            )}
                            <label
                                htmlFor="banner-upload"
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <div className="text-white text-center">
                                    <Upload className="h-8 w-8 mx-auto mb-2" />
                                    <span className="text-sm font-medium">Cambiar Banner</span>
                                </div>
                            </label>
                            <input
                                id="banner-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleBannerChange}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Recomendado: 1200x400px para mejor visualización
                        </p>
                    </div>

                    {/* Sección del Logo */}
                    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-muted/30">
                        <Avatar className="h-24 w-24">
                            {logoPreview ? (
                                <AvatarImage src={logoPreview} alt={name} />
                            ) : null}
                            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                {name ? getInitials(name) : <Store className="h-8 w-8" />}
                            </AvatarFallback>
                        </Avatar>

                        <div className="text-center">
                            <label htmlFor="logo-upload">
                                <Button type="button" variant="outline" size="sm" asChild>
                                    <span className="cursor-pointer">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Cambiar Logo
                                    </span>
                                </Button>
                            </label>
                            <input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoChange}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Recomendado: Imagen cuadrada, mínimo 200x200px
                            </p>
                        </div>
                    </div>

                    {/* Nombre de la Tienda */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Tienda</Label>
                        <Input
                            id="name"
                            placeholder="Mi Tienda Increíble"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            placeholder="Cuéntales a tus clientes qué ofreces..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Aparecerá en tu página pública
                        </p>
                    </div>

                    {/* Teléfono / WhatsApp */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">WhatsApp / Teléfono</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+502 1234 5678"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Tus clientes usarán este número para hacer pedidos
                        </p>
                    </div>

                    {/* Link de la tienda (editable) */}
                    <div className="space-y-2">
                        <Label htmlFor="slug">Link de tu Tienda</Label>
                        <div className="flex items-center">
                            <span className="px-3 py-2 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                                veny.app/
                            </span>
                            <Input
                                id="slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className="rounded-l-none"
                                placeholder="mi-tienda"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Solo letras minúsculas, números y guiones
                        </p>
                    </div>

                    {/* Mensaje de éxito */}
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                            <Check className="h-4 w-4" />
                            <span className="text-sm font-medium">Cambios guardados correctamente</span>
                        </div>
                    )}

                    {/* Botón de Guardar */}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </Button>

                </CardContent>
            </Card>
        </form>
    )
}
