import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Resource from './models/Resource';
import Booking from './models/Booking';

// Load env vars
dotenv.config();

// --- SCHOOL PROJECT DATA ---

const users = [
  {
    fullName: 'System Admin', // The IT Guy at school
    email: 'admin@university.edu',
    password: '123', 
    role: 'ADMIN',
    department: 'IT Services'
  },
  {
    fullName: 'Alice Nguyen', // A Student
    email: 'alice.nguyen@student.university.edu',
    password: '123',
    role: 'EMPLOYEE', // Students are "Employees" in this logic
    department: 'Computer Science'
  },
  {
    fullName: 'Prof. Robert Smith', // A Professor (Forgetful user)
    email: 'r.smith@university.edu',
    password: '123',
    role: 'EMPLOYEE',
    department: 'Physics Faculty'
  }
];

const resources = [
  // --- LIBRARY SPACES (Standard Rooms) ---
  {
    name: 'Library Group Study Room A',
    type: 'ROOM',
    capacity: 6,
    location: 'Library Floor 2'
  },
  {
    name: 'Library Group Study Room B',
    type: 'ROOM',
    capacity: 6,
    location: 'Library Floor 2'
  },
  {
    name: 'Multimedia Presentation Hall',
    type: 'ROOM',
    capacity: 50,
    location: 'Main Building - Wing C'
  },

  // --- CS DEPARTMENT (High Value Devices - Strict Return) ---
  {
    name: 'MacBook Pro M2 (Loaner #01)',
    type: 'DEVICE',
    capacity: 1,
    location: 'IT Helpdesk'
  },
  {
    name: 'MacBook Pro M2 (Loaner #02)',
    type: 'DEVICE',
    capacity: 1,
    location: 'IT Helpdesk'
  },
  {
    name: 'VR Headset - Oculus Quest 2',
    type: 'DEVICE',
    capacity: 1,
    location: 'VR Lab - Room 404'
  },
  {
    name: 'Arduino Advanced Kit',
    type: 'DEVICE',
    capacity: 1,
    location: 'Robotics Lab'
  },

  // --- PHYSICS/SCIENCE (Lab Equipment) ---
  {
    name: 'Digital Microscope Zeiss',
    type: 'DEVICE',
    capacity: 1,
    location: 'Science Block - Bio Lab'
  },
  {
    name: 'Physics Lab Bench #1 (Reserved)',
    type: 'ROOM',
    capacity: 2,
    location: 'Physics Dept - Basement'
  },
  
  // --- MEDIA DEPT ---
  {
    name: 'Sony Alpha A7 Camera',
    type: 'DEVICE',
    capacity: 1,
    location: 'Media Center'
  },
  {
    name: 'Tripod Manfrotto',
    type: 'DEVICE',
    capacity: 1,
    location: 'Media Center'
  }
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('✅ DB Connected');

    // Wipe everything
    await Booking.deleteMany();
    await Resource.deleteMany();
    await User.deleteMany();
    console.log('ben_project_v1 > Old data wiped.');

    // Hash Passwords
    const userPromises = users.map(async (user) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      return { ...user, password: hashedPassword };
    });

    const usersToInsert = await Promise.all(userPromises);
    const createdUsers = await User.insertMany(usersToInsert);
    const createdResources = await Resource.insertMany(resources);

    console.log('-----------------------------------');
    console.log('🎓 UNIVERSITY SYSTEM SEEDED');
    console.log('-----------------------------------');
    
    console.log('🔑 ACCOUNTS (Password: 123):');
    createdUsers.forEach(u => console.log(`   - ${u.email} [${u.role}]`));
    
    console.log('\n📦 ASSETS:');
    createdResources.forEach(r => console.log(`   - ${r.name} (${r.type}): ${r._id}`));

    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    await Booking.deleteMany();
    await Resource.deleteMany();
    await User.deleteMany();
    console.log('🧨 Database Cleared');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}