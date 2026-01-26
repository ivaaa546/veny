# AGENT.md - Proyecto VENY

## 📘 Descripción del Proyecto

**VENY** es un SaaS multi-tenant de tiendas online que permite a vendedores crear y gestionar sus propias tiendas virtuales con URLs personalizadas. El sistema soporta productos complejos con variantes (tallas, colores, sabores) y galerías de imágenes múltiples.

### Diseño Visual
- **Paleta de Colores:** Estilo "SaaS Pro". Primario Indigo-600 para transmitir confianza tecnológica, con neutros Slate (grises azulados) para un acabado premium y limpio.

### Características Principales
- 🏪 Multi-tenant: Cada vendedor tiene su propia tienda con slug único
- 🛍️ Productos con variantes y múltiples imágenes
- 🛒 Carrito de compras persistente
- 📱 Checkout vía WhatsApp
- 🎨 Personalización por tienda (logo, banner, colores)
- 🔐 Autenticación y seguridad con RLS
- 📊 Dashboard completo para vendedores
- 🌐 Storefront público responsive

---

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 16** (App Router con Server Components)
- **React 19** (Server & Client Components)
- **TypeScript** (Type-safe en todo el proyecto)
- **Tailwind CSS** (Estilos utility-first)
- **Shadcn UI** (Componentes reutilizables)

### Backend & Database
- **Supabase** (Backend-as-a-Service)
  - PostgreSQL con Row Level Security (RLS)
  - Authentication (email/password)
- **Cloudinary** (Gestión de Imágenes)
  - Upload y optimización automática de imágenes
  - CDN global para mejor rendimiento
  - Transformaciones automáticas (f_auto, q_auto)

### Estado & Lógica
- **Server Actions** (Backend en frontend, sin API Routes)
- **Zustand** (Estado global del carrito)
- **localStorage** (Persistencia del carrito)

---

## ✅ Funcionalidades Implementadas

### 1. Sistema de Autenticación
- Login/Register con Supabase Auth
- Perfiles de usuario con roles (`seller`, `admin`, `moderator`)
- Protección de rutas con middleware
- Callback handler para OAuth

**Archivos:**
- `src/app/(auth)/login/page.tsx`
- `src/app/auth/callback/route.ts`

---

### 2. Gestión de Tiendas (Multi-Tenant)

#### Características
- Slug único por tienda (ej: `/pizza-juan`)
- Personalización: logo, banner, color primario, descripción
- Soft delete con `deleted_at`
- Redirects automáticos si cambias el slug
- Estado activo/inactivo

#### Archivos
- `src/actions/stores.ts` - CRUD de tiendas
- `src/app/dashboard/settings/page.tsx` - Configuración
- `src/components/dashboard/StoreSettingsForm.tsx`

**Tabla BD:** `stores`
```sql
- id (uuid)
- user_id (uuid, FK a auth.users)
- slug (text, único)
- name, phone, description
- primary_color, logo_url, banner_url
- is_active, deleted_at
- created_at, updated_at
```

---

### 3. Sistema de Categorías

#### Características
- CRUD completo (crear, editar, eliminar)
- Orden personalizable (`sort_order`)
- Filtrado de productos por categoría
- Tabs horizontales en storefront

#### Archivos
- `src/actions/categories.ts`
- `src/app/dashboard/categories/page.tsx`
- `src/components/dashboard/CreateCategoryDialog.tsx`
- `src/components/dashboard/EditCategoryDialog.tsx`

**Tabla BD:** `categories`
```sql
- id, store_id (FK)
- name, sort_order
- created_at, updated_at
```

---

### 4. Sistema de Productos (COMPLETO)

#### 4.1 Productos Base

**Características:**
- Título, descripción (textarea), precio base
- Categoría opcional
- Estado activo/inactivo
- Imagen principal (legacy, aún soportado)

**Tabla BD:** `products`
```sql
- id, store_id (FK), category_id (FK nullable)
- title, description, price
- image_url (opcional)
- is_active, created_at, updated_at
```

