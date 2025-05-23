import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

type PromoCode = {
  id: string;
  code: string;
  discount_percentage: number;
  description: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
};

const AdminPromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    description: '',
    is_active: true,
    valid_until: ''
  });
  const { toast } = useToast();

  const fetchPromoCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setPromoCodes(data as PromoCode[] || []);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load promo codes",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) : value
    });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      is_active: checked
    });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: 10,
      description: '',
      is_active: true,
      valid_until: ''
    });
    setCurrentPromo(null);
  };

  const handleOpenDialog = (promo?: PromoCode) => {
    if (promo) {
      setCurrentPromo(promo);
      setFormData({
        code: promo.code,
        discount_percentage: promo.discount_percentage,
        description: promo.description || '',
        is_active: promo.is_active,
        valid_until: promo.valid_until ? new Date(promo.valid_until).toISOString().split('T')[0] : ''
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentPromo) {
        // Update existing promo code
        const { error } = await supabase
          .from('promo_codes')
          .update({
            code: formData.code,
            discount_percentage: formData.discount_percentage,
            description: formData.description,
            is_active: formData.is_active,
            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentPromo.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code updated successfully",
        });
      } else {
        // Create new promo code
        const { error } = await supabase
          .from('promo_codes')
          .insert([{
            code: formData.code,
            discount_percentage: formData.discount_percentage,
            description: formData.description,
            is_active: formData.is_active,
            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
          }]);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code created successfully",
        });
      }
      
      handleCloseDialog();
      fetchPromoCodes();
    } catch (error: any) {
      console.error('Error saving promo code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save promo code",
      });
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo code?")) return;
    
    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });
      
      fetchPromoCodes();
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete promo code",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiration';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Promo Code Management</h1>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="flex items-center gap-2"
        >
          <PlusCircle size={16} />
          Add New Promo
        </Button>
      </div>

      <div className="bg-white rounded-md shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount (%)</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : promoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No promo codes found</TableCell>
              </TableRow>
            ) : (
              promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.code}</TableCell>
                  <TableCell>{promo.discount_percentage}%</TableCell>
                  <TableCell>{promo.description || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {promo.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(promo.valid_until)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(promo)}>
                      <Pencil size={16} className="mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleDeletePromo(promo.id)}>
                      <Trash2 size={16} className="mr-1" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentPromo ? 'Edit Promo Code' : 'Create New Promo Code'}</DialogTitle>
            <DialogDescription>
              Fill the form below to {currentPromo ? 'update the' : 'create a new'} promo code.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="code">Promo Code</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g. SUMMER20"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="discount_percentage">Discount Percentage</Label>
              <Input
                id="discount_percentage"
                name="discount_percentage"
                type="number"
                min="1"
                max="100"
                value={formData.discount_percentage}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this promo is for"
              />
            </div>
            
            <div>
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                name="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {currentPromo ? 'Update' : 'Create'} Promo Code
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromoCodes;
