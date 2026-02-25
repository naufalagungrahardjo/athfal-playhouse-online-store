-- Create trigger on auth.users to sync new users (including SSO) to public.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_new_auth_user();