-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS prospects (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name            text NOT NULL,
  address               text,
  city                  text,
  state                 text,
  zip                   text,
  liquor_license_number text NOT NULL,
  license_type          text CHECK (license_type IN ('on_premise', 'off_premise')),
  phone                 text,
  created_at            timestamptz DEFAULT now(),
  CONSTRAINT prospects_license_number_unique UNIQUE (liquor_license_number)
);

CREATE INDEX IF NOT EXISTS prospects_license_type_idx   ON prospects (license_type);
CREATE INDEX IF NOT EXISTS prospects_city_idx           ON prospects (lower(city));
CREATE INDEX IF NOT EXISTS prospects_store_name_idx     ON prospects (lower(store_name));
