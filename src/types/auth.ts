
export type UserRole = 'user' | 'admin' | 'super_admin' | 'orders_manager' | 'order_staff' | 'content_manager' | 'content_staff';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole; // Now accepts specific admin roles too!
};
