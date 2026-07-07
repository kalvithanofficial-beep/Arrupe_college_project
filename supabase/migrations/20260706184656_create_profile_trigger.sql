/*
# Auto-create profile on auth user signup

## Overview
Creates a database trigger that automatically inserts a row into `public.profiles` whenever a new user is created in `auth.users`. The profile's `role` and `full_name` are read from the user's `raw_user_meta_data` (set during signUp). If no role is specified, defaults to 'teacher'.

## Security
- The trigger function is SECURITY DEFINER so it can insert into public.profiles even though the new user doesn't yet have an established session.
- This bypasses RLS on insert, which is necessary because the profile must exist before the user can authenticate.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
