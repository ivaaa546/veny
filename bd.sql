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
-- 8. SISTEMA DE ÓRDENES
-- ====================================================================

-- 8.1 ORDERS (Pedidos)
-- ====================================================================
CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  customer_last_name text,
  customer_department text,
  customer_municipality text,
  customer_zone text,
  customer_reference text,
  delivery_place text CHECK (delivery_place IS NULL OR delivery_place IN ('casa', 'trabajo', 'otro')),
  order_method text DEFAULT 'whatsapp' CHECK (order_method IN ('whatsapp', 'email', 'web')),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Comentarios de columnas
COMMENT ON TABLE public.orders IS 'Pedidos realizados por clientes en las tiendas';
COMMENT ON COLUMN public.orders.customer_last_name IS 'Apellido del cliente';
COMMENT ON COLUMN public.orders.customer_department IS 'Departamento de Guatemala';
COMMENT ON COLUMN public.orders.customer_municipality IS 'Municipio del departamento';
COMMENT ON COLUMN public.orders.customer_zone IS 'Zona de la ciudad (ej: Zona 10)';
COMMENT ON COLUMN public.orders.customer_reference IS 'Punto de referencia para la entrega';
COMMENT ON COLUMN public.orders.delivery_place IS 'Tipo de lugar: casa, trabajo, otro';
COMMENT ON COLUMN public.orders.order_method IS 'Método de pedido: whatsapp, email o web';


-- 8.2 ORDER_ITEMS (Items de pedidos)
-- ====================================================================
CREATE TABLE public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  variant_info text,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT NOW()
);

COMMENT ON TABLE public.order_items IS 'Productos incluidos en cada pedido';


-- 8.3 Índices para órdenes
-- ====================================================================
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_department ON public.orders(customer_department);
CREATE INDEX idx_orders_municipality ON public.orders(customer_municipality);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);


-- 8.4 Trigger para updated_at en orders
-- ====================================================================
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 8.5 Función RPC para crear pedidos de forma segura
-- ====================================================================
CREATE OR REPLACE FUNCTION public.create_new_order(
  p_store_id uuid,
  p_total numeric,
  p_customer_name text,
  p_customer_phone text DEFAULT NULL,
  p_customer_address text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid AS $$
DECLARE
  new_order_id uuid;
  item jsonb;
BEGIN
  -- Verificar que la tienda existe y está activa
  IF NOT EXISTS (
    SELECT 1 FROM public.stores 
    WHERE id = p_store_id 
    AND is_active = true 
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Tienda no encontrada o inactiva';
  END IF;

  -- Insertar la orden
  INSERT INTO public.orders (store_id, total, customer_name, customer_phone, customer_address)
  VALUES (p_store_id, p_total, p_customer_name, p_customer_phone, p_customer_address)
  RETURNING id INTO new_order_id;

  -- Insertar los items del pedido
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, product_title, variant_info, quantity, price)
    VALUES (
      new_order_id,
      (item->>'product_id')::uuid,
      item->>'product_title',
      item->>'variant_info',
      (item->>'quantity')::integer,
      (item->>'price')::numeric
    );
  END LOOP;

  RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_new_order IS 'Crea un nuevo pedido con sus items de forma atómica';


-- 8.6 RLS para órdenes
-- ====================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Políticas para ORDERS
-- Cualquier persona puede crear pedidos (checkout público)
CREATE POLICY "Crear pedidos" 
  ON public.orders FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Vendedores ven solo los pedidos de su tienda
CREATE POLICY "Ver mis pedidos" 
  ON public.orders FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = orders.store_id)
    OR is_admin_or_mod()
  );

-- Vendedores pueden actualizar pedidos de su tienda (cambiar estado)
CREATE POLICY "Actualizar mis pedidos" 
  ON public.orders FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = orders.store_id)
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.stores WHERE id = orders.store_id)
  );

-- Admins pueden gestionar todos los pedidos
CREATE POLICY "Admins gestionan pedidos" 
  ON public.orders FOR ALL 
  TO authenticated
  USING (is_admin_or_mod())
  WITH CHECK (is_admin_or_mod());

-- Políticas para ORDER_ITEMS
-- Insertar items (se hace via RPC, pero por si acaso)
CREATE POLICY "Crear items de pedido" 
  ON public.order_items FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Ver items de pedidos de mi tienda
CREATE POLICY "Ver items de mis pedidos" 
  ON public.order_items FOR SELECT 
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE auth.uid() IN (SELECT user_id FROM public.stores WHERE id = orders.store_id)
    )
    OR is_admin_or_mod()
  );


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
