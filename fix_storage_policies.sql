
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes" ON storage.objects;

-- Create more permissive policies for the images bucket
CREATE POLICY "Anyone can upload images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Anyone can view images" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Anyone can update images" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Anyone can delete images" ON storage.objects
FOR DELETE USING (bucket_id = 'images');
