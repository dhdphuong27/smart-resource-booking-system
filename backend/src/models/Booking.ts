import mongoose, { Schema, Document } from 'mongoose';
import { IBooking as SharedBooking } from '../../../shared/types';

// SỬA Ở ĐÂY:
// 1. Thêm 'user' và 'resource' vào danh sách Omit
// 2. Khai báo lại chúng là mongoose.Types.ObjectId
export interface IBookingDocument extends Omit<SharedBooking, '_id' | 'startTime' | 'endTime' | 'returnedAt' | 'user' | 'resource'>, Document {
  startTime: Date;
  endTime: Date;
  returnedAt?: Date | null;
  user: mongoose.Types.ObjectId;      // Override: Backend dùng ObjectId
  resource: mongoose.Types.ObjectId;  // Override: Backend dùng ObjectId
}

const BookingSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  resource: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
  
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  
  status: { 
    type: String, 
    enum: ['BOOKED', 'CANCELLED', 'COMPLETED'], 
    default: 'BOOKED' 
  },
  
  returnedAt: { type: Date, default: null },
}, { timestamps: true });

// Indexing
BookingSchema.index({ resource: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ resource: 1, returnedAt: 1 });

export default mongoose.model<IBookingDocument>('Booking', BookingSchema);