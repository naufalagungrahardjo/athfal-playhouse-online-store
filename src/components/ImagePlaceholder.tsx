
import { Upload } from 'lucide-react';

export const ImagePlaceholder = () => {
  return (
    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">Upload an image or add URL</p>
    </div>
  );
};
