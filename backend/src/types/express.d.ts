import { User as PassportUser } from 'passport';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }
    
    interface Request {
      user?: User;
    }
  }
}

export {};
