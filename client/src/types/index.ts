// Import từ thư mục shared
import type { 
  IResource as SharedResource,
  IUser as SharedUser,
  IBooking as SharedBooking
} from '../../../shared/types'; 

// Re-export cho Frontend dùng
export type Resource = SharedResource;
export type User = SharedUser;
export type Booking = SharedBooking;

// Form Input (cái này chỉ Frontend có)
export interface BookingFormInputs {
  resourceId: string;
  startTime: string;
  endTime: string;
  recurrenceType: 'NONE' | 'DAILY' | 'WEEKLY'; 
  occurrences: number; 
}