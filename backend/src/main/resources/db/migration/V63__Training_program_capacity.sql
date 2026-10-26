-- How many people a training program can take. Programs created before this have no limit (NULL).
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS max_participants INTEGER NULL;
