
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import PromoCodeInput from "./PromoCodeInput";

type OrderSummaryProps = {
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  appliedPromo: null | {
    id: string;
    code: string;
    discount_percentage: number;
    description: string | null;
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
  };
  getTotalPrice: () => number;
  getDiscountAmount: () => number;
  taxAmount: number;
  total: number;
  formatCurrency: (amount: number) => string;
  onApplyPromo: (promo: any) => void;
  onRemovePromo: () => void;
};

const OrderSummary = ({
  items,
  appliedPromo,
  getTotalPrice,
  getDiscountAmount,
  taxAmount,
  total,
  formatCurrency,
  onApplyPromo,
  onRemovePromo,
}: OrderSummaryProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Order Summary</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
            </div>
            <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        ))}
        
        <Separator className="my-4" />
        
        {/* Promo Code Input */}
        <div className="mb-4">
          <PromoCodeInput
            appliedPromo={appliedPromo}
            onApplyPromo={onApplyPromo}
            onRemovePromo={onRemovePromo}
          />
        </div>

        <Separator className="my-4" />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(getTotalPrice())}</span>
          </div>
          {appliedPromo && (
            <div className="flex justify-between text-green-600">
              <span>Discount ({appliedPromo.code} - {appliedPromo.discount_percentage}%):</span>
              <span>-{formatCurrency(getDiscountAmount())}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default OrderSummary;
