# Auto-Limpieza de Storage en Supabase

## ¿Qué hace este sistema?

Automáticamente elimina los archivos del storage de Supabase cuando:

1. **Se elimina una imagen de `product_images`**
   - Borra el registro de la BD → Elimina el archivo del bucket `store-images`

2. **Se actualiza/elimina la imagen principal de un producto**
   - Cambias `products.image_url` → Elimina la imagen anterior del storage
   - Borras el producto → Elimina su imagen del storage

3. **Se actualiza/elimina el logo de una tienda**
   - Cambias `stores.logo_url` → Elimina el logo anterior del storage
   - Borras la tienda → Elimina su logo del storage

4. **Se actualiza/elimina el banner de una tienda**
   - Cambias `stores.banner_url` → Elimina el banner anterior del storage
   - Borras la tienda → Elimina su banner del storage

## Cómo funciona

### 1. Función `extract_storage_path(url)`
Extrae el path del archivo desde una URL completa:

```
Entrada: https://xxx.supabase.co/storage/v1/object/public/store-images/productos/imagen.jpg
Salida:  productos/imagen.jpg
```

### 2. Funciones de eliminación
Cada tabla tiene su función trigger que:
- Detecta cuándo se elimina o actualiza una imagen
- Extrae el path del archivo usando `extract_storage_path()`
- Llama a `storage.fdelete()` para borrar el archivo físico

### 3. Triggers
Ejecutan automáticamente las funciones cuando:
- `AFTER DELETE`: Cuando se borra un registro
- `AFTER UPDATE`: Cuando se actualiza una URL de imagen (solo si cambió)

## Ventajas

✅ **Automático**: No necesitas código adicional en tu aplicación  
✅ **Limpio**: No quedan archivos huérfanos en el storage  
✅ **Ahorro de costos**: No pagas por almacenar archivos no usados  
✅ **Seguro**: Solo elimina cuando realmente se borra/cambia el registro  

## Consideraciones

⚠️ **Backups**: Si restauras la BD, las imágenes eliminadas NO se restauran (están en el storage)  
⚠️ **URLs externas**: Solo funciona con archivos en `store-images` de tu proyecto  
⚠️ **Reutilización**: Si dos registros usan la misma URL, al borrar uno se elimina para ambos  

## Casos de uso

### Ejemplo 1: Usuario elimina una imagen adicional
```sql
-- Usuario borra una imagen de su producto
DELETE FROM product_images WHERE id = 'uuid-de-imagen';

-- ✅ Automáticamente:
-- 1. Se borra el registro de la BD
-- 2. Se elimina el archivo del storage
```

### Ejemplo 2: Usuario cambia el logo de su tienda
```sql
-- Usuario sube un nuevo logo
UPDATE stores 
SET logo_url = 'https://xxx.supabase.co/storage/v1/object/public/store-images/logos/nuevo.jpg'
WHERE id = 'uuid-tienda';

-- ✅ Automáticamente:
-- 1. Se actualiza la URL en la BD
-- 2. Se elimina el logo anterior del storage
-- 3. El nuevo logo queda intacto
```

### Ejemplo 3: Usuario elimina un producto con CASCADE
```sql
-- Usuario borra un producto (que tiene 3 imágenes adicionales)
DELETE FROM products WHERE id = 'uuid-producto';

-- ✅ Automáticamente:
-- 1. Se borran las 3 filas de product_images (CASCADE)
-- 2. El trigger de product_images elimina las 3 imágenes del storage
-- 3. El trigger de products elimina la imagen principal del storage
-- RESULTADO: 4 archivos eliminados automáticamente
```

## Pruebas

### Probar que funciona:
1. Sube una imagen desde tu app
2. Verifica que aparece en Storage > store-images
3. Elimina el registro de la BD
4. Verifica que la imagen desapareció del storage

### Verificar logs (en caso de errores):
```sql
-- Ver errores recientes en triggers
SELECT * FROM pg_stat_activity 
WHERE state = 'active' 
AND query LIKE '%storage.fdelete%';
```

## Troubleshooting

### Problema: Las imágenes no se eliminan

**Causas posibles:**
1. La función `storage.fdelete()` no está disponible en tu versión de Supabase
2. El path extraído es incorrecto (verifica con `SELECT extract_storage_path('tu-url')`)
3. Permisos insuficientes en el bucket

**Solución:**
```sql
-- Verificar que la función existe
SELECT * FROM pg_proc WHERE proname = 'fdelete';

-- Verificar permisos del bucket
SELECT * FROM storage.buckets WHERE name = 'store-images';
```

### Problema: Error "function storage.fdelete does not exist"

**Causa:** Versión antigua de Supabase Storage API

**Solución alternativa:** Usar un Edge Function de Supabase para eliminar archivos desde tu aplicación

## Mantenimiento

### Limpiar archivos huérfanos (si ya existían antes de este script):
```sql
-- Listar todos los archivos en storage
SELECT * FROM storage.objects WHERE bucket_id = 'store-images';

-- Comparar con las URLs en tu BD y eliminar manualmente los huérfanos
```

## Notas adicionales

- Los triggers usan `SECURITY DEFINER` para tener permisos de eliminación
- Solo funciona con el bucket `store-images` (modifica si usas otro nombre)
- Compatible con soft-delete (`deleted_at`) en stores
- Si un producto se elimina por CASCADE, todos sus archivos se limpian
