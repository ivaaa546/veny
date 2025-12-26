Actúa como un Desarrollador Senior Full Stack en Next.js.

OBJETIVO:
Actualizar el formulario de creación de productos y la Server Action para soportar la nueva estructura de base de datos "Flexible" (Múltiples variantes y múltiples imágenes).

CONTEXTO DE BASE DE DATOS (Supabase):
He creado estas dos nuevas tablas relacionadas con `products`:

1. table `product_variants`:
   - product_id (uuid)
   - variant_type (text) -- Ej: "Talla", "Color"
   - variant_value (text) -- Ej: "XL", "Rojo"
   - price_adjustment (numeric) -- Ej: 10 (Se suma al precio base)

2. table `product_images`:
   - product_id (uuid)
   - image_url (text)
   - display_order (int)

TAREAS A REALIZAR:

1. Modificar `src/components/dashboard/ProductForm.tsx`:
   - CAMBIO 1 (Imágenes): Permite subir múltiples imágenes. Muestra una grilla con las previsualizaciones. Debes manejar la subida a Supabase Storage de cada una y obtener su URL pública.
   - CAMBIO 2 (Variantes): Agrega una sección dinámica. Debe haber un botón "Agregar Variante". Cada fila de variante debe tener inputs para:
     - Tipo (Ej: "Talla")
     - Valor (Ej: "M")
     - Ajuste de Precio (Opcional, default 0).
     - Botón de eliminar esa fila.
   - Al enviar el formulario, debes pasar estos arrays de datos al Server Action. (Sugerencia: Puedes serializarlos como JSON string dentro del FormData o ajustar la firma de la función).

2. Modificar `src/actions/products.ts` (Función createProduct):
   - Extraer los datos básicos del producto y crearlo en la tabla `products`.
   - Obtener el `id` del producto recién creado.
   - Insertar las variantes en `product_variants`.
   - Insertar las imágenes en `product_images`.
   - Todo esto debe ocurrir idealmente, si falla la creación del producto, no deberían crearse las variantes.

REQUISITOS TÉCNICOS:
- Usa componentes de Shadcn UI (Button, Input, Label).
- Mantén el diseño limpio.
- Maneja los estados de 'loading' correctamente.