#### 4.2 Variantes de Productos ✨

**Características:**
- Variantes dinámicas (tipo + valor)
- Ajuste de precio por variante (positivo o negativo)
- Campo de stock (preparado para futura funcionalidad)
- Agrupación por tipo en el modal

**Ejemplos:**
- Talla: S, M, L, XL
- Color: Rojo (+Q5), Negro, Azul (+Q3)
- Sabor: Chocolate, Vainilla (+Q2)

**Tabla BD:** `product_variants`
```sql
- id, product_id (FK)
- variant_type (text, ej: "Talla")
- variant_value (text, ej: "L")
- price_adjustment (numeric, ej: 5.00)
- stock (integer, default 0)
- created_at, updated_at
```

**Índice único:** `(product_id, variant_type, variant_value)` para evitar duplicados

#### 4.3 Galerías de Imágenes ✨

**Características:**
- Múltiples imágenes por producto
- Orden personalizable (`display_order`)
- Miniaturas interactivas en modal
- Auto-limpieza de Cloudinary al eliminar

**Tabla BD:** `product_images`
```sql
- id, product_id (FK)
- image_url (text)
- display_order (integer)
- created_at, updated_at
```

#### 4.4 Server Actions (Backend)

**Archivo:** `src/actions/products.ts`

**Funciones implementadas:**

1. **`createProduct(formData: FormData)`**
   - Inserta producto base
   - Inserta variantes (si existen)
   - Inserta imágenes (si existen)
   - Rollback automático si falla algo
   - Validaciones de ownership

2. **`updateProduct(formData: FormData)`**
   - Actualiza datos del producto
   - Reemplaza todas las variantes
   - Agrega nuevas imágenes (sin borrar existentes)
   - Revalidación de caché de Next.js

3. **`deleteProduct(productId: string)`**
   - Elimina producto (CASCADE elimina variantes e imágenes)
   - Elimina archivos de Cloudinary
   - Limpieza completa

4. **`deleteProductImage(imageId: string, productId: string)`**
   - Elimina imagen específica de la galería
   - Elimina archivo de Cloudinary

5. **`toggleProductStatus(productId: string, currentStatus: boolean)`**
   - Activa/desactiva productos

**Características técnicas:**
- Autenticación con cookies de Supabase SSR
- Validación de ownership (solo tu tienda)
- Try/Catch con mensajes descriptivos
- `revalidatePath()` para caché

#### 4.5 Formulario de Productos (Dashboard)

**Archivo:** `src/components/ui/dashboard/ProductForm.tsx`

**Características:**
- ✅ Modo creación y modo edición
- ✅ Campo de descripción con `<Textarea>`
- ✅ Selector de categoría (opcional)

