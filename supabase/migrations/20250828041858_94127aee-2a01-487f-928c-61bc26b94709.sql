-- Grant necessary table privileges for guest and authenticated users
GRANT INSERT ON orders TO anon;
GRANT INSERT ON orders TO authenticated;
GRANT INSERT ON order_items TO anon; 
GRANT INSERT ON order_items TO authenticated;

-- Also ensure SELECT privileges for order details page
GRANT SELECT ON orders TO anon;
GRANT SELECT ON orders TO authenticated;
GRANT SELECT ON order_items TO anon;
GRANT SELECT ON order_items TO authenticated;