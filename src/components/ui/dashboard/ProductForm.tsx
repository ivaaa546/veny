'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProduct, updateProduct, deleteProductImage } from '@/actions/products'
import { supabase } from '@/lib/supabase'
import { Loader2, UploadCloud, X, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Variant {
    type: string
    value: string
    priceAdjustment: number
}

interface ExistingImage {
    id: string
    url: string
}

interface InitialData {
    id: string
    title: string
    price: number
    description: string
    category_id: string
    variants: Variant[]
    images: ExistingImage[]
}

interface ProductFormProps {
    userId: string
    categories: Array<{ id: string; name: string }>
    initialData?: InitialData
}

export default function ProductForm({ userId, categories, initialData }: ProductFormProps) {
    const isEditMode = !!initialData

    const [loading, setLoading] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category_id || '')

    // Estados para múltiples imágenes (nuevas a subir)
    const [imageFiles, setImageFiles] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])

    // Imágenes existentes (solo en modo edición)
    const [existingImages, setExistingImages] = useState<ExistingImage[]>(initialData?.images || [])

    // Estados para variantes
    const [variants, setVariants] = useState<Variant[]>(initialData?.variants || [])

    // Manejar múltiples imágenes
    const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length > 0) {
            setImageFiles(prev => [...prev, ...files])
            const newPreviews = files.map(file => URL.createObjectURL(file))
            setPreviewUrls(prev => [...prev, ...newPreviews])
        }
    }

    // Eliminar una imagen nueva (no subida aún)
    const removeNewImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index))
        setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    }

    // Eliminar una imagen existente (del servidor)
    const removeExistingImage = async (imageId: string) => {
        if (!initialData) return
        try {
            await deleteProductImage(imageId, initialData.id)
            setExistingImages(prev => prev.filter(img => img.id !== imageId))
        } catch (error) {
            console.error('Error eliminando imagen:', error)
            alert('No se pudo eliminar la imagen')
        }
    }

    // Agregar nueva variante
    const addVariant = () => {
        setVariants(prev => [...prev, { type: '', value: '', priceAdjustment: 0 }])
    }

    // Eliminar variante
    const removeVariant = (index: number) => {
        setVariants(prev => prev.filter((_, i) => i !== index))
    }

    // Actualizar campo de variante
    const updateVariant = (index: number, field: keyof Variant, value: string | number) => {
        setVariants(prev => prev.map((variant, i) =>
            i === index ? { ...variant, [field]: value } : variant
        ))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(e.currentTarget)

            // 1. Subir TODAS las imágenes NUEVAS a Supabase Storage
            const imageUrls: string[] = []

            for (const file of imageFiles) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
                const filePath = `${userId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('store-images')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from('store-images')
                    .getPublicUrl(filePath)

                imageUrls.push(data.publicUrl)
            }

            // 2. Serializar datos como JSON strings
            formData.set('images', JSON.stringify(imageUrls))
            formData.set('variants', JSON.stringify(variants))
            formData.set('user_id', userId)

            // 3. Llamar al Server Action correspondiente
            if (isEditMode && initialData) {
                formData.set('product_id', initialData.id)
                await updateProduct(formData)
            } else {
                await createProduct(formData)
            }

        } catch (error: any) {
            // Ignorar el error de redirección de Next.js (es el comportamiento esperado de éxito)
            if (error.message === 'NEXT_REDIRECT' || error.digest === 'NEXT_REDIRECT') {
                return
            }

            console.error(error)
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar el producto'
            // Usar un toast en lugar de alert si es posible, o simplemente filtrar este error
            if (!errorMessage.includes('NEXT_REDIRECT')) {
                 alert(errorMessage)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto py-10">

            {/* Nombre del Producto */}
            <div className="space-y-2">
                <Label htmlFor="title">Nombre del Producto</Label>
                <Input
                    id="title"
                    name="title"
                    placeholder="Ej: Playera Oversize Cotton"
                    defaultValue={initialData?.title || ''}
                    required
                />
            </div>

            {/* Precio Base */}
            <div className="space-y-2">
                <Label htmlFor="price">Precio Base (Q)</Label>
                <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="149.00"
                    defaultValue={initialData?.price || ''}
                    required
                />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
                <Label htmlFor="description">Descripción del Producto</Label>
                <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe tu producto, materiales, guía de tallas, etc."
                    rows={4}
                    className="resize-none"
                    defaultValue={initialData?.description || ''}
                />
                <p className="text-xs text-muted-foreground">Opcional - Ayuda a tus clientes a conocer mejor el producto</p>
            </div>

            {/* SECCIÓN: MÚLTIPLES IMÁGENES */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Fotografías del Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Grilla de Imágenes Existentes (solo en modo edición) */}
                    {existingImages.length > 0 && (
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">Imágenes actuales:</p>
                            <div className="grid grid-cols-3 gap-4">
                                {existingImages.map((img, index) => (
                                    <div key={img.id} className="relative group">
                                        <Image
                                            src={img.url}
                                            alt={`Imagen ${index + 1}`}
                                            width={200}
                                            height={128}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeExistingImage(img.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                            #{index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Grilla de Previsualizaciones de nuevas imágenes */}
                    {previewUrls.length > 0 && (
                        <div>
                            <p className="text-sm text-muted-foreground mb-2">Nuevas imágenes a subir:</p>
                            <div className="grid grid-cols-3 gap-4">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeNewImage(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <div className="absolute bottom-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                                            Nueva
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Botón para Agregar Más Imágenes */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                        <label htmlFor="images-upload" className="cursor-pointer flex flex-col items-center justify-center">
                            <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600">Clic para agregar imágenes</p>
                            <p className="text-xs text-gray-400 mt-1">Puedes subir múltiples archivos</p>
                        </label>
                        <input
                            id="images-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImagesChange}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SECCIÓN: VARIANTES DINÁMICAS */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Variantes del Producto (Opcional)</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar Variante
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {variants.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No hay variantes. Agrega una si tu producto tiene tallas, colores, etc.
                        </p>
                    ) : (
                        variants.map((variant, index) => (
                            <div key={index} className="flex gap-2 items-end p-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <Label className="text-xs">Tipo</Label>
                                    <Input
                                        placeholder="Ej: Talla, Color"
                                        value={variant.type}
                                        onChange={(e) => updateVariant(index, 'type', e.target.value)}
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label className="text-xs">Valor</Label>
                                    <Input
                                        placeholder="Ej: M, Rojo"
                                        value={variant.value}
                                        onChange={(e) => updateVariant(index, 'value', e.target.value)}
                                    />
                                </div>
                                <div className="w-32">
                                    <Label className="text-xs">Ajuste Precio</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={variant.priceAdjustment}
                                        onChange={(e) => updateVariant(index, 'priceAdjustment', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeVariant(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Categoría */}
            <div className="space-y-2">
                <Label htmlFor="category_id">Categoría</Label>
                {categories.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-md border">
                        No tienes categorías. <a href="/dashboard/categories" className="text-blue-600 hover:underline">Crea una aquí</a>.
                    </div>
                ) : (
                    <>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una categoría (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input type="hidden" name="category_id" value={selectedCategory} />
                    </>
                )}
            </div>

            {/* Botón de Envío */}
            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                    </>
                ) : (
                    isEditMode ? 'Guardar Cambios' : 'Crear Producto'
                )}
            </Button>
        </form>
    )
}