**Sección de Imágenes:**
- Upload múltiple con preview
- Grilla de imágenes existentes (modo edición)
- Botón X para eliminar (nuevas o existentes)
- Badge de orden (#1, #2, #3...)
- Drag zone con ícono de upload

**Sección de Variantes:**
- Agregar/eliminar filas dinámicamente
- 3 inputs por fila:
  - Tipo (ej: "Talla")
  - Valor (ej: "M")
  - Ajuste de precio (número, puede ser negativo)
- Validación: filtra variantes vacías antes de enviar

**Flujo de subida:**
1. Usuario selecciona archivos
2. Se muestran previews locales
3. Al submit, se suben a Cloudinary via Server Action
4. Se obtienen URLs públicas optimizadas
5. Se serializan como JSON y se envían al Server Action

**Páginas que usan este componente:**
- `src/app/dashboard/products/new/page.tsx` (crear)
- `src/app/dashboard/products/[id]/page.tsx` (editar)

---

### 5. Storefront (Tienda Pública) 🏪

#### 5.1 Página Principal de la Tienda

**Archivo:** `src/app/[slug]/page.tsx`

**Características:**
- Ruta dinámica por slug
- Server Component (SSR)
- Fetch completo de tienda + productos + categorías + imágenes + variantes
- Manejo de redirects (slug antiguo → nuevo)
- Manejo de tiendas inactivas/eliminadas
- Banner personalizado (o gradiente por defecto)
- Logo en header y banner
- Botón de WhatsApp

**Función:** `getStoreData(slug: string)`
```typescript
// Fetch de:
- store (por slug)
- products (activos)
- categories
- product_images
- product_variants
```

#### 5.2 Lista de Productos con Filtros

**Archivo:** `src/components/storefront/StoreProducts.tsx`

**Características:**
- Tabs horizontales por categoría (scrollable en móvil)
- Tab "Todos" muestra todo
- Grid responsive (2 cols móvil, 3 tablet, 4 desktop)
- Click en tarjeta abre modal de detalles
- Muestra imagen principal de la galería (o fallback a `image_url`)

**Estructura de tarjeta:**
- Imagen cuadrada (aspect-square)
- Título truncado
- Precio en grande (verde)
- Botón "Agregar al carrito" (previene propagación del click)

#### 5.3 Modal de Detalles del Producto ✨

**Archivo:** `src/components/storefront/ProductDetailsModal.tsx`

**Características:**

**Columna Izquierda (Imágenes):**
- Imagen principal grande
- Grilla de miniaturas (4 columnas)
- Click en miniatura cambia la principal
- Border negro en la seleccionada
- Fallback si no hay imágenes

**Columna Derecha (Info):**
- Título (H2)
- Precio calculado (con variante seleccionada)
- Muestra ajuste de precio si aplica
- Descripción del producto (si existe)
- Selector de variantes:
  - Agrupadas por tipo (Talla, Color, etc.)
  - Botones estilo pill
  - Muestra ajuste de precio en cada botón
  - Toggle selección (click desactiva)
- Botón "Agregar al carrito" (tamaño completo)

**Lógica de precio:**
```typescript
const finalPrice = selectedVariantData
  ? product.price + selectedVariantData.price_adjustment
  : product.price
```

**Props del modal:**
```typescript
{
  product: any
  images: Array<{ image_url, display_order }>
  variants: Array<{ id, variant_type, variant_value, price_adjustment }>
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

#### 5.4 Sistema de Carrito

**Archivo:** `src/hooks/use-cart.ts`

**Características:**
- Estado global con Zustand
- Persistencia en localStorage
- Interfaz `CartItem`:
  ```typescript
  {
    id: string
    title: string
    price: number (con variante aplicada)
    image_url: string | null
    quantity: number
    selectedVariant?: string (info de la variante)
  }
  ```

**Métodos:**
- `addItem(data)` - Agrega o incrementa cantidad
- `removeItem(id)` - Elimina del carrito
- `clearCart()` - Vacía el carrito

**Componentes del carrito:**

1. **`CartSidebar.tsx`** - Sheet deslizable desde la derecha
   - Lista de items con imagen
   - Botón de eliminar por item
   - Total calculado
   - Botón "Finalizar Pedido" (abre CheckoutDialog)

2. **`CheckoutDialog.tsx`** - Dialog de confirmación
   - Resumen del pedido
   - Input de nombre del cliente
   - Input de dirección de entrega (opcional)
   - Textarea de notas adicionales
   - Botón "Enviar Pedido a WhatsApp"

3. **`AddToCartButton.tsx`** - Botón reutilizable
   - Ícono de carrito
   - Llamada a `useCart().addItem()`
   - Usado en tarjetas y en modal

#### 5.5 Checkout por WhatsApp

**Archivo:** `src/lib/whatsapp.ts`

**Función:** `generateWhatsAppMessage(items, customerInfo)`

**Formato del mensaje:**
```
🛒 *Nuevo Pedido*

👤 Cliente: [Nombre]
📍 Dirección: [Dirección]

📦 *Productos:*
1. [Producto] (Variante: [Info]) x[Cantidad] - Q[Subtotal]
2. ...

💰 *Total: Q[Total]*

📝 Notas: [Notas adicionales]
```

**Generación del link:**
```typescript
const url = `https://wa.me/${formatPhoneForWhatsApp(storePhone)}?text=${encodedMessage}`
```

---

### 6. Dashboard del Vendedor

#### Estructura
```
/dashboard
├── /                    # Resumen/stats
├── /products            # Lista de productos
├── /products/new        # Crear producto
├── /products/[id]       # Editar producto
├── /categories          # Gestión de categorías
├── /orders              # Gestión de órdenes (básico)
└── /settings            # Configuración de tienda
```

#### Layout del Dashboard
**Archivo:** `src/app/dashboard/layout.tsx`

- Sidebar con navegación
- Header con logo de la tienda
- Botón de logout
- Protegido por middleware

#### Componentes Clave

1. **`StoreSettingsForm.tsx`**
   - Editar nombre, teléfono, descripción
   - Cambiar color primario
   - Subir logo y banner
   - Preview en tiempo real

2. **`ShareStoreCard.tsx`**
   - Muestra URL pública de la tienda
   - Botón para copiar link
   - QR code para compartir

3. **`DangerZone.tsx`**
   - Desactivar/activar tienda
   - Eliminar tienda (soft delete)

4. **`RecoverAccountCard.tsx`**
   - Recuperar tienda eliminada
   - Solo visible si `deleted_at` no es null

5. **`LogoutButton.tsx`**
   - Cierra sesión con Supabase

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `profiles`
```sql
- id (uuid, PK, FK a auth.users)
- email (text)
- role (enum: seller, admin, moderator)
- created_at (timestamptz)
```

#### 2. `stores`
```sql
- id (uuid, PK)
- user_id (uuid, FK a auth.users, UNIQUE)
- slug (text, UNIQUE)
- name, phone, description (text)
- primary_color (text, default '#000000')
- logo_url, banner_url (text, nullable)
- is_active (boolean, default true)
- deleted_at (timestamptz, nullable)
- created_at, updated_at (timestamptz)
```

**Constraints:**
- `valid_slug`: Solo letras minúsculas, números y guiones
- `check_logo_url_format`: Valida formato HTTP(S)
- `check_banner_url_format`: Valida formato HTTP(S)

#### 3. `categories`
```sql
- id (uuid, PK)
- store_id (uuid, FK a stores, CASCADE)
- name (text)
- sort_order (int, default 0)
- created_at, updated_at (timestamptz)
```

#### 4. `products`
```sql
- id (uuid, PK)
- store_id (uuid, FK a stores, CASCADE)
- category_id (uuid, FK a categories, SET NULL)
- title, description (text)
- price (numeric(10,2), CHECK >= 0)
- image_url (text, nullable)
- is_active (boolean, default true)
- created_at, updated_at (timestamptz)
```

#### 5. `product_variants`
```sql
- id (uuid, PK)
- product_id (uuid, FK a products, CASCADE)
- variant_type (text, ej: "Talla")
- variant_value (text, ej: "M")
- price_adjustment (numeric, default 0)
- stock (integer, default 0)
- created_at, updated_at (timestamptz)
```

**Constraints:**
- `check_price_adjustment`: Rango válido
- `check_stock_positive`: >= 0
- **Índice único:** `(product_id, variant_type, variant_value)`

#### 6. `product_images`
```sql
- id (uuid, PK)
- product_id (uuid, FK a products, CASCADE)
- image_url (text)
- display_order (integer, default 0, CHECK >= 0)
- created_at, updated_at (timestamptz)
```

#### 7. `store_redirects` (para cambios de slug)
```sql
- old_slug (text)
- store_id (uuid, FK a stores)
```

### Índices Creados

```sql
-- Stores
idx_stores_slug
idx_stores_active (WHERE is_active = true)

-- Categories
idx_categories_store_id

-- Products
idx_products_store_id
idx_products_category_id
idx_products_store_active (store_id, is_active WHERE is_active = true)

-- Variants
idx_product_variants_product_id
idx_product_variants_type
idx_product_variants_unique (UNIQUE)

-- Images
idx_product_images_product_id
idx_product_images_order (product_id, display_order)
```

### Funciones SQL Importantes

#### 1. `update_updated_at_column()`
Trigger que actualiza automáticamente `updated_at` en cada UPDATE.

#### 2. `handle_new_user()`
Crea automáticamente un perfil en `profiles` cuando se registra un usuario.

#### 3. `is_admin_or_mod()`
Helper para políticas RLS que verifica si el usuario es admin o moderador.

#### 4. `is_product_owner(product_uuid)`
Verifica si el usuario actual es dueño del producto (vía store).

### Gestión de Imágenes (Cloudinary)

Las imágenes se gestionan con Cloudinary en lugar de Supabase Storage:

- **Upload**: Via `src/actions/cloudinary.ts` → `uploadImage()`
- **Delete**: Via `src/actions/cloudinary.ts` → `deleteImage()`
- **Helpers**: `src/lib/cloudinary.ts` (extractPublicId, isCloudinaryUrl, etc.)

**Estructura de carpetas en Cloudinary:**
```
veny/
├── products/          # Imágenes de productos
├── stores/
│   └── {store_id}/
│       ├── logos/     # Logos de tiendas
│       └── banners/   # Banners de tiendas
```

### Row Level Security (RLS)

**Todas las tablas tienen RLS habilitado.**

#### Políticas de Products (ejemplo):
```sql
-- Público puede ver productos activos
"Ver productos activos" FOR SELECT
  USING (is_active = true)

-- Vendedor puede ver sus propios productos (aunque estén inactivos)
"Ver mis productos" FOR SELECT TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM stores WHERE id = products.store_id))

