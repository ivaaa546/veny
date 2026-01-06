-- Función RPC para crear un pedido y sus items de forma atómica y segura
-- Se ejecuta con privilegios de SECURITY DEFINER (bypass RLS)

CREATE OR REPLACE FUNCTION public.create_new_order(
    p_store_id uuid,
    p_total numeric,
    p_customer_name text,
    p_customer_phone text,
    p_customer_address text,
    p_items jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    item jsonb;
BEGIN
    -- 1. Insertar el pedido
    INSERT INTO public.orders (
        store_id,
        total,
        status,
        customer_name,
        customer_phone,
        customer_address
    ) VALUES (
        p_store_id,
        p_total,
        'pending',
        p_customer_name,
        p_customer_phone,
        p_customer_address
    )
    RETURNING id INTO v_order_id;

    -- 2. Insertar los items
    -- p_items debe ser un array de objetos JSON: 
    -- [{"product_id": "...", "product_title": "...", "quantity": 1, "price": 10.00, "variant_info": "..."}]
    
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_title,
            quantity,
            price,
            variant_info
        ) VALUES (
            v_order_id,
            (item->>'product_id')::uuid,
            item->>'product_title',
            (item->>'quantity')::int,
            (item->>'price')::numeric,
            item->>'variant_info'
        );
    END LOOP;

    RETURN v_order_id;
END;
$$;
