// root/shared/types.ts

// 1. User Interface
export interface IUser {
    _id?: string; // Optional because new users don't have ID yet
    fullName: string;
    email: string;
    role: 'EMPLOYEE' | 'ADMIN';
    department?: string;
    password?: string; // Only needed for registration
    createdAt?: string; // String because JSON sends dates as strings
}

// 2. Resource Interface
export interface IResource {
    _id: string;
    name: string;
    type: 'ROOM' | 'DEVICE';
    capacity?: number;
    location?: string;
    bufferTime?: number;
    status: 'ACTIVE' | 'MAINTENANCE';
}

// 3. Booking Interface
export interface IBooking {
    _id: string;
    user: IUser | string; // Can be full user object OR just ID
    resource: IResource | string;
    startTime: string; // ISO String
    endTime: string; 
    status: 'BOOKED' | 'CANCELLED' | 'COMPLETED';
    returnedAt?: string | null;
}

// 4. API Response Shapes (Optional but good)
export interface AuthResponse {
    user: IUser;
    token: string;
}