-- Vendedor puede insertar solo en su tienda
"Insertar mis productos" FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IN (SELECT user_id FROM stores WHERE id = products.store_id))

-- Similar para UPDATE y DELETE

-- Admins pueden hacer todo
"Admins gestionan productos" FOR ALL TO authenticated
  USING (is_admin_or_mod())
  WITH CHECK (is_admin_or_mod())
```

---

## 📁 Estructura de Archivos

```
veny/
├── src/
│   ├── app/                           # App Router (Next.js)
│   │   ├── (auth)/
│   │   │   └── login/page.tsx         # Login page
│   │   ├── auth/
│   │   │   └── callback/route.ts      # OAuth callback
│   │   ├── dashboard/                 # Dashboard del vendedor
│   │   │   ├── layout.tsx             # Layout con sidebar
│   │   │   ├── page.tsx               # Resumen/stats
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Lista
│   │   │   │   ├── new/page.tsx       # Crear
│   │   │   │   └── [id]/page.tsx      # Editar
│   │   │   ├── categories/page.tsx    # Gestión de categorías
│   │   │   ├── orders/page.tsx        # Pedidos
│   │   │   └── settings/page.tsx      # Configuración
│   │   ├── [slug]/page.tsx            # 🏪 Tienda pública (dinámica)
│   │   ├── layout.tsx                 # Layout global
│   │   ├── page.tsx                   # Landing page
│   │   ├── recover/page.tsx           # Recuperar cuenta
│   │   ├── globals.css                # Estilos globales
│   │   └── favicon.ico
│   │
│   ├── actions/                       # Server Actions (Backend)
│   │   ├── products.ts                # ⭐ CRUD productos + variantes + imágenes
│   │   ├── stores.ts                  # CRUD tiendas
│   │   ├── categories.ts              # CRUD categorías
│   │   ├── orders.ts                  # Gestión de órdenes
│   │   ├── dashboard.ts               # Stats
│   │   └── cloudinary.ts              # ⭐ Upload/delete imágenes a Cloudinary
│   │
│   ├── components/
│   │   ├── ui/                        # Shadcn UI components
│   │   │   ├── dashboard/
│   │   │   │   ├── ProductForm.tsx    # ⭐ Formulario productos (variantes + imágenes)
│   │   │   │   ├── StoreForm.tsx      # Crear tienda
│   │   │   │   └── LogoutButton.tsx
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── label.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   └── table.tsx
│   │   │
│   │   ├── dashboard/                 # Componentes del admin
│   │   │   ├── StoreSettingsForm.tsx  # Config de tienda
│   │   │   ├── ShareStoreCard.tsx     # Compartir link + QR
│   │   │   ├── DangerZone.tsx         # Eliminar tienda
│   │   │   ├── RecoverAccountCard.tsx # Recuperar tienda
│   │   │   ├── CreateCategoryDialog.tsx
│   │   │   └── EditCategoryDialog.tsx
│   │   │
│   │   └── storefront/                # Componentes tienda pública
│   │       ├── StoreProducts.tsx      # ⭐ Lista + filtros por categoría
│   │       ├── ProductDetailsModal.tsx # ⭐ Modal con galería + variantes
│   │       ├── AddToCartButton.tsx    # Botón agregar al carrito
│   │       ├── CartSidebar.tsx        # Carrito deslizable
│   │       └── CheckoutDialog.tsx     # Finalizar pedido
│   │
│   ├── hooks/
│   │   └── use-cart.ts                # ⭐ Estado global del carrito (Zustand)
│   │
│   ├── lib/
│   │   ├── supabase.ts                # Cliente de Supabase
│   │   ├── cloudinary.ts              # ⭐ Helpers para Cloudinary (upload, delete, etc.)
│   │   ├── whatsapp.ts                # Generación mensaje WhatsApp
│   │   ├── phone.ts                   # Formateo de teléfonos
│   │   └── utils.ts                   # Helpers (cn, etc.)
│   │
│   └── types/
│       └── index.ts                   # ⭐ Interfaces TypeScript
│
├── public/                            # Archivos estáticos
│   ├── *.svg
│   └── favicon.ico
│
├── bd.sql                             # ⭐ Schema completo de BD
├── scripts/
│   └── migrate-images-to-cloudinary.ts # Script de migración (ya ejecutado)
├── AGENT.md                          # 📄 Este archivo
├── README.md                         # Documentación general
├── package.json                      # Dependencias
├── tsconfig.json                     # Config de TypeScript
├── next.config.ts                    # Config de Next.js
├── tailwind.config.js                # Config de Tailwind
├── components.json                   # Config de Shadcn UI
├── postcss.config.mjs                # Config de PostCSS
├── eslint.config.mjs                 # Config de ESLint
└── .env.local                        # Variables de entorno (NO commitear)
```

---

## 🔑 Variables de Entorno

Archivo: `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[tu-proyecto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[tu-key]...

# Cloudinary (para gestión de imágenes)
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=tu-cloud-name
```

---

## 💻 Comandos Útiles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (http://localhost:3000)

# Producción
npm run build        # Genera build optimizado
npm run start        # Inicia servidor de producción

# Linting
npm run lint         # Ejecuta ESLint

# Instalación
npm install          # Instala dependencias
```

---

## 📋 Convenciones de Código

### Server vs Client Components

**Server Components (por defecto):**
- NO llevan `'use client'`
- Pueden hacer fetch directo en el componente
- No pueden usar hooks de React (useState, useEffect, etc.)
- Ejemplo: `src/app/[slug]/page.tsx`

**Client Components:**
- Llevan `'use client'` en la primera línea
- Pueden usar hooks de React
- Pueden tener interactividad
- Ejemplo: `src/components/storefront/StoreProducts.tsx`

### Server Actions

```typescript
'use server' // Primera línea

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function myAction(formData: FormData) {
  // Autenticación
  const cookieStore = await cookies()
  const supabase = createServerClient(...)
  
  // Lógica de negocio
  const result = await supabase.from('table').insert(...)
  
  // Revalidación de caché
  revalidatePath('/dashboard')
  
  // Opcional: Redirect
  redirect('/dashboard')
}
```

### Tipos TypeScript

Usar interfaces exportadas desde `src/types/index.ts`:
```typescript
import { Product, Category, Store, CartItem } from '@/types'
```

### Componentes Shadcn UI

Importar desde `@/components/ui`:
```typescript
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
```

### Estilos con Tailwind

- Usar utility classes directamente
- Para condicionales, usar `cn()` de `@/lib/utils`
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  disabled && "disabled-classes"
)} />
```

---

## 🚀 Flujos Principales

### 1. Crear un Producto Completo

```
Usuario → Dashboard → /products/new
  ↓
