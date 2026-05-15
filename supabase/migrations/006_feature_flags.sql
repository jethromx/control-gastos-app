-- Feature flags — admin-controlled section toggles
CREATE TABLE public.feature_flags (
  key        text PRIMARY KEY,
  enabled    boolean NOT NULL DEFAULT true,
  label      text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default flags
INSERT INTO public.feature_flags (key, label, enabled) VALUES
  ('section_otros',     'Sección: Otros proyectos', false),
  ('section_afore',     'Sección: AFORE',            true),
  ('section_fondos',    'Sección: Fondos',            true),
  ('section_terrenos',  'Sección: Terrenos',          true),
  ('section_briq',      'Sección: Briq',              true);

-- Trigger for updated_at
CREATE TRIGGER set_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: everyone reads, only admins write
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read feature_flags" ON public.feature_flags
  FOR SELECT USING (true);

CREATE POLICY "Admins can update feature_flags" ON public.feature_flags
  FOR UPDATE USING (public.is_admin());
