# Plan de Mejoras para VENY - COMPLETADO

## Estado: IMPLEMENTADO

Todas las mejoras han sido aplicadas exitosamente el 24 de Enero de 2026.

---

## FASE 1: Corregir Bugs Críticos (~1-2 horas)

### 1.1 Bug de variantes en carrito
**Archivo:** `src/hooks/use-cart.ts`

**Problema:** Al agregar el mismo producto con diferentes variantes, se incrementa la cantidad en lugar de crear items separados.

**Solución:** Usar un ID compuesto que incluya la variante.

```typescript
// ANTES (línea 4-11):
export interface CartItem {
    id: string
    title: string
    price: number
    image_url: string | null
    quantity: number
    selectedVariant?: string
}

// DESPUÉS:
export interface CartItem {
    id: string              // ID del producto original
    cartItemId: string      // ID único: productId-variantHash
    title: string
    price: number
    image_url: string | null
    quantity: number
    selectedVariant?: string
}
```

```typescript
// ANTES (línea 30-58):
addItem: (data: CartItemInput) => {
    const currentItems = get().items
    const cleanData: CartItemInput = {
        id: data.id,
        title: data.title,
        price: Number(data.price),
        image_url: data.image_url,
        selectedVariant: typeof data.selectedVariant === 'string'
            ? data.selectedVariant
            : undefined
    }
    const existingItem = currentItems.find((item) => item.id === cleanData.id)
    // ...
}

// DESPUÉS:
addItem: (data: CartItemInput) => {
    const currentItems = get().items
    
    const cleanData: CartItemInput = {
        id: data.id,
        title: data.title,
        price: Number(data.price),
        image_url: data.image_url,
        selectedVariant: typeof data.selectedVariant === 'string'
            ? data.selectedVariant
            : undefined
    }
    
    // Crear ID único que incluye la variante
    const cartItemId = cleanData.selectedVariant 
        ? `${cleanData.id}-${cleanData.selectedVariant.replace(/\s/g, '_')}`
        : cleanData.id
    
    const existingItem = currentItems.find((item) => item.cartItemId === cartItemId)

    if (existingItem) {
        set({
            items: currentItems.map((item) =>
                item.cartItemId === cartItemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ),
        })
    } else {
        set({ items: [...currentItems, { ...cleanData, cartItemId, quantity: 1 }] })
    }
}
```

```typescript
// ANTES (línea 61-62):
removeItem: (id: string) => {
    set({ items: [...get().items.filter((item) => item.id !== id)] })
}

// DESPUÉS:
removeItem: (cartItemId: string) => {
    set({ items: [...get().items.filter((item) => item.cartItemId !== cartItemId)] })
}
```

**También actualizar CartSidebar.tsx línea 44 y 66:**
```typescript
// Cambiar item.id por item.cartItemId en el key y en removeItem
<div key={item.cartItemId} className="flex gap-4 items-start">
// ...
onClick={() => cart.removeItem(item.cartItemId)}
```

---

### 1.2 Indicador de carrito vacío
**Archivo:** `src/components/storefront/StoreNavbar.tsx`

**Problema:** El punto rojo del carrito siempre se muestra, incluso vacío.

**Solución:** Mostrar solo si hay items y agregar contador.

```typescript
// ANTES (línea 90-100):
<CartSidebar storeId={storeId} storePhone={storePhone}>
    <Button 
        size="icon" 
        className="rounded-full relative shadow-lg shadow-black/10 bg-black text-white hover:bg-gray-800 h-10 w-10 transition-all border-2 border-white"
    >
        <ShoppingCart className="h-5 w-5" />
        {/* Dot indicador rojo */}
        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 border-2 border-white rounded-full" />
    </Button>
</CartSidebar>

// DESPUÉS:
// Agregar import al inicio del archivo:
import { useCart } from '@/hooks/use-cart'

// Agregar dentro del componente (después de useState):
const cart = useCart()
const itemCount = cart.items.reduce((acc, item) => acc + item.quantity, 0)

// Cambiar el JSX:
<CartSidebar storeId={storeId} storePhone={storePhone}>
    <Button 
        size="icon" 
        className="rounded-full relative shadow-lg shadow-black/10 bg-black text-white hover:bg-gray-800 h-10 w-10 transition-all border-2 border-white"
    >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-bold">
                {itemCount > 99 ? '99+' : itemCount}
            </span>
        )}
    </Button>
</CartSidebar>
```

---

### 1.3 Imagen null en carrito
**Archivo:** `src/components/storefront/ProductDetailsModal.tsx`

**Problema:** Si no hay imágenes, `productImages[0]` puede ser undefined.

**Solución:** Agregar fallback seguro.

