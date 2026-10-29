CREATE TABLE public.store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'Minha Loja',
  logo_url text NOT NULL DEFAULT '',
  banner_url text NOT NULL DEFAULT '',
  followers text NOT NULL DEFAULT '+48,5 mil',
  products_label text NOT NULL DEFAULT '+5mil',
  sales_label text NOT NULL DEFAULT '+500 mil',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads store settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manages store settings" ON public.store_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.store_settings (id) VALUES (1);