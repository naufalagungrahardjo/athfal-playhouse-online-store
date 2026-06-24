import { formatCurrency } from '@/lib/utils';
import { FundBalanceRow } from '@/hooks/useFinancialSummary';

interface FundBalanceTableProps {
  data: FundBalanceRow[];
}

export const FundBalanceTable = ({ data }: FundBalanceTableProps) => {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No data</p>;
  }
  const sum = (key: keyof FundBalanceRow) => data.reduce((s, d) => s + (d[key] as number), 0);
  const totalNet = sum('net');

  return (
    <div className="overflow-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-muted-foreground">Fund Source / Bank</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Sales In</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Other Income In</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Capital In</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Transfer In</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Transfer Out</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Total In</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Expense Out</th>
            <th className="text-right p-3 font-medium text-muted-foreground">Net Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
              <td className="p-3 font-medium">{row.name}</td>
              <td className="p-3 text-right text-green-600">{row.salesIn > 0 ? formatCurrency(row.salesIn) : '-'}</td>
              <td className="p-3 text-right text-blue-600">{row.otherIn > 0 ? formatCurrency(row.otherIn) : '-'}</td>
              <td className="p-3 text-right text-purple-600">{row.capitalIn > 0 ? formatCurrency(row.capitalIn) : '-'}</td>
              <td className="p-3 text-right text-emerald-600">{row.transferIn > 0 ? formatCurrency(row.transferIn) : '-'}</td>
              <td className="p-3 text-right text-amber-600">{row.transferOut > 0 ? formatCurrency(row.transferOut) : '-'}</td>
              <td className="p-3 text-right font-medium">{formatCurrency(row.totalIn)}</td>
              <td className="p-3 text-right text-destructive">{row.expenseOut > 0 ? formatCurrency(row.expenseOut) : '-'}</td>
              <td className={`p-3 text-right font-bold ${row.net >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {row.net < 0 ? '-' : ''}{formatCurrency(Math.abs(row.net))}
              </td>
            </tr>
          ))}
          <tr className="border-t-2 font-bold">
            <td className="p-3">Total</td>
            <td className="p-3 text-right text-green-600">{formatCurrency(sum('salesIn'))}</td>
            <td className="p-3 text-right text-blue-600">{formatCurrency(sum('otherIn'))}</td>
            <td className="p-3 text-right text-purple-600">{formatCurrency(sum('capitalIn'))}</td>
            <td className="p-3 text-right text-emerald-600">{formatCurrency(sum('transferIn'))}</td>
            <td className="p-3 text-right text-amber-600">{formatCurrency(sum('transferOut'))}</td>
            <td className="p-3 text-right">-</td>
            <td className="p-3 text-right text-destructive">{formatCurrency(sum('expenseOut'))}</td>
            <td className={`p-3 text-right ${totalNet >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {totalNet < 0 ? '-' : ''}{formatCurrency(Math.abs(totalNet))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
