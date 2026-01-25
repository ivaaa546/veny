-- =====================================================
-- SCRIPT: Agregar columnas de dirección detallada a orders
-- Fecha: Enero 2026
-- Descripción: Agrega campos para dirección de Guatemala
--              (departamento, municipio, zona, referencia, lugar de entrega)
-- =====================================================

-- Agregar columnas nuevas a la tabla orders
-- Estas columnas son opcionales para mantener compatibilidad con pedidos anteriores

-- Apellido del cliente
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_last_name TEXT;

-- Departamento de Guatemala
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_department TEXT;

-- Municipio
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_municipality TEXT;

-- Zona (ej: Zona 10)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_zone TEXT;

-- Punto de referencia
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_reference TEXT;

-- Lugar de entrega: casa, trabajo, otro
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_place TEXT;

-- Método del pedido: whatsapp, email (para futuro)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_method TEXT DEFAULT 'whatsapp';

-- Comentarios sobre las columnas
COMMENT ON COLUMN orders.customer_last_name IS 'Apellido del cliente';
COMMENT ON COLUMN orders.customer_department IS 'Departamento de Guatemala';
COMMENT ON COLUMN orders.customer_municipality IS 'Municipio del departamento';
COMMENT ON COLUMN orders.customer_zone IS 'Zona de la ciudad (ej: Zona 10)';
COMMENT ON COLUMN orders.customer_reference IS 'Punto de referencia para la entrega';
COMMENT ON COLUMN orders.delivery_place IS 'Tipo de lugar: casa, trabajo, otro';
COMMENT ON COLUMN orders.order_method IS 'Método de pedido: whatsapp o email';

-- Crear índices para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_orders_department ON orders(customer_department);
CREATE INDEX IF NOT EXISTS idx_orders_municipality ON orders(customer_municipality);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_place ON orders(delivery_place);

-- =====================================================
-- VERIFICACIÓN
-- Ejecuta esto para verificar que las columnas existen:
-- =====================================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- AND column_name IN (
--     'customer_last_name', 
--     'customer_department', 
--     'customer_municipality', 
--     'customer_zone', 
--     'customer_reference', 
--     'delivery_place',
--     'order_method'
-- );
