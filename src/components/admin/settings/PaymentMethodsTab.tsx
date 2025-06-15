import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Save, Trash2, X } from "lucide-react";
import React from "react";

interface PaymentMethodsTabProps {
  localPayments: any[];
  newPayment: any;
  setNewPayment: (n: any) => void;
  handleAddPayment: () => void;
  handleUpdatePayment: (id: string, field: string, value: string | boolean | string[]) => void;
  handleAddPaymentStep: (paymentId: string) => void;
  handleRemovePaymentStep: (paymentId: string, stepIndex: number) => void;
  handleUpdatePaymentStep: (paymentId: string, stepIndex: number, value: string) => void;
  deletePaymentMethod: (id: string) => void;
}

export const PaymentMethodsTab = ({
  localPayments,
  newPayment,
  setNewPayment,
  handleAddPayment,
  handleUpdatePayment,
  handleAddPaymentStep,
  handleRemovePaymentStep,
  handleUpdatePaymentStep,
  deletePaymentMethod
}: PaymentMethodsTabProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Payment Methods</CardTitle>
      <CardDescription>
        Manage the payment methods available for customers and customize payment instructions.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-6">
        {/* Add new payment method */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <h3 className="font-medium mb-4">Add New Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Input
              placeholder="Bank Name"
              value={newPayment.bank_name}
              onChange={(e) => setNewPayment({...newPayment, bank_name: e.target.value})}
            />
            <Input
              placeholder="Account Number"
              value={newPayment.account_number}
              onChange={(e) => setNewPayment({...newPayment, account_number: e.target.value})}
            />
            <Input
              placeholder="Account Name"
              value={newPayment.account_name}
              onChange={(e) => setNewPayment({...newPayment, account_name: e.target.value})}
            />
          </div>
          
          <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Payment Steps</Label>
            {newPayment.payment_steps.map((step: string, index: number) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={step}
                  onChange={(e) => {
                    const updatedSteps = [...newPayment.payment_steps];
                    updatedSteps[index] = e.target.value;
                    setNewPayment({...newPayment, payment_steps: updatedSteps});
                  }}
                  placeholder={`Step ${index + 1}`}
                />
                {newPayment.payment_steps.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updatedSteps = newPayment.payment_steps.filter((_: any, i: number) => i !== index);
                      setNewPayment({...newPayment, payment_steps: updatedSteps});
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setNewPayment({
                ...newPayment, 
                payment_steps: [...newPayment.payment_steps, ""]
              })}
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>
          
          <Button onClick={handleAddPayment}>
            Add Payment Method
          </Button>
        </div>

        {/* Existing payment methods */}
        <div className="space-y-6">
          {localPayments.map((payment) => (
            <div 
              key={payment.id}
              className="border rounded-lg p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={payment.bank_name}
                    onChange={(e) => handleUpdatePayment(payment.id, 'bank_name', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={payment.account_number}
                    onChange={(e) => handleUpdatePayment(payment.id, 'account_number', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={payment.account_name}
                    onChange={(e) => handleUpdatePayment(payment.id, 'account_name', e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label className="text-sm font-medium mb-2 block">Payment Steps</Label>
                {payment.payment_steps?.map((step: string, index: number) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={step}
                      onChange={(e) => handleUpdatePaymentStep(payment.id, index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemovePaymentStep(payment.id, index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPaymentStep(payment.id)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Step
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={payment.active}
                    onChange={(e) => handleUpdatePayment(payment.id, 'active', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label>Active</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdatePayment(payment.id, 'payment_steps', payment.payment_steps || [])}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save Steps
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => deletePaymentMethod(payment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);
