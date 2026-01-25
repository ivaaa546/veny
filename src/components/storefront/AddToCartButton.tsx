'use client'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

interface AddToCartButtonProps {
    product: any
    disabled?: boolean
}

export default function AddToCartButton({ product, disabled = false }: AddToCartButtonProps) {
    const cart = useCart()

    const handleAddToCart = () => {
        if (disabled) return
        
        // Limpiar el objeto del producto para solo incluir los campos necesarios
        const cleanProduct = {
            id: product.id,
            title: product.title,
            price: Number(product.price),
            image_url: product.image_url || null,
            selectedVariant: product.selectedVariant || undefined
        }

        cart.addItem(cleanProduct)
        toast.success('Agregado al carrito', {
            description: product.title,
            duration: 2000,
        })
    }

    return (
        <Button
            className={`w-full h-8 text-xs ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            variant="outline"
            onClick={handleAddToCart}
            disabled={disabled}
        >
            {disabled ? 'Agotado' : 'Agregar +'}
        </Button>
    )
}