Llena formulario (ProductForm.tsx)
  ↓
Selecciona múltiples imágenes → Preview local
  ↓
Agrega variantes (tipo, valor, precio)
  ↓
Submit → Subida de imágenes a Cloudinary
  ↓
Server Action createProduct()
  ↓
INSERT en products → INSERT en product_variants → INSERT en product_images
  ↓
Redirect a /dashboard
```

### 2. Compra en el Storefront

```
Cliente → /{slug}
  ↓
Ve productos (filtrados por categoría)
  ↓
Click en producto → Abre ProductDetailsModal
  ↓
Ve galería de imágenes (miniaturas)
  ↓
Selecciona variante (talla, color, etc.)
  ↓
Precio se actualiza dinámicamente
  ↓
Click "Agregar al carrito"
  ↓
useCart().addItem() → Estado Zustand → localStorage
  ↓
Click en ícono del carrito → CartSidebar abre
  ↓
Click "Finalizar Pedido" → CheckoutDialog
  ↓
Llena nombre, dirección, notas
  ↓
Click "Enviar a WhatsApp"
  ↓
Genera mensaje formateado → Abre WhatsApp Web
  ↓
Cliente envía mensaje al vendedor
```

### 3. Cambiar Slug de Tienda

```
Vendedor → /dashboard/settings
  ↓
