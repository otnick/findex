-- Migration: Multiple Photos per Catch
-- This adds support for multiple photos per catch instead of just one

-- Step 1: Ensure photo_url column exists in catches (should already be there)
-- The column is called photo_url, not photo!
ALTER TABLE catches ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Step 2: Create catch_photos table
CREATE TABLE IF NOT EXISTS catch_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_catch_photos_catch_id ON catch_photos(catch_id);
CREATE INDEX IF NOT EXISTS idx_catch_photos_order ON catch_photos(catch_id, order_index);

-- Enable RLS
ALTER TABLE catch_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for catch_photos
DROP POLICY IF EXISTS "Users can view photos of their catches" ON catch_photos;
CREATE POLICY "Users can view photos of their catches"
  ON catch_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM catches 
      WHERE catches.id = catch_photos.catch_id 
      AND catches.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view photos of public catches" ON catch_photos;
CREATE POLICY "Users can view photos of public catches"
  ON catch_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM catches 
      WHERE catches.id = catch_photos.catch_id 
      AND catches.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users can insert photos for their catches" ON catch_photos;
CREATE POLICY "Users can insert photos for their catches"
  ON catch_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM catches 
      WHERE catches.id = catch_photos.catch_id 
      AND catches.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update photos of their catches" ON catch_photos;
CREATE POLICY "Users can update photos of their catches"
  ON catch_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM catches 
      WHERE catches.id = catch_photos.catch_id 
      AND catches.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete photos of their catches" ON catch_photos;
CREATE POLICY "Users can delete photos of their catches"
  ON catch_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM catches 
      WHERE catches.id = catch_photos.catch_id 
      AND catches.user_id = auth.uid()
    )
  );

-- Step 3: Migrate existing photos from catches.photo_url to catch_photos
-- This preserves the existing single photo per catch
INSERT INTO catch_photos (catch_id, photo_url, order_index)
SELECT id, photo_url, 0
FROM catches
WHERE photo_url IS NOT NULL AND photo_url != ''
ON CONFLICT DO NOTHING;

-- Step 4: Create function to update catches.photo_url with first photo from catch_photos
CREATE OR REPLACE FUNCTION update_catch_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the catches table with the first photo (lowest order_index)
  UPDATE catches
  SET photo_url = (
    SELECT photo_url 
    FROM catch_photos 
    WHERE catch_id = COALESCE(NEW.catch_id, OLD.catch_id)
    ORDER BY order_index 
    LIMIT 1
  )
  WHERE id = COALESCE(NEW.catch_id, OLD.catch_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to keep catches.photo_url in sync
DROP TRIGGER IF EXISTS sync_catch_primary_photo ON catch_photos;
CREATE TRIGGER sync_catch_primary_photo
  AFTER INSERT OR UPDATE OR DELETE ON catch_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_catch_primary_photo();

-- Storage bucket for photos (if not exists)
-- Note: Run this in Supabase Storage UI if bucket doesn't exist yet
/*
Bucket name: catch-photos
Public: Yes

Storage policies (run in SQL Editor):

INSERT POLICY:
CREATE POLICY "Users can upload catch photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'catch-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

SELECT POLICY:
CREATE POLICY "Users can view catch photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catch-photos');

UPDATE POLICY:
CREATE POLICY "Users can update their catch photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'catch-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DELETE POLICY:
CREATE POLICY "Users can delete their catch photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'catch-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
*/

COMMENT ON TABLE catch_photos IS 'Multiple photos per catch with ordering support';
COMMENT ON COLUMN catch_photos.order_index IS 'Order of photo in the catch gallery (0 = primary)';
COMMENT ON COLUMN catches.photo_url IS 'Primary/first photo for backward compatibility and quick access';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Multiple photos migration completed successfully!';
  RAISE NOTICE 'catch_photos table created with RLS policies';
  RAISE NOTICE 'Existing photos migrated from catches.photo_url to catch_photos table';
  RAISE NOTICE 'Sync trigger installed to keep catches.photo_url updated';
  RAISE NOTICE 'You can now upload multiple photos per catch!';
END $$;
