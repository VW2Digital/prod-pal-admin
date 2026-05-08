CREATE POLICY "Admins can view all addresses" ON public.addresses FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert any address" ON public.addresses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all addresses" ON public.addresses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete all addresses" ON public.addresses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));