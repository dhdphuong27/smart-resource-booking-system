import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes'; // <--- Import routes
import resourceRoutes from './routes/resourceRoutes';
import bookingRoutes from './routes/bookingRoutes';

dotenv.config();
connectDB();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes); // <--- Mount the route
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});