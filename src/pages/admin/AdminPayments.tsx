
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  Badge, 
  CheckCircle2, 
  ExternalLink,
  Info, 
  Search,
  XCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Mock order data
const MOCK_ORDERS = [
  {
    id: "ORD-001",
    customerName: "Annisa Wijaya",
    customerEmail: "annisa@example.com",
    products: [
      { name: "Pop Up Class - Usia 2-3 Tahun", price: 250000, quantity: 1 },
    ],
    total: 277500,
    date: "2023-05-20",
    paymentMethod: "Bank Hijra",
    paymentStatus: "paid",
    fulfillmentStatus: "completed",
  },
  {
    id: "ORD-002",
    customerName: "Budi Santoso",
    customerEmail: "budi@example.com",
    products: [
      { name: "Play Kit - Alphabet Fun", price: 199000, quantity: 1 },
      { name: "Kaos Athfal Playhouse - Anak", price: 120000, quantity: 2 },
    ],
    total: 486680,
    date: "2023-05-18",
    paymentMethod: "BCA",
    paymentStatus: "paid",
    fulfillmentStatus: "processing",
  },
  {
    id: "ORD-003",
    customerName: "Clara Hutapea",
    customerEmail: "clara@example.com",
    products: [
      { name: "Konsultasi Anak 60 Menit", price: 350000, quantity: 1 },
    ],
    total: 388500,
    date: "2023-05-15",
    paymentMethod: "Bank Jago",
    paymentStatus: "pending",
    fulfillmentStatus: "pending",
  },
  {
    id: "ORD-004",
    customerName: "Deni Firmansyah",
    customerEmail: "deni@example.com",
    products: [
      { name: "Bumi Class: Mengenal Alam", price: 300000, quantity: 1 },
    ],
    total: 333000,
    date: "2023-05-10",
    paymentMethod: "Bank Hijra",
    paymentStatus: "cancelled",
    fulfillmentStatus: "cancelled",
  },
];

// Mock payment confirmation data
const MOCK_PAYMENT_CONFIRMATIONS = [
  {
    id: "PAY-001",
    orderId: "ORD-003",
    customerName: "Clara Hutapea",
    amount: 388500,
    date: "2023-05-15",
    bank: "Bank Jago",
    accountName: "Clara Hutapea",
    status: "pending",
    receiptUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4",
    notes: "Payment has been made, please confirm",
  },
  {
    id: "PAY-002",
    orderId: "ORD-005",
    customerName: "Eko Prasetyo",
    amount: 250000,
    date: "2023-05-09",
    bank: "BCA",
    accountName: "Eko Prasetyo",
    status: "verified",
    receiptUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4",
    notes: "",
  },
];

