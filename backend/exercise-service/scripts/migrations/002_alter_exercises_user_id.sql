ALTER TABLE exercises
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;