```typescript
// ANTES (línea 155-167):
<AddToCartButton
    product={{
        id: product.id,
        title: product.title,
        price: finalPrice,
        image_url: productImages[0] || product.image_url,
        selectedVariant: selectedVariantData
            ? `${selectedVariantData.variant_type}: ${selectedVariantData.variant_value}`
            : undefined
    }}
/>

// DESPUÉS:
<AddToCartButton
    product={{
        id: product.id,
        title: product.title,
        price: finalPrice,
        image_url: productImages[0] ?? product.image_url ?? null,
        selectedVariant: selectedVariantData
            ? `${selectedVariantData.variant_type}: ${selectedVariantData.variant_value}`
            : undefined
    }}
/>
```

---

## FASE 2: Control de Cantidad en Carrito (~2-3 horas)

### 2.1 Agregar métodos al store
**Archivo:** `src/hooks/use-cart.ts`

Agregar estos métodos a la interfaz `CartStore` y su implementación:

```typescript
interface CartStore {
    items: CartItem[]
    addItem: (data: CartItemInput) => void
    removeItem: (cartItemId: string) => void
    updateQuantity: (cartItemId: string, quantity: number) => void
    increaseQuantity: (cartItemId: string) => void
    decreaseQuantity: (cartItemId: string) => void
    clearCart: () => void
    total: number
}

// Implementación (agregar después de removeItem):
updateQuantity: (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
        get().removeItem(cartItemId)
        return
    }
    set({
        items: get().items.map((item) =>
            item.cartItemId === cartItemId
                ? { ...item, quantity }
                : item
        ),
    })
},

increaseQuantity: (cartItemId: string) => {
    set({
        items: get().items.map((item) =>
            item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity + 1 }
                : item
        ),
    })
},

decreaseQuantity: (cartItemId: string) => {
    const item = get().items.find((i) => i.cartItemId === cartItemId)
    if (item && item.quantity <= 1) {
        get().removeItem(cartItemId)
    } else {
        set({
            items: get().items.map((i) =>
                i.cartItemId === cartItemId
                    ? { ...i, quantity: i.quantity - 1 }
                    : i
            ),
        })
    }
},
```

---

### 2.2 Actualizar CartSidebar con botones +/-
**Archivo:** `src/components/storefront/CartSidebar.tsx`

```typescript
// Agregar import:
import { Minus, Plus } from 'lucide-react'

// Reemplazar la sección de info del item (línea 51-60) por:
{cart.items.map((item) => (
    <div key={item.cartItemId} className="flex gap-3 items-start">
        {/* Imagen Miniatura */}
        <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
            {item.image_url && (
                <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
            )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
            {item.selectedVariant && (
                <p className="text-xs text-muted-foreground">{item.selectedVariant}</p>
            )}
            <p className="text-sm font-semibold text-green-700 mt-1">
                Q{(item.price * item.quantity).toFixed(2)}
            </p>
            
            {/* Controles de cantidad */}
            <div className="flex items-center gap-2 mt-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => cart.decreaseQuantity(item.cartItemId)}
                >
                    <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => cart.increaseQuantity(item.cartItemId)}
                >
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        </div>
        
        {/* Borrar */}
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 flex-shrink-0"
            onClick={() => cart.removeItem(item.cartItemId)}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    </div>
))}
```

---

## FASE 3: Sistema de Stock (~3-4 horas)

### 3.1 Agregar input de stock en ProductForm
**Archivo:** `src/components/ui/dashboard/ProductForm.tsx`

Buscar la sección de variantes y agregar un input de stock por cada variante:

```typescript
// En la sección donde se renderizan las variantes, agregar un campo más:
<Input
    type="number"
    min="0"
    placeholder="Stock"
    value={variant.stock || 0}
    onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
    className="w-24"
/>
```

También actualizar la interfaz de variante en el formulario:
```typescript
interface VariantInput {
    variant_type: string
    variant_value: string
    price_adjustment: number
    stock: number  // Agregar este campo
}
```

---

### 3.2 Pasar stock al storefront
**Archivo:** `src/app/[slug]/page.tsx`

El query ya debería traer el stock, verificar que se pase al componente:
```typescript
// En el fetch de productos, asegurar que se incluya stock:
.select('*, product_variants(id, variant_type, variant_value, price_adjustment, stock)')
```

---

### 3.3 Indicador "Agotado" en ProductDetailsModal
**Archivo:** `src/components/storefront/ProductDetailsModal.tsx`

