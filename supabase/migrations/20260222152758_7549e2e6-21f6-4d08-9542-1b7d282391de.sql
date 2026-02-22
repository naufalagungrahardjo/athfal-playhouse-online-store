UPDATE products SET category = 'firststep' WHERE category = 'First Step';

NOTIFY pgrst, 'reload schema';