const AdminPayments = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  // Filter orders
  const filteredOrders = MOCK_ORDERS.filter(order => {
    // Search
    const matchesSearch = 
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      order.products.some(p => p.name.toLowerCase().includes(search.toLowerCase()));
    
    // Status filter
    const matchesStatus = 
      statusFilter === "all" || 
      order.paymentStatus === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateRange.from) {
      const orderDate = new Date(order.date);
      matchesDate = orderDate >= dateRange.from;
      
      if (dateRange.to) {
        matchesDate = matchesDate && orderDate <= dateRange.to;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  // Filter payment confirmations
  const filteredConfirmations = MOCK_PAYMENT_CONFIRMATIONS.filter(confirmation => {
    // Search
    const matchesSearch = 
      confirmation.id.toLowerCase().includes(search.toLowerCase()) ||
      confirmation.orderId.toLowerCase().includes(search.toLowerCase()) ||
      confirmation.customerName.toLowerCase().includes(search.toLowerCase());
    
    // Status filter
    const matchesStatus = 
      statusFilter === "all" || 
      confirmation.status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    if (dateRange.from) {
      const confirmationDate = new Date(confirmation.date);
      matchesDate = confirmationDate >= dateRange.from;
      
      if (dateRange.to) {
        matchesDate = matchesDate && confirmationDate <= dateRange.to;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleChangeOrderStatus = (orderId: string, status: string) => {
    // In a real app, this would update the database/API
    toast({
      title: "Order status updated",
      description: `Order ${orderId} is now ${status}.`,
    });
  };

  const handleVerifyPayment = (paymentId: string) => {
    // In a real app, this would update the database/API
    toast({
      title: "Payment verified",
      description: `Payment ${paymentId} has been verified.`,
    });
  };

  const handleRejectPayment = (paymentId: string) => {
    // In a real app, this would update the database/API
    toast({
      title: "Payment rejected",
      description: `Payment ${paymentId} has been rejected.`,
      variant: "destructive",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Payments & Orders</h2>
      </div>

      <Tabs 
        defaultValue="orders" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="confirmations">Payment Confirmations</TabsTrigger>
        </TabsList>
        
        <div className="flex flex-wrap justify-between items-center gap-4 mt-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder={`Search ${activeTab}...`}
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="status-filter" className="whitespace-nowrap">Status:</Label>
            <Select 
              value={statusFilter} 
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status-filter" className="w-[130px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Date filter */}
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Date:</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                >
                  <div className="truncate">
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick a date range"
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
                <div className="p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                  >
                    Clear
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="pt-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <p className="text-gray-500">No orders found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {order.id}
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full", 
                            order.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                            order.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          )}>
                            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                        </CardTitle>
                        <div className="text-sm text-gray-500 mt-1">
                          {format(new Date(order.date), "MMM d, yyyy")}
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Select 
                          value={order.paymentStatus}
                          onValueChange={(value) => handleChangeOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="h-8">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-medium">{order.customerName}</span>{" "}
                        <span className="text-gray-500">({order.customerEmail})</span>
                      </div>
                      
                      <div className="space-y-1">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {product.quantity}x {product.name}
                            </span>
                            <span>{formatCurrency(product.price * product.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t mt-3 pt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span>{formatCurrency(order.total)}</span>
                      </div>
                      
                      <div className="mt-3 pt-2 flex justify-between text-gray-600">
                        <span className="flex items-center">
                          <Badge className="h-3.5 w-3.5 mr-1" />
                          Payment Method
                        </span>
                        <span>{order.paymentMethod}</span>
                      </div>
                      
                      <div className="flex justify-between text-gray-600">
                        <span className="flex items-center">
                          <Info className="h-3.5 w-3.5 mr-1" />
                          Fulfillment
                        </span>
                        <span className={cn(
                          "capitalize",
                          order.fulfillmentStatus === "completed" ? "text-green-600" :
                          order.fulfillmentStatus === "processing" ? "text-blue-600" :
                          order.fulfillmentStatus === "pending" ? "text-yellow-600" :
                          "text-red-600"
                        )}>
                          {order.fulfillmentStatus}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Payment Confirmations Tab */}
        <TabsContent value="confirmations" className="pt-4">
          {filteredConfirmations.length === 0 ? (
            <div className="text-center py-8 border rounded-lg border-dashed">
              <p className="text-gray-500">No payment confirmations found matching your filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConfirmations.map((confirmation) => (
                <Card key={confirmation.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {confirmation.orderId}
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full", 
                            confirmation.status === "verified" ? "bg-green-100 text-green-700" :
                            "bg-yellow-100 text-yellow-700"
                          )}>
                            {confirmation.status.charAt(0).toUpperCase() + confirmation.status.slice(1)}
                          </span>
                        </CardTitle>
                        <div className="text-sm text-gray-500 mt-1">
                          {format(new Date(confirmation.date), "MMM d, yyyy")} - Payment ID: {confirmation.id}
                        </div>
                      </div>
                      {confirmation.status === "pending" && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleRejectPayment(confirmation.id)}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleVerifyPayment(confirmation.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verify
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm">
                      <div className="mb-2">
                        <span className="font-medium">From: {confirmation.customerName}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium">{formatCurrency(confirmation.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bank:</span>
                              <span>{confirmation.bank}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Account Name:</span>
                              <span>{confirmation.accountName}</span>
                            </div>
                            {confirmation.notes && (
                              <div className="pt-2">
                                <span className="text-gray-600">Notes:</span>
                                <p className="mt-1 bg-gray-50 p-2 rounded">{confirmation.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <Label className="mb-2 block">Payment Receipt</Label>
                          <img 
                            src={confirmation.receiptUrl} 
                            alt="Payment receipt" 
                            className="rounded border w-full max-h-40 object-cover"
                          />
                          <div className="mt-2 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(confirmation.receiptUrl, '_blank')}
                            >
                              View Full Image
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPayments;
