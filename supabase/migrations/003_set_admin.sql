-- Set jethro.gutierrez@gmail.com as admin
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'jethro.gutierrez@gmail.com'
);
