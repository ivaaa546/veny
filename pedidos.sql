-- ====================================================================
-- TABLAS DE PEDIDOS PARA VENY
-- ====================================================================

-- 1. TABLA DE PEDIDOS (Encabezado)
CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text DEFAULT 'pending', -- pending, completed, cancelled
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- 2. DETALLE DEL PEDIDO (Productos comprados)
CREATE TABLE public.order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_title text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  variant_info text,
  created_at timestamptz DEFAULT NOW()
);

-- 3. ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- 4. TRIGGER PARA ACTUALIZAR FECHA DE MODIFICACIÓN
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. SEGURIDAD (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Los vendedores solo ven pedidos de su propia tienda
CREATE POLICY "Vendedores ven sus pedidos" 
  ON public.orders FOR SELECT 
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.stores WHERE id = orders.store_id));

CREATE POLICY "Vendedores ven items de sus pedidos" 
  ON public.order_items FOR SELECT 
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders 
    JOIN public.stores ON stores.id = orders.store_id
    WHERE orders.id = order_items.order_id AND stores.user_id = auth.uid()
  ));

-- Permitir que cualquier cliente inserte pedidos (público)
CREATE POLICY "Clientes pueden crear pedidos" 
  ON public.orders FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Clientes pueden crear items de pedido" 
  ON public.order_items FOR INSERT 
  WITH CHECK (true);
