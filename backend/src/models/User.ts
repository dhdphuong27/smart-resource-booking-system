import mongoose, { Schema, Document } from 'mongoose';
import { IUser as SharedUser } from '../../../shared/types'; // Import từ Shared

// Omit _id vì SharedUser dùng string, còn Mongoose dùng ObjectId
export interface IUserDocument extends Omit<SharedUser, '_id'>, Document {
  password: string;
}

const UserSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['EMPLOYEE', 'ADMIN'], 
    default: 'EMPLOYEE' 
  },
  department: { type: String },
}, { timestamps: true });

export default mongoose.model<IUserDocument>('User', UserSchema);