'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProduct } from '@/actions/products' // Tu Server Action
import { supabase } from '@/lib/supabase' // Tu cliente Supabase
import { Loader2, UploadCloud, X } from 'lucide-react' // Iconos

interface ProductFormProps {
    userId: string
    categories: Array<{ id: string; name: string }>
}

export default function ProductForm({ userId, categories }: ProductFormProps) {
    const [loading, setLoading] = useState(false)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [selectedCategory, setSelectedCategory] = useState<string>('')

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            setPreviewUrl(URL.createObjectURL(file)) // Previsualización instantánea
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData(e.currentTarget)

            // 1. Subir Imagen (si existe)
            let finalImageUrl = ''

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
                const filePath = `${userId}/${fileName}` // Carpeta por usuario

                const { error: uploadError } = await supabase.storage
                    .from('store-images') // Asegúrate que este bucket exista en Supabase
                    .upload(filePath, imageFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage
                    .from('store-images')
                    .getPublicUrl(filePath)

                finalImageUrl = data.publicUrl
            }

            // 2. Preparar datos para el Server Action
            // Agregamos la URL y el UserID al FormData manualmente
            formData.set('image_url', finalImageUrl)
            formData.set('user_id', userId)

            // 3. Guardar en Base de Datos (Llamada al Server Action)
            await createProduct(formData)

            // El redirect ocurre en el server action, así que no necesitamos hacer nada más aquí

        } catch (error) {
            console.error(error)
            const errorMessage = error instanceof Error ? error.message : 'Error al crear el producto'
            alert(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto py-10">

            <div className="space-y-2">
                <Label htmlFor="title">Nombre del Producto</Label>
                <Input id="title" name="title" placeholder="Ej: Hamburguesa Doble" required />
            </div>

            <div className="space-y-2">
                <Label htmlFor="price">Precio (Q)</Label>
                <Input id="price" name="price" type="number" step="0.01" placeholder="50.00" required />
            </div>

            {/* Input de Archivo Personalizado */}
            <div className="space-y-2">
                <Label>Fotografía</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 relative">
                    {previewUrl ? (
                        <div className="relative">
                            <img src={previewUrl} alt="Vista previa" className="h-40 object-cover rounded-md" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => {
                                    setImageFile(null)
                                    setPreviewUrl(null)
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <label htmlFor="image-upload" className="cursor-pointer text-center w-full">
                            <div className="text-gray-500">
                                <UploadCloud className="h-10 w-10 mx-auto mb-2" />
                                <p className="text-sm">Clic para subir imagen</p>
                            </div>
                        </label>
                    )}
                    <input
                        id="image-upload"
                        type="file"
                        name="image"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                </div>
                {previewUrl && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => document.getElementById('image-upload')?.click()}
                    >
                        Cambiar Imagen
                    </Button>
                )}
            </div>

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
                        {/* Campo oculto para enviar al server */}
                        <input type="hidden" name="category_id" value={selectedCategory} />
                    </>
                )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                    </>
                ) : (
                    'Crear Producto'
                )}
            </Button>
        </form>
    )
}