Cambia el slug (ej: "pizza-juan" → "pizzeria-juan")
  ↓
Server Action updateStoreSlug()
  ↓
INSERT en store_redirects (old_slug: "pizza-juan")
  ↓
UPDATE stores SET slug = "pizzeria-juan"
  ↓
Cliente visita /pizza-juan (slug antiguo)
  ↓
getStoreData() detecta el redirect
  ↓
redirect(`/pizzeria-juan`) automático
```

---

## 🎯 Puntos de Integración

### Para Futuros Desarrollos

#### 1. Sistema de Inventario
- Campo `stock` ya existe en `product_variants`
- Agregar lógica en `addItem()` para verificar disponibilidad
- Decrementar stock en Server Action al confirmar pedido

#### 2. Sistema de Órdenes Completo
- Tabla `orders` y `order_items` (no implementado)
- Guardar pedidos en BD en lugar de solo WhatsApp
- Dashboard para ver historial de pedidos

#### 3. Pagos Online
- Integrar Stripe/MercadoPago/PayPal
- Webhook para confirmar pago
- Cambiar checkout de WhatsApp a formulario de pago

#### 4. Analytics
- Tabla de events (product_view, add_to_cart, purchase)
- Dashboard con gráficas
- Productos más vendidos

#### 5. Multi-Idioma
- next-intl o i18next
- Traducciones en JSON
- Locale en URL o cookies

---

## 🐛 Notas Técnicas

### Cloudinary para Imágenes
- Las imágenes se almacenan en Cloudinary con optimización automática
- Al eliminar productos/tiendas, se eliminan las imágenes de Cloudinary
- Las URLs de Cloudinary incluyen transformaciones automáticas (f_auto, q_auto)
- Helpers disponibles en `src/lib/cloudinary.ts`

### RLS y Performance
- Las políticas RLS pueden ser costosas en queries complejos
- Considerar índices compuestos si hay lentitud
- Usar `EXPLAIN ANALYZE` en Supabase SQL Editor

### Server Actions y Caché
- `revalidatePath()` invalida el caché de Next.js
- Si no ves cambios, verificar que esté llamado
- En desarrollo, el caché es más agresivo

### TypeScript Estricto
- `tsconfig.json` tiene `strict: true`
- Siempre tipar props de componentes
- Evitar `any`, usar `unknown` si no conoces el tipo

---

## 📚 Recursos Externos

### Documentación Oficial
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [Shadcn UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zustand](https://zustand-demo.pmnd.rs)

### Supabase Dashboard
- Database: Ver tablas, ejecutar SQL, ver políticas RLS
- Authentication: Ver usuarios, resetear passwords
- SQL Editor: Ejecutar queries

---

## ✅ Checklist de Funcionalidades

### Implementado
- ✅ Autenticación con Supabase
- ✅ Multi-tenant con slugs únicos
- ✅ CRUD de tiendas
- ✅ CRUD de categorías
- ✅ CRUD de productos
- ✅ Variantes de productos (tipo + valor + precio)
- ✅ Galerías de imágenes por producto
- ✅ Upload de imágenes a Cloudinary
- ✅ Auto-limpieza de imágenes en Cloudinary
- ✅ Row Level Security (RLS)
- ✅ Dashboard completo para vendedores
- ✅ Storefront público responsive
- ✅ Modal de detalles con galería interactiva
- ✅ Selector de variantes dinámico
- ✅ Carrito de compras (Zustand + localStorage)
- ✅ Checkout por WhatsApp
- ✅ Soft delete de tiendas
- ✅ Redirects de slugs antiguos
- ✅ Personalización de tienda (logo, banner, color)
- ✅ Filtrado por categorías
- ✅ Activar/desactivar productos y tiendas

### Preparado pero No Implementado
- 🟡 Stock por variante (campo existe pero sin lógica)
- 🟡 Sistema de órdenes (tabla básica existe)

### No Implementado
- ❌ Pagos online
- ❌ Dashboard de analytics
- ❌ Sistema de reviews
- ❌ Búsqueda de productos
- ❌ Testing (unit, e2e)
- ❌ Multi-idioma
- ❌ PWA
- ❌ Notificaciones push

---

## 🎓 Para Agentes IA

### Al trabajar en este proyecto:

1. **Revisa primero:**
   - `src/types/index.ts` para entender las interfaces
   - `bd.sql` para entender el esquema de BD
   - Este archivo (AGENT.md) para contexto general

2. **Sigue las convenciones:**
   - Server Actions en `src/actions/`
   - Componentes de UI en `src/components/`
   - Usa TypeScript estricto
   - Usa componentes de Shadcn UI

3. **Seguridad:**
   - Siempre valida ownership en Server Actions
   - Verifica que RLS esté habilitado en nuevas tablas
   - No expongas claves secretas en el cliente

4. **Performance:**
   - Usa Server Components cuando sea posible
   - Minimiza JavaScript en el cliente
   - Optimiza imágenes con Next.js Image

5. **Testing:**
   - Prueba en móvil y desktop
   - Verifica que RLS funcione (probando con diferentes usuarios)

---

## 📝 Historial de Cambios

- **2026-01-26**: Migración de Supabase Storage a Cloudinary para gestión de imágenes
- **2026-01-05**: Cambio de diseño UI a paleta "SaaS Pro" (Indigo/Slate). Actualización completa del AGENT.md reflejando el estado actual del proyecto
- **2026-01-02**: Implementación de sistema de variantes e imágenes múltiples
- **2025-12-27**: Inicio del proyecto VENY

---

## 🙋 Soporte

Si encuentras problemas o tienes preguntas:
1. Revisa la documentación de las tecnologías usadas
2. Verifica los logs en la consola del navegador
3. Revisa los logs de Supabase (Dashboard → Logs)
4. Consulta este archivo para entender la arquitectura

---

**Última actualización:** 5 de Enero de 2026
**Versión del proyecto:** 0.1.0
**Estado:** Producción (funcional y estable)
