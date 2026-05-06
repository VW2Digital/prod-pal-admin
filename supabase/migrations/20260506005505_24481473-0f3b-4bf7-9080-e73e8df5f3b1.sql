CREATE TABLE public.gateway_fallback_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  order_id uuid,
  customer_email text,
  customer_name text,
  payment_method text,
  amount numeric,
  original_gateway text NOT NULL,
  fallback_gateway text NOT NULL,
  reason text,
  outcome text NOT NULL DEFAULT 'attempted',
  outcome_message text,
  metadata jsonb
);

CREATE INDEX gateway_fallback_logs_created_at_idx ON public.gateway_fallback_logs (created_at DESC);
CREATE INDEX gateway_fallback_logs_original_idx ON public.gateway_fallback_logs (original_gateway);
CREATE INDEX gateway_fallback_logs_fallback_idx ON public.gateway_fallback_logs (fallback_gateway);

ALTER TABLE public.gateway_fallback_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert fallback logs"
ON public.gateway_fallback_logs
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can view fallback logs"
ON public.gateway_fallback_logs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete fallback logs"
ON public.gateway_fallback_logs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));