
CREATE TABLE public.gateway_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway text NOT NULL CHECK (gateway IN ('asaas','mercadopago','pagbank','pagarme')),
  label text NOT NULL,
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox','production')),
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX gateway_accounts_one_primary_per_gateway
  ON public.gateway_accounts (gateway) WHERE is_primary = true;

CREATE INDEX gateway_accounts_gateway_active_idx
  ON public.gateway_accounts (gateway, active);

ALTER TABLE public.gateway_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view gateway accounts"
  ON public.gateway_accounts FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert gateway accounts"
  ON public.gateway_accounts FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update gateway accounts"
  ON public.gateway_accounts FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete gateway accounts"
  ON public.gateway_accounts FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER gateway_accounts_updated_at
  BEFORE UPDATE ON public.gateway_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS gateway_account_id uuid;

CREATE OR REPLACE FUNCTION public.pick_next_gateway_account(_gateway text)
RETURNS public.gateway_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.gateway_accounts;
BEGIN
  SELECT * INTO _row
  FROM public.gateway_accounts
  WHERE gateway = _gateway AND active = true
  ORDER BY last_used_at ASC NULLS FIRST, sort_order ASC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF _row.id IS NOT NULL THEN
    UPDATE public.gateway_accounts
      SET last_used_at = now()
      WHERE id = _row.id;
    _row.last_used_at := now();
  END IF;

  RETURN _row;
END;
$$;
