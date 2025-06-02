
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const CreateImagesBucket = () => {
  const { toast } = useToast();

  useEffect(() => {
    const createBucket = async () => {
      try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const imagesBucketExists = buckets?.some(bucket => bucket.id === 'images');

        if (!imagesBucketExists) {
          console.log('Creating images bucket...');
          
          // Create the bucket
          const { error } = await supabase.storage.createBucket('images', {
            public: true,
            allowedMimeTypes: ['image/*'],
            fileSizeLimit: 5242880 // 5MB
          });

          if (error) {
            console.error('Error creating bucket:', error);
          } else {
            console.log('Images bucket created successfully');
          }
        }
      } catch (error) {
        console.error('Error checking/creating bucket:', error);
      }
    };

    createBucket();
  }, []);

  return null; // This component doesn't render anything
};
