
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronDown, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2,
  Eye
} from 'lucide-react';
import { ProductCategory } from '@/contexts/CartContext';

// Mock products data
const MOCK_PRODUCTS = [
  {
    id: 'pop1',
    name: 'Pop Up Class - Usia 2-3 Tahun',
    description: 'Kelas untuk anak usia 2-3 tahun yang menyenangkan dan edukatif',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1588075592405-d68745302891',
    category: 'pop-up-class' as ProductCategory,
    tax: 11,
    stock: 10,
  },
  {
    id: 'pop2',
    name: 'Pop Up Class - Usia 4-5 Tahun',
    description: 'Kelas untuk anak usia 4-5 tahun dengan aktivitas yang lebih kompleks',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1543087903-1ac2ec7aa8c5',
    category: 'pop-up-class' as ProductCategory,
    tax: 11,
    stock: 8,
  },
  {
    id: 'bumi1',
    name: 'Bumi Class: Mengenal Alam',
    description: 'Kelas belajar mengenal alam untuk anak-anak',
    price: 300000,
    image: 'https://images.unsplash.com/photo-1590592006475-d0264ad1ee92',
    category: 'bumi-class' as ProductCategory,
    tax: 11,
    stock: 10,
  },
  {
    id: 'kit1',
    name: 'Play Kit - Alphabet Fun',
    description: 'Kit bermain sambil belajar alfabet untuk anak',
    price: 199000,
    image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b',
    category: 'play-kit' as ProductCategory,
    tax: 11,
    stock: 20,
  },
  {
    id: 'consult1',
    name: 'Konsultasi Anak 60 Menit',
    description: 'Sesi konsultasi psikologi anak dengan ahli',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1516733968668-dbdce39c4651',
    category: 'consultation' as ProductCategory,
    tax: 11,
    stock: 5,
  },
];

// Product form type
interface ProductFormData {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: ProductCategory;
  tax: number;
  stock: number;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Format category name
const formatCategoryName = (category: ProductCategory) => {
  switch (category) {
    case 'pop-up-class':
      return 'Pop Up Class';
    case 'bumi-class':
      return 'Bumi Class';
    case 'tahsin-class':
      return 'Tahsin Class';
    case 'play-kit':
      return 'Play Kit';
    case 'consultation':
      return 'Psychological Consultation';
    case 'merchandise':
      return 'Merchandise & Others';
    default:
      return category;
  }
};

const AdminProducts = () => {
  const [products, setProducts] = useState<ProductFormData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Empty product form
  const emptyProduct: ProductFormData = {
    id: '',
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'pop-up-class',
    tax: 11,
    stock: 0,
  };

  // Fetch products (simulation)
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handle adding a new product
  const handleAddNewProduct = () => {
    setCurrentProduct(emptyProduct);
    setIsEditing(false);
    setShowAddEditModal(true);
  };

  // Handle edit product
  const handleEditProduct = (product: ProductFormData) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setShowAddEditModal(true);
  };

  // Handle delete product
  const handleDeleteProduct = (product: ProductFormData) => {
    setCurrentProduct(product);
    setShowDeleteModal(true);
  };

  // Handle view product
  const handleViewProduct = (productId: string) => {
    window.open(`/product/${productId}`, '_blank');
  };

  // Handle save product (create or update)
  const handleSaveProduct = (formData: ProductFormData) => {
    if (isEditing) {
      // Update existing product
      const updatedProducts = products.map(p => 
        p.id === formData.id ? formData : p
      );
      setProducts(updatedProducts);
      toast({
        title: "Product updated",
        description: `${formData.name} has been updated successfully.`,
      });
    } else {
      // Add new product
      const newProduct = {
        ...formData,
        id: `prod-${Math.random().toString(36).substring(2, 9)}`,
      };
      setProducts([...products, newProduct]);
      toast({
        title: "Product added",
        description: `${newProduct.name} has been added successfully.`,
      });
    }
    setShowAddEditModal(false);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (currentProduct) {
      const updatedProducts = products.filter(p => p.id !== currentProduct.id);
      setProducts(updatedProducts);
      toast({
        title: "Product deleted",
        description: `${currentProduct.name} has been deleted successfully.`,
        variant: "destructive",
      });
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Products</h2>
          <p className="text-gray-500 mt-1">Manage your product inventory</p>
        </div>
        <Button 
          onClick={handleAddNewProduct}
          className="mt-4 md:mt-0 bg-athfal-pink hover:bg-athfal-pink/80 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Product
        </Button>
      </div>

      {/* Product filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[180px]" aria-label="Filter by category">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by category" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="pop-up-class">Pop Up Class</SelectItem>
              <SelectItem value="bumi-class">Bumi Class</SelectItem>
              <SelectItem value="tahsin-class">Tahsin Class</SelectItem>
              <SelectItem value="play-kit">Play Kit</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="merchandise">Merchandise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Image</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Category</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Tax</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Stock</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b">
                      <td className="px-4 py-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-md object-cover"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatCategoryName(product.category)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-right">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-right">{product.tax}%</td>
                      <td className="px-4 py-3 text-gray-600 text-right">{product.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProduct(product.id)}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Add/Edit Modal */}
      {showAddEditModal && currentProduct && (
        <Dialog open={showAddEditModal} onOpenChange={setShowAddEditModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? `Edit Product: ${currentProduct.name}` : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                Fill in the product details below. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details & Pricing</TabsTrigger>
              </TabsList>
              <TabsContent value="basic">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={currentProduct.name}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        name: e.target.value
                      })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={currentProduct.category}
                      onValueChange={(value) => setCurrentProduct({
                        ...currentProduct,
                        category: value as ProductCategory
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pop-up-class">Pop Up Class</SelectItem>
                        <SelectItem value="bumi-class">Bumi Class</SelectItem>
                        <SelectItem value="tahsin-class">Tahsin Class</SelectItem>
                        <SelectItem value="play-kit">Play Kit</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="merchandise">Merchandise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={currentProduct.description}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        description: e.target.value
                      })}
                      placeholder="Enter product description"
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image">Image URL *</Label>
                    <Input
                      id="image"
                      value={currentProduct.image}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        image: e.target.value
                      })}
                      placeholder="Enter image URL"
                      required
                    />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (IDR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={currentProduct.price}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        price: Number(e.target.value)
                      })}
                      placeholder="Enter price in IDR"
                      min="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax">Tax Rate (%) *</Label>
                    <Input
                      id="tax"
                      type="number"
                      value={currentProduct.tax}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        tax: Number(e.target.value)
                      })}
                      placeholder="Enter tax percentage"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock *</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={currentProduct.stock}
                      onChange={(e) => setCurrentProduct({
                        ...currentProduct,
                        stock: Number(e.target.value)
                      })}
                      placeholder="Enter available stock"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSaveProduct(currentProduct)}
                className="bg-athfal-pink hover:bg-athfal-pink/80 text-white"
              >
                Save Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentProduct && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{currentProduct.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminProducts;
