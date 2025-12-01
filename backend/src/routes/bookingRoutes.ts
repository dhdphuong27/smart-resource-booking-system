import express from 'express';
import { createBooking } from '../controllers/bookingController';
import { protect, admin } from '../middleware/authMiddleware';
import { returnResource,getMyBookings,getAllBookings, getResourceBookings, getBookingStats, getUserStats} from '../controllers/bookingController';
const router = express.Router();

// Only logged in users can book
router.post('/', protect, createBooking);
router.get('/stats', protect, admin, getBookingStats);
router.put('/:id/return', protect, admin, returnResource);
router.get('/my-bookings', protect, getMyBookings);
router.get('/all', protect, admin, getAllBookings);
router.get('/resource/:resourceId', protect, getResourceBookings);
router.get('/user-stats', protect, admin, getUserStats);

export default router;