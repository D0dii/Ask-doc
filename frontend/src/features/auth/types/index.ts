export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  picture: string | null;
  isAdmin: boolean;
}
