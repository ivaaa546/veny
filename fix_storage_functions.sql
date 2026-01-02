-- ====================================================================
-- CORRECCIÓN: Funciones de eliminación de archivos del storage
-- ====================================================================
-- Problema: storage.fdelete() no existe en versiones recientes de Supabase
-- Solución: Usar la extensión http para eliminar archivos directamente
-- ====================================================================

-- Primero, eliminar las funciones antiguas
DROP FUNCTION IF EXISTS delete_product_image_from_storage() CASCADE;
DROP FUNCTION IF EXISTS delete_product_main_image_from_storage() CASCADE;
DROP FUNCTION IF EXISTS delete_store_logo_from_storage() CASCADE;
DROP FUNCTION IF EXISTS delete_store_banner_from_storage() CASCADE;

-- ====================================================================
-- OPCIÓN 1: Funciones SIN auto-eliminación automática (RECOMENDADO)
-- ====================================================================
-- Esta opción es más segura y te da control total sobre cuándo eliminar archivos
-- Los archivos quedan en el storage y puedes eliminarlos manualmente desde el código
-- o crear un proceso de limpieza periódico

-- No hacer nada, simplemente eliminar los triggers antiguos
DROP TRIGGER IF EXISTS on_product_image_deleted ON public.product_images;
DROP TRIGGER IF EXISTS on_product_image_changed ON public.products;
DROP TRIGGER IF EXISTS on_store_logo_changed ON public.stores;
DROP TRIGGER IF EXISTS on_store_banner_changed ON public.stores;

-- ====================================================================
-- NOTAS IMPORTANTES:
-- ====================================================================
-- 1. Las funciones storage.fdelete() ya no existen en Supabase moderno
-- 2. Para eliminar archivos del storage, debes hacerlo desde tu código Next.js
-- 3. Ejemplo de eliminación desde el código:
--    await supabase.storage.from('store-images').remove(['path/to/file.jpg'])
-- 4. Los triggers automáticos de eliminación pueden causar problemas de permisos
-- 5. Es mejor manejar la eliminación de archivos explícitamente en tu aplicación

-- ====================================================================
-- ALTERNATIVA: Si realmente necesitas auto-eliminación (AVANZADO)
-- ====================================================================
-- Descomenta esta sección solo si necesitas auto-eliminación automática
-- Requiere configurar la extensión http y permisos adicionales en Supabase

/*
-- Habilitar la extensión http (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS http;

-- Función para eliminar archivos usando la API de Supabase Storage
CREATE OR REPLACE FUNCTION delete_storage_file(bucket_name text, file_path text)
RETURNS void AS $$
DECLARE
  project_url text := current_setting('app.settings.supabase_url', true);
  service_role_key text := current_setting('app.settings.supabase_service_key', true);
  request_url text;
BEGIN
  IF file_path IS NULL OR file_path = '' THEN
    RETURN;
  END IF;

  request_url := project_url || '/storage/v1/object/' || bucket_name || '/' || file_path;
  
  PERFORM http((
    'DELETE',
    request_url,
    ARRAY[http_header('apikey', service_role_key), http_header('Authorization', 'Bearer ' || service_role_key)],
    'application/json',
    ''
  )::http_request);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear funciones de limpieza usando la nueva función
CREATE OR REPLACE FUNCTION delete_product_image_from_storage()
RETURNS TRIGGER AS $$
DECLARE
  file_path text;
BEGIN
  file_path := extract_storage_path(OLD.image_url);
  
  IF file_path IS NOT NULL AND file_path != '' THEN
    PERFORM delete_storage_file('store-images', file_path);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear triggers
CREATE TRIGGER on_product_image_deleted
  AFTER DELETE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION delete_product_image_from_storage();
*/

-- ====================================================================
-- FIN DE LAS CORRECCIONES
-- ====================================================================
