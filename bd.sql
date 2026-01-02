-- ====================================================================
-- BASE DE DATOS VENY - VERSIÓN LIMPIA Y OPTIMIZADA
-- ====================================================================
-- Sistema de gestión de tiendas online con productos, variantes e imágenes
-- Incluye: Seguridad RLS, Auditoría, Validaciones, Auto-limpieza de Storage
-- ====================================================================
-- CARACTERÍSTICAS:
-- - Script limpio sin correcciones históricas
-- - Listo para ejecutar en una BD nueva desde cero
-- - Incluye todas las optimizaciones y mejores prácticas
-- - Políticas RLS seguras desde el inicio
-- - Auto-limpieza automática de archivos del storage
-- ====================================================================


-- ====================================================================
-- 1. TIPOS Y ENUMS
-- ====================================================================

CREATE TYPE app_role AS ENUM ('seller', 'admin', 'moderator');


-- ====================================================================
-- 2. TABLAS
-- ====================================================================

-- 2.1 PROFILES (Extensión de usuarios de Supabase Auth)
-- ====================================================================
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email text,
  role app_role DEFAULT 'seller',
  created_at timestamptz DEFAULT NOW()
);


-- 2.2 STORES (Tiendas)
-- ====================================================================
CREATE TABLE public.stores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  phone text NOT NULL,
  description text,
  primary_color text DEFAULT '#000000',
  logo_url text,
  banner_url text,
  is_active boolean DEFAULT true,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9-]+$'),
  CONSTRAINT check_logo_url_format CHECK (logo_url IS NULL OR logo_url ~* '^https?://'),
  CONSTRAINT check_banner_url_format CHECK (banner_url IS NULL OR banner_url ~* '^https?://')
);


-- 2.3 CATEGORIES (Categorías de productos por tienda)
-- ====================================================================
CREATE TABLE public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);


-- 2.4 PRODUCTS (Productos)
-- ====================================================================
CREATE TABLE public.products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT check_image_url_format CHECK (image_url IS NULL OR image_url ~* '^https?://')
);


-- 2.5 PRODUCT_VARIANTS (Variantes: tallas, colores, sabores, etc.)
-- ====================================================================
CREATE TABLE public.product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_type text NOT NULL,
  variant_value text NOT NULL,
  price_adjustment numeric DEFAULT 0,
  stock integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT check_price_adjustment CHECK (price_adjustment >= -999999 AND price_adjustment <= 999999),
  CONSTRAINT check_stock_positive CHECK (stock >= 0)
);


-- 2.6 PRODUCT_IMAGES (Imágenes adicionales de productos)
-- ====================================================================
CREATE TABLE public.product_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  CONSTRAINT check_display_order_positive CHECK (display_order >= 0),
  CONSTRAINT check_product_image_url_format CHECK (image_url ~* '^https?://')
);


-- ====================================================================
-- 3. ÍNDICES (Optimización de queries)
-- ====================================================================

-- Índices básicos
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_active ON public.stores(is_active) WHERE is_active = true;

CREATE INDEX idx_categories_store_id ON public.categories(store_id);

