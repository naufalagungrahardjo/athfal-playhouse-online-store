
-- Create users table for storing user information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some test users
INSERT INTO users (email, name, password) 
VALUES 
('user1@example.com', 'User One', 'hashed_password1'),
('user2@example.com', 'User Two', 'hashed_password2')
ON CONFLICT DO NOTHING;
