import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
  SalesDetailRow,
  OtherIncomeDetailRow,
  ReceivableDetailRow,
} from '@/hooks/useDashboardDetails';
import { FinancialSummary } from '@/hooks/useFinancialSummary';

const Empty = () => <p className="text-muted-foreground text-center py-8">No data</p>;

export const SalesDetailTable = ({ data }: { data: SalesDetailRow[] }) => {
  if (data.length === 0) return <Empty />;
  const totalSum = data.reduce((s, d) => s + d.total, 0);
  const qtySum = data.reduce((s, d) => s + d.quantity, 0);
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Qty</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-3 font-medium">{row.productName}</td>
              <td className="p-3 text-right">{row.quantity}</td>
              <td className="p-3">{row.customerName}</td>
              <td className="p-3 text-right">{formatCurrency(row.total)}</td>
            </tr>
          ))}
          <tr className="border-t-2 font-bold">
            <td className="p-3">Total</td>
            <td className="p-3 text-right">{qtySum}</td>
            <td className="p-3" />
            <td className="p-3 text-right">{formatCurrency(totalSum)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const OtherIncomeDetailTable = ({ data }: { data: OtherIncomeDetailRow[] }) => {
  if (data.length === 0) return <Empty />;
  const totalSum = data.reduce((s, d) => s + d.amount, 0);
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Fund Source</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-3 whitespace-nowrap">{row.date ? format(new Date(row.date), 'dd MMM yyyy') : '-'}</td>
              <td className="p-3 font-medium">{row.description}</td>
              <td className="p-3">{row.fundSource}</td>
              <td className="p-3 text-right text-blue-600">{formatCurrency(row.amount)}</td>
            </tr>
          ))}
          <tr className="border-t-2 font-bold">
            <td className="p-3" colSpan={3}>Total</td>
            <td className="p-3 text-right text-blue-600">{formatCurrency(totalSum)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const ReceivableDetailTable = ({ data }: { data: ReceivableDetailRow[] }) => {
  if (data.length === 0) return <Empty />;
  const totalSum = data.reduce((s, d) => s + d.outstanding, 0);
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Customer</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Child</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-3 font-medium">{row.productName}</td>
              <td className="p-3">{row.customerName}</td>
              <td className="p-3">{row.childName}</td>
              <td className="p-3 text-right text-destructive">
                {row.outstanding > 0 ? formatCurrency(row.outstanding) : '-'}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 font-bold">
            <td className="p-3" colSpan={3}>Total Outstanding</td>
            <td className="p-3 text-right text-destructive">{formatCurrency(totalSum)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export const MoneyFlowSummary = ({ summary }: { summary: FinancialSummary }) => {
  const totalRevenue = summary.salesRevenue + summary.otherIncome;
  return (
    <div className="flex flex-col space-y-3 sm:space-y-4">
      <div className="flex justify-between items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
        <span className="text-sm font-medium">Sales Revenue</span>
        <span className="font-bold text-green-600">{formatCurrency(summary.salesRevenue)}</span>
      </div>
      <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
        <span className="text-sm font-medium">+ Other Income</span>
        <span className="font-bold text-blue-600">{formatCurrency(summary.otherIncome)}</span>
      </div>
      <div className="border-t pt-2 flex justify-between items-center p-3">
        <span className="text-sm font-medium">Total Revenue</span>
        <span className="font-bold">{formatCurrency(totalRevenue)}</span>
      </div>
      <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
        <span className="text-sm font-medium">- Total Expenses</span>
        <span className="font-bold text-destructive">{formatCurrency(summary.totalExpenses)}</span>
      </div>
      <div
        className={`border-t-2 pt-2 flex justify-between items-center p-3 rounded-lg ${
          summary.targetToBEP >= 0 ? 'bg-green-100 dark:bg-green-950/30' : 'bg-red-100 dark:bg-red-950/30'
        }`}
      >
        <span className="font-semibold">Net Income (excl. Capital)</span>
        <span className={`text-lg font-bold ${summary.targetToBEP >= 0 ? 'text-green-600' : 'text-destructive'}`}>
          {summary.targetToBEP < 0 ? '-' : ''}{formatCurrency(Math.abs(summary.targetToBEP))}
        </span>
      </div>
    </div>
  );
};
