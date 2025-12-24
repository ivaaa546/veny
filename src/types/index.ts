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
    primary_color: string; // Ej: "#FF0000"
    logo_url: string | null; // Puede ser null si no ha subido nada
    created_at: string;
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