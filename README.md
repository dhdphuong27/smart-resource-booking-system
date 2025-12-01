niRes Portal - University Resource Management System
UniRes is a full-stack internal tool designed to streamline the scheduling of university laboratories and physical assets (laptops, VR headsets). Unlike standard booking apps, UniRes implements a state-based locking mechanism to track physical device returns and prevent scheduling conflicts.

Key Features
Advanced Conflict Detection Algorithm:

Time-Series Projection: Uses an in-memory batch projection algorithm to handle recurring bookings (Daily/Weekly) in a single atomic database transaction.

Physical State Locking: Blocks future bookings for devices that haven't been returned by the previous user (Late Return logic).

Full-Stack Type Safety (Monorepo-lite):

Architected with a Shared Type System. Interfaces are defined once in a root "shared" folder and consumed by both React (Frontend) and Node.js (Backend) to guarantee zero API contract errors.

Admin Analytics:

Real-time aggregation pipeline (MongoDB) to visualize resource utilization rates and top-active users via dynamic charts.

RBAC & Security:

JWT Authentication with strict Role-Based Access Control (Admin vs. Student).

Tech Stack
Frontend: React (Vite), TypeScript, Tailwind CSS, Recharts, React Hook Form.

Backend: Node.js, Express, TypeScript, MongoDB (Mongoose).

Architecture: MVC Pattern, Shared Types (Monorepo style).

Project Structure
root/ ├── backend/ # Node.js API ├── client/ # React Frontend ├── shared/ # Shared TypeScript Interfaces (The "Source of Truth") └── README.md

Quick Start
Clone & Install git clone https://github.com/your-username/unires-portal.git npm install # Install backend deps cd client && npm install # Install frontend deps

Configuration Create a .env file in the root directory: PORT=5000 MONGO_URI=your_mongodb_connection_string JWT_SECRET=your_super_secret_key

Seed Data (Crucial for Testing) Populate the DB with dummy data (Admin, Students, Rooms, Devices): npm run data:import

Run Development Server

Terminal 1 (Backend)
npm run dev

Terminal 2 (Frontend)
cd client && npm run dev

Credentials for Testing
Admin: admin@university.edu / 123

Student: alice.nguyen@student.university.edu / 123

Built as a Capstone Project demonstrating Full-Stack Architecture & Resource Optimization.
