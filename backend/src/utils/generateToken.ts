import jwt from 'jsonwebtoken';

const generateToken = (id: string): string => {
  // The token will contain the User's ID inside it
  return jwt.sign({ id }, process.env.JWT_SECRET || 'defaultSecret', {
    expiresIn: '30d', // Token is valid for 30 days
  });
};

export default generateToken;