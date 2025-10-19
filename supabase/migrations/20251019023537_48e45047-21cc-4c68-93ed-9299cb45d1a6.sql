-- Add usage quota fields to promo_codes table
ALTER TABLE promo_codes 
ADD COLUMN usage_limit INTEGER DEFAULT NULL,
ADD COLUMN usage_count INTEGER DEFAULT 0 NOT NULL;

-- Add check constraint to ensure usage_count doesn't exceed usage_limit
ALTER TABLE promo_codes 
ADD CONSTRAINT check_usage_limit 
CHECK (usage_limit IS NULL OR usage_count <= usage_limit);

COMMENT ON COLUMN promo_codes.usage_limit IS 'Maximum number of times this promo code can be used. NULL means unlimited.';
COMMENT ON COLUMN promo_codes.usage_count IS 'Number of times this promo code has been used.';