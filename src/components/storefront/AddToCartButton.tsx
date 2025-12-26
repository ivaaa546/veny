'use client'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

export default function AddToCartButton({ product }: { product: any }) {
    const cart = useCart()

    const handleAddToCart = () => {
        cart.addItem(product)
        toast.success('Agregado al carrito', {
            description: product.title,
            duration: 2000,
        })
    }

    return (
        <Button
            className="w-full h-8 text-xs"
            variant="outline"
            onClick={handleAddToCart}
        >
            Agregar +
        </Button>
    )
}