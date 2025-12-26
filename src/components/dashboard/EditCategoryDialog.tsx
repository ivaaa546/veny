'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { updateCategory } from '@/actions/categories'
import { Edit, Loader2 } from 'lucide-react'

interface EditCategoryDialogProps {
    category: {
        id: string
        name: string
    }
}

export default function EditCategoryDialog({ category }: EditCategoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(category.name)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            const formData = new FormData()
            formData.set('category_id', category.id)
            formData.set('name', name.trim())

            await updateCategory(formData)

            setOpen(false)
        } catch (error) {
            console.error('Error:', error)
            alert('Error al actualizar la categoría')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Editar categoría"
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Categoría</DialogTitle>
                    <DialogDescription>
                        Modifica el nombre de la categoría.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-category-name">Nombre</Label>
                            <Input
                                id="edit-category-name"
                                placeholder="Nombre de la categoría"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || !name.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
