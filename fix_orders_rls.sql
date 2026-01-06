-- Permitir a los vendedores actualizar el estado de sus pedidos
CREATE POLICY "Vendedores gestionan sus pedidos" 
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() IN (SELECT user_id FROM public.stores WHERE id = orders.store_id))
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.stores WHERE id = orders.store_id));
