// src/types/index.ts

// 1. Roles de Usuario (Coincide con tu ENUM en SQL)
export type UserRole = 'seller' | 'admin' | 'moderator';

// 2. Perfil de Usuario (Tabla: public.profiles)
export interface Profile {
    id: string; // UUID
    email: string;
    role: UserRole;
    created_at: string; // ISO String fecha
}

// 3. Tienda (Tabla: public.stores)
export interface Store {
    id: string;
    user_id: string;
    slug: string; // El identificador único para la URL (ej: "pizzas-juan")
    name: string;
    phone: string; // Importante para WhatsApp
    description: string | null;
    primary_color: string; // Ej: "#FF0000"
    logo_url: string | null; // Puede ser null si no ha subido nada
    banner_url: string | null;
    is_active: boolean;
    deleted_at: string | null;
    instagram_url: string | null;
    facebook_url: string | null;
    tiktok_url: string | null;
    facebook_pixel_id: string | null; // ID del Pixel de Facebook para tracking
    created_at: string;
    updated_at: string;
}

// 4. Categoría (Tabla: public.categories)
export interface Category {
    id: string;
    store_id: string;
    name: string;
    sort_order: number;
    // Opcional: Para cuando traigas categorías CON sus productos anidados
    products?: Product[];
}

// 5. Producto (Tabla: public.products)
export interface Product {
    id: string;
    store_id: string;
    category_id: string | null; // Puede ser null si se borró la categoría
    title: string;
    description: string | null;
    price: number; // En SQL es numeric, en JS es number
    image_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// 6. Variante de Producto (Tabla: public.product_variants)
export interface ProductVariant {
    id: string;
    product_id: string;
    variant_type: string; // Ej: "Talla", "Color", "Sabor"
    variant_value: string; // Ej: "M", "Rojo", "Chocolate"
    price_adjustment: number; // Puede ser negativo
    stock: number;
    created_at: string;
    updated_at: string;
}

// 7. Imagen de Producto (Tabla: public.product_images)
export interface ProductImage {
    id: string;
    product_id: string;
    image_url: string;
    display_order: number;
    created_at: string;
    updated_at: string;
}

// --- TIPOS EXTRAS PARA EL FRONTEND (No están en BD) ---

// Para el Carrito de Compras (Frontend)
export interface CartItem extends Product {
    quantity: number; // El producto + cuántos lleva
}

// Para la respuesta de Supabase cuando pedimos la tienda completa
export interface StoreData extends Store {
    categories: Category[]; // Una tienda tiene un array de categorías...
    // ... y cada categoría tiene un array de productos (ver interfaz Category arriba)
}

// ====================================================================
// SISTEMA DE ÓRDENES
// ====================================================================

// Estados de pedido
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// Lugar de entrega
export type DeliveryPlace = 'casa' | 'trabajo' | 'otro';

// Método de pedido
export type OrderMethod = 'whatsapp' | 'email' | 'web';

// 8. Orden/Pedido (Tabla: public.orders)
export interface Order {
    id: string;
    store_id: string;
    status: OrderStatus;
    total: number;
    customer_name: string;
    customer_phone: string | null;
    customer_address: string | null;
    customer_last_name: string | null;
    customer_department: string | null;
    customer_municipality: string | null;
    customer_zone: string | null;
    customer_reference: string | null;
    delivery_place: DeliveryPlace | null;
    order_method: OrderMethod;
    created_at: string;
    updated_at: string;
    // Relación con items (cuando se hace join)
    order_items?: OrderItem[];
}

// 9. Item de Orden (Tabla: public.order_items)
export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string | null; // Puede ser null si el producto fue eliminado
    product_title: string;
    variant_info: string | null;
    quantity: number;
    price: number;
    created_at: string;
}

// Producto extendido con variantes e imágenes (para storefront)
export interface ProductWithDetails extends Product {
    images?: ProductImage[];
    variants?: ProductVariant[];
}