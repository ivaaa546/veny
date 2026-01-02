# Role
Actúa como un Desarrollador Senior Full Stack especializado en Next.js, Supabase, Tailwind y Shadcn UI.

# Contexto Global
Estamos actualizando un SaaS de tiendas online. El objetivo es soportar productos complejos con variantes (tallas, colores) y galerías de imágenes.
Ya hemos creado las tablas en Supabase, ahora necesitamos actualizar el código del **Dashboard (Admin)** y de la **Storefront (Pública)**.

# Estructura de Base de Datos (Ya existente)
1. table `products`:
   - id, title, price, description (text), category_id, store_id, image_url (principal).
2. table `product_variants`:
   - product_id (fk), variant_type (text, ej: "Talla"), variant_value (text, ej: "XL"), price_adjustment (numeric).
3. table `product_images`:
   - product_id (fk), image_url (text), display_order (int).

---

# TAREA 1: ADMIN & BACKEND (Creación de Productos)

## 1.1 Modificar `src/actions/products.ts` (Server Action)
- Actualiza la función `createProduct`.
- Debe recibir: datos básicos + array de variantes + array de URLs de imágenes extra (probablemente como JSON string).
- Lógica transaccional ideal:
  1. Insertar producto en `products`.
  2. Si tiene variantes, insertarlas en `product_variants`.
  3. Si tiene imágenes extra, insertarlas en `product_images`.

## 1.2 Modificar `src/components/dashboard/ProductForm.tsx`
- **Campo Descripción:** Agrega un Textarea para la descripción.
- **Sección Imágenes:**
  - Permite subir múltiples archivos.
  - Sube cada archivo a Supabase Storage (`store-images`).
  - Muestra previews.
- **Sección Variantes (Dinámica):**
  - Botón "Agregar Variante".
  - Inputs por fila: Tipo (ej: "Color"), Valor (ej: "Rojo"), Precio Extra (+).
  - Botón para eliminar fila.
- **Envío:** Empaqueta todo (datos + variantes + array fotos) y envíalo al Server Action actualizado.

---

# TAREA 2: STOREFRONT & UX (Vista del Cliente)

## 2.1 Actualizar Fetch de Datos
**Archivo:** `src/app/[slug]/page.tsx`
- Modifica `getStoreData` para traer las relaciones.
- Query: `.select('*, product_variants(*), product_images(*)')`.
- Pasa esta data enriquecida al componente `StoreProducts`.

## 2.2 Crear Componente "ProductModal"
**Archivo:** `src/components/storefront/ProductModal.tsx` (Componente Nuevo)
- Usa `Dialog` de Shadcn UI.
- Muestra:
  - Galería interactiva (foto principal cambia al hacer clic en miniaturas).
  - Información: Título, Descripción, Precio Calculado.
  - Selector de Variantes: Botones para elegir (ej: S, M, L). Actualiza el precio si la variante tiene costo extra.
- Lógica `useCart`:
  - Al agregar, genera un ID único combinando `${productId}-${variantId}`.
  - El título en el carrito debe incluir la variante (ej: "Camisa (Talla: L)").

## 2.3 Integrar Modal en la Lista
**Archivo:** `src/components/storefront/StoreProducts.tsx`
- Envuelve cada tarjeta de producto con `<ProductModal>`.
- Muestra un indicador visual si el producto tiene variantes (ej: "Más opciones").

---

# Requisitos Técnicos
- Usa componentes de Shadcn UI (Dialog, Tabs, Input, Button, Select, Textarea).
- Manejo de errores robusto (Try/Catch).
- Diseño Responsive (Mobile First).
- Mantén el código limpio y tipado (TypeScript).