INSERT INTO feature_flags (key, enabled, label)
VALUES ('section_hipoteca', true, 'Hipoteca')
ON CONFLICT (key) DO NOTHING;