```typescript
// Agregar prop de variants con stock:
interface ProductDetailsModalProps {
    // ... existing props
    variants?: Array<{ 
        id: string
        variant_type: string
        variant_value: string
        price_adjustment: number
        stock: number  // Agregar
    }>
}

// Calcular si el producto/variante está agotado:
const isOutOfStock = selectedVariantData 
    ? selectedVariantData.stock <= 0
    : variants.length > 0 
        ? variants.every(v => v.stock <= 0)  // Todas las variantes agotadas
        : false  // Si no tiene variantes, asumir disponible

// En los botones de variantes, mostrar agotado:
<button
    key={variant.id}
    disabled={variant.stock <= 0}
    onClick={() => setSelectedVariant(prev => prev === variant.id ? null : variant.id)}
    className={`px-3 py-1.5 text-sm rounded-md border transition-all 
        ${variant.stock <= 0 ? 'opacity-50 cursor-not-allowed line-through' : ''}
        ${selectedVariant === variant.id
            ? 'border-black bg-black text-white shadow-sm'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
>
    {variant.variant_value}
    {variant.stock <= 0 && <span className="ml-1 text-[10px]">(Agotado)</span>}
</button>

// Deshabilitar botón de agregar si agotado:
<AddToCartButton
    disabled={isOutOfStock}
    // ... rest of props
/>

// En AddToCartButton, agregar prop disabled y manejarlo:
// Archivo: src/components/storefront/AddToCartButton.tsx
interface AddToCartButtonProps {
    product: CartItemInput
    disabled?: boolean
}

// En el botón:
<Button 
    disabled={disabled}
    className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
>
    {disabled ? 'Agotado' : 'Agregar al carrito'}
</Button>
```

---

### 3.4 Decrementar stock al completar pedido
**Archivo:** `src/actions/orders.ts`

```typescript
// En la función que crea la orden, después de insertar order_items:

// Decrementar stock de cada variante
for (const item of cartItems) {
    if (item.variantId) {
        const { error: stockError } = await supabase
            .from('product_variants')
            .update({ 
                stock: supabase.raw('stock - ?', [item.quantity])
            })
            .eq('id', item.variantId)
            .gte('stock', item.quantity)  // Solo si hay suficiente stock
        
        if (stockError) {
            // Hacer rollback de la orden si falla
            await supabase.from('orders').delete().eq('id', newOrderId)
            return { error: 'Stock insuficiente para uno o más productos' }
        }
    }
}
```

**Alternativa SQL más segura (recomendada):**

Crear una función RPC en Supabase:
```sql
CREATE OR REPLACE FUNCTION decrement_stock(variant_id UUID, qty INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    SELECT stock INTO current_stock 
    FROM product_variants 
    WHERE id = variant_id 
    FOR UPDATE;
    
    IF current_stock >= qty THEN
        UPDATE product_variants 
        SET stock = stock - qty 
        WHERE id = variant_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;
```

Y llamarla desde el Server Action:
```typescript
const { data: success } = await supabase.rpc('decrement_stock', {
    variant_id: item.variantId,
    qty: item.quantity
})

if (!success) {
    return { error: `Stock insuficiente para ${item.title}` }
}
```

---

## Archivos a Modificar (Resumen)

| Fase | Archivo | Cambios |
|------|---------|---------|
| 1 | `src/hooks/use-cart.ts` | Agregar cartItemId, cambiar lógica de búsqueda |
| 1 | `src/components/storefront/StoreNavbar.tsx` | Agregar contador condicional |
| 1 | `src/components/storefront/ProductDetailsModal.tsx` | Fallback de imagen |
| 1 | `src/components/storefront/CartSidebar.tsx` | Usar cartItemId |
| 2 | `src/hooks/use-cart.ts` | Agregar métodos de cantidad |
| 2 | `src/components/storefront/CartSidebar.tsx` | Agregar botones +/- |
| 3 | `src/components/ui/dashboard/ProductForm.tsx` | Input de stock |
| 3 | `src/components/storefront/ProductDetailsModal.tsx` | Badge agotado |
| 3 | `src/components/storefront/AddToCartButton.tsx` | Prop disabled |
| 3 | `src/actions/orders.ts` | Decrementar stock |
| 3 | `bd.sql` (opcional) | Función RPC decrement_stock |

---

## Orden de Implementación

1. **use-cart.ts** - Cambios de cartItemId + métodos de cantidad (Fase 1 + 2 juntos)
2. **CartSidebar.tsx** - Usar cartItemId + botones +/-
3. **StoreNavbar.tsx** - Contador condicional
4. **ProductDetailsModal.tsx** - Fallback imagen + badge agotado
5. **AddToCartButton.tsx** - Prop disabled
6. **ProductForm.tsx** - Input de stock
7. **orders.ts** - Decrementar stock

---

## Testing Manual

### Fase 1
- [ ] Agregar mismo producto con variante "Talla M" → debe crear item
- [ ] Agregar mismo producto con variante "Talla L" → debe crear item separado
- [ ] Carrito vacío → no muestra punto rojo
- [ ] Carrito con 3 items → muestra "3" en el contador

### Fase 2
- [ ] Click en "+" aumenta cantidad
- [ ] Click en "-" reduce cantidad
- [ ] "-" cuando quantity=1 → elimina el item
- [ ] Total se actualiza correctamente

### Fase 3
- [ ] Producto con stock=0 → muestra "Agotado"
- [ ] Variante con stock=0 → deshabilitada con tachado
- [ ] No se puede agregar producto agotado
- [ ] Al completar pedido, stock se reduce en BD
