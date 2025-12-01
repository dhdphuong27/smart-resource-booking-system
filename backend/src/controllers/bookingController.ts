import { Request, Response } from 'express';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/authMiddleware';
import Resource from '../models/Resource';

// Helper to add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId, startTime, endTime, recurrenceType = 'NONE', occurrences = 1 } = req.body;
    const userId = req.user?._id;

    // 1. GENERATE REQUESTED SLOTS (In-Memory Projection)
    // We calculate all the specific start/end times the user wants.
    const requestedSlots: { start: Date; end: Date }[] = [];
    
    const baseStart = new Date(startTime);
    const baseEnd = new Date(endTime);
    const limit = recurrenceType === 'NONE' ? 1 : Math.min(occurrences, 12); // Limit to 12 repeats for safety

    for (let i = 0; i < limit; i++) {
      let offset = 0;
      if (recurrenceType === 'DAILY') offset = i;
      if (recurrenceType === 'WEEKLY') offset = i * 7;

      requestedSlots.push({
        start: addDays(baseStart, offset),
        end: addDays(baseEnd, offset)
      });
    }

    // 2. CHECK RESOURCE TYPE & PHYSICAL RETURN (Logic from before)
    const resource = await Resource.findById(resourceId);
    if (!resource) { res.status(404).json({ message: 'Resource not found' }); return; }

    if (resource.type !== 'ROOM') {
      // Check if item is CURRENTLY out (Late return check)
      const isMissing = await Booking.findOne({
        resource: resourceId,
        returnedAt: null,
        startTime: { $lte: new Date() }
      });
      if (isMissing) {
        res.status(409).json({ message: 'Resource is currently checked out.' });
        return;
      }
    }

    // 3. THE ALGORITHM: BATCH CONFLICT DETECTION
    // Instead of querying DB 10 times, we build ONE big "$or" query.
    // We check if ANY of our requested slots overlap with ANY existing booking.
    
    const conflictQuery = {
      resource: resourceId,
      status: 'BOOKED',
      $or: requestedSlots.map(slot => ({
        // Overlap Logic: (StartA < EndB) and (EndA > StartB)
        startTime: { $lt: slot.end },
        endTime: { $gt: slot.start }
      }))
    };

    const existingConflicts = await Booking.find(conflictQuery);

    if (existingConflicts.length > 0) {
      // Intelligent Error Message
      const conflictDates = existingConflicts.map(b => 
        b.startTime.toLocaleDateString()
      ).join(', ');
      
      res.status(409).json({ 
        message: `Conflict detected on these dates: ${conflictDates}. The entire series was rejected.` 
      });
      return;
    }

    // 4. ATOMIC INSERTION
    // If we passed the check, we know ALL slots are free.
    // Prepare objects for bulk insert
    const bookingsToCreate = requestedSlots.map(slot => ({
      user: userId,
      resource: resourceId,
      startTime: slot.start,
      endTime: slot.end,
      status: 'BOOKED'
    }));

    await Booking.insertMany(bookingsToCreate);

    res.status(201).json({ message: `Successfully booked ${bookingsToCreate.length} slots.` });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
// @desc    Mark a booking as returned
// @route   PUT /api/bookings/:id/return
// @access  Private (Admin or Manager)
export const returnResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      res.status(404).json({ message: 'Booking not found' });
      return;
    }

    // Check if already returned
    if (booking.returnedAt) {
      res.status(400).json({ message: 'Booking already marked as returned' });
      return;
    }

    // Mark as returned now
    booking.returnedAt = new Date();
    booking.status = 'COMPLETED'; 
    await booking.save();

    res.json({ message: 'Resource returned successfully', returnedAt: booking.returnedAt });

  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getMyBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    // Find bookings for this user & sort by Start Time (Newest first)
    // .populate('resource') fills in the details (name, location)
    const bookings = await Booking.find({ user: userId })
      .populate('resource', 'name type location') 
      .sort({ startTime: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: (error as Error).message });
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Populate cả 'user' (để biết ai đặt) và 'resource'
    const bookings = await Booking.find({})
      .populate('user', 'fullName email') 
      .populate('resource', 'name type location')
      .sort({ startTime: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get future bookings for a specific resource
// @route   GET /api/bookings/resource/:resourceId
// @access  Private
export const getResourceBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { resourceId } = req.params;

    // Find bookings where resource matches AND endTime is in the future
    // We only need start/end times, not the full user info
    const bookings = await Booking.find({
      resource: resourceId,
      endTime: { $gte: new Date() }, // Only future/ongoing
      status: 'BOOKED'
    })
    .select('startTime endTime') // Keep payload light
    .sort({ startTime: 1 });     // Ascending (soonest first)

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get booking statistics (Chart Data)
// @route   GET /api/bookings/stats
// @access  Private/Admin
export const getBookingStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // MongoDB Aggregation Pipeline
    const stats = await Booking.aggregate([
      // 1. Group by Resource ID and Count them
      {
        $group: {
          _id: "$resource",
          count: { $sum: 1 }
        }
      },
      // 2. Join with Resources collection to get the Name
      {
        $lookup: {
          from: "resources", // Tên collection trong DB (thường là số nhiều, viết thường)
          localField: "_id",
          foreignField: "_id",
          as: "resourceInfo"
        }
      },
      // 3. Flatten the array (Lookup returns an array)
      { $unwind: "$resourceInfo" },
      // 4. Format the output
      {
        $project: {
          name: "$resourceInfo.name",
          bookings: "$count"
        }
      },
      // 5. Sort by most booked
      { $sort: { bookings: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get top users by usage (Count & Duration)
// @route   GET /api/bookings/user-stats
// @access  Private/Admin
export const getUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await Booking.aggregate([
      // 1. Calculate Duration for each booking (in milliseconds)
      {
        $addFields: {
          durationMs: { $subtract: ["$endTime", "$startTime"] }
        }
      },
      // 2. Group by User
      {
        $group: {
          _id: "$user",
          totalBookings: { $sum: 1 },
          totalDurationMs: { $sum: "$durationMs" }
        }
      },
      // 3. Lookup User Details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      { $unwind: "$userInfo" },
      // 4. Format Output (Convert ms to Hours)
      {
        $project: {
          name: "$userInfo.fullName",
          bookings: "$totalBookings",
          // Round hours to 1 decimal place: (ms / 1000 / 60 / 60)
          hours: { 
            $round: [{ $divide: ["$totalDurationMs", 3600000] }, 1] 
          }
        }
      },
      // 5. Sort by most hours booked
      { $sort: { hours: -1 } },
      // 6. Limit to top 5 users (to keep chart clean)
      { $limit: 5 } 
    ]);

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};