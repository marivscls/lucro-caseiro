ALTER TABLE video_scenes
ADD COLUMN IF NOT EXISTS movement_plan jsonb NOT NULL DEFAULT '{}'::jsonb;
