
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
    firstPaymentUnit?: number;
    installments?: number;
  }[];
  appliedPromo: null | {
    id: string;
    code: string;
    discount_percentage: number;
    discount_type: string;
    discount_amount: number;
    description: string | null;
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
    usage_limit: number | null;
    usage_count: number;
    applies_to: string;
    applicable_product_ids: string[];
    applicable_category_slugs: string[];
  };
  getTotalPrice: () => number;
  getDiscountAmount: () => number;
  taxAmount: number;
  total: number;
  hasInstallment?: boolean;
  firstPaymentDueNow?: number;
  remainingLater?: number;
  remainingSchedule?: number[];
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
  hasInstallment,
  firstPaymentDueNow,
  remainingLater,
  remainingSchedule,
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
              {!!item.installments && item.installments > 1 && (
                <p className="text-xs text-athfal-green">
                  {item.installments}x · bayar pertama {formatCurrency((item.firstPaymentUnit || 0) * item.quantity)}
                </p>
              )}
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
              <span>Discount ({appliedPromo.code} - {appliedPromo.discount_type === 'fixed'
                ? `Rp${(appliedPromo.discount_amount || 0).toLocaleString('id-ID')}`
                : `${appliedPromo.discount_percentage}%`}):</span>
              <span>-{formatCurrency(getDiscountAmount())}</span>
            </div>
          )}
          <div className="flex justify-between text-lg border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {hasInstallment && (
            <div className="mt-2 space-y-2">
              {/* Highlighted current bill the customer must pay now */}
              <div className="rounded-lg border-2 border-athfal-green bg-athfal-green/10 p-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-athfal-green">Pay now (first payment):</span>
                  <span className="font-bold text-lg text-athfal-green">
                    {formatCurrency(firstPaymentDueNow || 0)}
                  </span>
                </div>
                <p className="text-xs text-athfal-green/80 mt-1">
                  This is the amount you need to pay now (after discount).
                </p>
              </div>

              {/* Remaining payments, broken down by division */}
              {remainingSchedule && remainingSchedule.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-3 space-y-1.5">
                  <div className="flex justify-between text-sm font-medium text-gray-700">
                    <span>Remaining (paid later):</span>
                    <span>{formatCurrency(remainingLater || 0)}</span>
                  </div>
                  <Separator className="my-1" />
                  {remainingSchedule.map((amount, idx) => (
                    <div key={idx} className="flex justify-between text-sm text-gray-600">
                      <span>Payment {idx + 2}:</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default OrderSummary;
