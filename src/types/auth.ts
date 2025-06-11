
export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};