CREATE INDEX idx_products_store_id ON public.products(store_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_store_active ON public.products(store_id, is_active) WHERE is_active = true;

CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_type ON public.product_variants(variant_type);
CREATE UNIQUE INDEX idx_product_variants_unique ON public.product_variants(product_id, variant_type, variant_value);

CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_order ON public.product_images(product_id, display_order);


-- ====================================================================
-- 4. FUNCIONES
-- ====================================================================

-- 4.1 Auto-actualizar columna updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 4.2 Crear perfil automáticamente al registrarse un usuario
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'seller')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.3 Helper para verificar si es admin o moderador
-- ====================================================================
CREATE OR REPLACE FUNCTION is_admin_or_mod()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.4 Helper para verificar ownership de un producto
-- ====================================================================
CREATE OR REPLACE FUNCTION is_product_owner(product_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.products 
    JOIN public.stores ON stores.id = products.store_id
    WHERE products.id = product_uuid 
    AND stores.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.5 Extraer path del storage desde URL completa
-- ====================================================================
CREATE OR REPLACE FUNCTION extract_storage_path(url text)
RETURNS text AS $$
DECLARE
  path_part text;
BEGIN
  IF url IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Extraer path después de /store-images/
  path_part := regexp_replace(url, '^.*/store-images/', '');
  
  -- Si no se encontró, intentar formato directo
  IF path_part = url THEN
    path_part := regexp_replace(url, '^store-images/', '');
  END IF;
  
  RETURN path_part;
END;
$$ LANGUAGE plpgsql;

-- 4.5.1 Helper para borrar de storage.objects (NUEVO)
CREATE OR REPLACE FUNCTION public.delete_storage_object(bucket_text text, file_path text)
RETURNS void AS $$
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = bucket_text
  AND name = file_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.6 Eliminar imagen de product_images del storage (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION delete_product_image_from_storage()
RETURNS TRIGGER AS $$
DECLARE
  file_path text;
BEGIN
  file_path := extract_storage_path(OLD.image_url);
  
  IF file_path IS NOT NULL AND file_path != '' THEN
    PERFORM public.delete_storage_object('store-images', file_path);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.7 Eliminar imagen principal del producto del storage (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION delete_product_main_image_from_storage()
RETURNS TRIGGER AS $$
DECLARE
  file_path text;
BEGIN
  IF (TG_OP = 'DELETE' OR OLD.image_url IS DISTINCT FROM NEW.image_url) THEN
    file_path := extract_storage_path(OLD.image_url);
    
    IF file_path IS NOT NULL AND file_path != '' THEN
      PERFORM public.delete_storage_object('store-images', file_path);
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.8 Eliminar logo de tienda del storage (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION delete_store_logo_from_storage()
RETURNS TRIGGER AS $$
DECLARE
  logo_path text;
BEGIN
  IF (TG_OP = 'DELETE' OR OLD.logo_url IS DISTINCT FROM NEW.logo_url) THEN
    logo_path := extract_storage_path(OLD.logo_url);
    
    IF logo_path IS NOT NULL AND logo_path != '' THEN
      PERFORM public.delete_storage_object('store-images', logo_path);
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4.9 Eliminar banner de tienda del storage (FIXED)
-- ====================================================================
CREATE OR REPLACE FUNCTION delete_store_banner_from_storage()
RETURNS TRIGGER AS $$
DECLARE
  banner_path text;
BEGIN
  IF (TG_OP = 'DELETE' OR OLD.banner_url IS DISTINCT FROM NEW.banner_url) THEN
    banner_path := extract_storage_path(OLD.banner_url);
    
    IF banner_path IS NOT NULL AND banner_path != '' THEN
      PERFORM public.delete_storage_object('store-images', banner_path);
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ====================================================================
-- 5. TRIGGERS
-- ====================================================================

-- 5.1 Triggers para updated_at
-- ====================================================================
CREATE TRIGGER update_stores_updated_at 
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_images_updated_at 
  BEFORE UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 5.2 Trigger para crear perfil al registrarse
-- ====================================================================
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5.3 Triggers para auto-limpieza de storage
-- ====================================================================
CREATE TRIGGER on_product_image_deleted
  AFTER DELETE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION delete_product_image_from_storage();

CREATE TRIGGER on_product_image_changed
  AFTER UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION delete_product_main_image_from_storage();

CREATE TRIGGER on_store_logo_changed
  AFTER UPDATE OR DELETE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION delete_store_logo_from_storage();

CREATE TRIGGER on_store_banner_changed
  AFTER UPDATE OR DELETE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION delete_store_banner_from_storage();


-- ====================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;


-- 6.1 Políticas para PROFILES
-- ====================================================================
CREATE POLICY "Perfiles públicos" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Editar propio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);


-- 6.2 Políticas para STORES
-- ====================================================================
CREATE POLICY "Ver tiendas activas" 
  ON public.stores FOR SELECT 
  USING (is_active = true AND deleted_at IS NULL);

CREATE POLICY "Ver mi tienda" 
  ON public.stores FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id OR is_admin_or_mod());

CREATE POLICY "Gestionar mi tienda" 
  ON public.stores FOR ALL 
  USING (auth.uid() = user_id OR is_admin_or_mod());


-- 6.3 Políticas para CATEGORIES
-- ====================================================================
CREATE POLICY "Ver categorías" 
  ON public.categories FOR SELECT 
  USING (true);

CREATE POLICY "Gestionar categorías" 
  ON public.categories FOR ALL 
  USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = categories.store_id) 
    OR is_admin_or_mod()
  );


