-- Añadir columnas para redes sociales en la tabla de tiendas
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text;

-- Validaciones básicas de formato URL (opcional)
ALTER TABLE public.stores
ADD CONSTRAINT check_instagram_url_format CHECK (instagram_url IS NULL OR instagram_url ~* '^https?://'),
ADD CONSTRAINT check_facebook_url_format CHECK (facebook_url IS NULL OR facebook_url ~* '^https?://'),
ADD CONSTRAINT check_tiktok_url_format CHECK (tiktok_url IS NULL OR tiktok_url ~* '^https?://');
