DROP POLICY IF EXISTS "Admins manage resellers" ON public.resellers;

CREATE POLICY "Admins manage resellers"
  ON public.resellers
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS touch_resellers_updated_at ON public.resellers;

CREATE TRIGGER touch_resellers_updated_at
BEFORE UPDATE ON public.resellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();