import mongoose, { Schema, Document } from 'mongoose';
import { IResource as SharedResource } from '../../../shared/types';

// SỬA DÒNG NÀY:
// Dùng Omit<SharedResource, '_id'> để loại bỏ xung đột
export interface IResourceDocument extends Omit<SharedResource, '_id'>, Document {}

const ResourceSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['ROOM', 'DEVICE'], 
    required: true 
  },
  capacity: { type: Number },
  location: { type: String },
  bufferTime: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'MAINTENANCE'], 
    default: 'ACTIVE' 
  },
}, { timestamps: true });

export default mongoose.model<IResourceDocument>('Resource', ResourceSchema);