-- 6.4 Políticas para PRODUCTS
-- ====================================================================
CREATE POLICY "Ver productos activos" 
  ON public.products FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Ver mis productos" 
  ON public.products FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = products.store_id)
  );

CREATE POLICY "Insertar mis productos" 
  ON public.products FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = products.store_id)
  );

CREATE POLICY "Actualizar mis productos" 
  ON public.products FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = products.store_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = products.store_id)
  );

CREATE POLICY "Eliminar mis productos" 
  ON public.products FOR DELETE 
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = products.store_id)
  );

CREATE POLICY "Admins gestionan productos" 
  ON public.products FOR ALL 
  TO authenticated
  USING (is_admin_or_mod())
  WITH CHECK (is_admin_or_mod());


-- 6.5 Políticas para PRODUCT_VARIANTS
-- ====================================================================
CREATE POLICY "Ver variantes de productos activos" 
  ON public.product_variants FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_variants.product_id 
      AND products.is_active = true
    )
  );

CREATE POLICY "Ver mis variantes" 
  ON public.product_variants FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_variants.product_id
    )
  );

CREATE POLICY "Insertar variantes en mis productos" 
  ON public.product_variants FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_variants.product_id
    ) OR is_admin_or_mod()
  );

CREATE POLICY "Actualizar mis variantes" 
  ON public.product_variants FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_variants.product_id
    ) OR is_admin_or_mod()
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_variants.product_id
    ) OR is_admin_or_mod()
  );

CREATE POLICY "Eliminar mis variantes" 
  ON public.product_variants FOR DELETE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_variants.product_id
    ) OR is_admin_or_mod()
  );


-- 6.6 Políticas para PRODUCT_IMAGES
-- ====================================================================
CREATE POLICY "Ver imagenes de productos activos" 
  ON public.product_images FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.products 
      WHERE products.id = product_images.product_id 
      AND products.is_active = true
    )
  );

CREATE POLICY "Ver mis imagenes" 
  ON public.product_images FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_images.product_id
    )
  );

CREATE POLICY "Insertar imagenes en mis productos" 
  ON public.product_images FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_images.product_id
    ) OR is_admin_or_mod()
  );

CREATE POLICY "Actualizar mis imagenes" 
  ON public.product_images FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_images.product_id
    ) OR is_admin_or_mod()
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_images.product_id
    ) OR is_admin_or_mod()
  );

CREATE POLICY "Eliminar mis imagenes" 
  ON public.product_images FOR DELETE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT stores.user_id 
      FROM public.stores 
      JOIN public.products ON products.store_id = stores.id
      WHERE products.id = product_images.product_id
    ) OR is_admin_or_mod()
  );


-- ====================================================================
-- 7. POLÍTICAS DE STORAGE (bucket: store-images)
-- ====================================================================
-- NOTA: Ejecuta estas políticas en el SQL Editor de Supabase
-- Si ya tienes políticas para store-images, elimínalas primero desde el dashboard

CREATE POLICY "allow_authenticated_uploads"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'store-images');

CREATE POLICY "allow_public_reads"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'store-images');

CREATE POLICY "allow_authenticated_updates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'store-images')
  WITH CHECK (bucket_id = 'store-images');

CREATE POLICY "allow_authenticated_deletes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'store-images');


-- ====================================================================
-- FIN DEL SCRIPT
-- ====================================================================

-- ====================================================================
-- COMANDOS DE VERIFICACIÓN (Descomenta para ejecutar)
-- ====================================================================

-- Ver todas las tablas
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Ver todas las políticas RLS
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;

-- Ver todos los índices
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Ver todos los triggers
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY event_object_table;

-- Ver todas las funciones personalizadas
-- SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;
