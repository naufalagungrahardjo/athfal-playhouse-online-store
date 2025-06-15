
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock } from "lucide-react";
import { Product } from "@/contexts/CartContext";

interface ProductTabsProps {
  product: Product;
  language: string;
  formatCurrency: (amount: number) => string;
}

const ProductTabs: React.FC<ProductTabsProps> = ({ product, language, formatCurrency }) => (
  <div className="mt-16">
    <Tabs defaultValue="description">
      <TabsList className="w-full justify-start border-b">
        <TabsTrigger value="description" className="px-8">
          {language === 'id' ? 'Deskripsi' : 'Description'}
        </TabsTrigger>
        <TabsTrigger value="details" className="px-8">
          {language === 'id' ? 'Detail' : 'Details'}
        </TabsTrigger>
        <TabsTrigger value="schedule" className="px-8">
          {language === 'id' ? 'Jadwal' : 'Schedule'}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="py-6">
        <div className="prose max-w-none">
          <p className="mb-4">{product.description}</p>
        </div>
      </TabsContent>
      <TabsContent value="details" className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-athfal-pink">{language === 'id' ? 'Informasi Produk' : 'Product Information'}</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="font-medium text-gray-700 w-32">{language === 'id' ? 'Nama' : 'Name'}:</span>
                <span className="text-gray-600">{product.name}</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 w-32">{language === 'id' ? 'Kategori' : 'Category'}:</span>
                <span className="text-gray-600">
                  {product.category === 'pop-up-class' ? 'Pop Up Class' :
                    product.category === 'bumi-class' ? 'Bumi Class' :
                    product.category === 'tahsin-class' ? 'Tahsin Class' :
                    product.category === 'play-kit' ? 'Play Kit' :
                    product.category === 'consultation' ? 'Psychological Consultation' :
                    'Merchandise & Others'}
                </span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 w-32">{language === 'id' ? 'Stok' : 'Stock'}:</span>
                <span className="text-gray-600">{product.stock}</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-3 text-athfal-pink">{language === 'id' ? 'Informasi Harga' : 'Price Information'}</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="font-medium text-gray-700 w-32">{language === 'id' ? 'Harga' : 'Price'}:</span>
                <span className="text-gray-600">{formatCurrency(product.price)}</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 w-32">{language === 'id' ? 'Pajak' : 'Tax'}:</span>
                <span className="text-gray-600">{product.tax}%</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium text-gray-700 w-32">{language === 'id' ? 'Total (1 item)' : 'Total (1 item)'}:</span>
                <span className="text-gray-600">{formatCurrency(product.price + (product.price * product.tax / 100))}</span>
              </li>
            </ul>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="schedule" className="py-6">
        {product.category.includes('class') ? (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg mb-3 text-athfal-pink">{language === 'id' ? 'Jadwal Kelas' : 'Class Schedule'}</h3>
            <div className="bg-athfal-peach/10 rounded-xl p-4 flex items-start">
              <Calendar className="text-athfal-pink mr-3 mt-1" />
              <div>
                <p className="font-medium">{language === 'id' ? 'Hari' : 'Day'}: Senin & Rabu</p>
                <p className="text-gray-600">{language === 'id' ? 'Waktu' : 'Time'}: 10:00 - 11:30 WIB</p>
              </div>
            </div>
            <div className="bg-athfal-peach/10 rounded-xl p-4 flex items-start">
              <Calendar className="text-athfal-pink mr-3 mt-1" />
              <div>
                <p className="font-medium">{language === 'id' ? 'Hari' : 'Day'}: Selasa & Kamis</p>
                <p className="text-gray-600">{language === 'id' ? 'Waktu' : 'Time'}: 15:00 - 16:30 WIB</p>
              </div>
            </div>
            <div className="bg-athfal-peach/10 rounded-xl p-4 flex items-start">
              <Clock className="text-athfal-pink mr-3 mt-1" />
              <div>
                <p className="font-medium">{language === 'id' ? 'Durasi' : 'Duration'}: 8 {language === 'id' ? 'pertemuan' : 'meetings'}</p>
                <p className="text-gray-600">{language === 'id' ? 'Mulai' : 'Starts'}: 1 Juni 2023</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">
            {language === 'id'
              ? 'Tidak ada informasi jadwal untuk produk ini.'
              : 'No schedule information for this product.'}
          </p>
        )}
      </TabsContent>
    </Tabs>
  </div>
);

export default ProductTabs;
