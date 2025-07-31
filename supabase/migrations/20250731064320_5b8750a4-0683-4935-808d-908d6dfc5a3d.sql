-- Add public read access to active payment methods for checkout
CREATE POLICY "Public can view active payment methods" 
ON payment_methods 
FOR SELECT 
USING (active = true);