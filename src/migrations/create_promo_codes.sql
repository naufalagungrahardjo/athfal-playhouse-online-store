
-- Create promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_percentage, description, is_active, valid_until) 
VALUES 
('TEST10', 10, '10% discount on all products', true, NOW() + INTERVAL '30 days'),
('TEST50', 50, '50% discount on all products', true, NOW() + INTERVAL '7 days')
ON CONFLICT DO NOTHING;
