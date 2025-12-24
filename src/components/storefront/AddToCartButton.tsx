'use client'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/use-cart'

export default function AddToCartButton({ product }: { product: any }) {
    const cart = useCart()
    return (
        <Button
            className="w-full h-8 text-xs"
            variant="outline"
            onClick={() => cart.addItem(product)}
        >
            Agregar +
        </Button>
    )
}