import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUserDocument } from '../models/User';

// 1. Export the Interface so it can be used elsewhere if needed
export interface AuthRequest extends Request {
  user?: IUserDocument;
}

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

// 2. IMPORTANT: Add 'export' keyword here
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
      
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
         res.status(401).json({ message: 'Not authorized, user not found' });
         return;
      }

      req.user = user;
      next();

    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};