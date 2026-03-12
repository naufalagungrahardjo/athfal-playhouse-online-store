import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OtherIncomeTab from './other-income/OtherIncomeTab';
import CapitalTab from './other-income/CapitalTab';

const AdminOtherIncome = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Other Income & Capital</h1>
      <Tabs defaultValue="income">
        <TabsList>
          <TabsTrigger value="income">Other Income</TabsTrigger>
          <TabsTrigger value="capital">Capital</TabsTrigger>
        </TabsList>
        <TabsContent value="income">
          <OtherIncomeTab />
        </TabsContent>
        <TabsContent value="capital">
          <CapitalTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminOtherIncome;
