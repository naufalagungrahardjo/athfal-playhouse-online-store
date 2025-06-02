
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ClickableStatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export const ClickableStatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  onClick,
  className = ""
}: ClickableStatsCardProps) => {
  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};
