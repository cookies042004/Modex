-- doctors
CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  speciality TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- slots (for appointments)
CREATE TABLE IF NOT EXISTS slots (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);

-- booking status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');
  END IF;
END$$;

-- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER REFERENCES slots(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_contact TEXT,
  status booking_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_slots_doctor_start ON slots(doctor_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_status ON bookings(slot_id, status);
