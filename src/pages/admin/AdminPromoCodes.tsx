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
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Pencil, Trash2, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { logAdminAction } from "@/utils/logAdminAction";

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
    valid_from: '',
    valid_until: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

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
      valid_from: '',
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
        valid_from: promo.valid_from ? new Date(promo.valid_from).toISOString().split('T')[0] : '',
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
            valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentPromo.id);
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code updated successfully",
        });

        await logAdminAction({
          user,
          action: `Updated promo code (id: ${currentPromo.id}, code: ${formData.code})`,
        });
      } else {
        // Create new promo code
        const { data, error } = await supabase
          .from('promo_codes')
          .insert([{
            code: formData.code,
            discount_percentage: formData.discount_percentage,
            description: formData.description,
            is_active: formData.is_active,
            valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
          }])
          .select()
          .single();
          
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code created successfully",
        });

        await logAdminAction({
          user,
          action: `Created new promo code (id: ${data.id}, code: ${data.code})`,
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

      await logAdminAction({
        user,
        action: `Deleted promo code (id: ${id})`,
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
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPromoStatus = (promo: PromoCode) => {
    if (!promo.is_active) return { status: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    
    const now = new Date();
    const validFrom = promo.valid_from ? new Date(promo.valid_from) : null;
    const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;
    
    if (validFrom && now < validFrom) {
      return { status: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (validUntil && now > validUntil) {
      return { status: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    
    return { status: 'Active', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Promo Code Management</h1>
          <p className="text-gray-600">Create and manage discount codes with date ranges</p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="flex items-center gap-2 bg-athfal-pink hover:bg-athfal-pink/90"
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
              <TableHead>Valid From</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">Loading...</TableCell>
              </TableRow>
            ) : promoCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">No promo codes found</TableCell>
              </TableRow>
            ) : (
              promoCodes.map((promo) => {
                const statusInfo = getPromoStatus(promo);
                return (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.code}</TableCell>
                    <TableCell>{promo.discount_percentage}%</TableCell>
                    <TableCell>{promo.description || '-'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(promo.valid_from)}</TableCell>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {currentPromo ? 'Edit Promo Code' : 'Create New Promo Code'}
            </DialogTitle>
            <DialogDescription>
              Fill the form below to {currentPromo ? 'update the' : 'create a new'} promo code with date range settings.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  name="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for immediate activation</p>
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
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
              </div>
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
              <Button type="submit" className="bg-athfal-pink hover:bg-athfal-pink/90">
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
