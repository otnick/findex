-- Simple Migration: Just add catch_photos table
-- Use this if you don't have a 'photo' column in catches yet
-- or if you want to skip the data migration

-- Create catch_photos table
CREATE TABLE IF NOT EXISTS catch_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catch_id UUID NOT NULL REFERENCES catches(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_catch_photos_catch_id ON catch_photos(catch_id);
CREATE INDEX IF NOT EXISTS idx_catch_photos_order ON catch_photos(catch_id, order_index);

-- Enable RLS
ALTER TABLE catch_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
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

-- Done!
RAISE NOTICE 'catch_photos table created successfully with RLS policies!';
