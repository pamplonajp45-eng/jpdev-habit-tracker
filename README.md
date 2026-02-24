# JPDev Habit Tracker 🚀

A comprehensive, full-stack habit tracking application built with the MERN stack (MongoDB, Express, React, Node.js). 

> **A Personal Passion Project:** This application was built out of a personal desire to merge productivity with gamification. It's designed not just as a tool, but as an engaging experience to help users—including myself—build positive, lasting routines through XP leveling, ongoing streaks, and a rewarding achievement badge system.

## 🌟 Features

- **Gamification:** Earn XP, level up, and achieve "God Mode" (Level 100) by consistently completing habits.
- **Achievements & Badges:** Unlock both Streak and Level-based badges to showcase your dedication.
- **Real-Time Updates:** Seamless real-time synchronization utilizing Socket.io so you never miss a beat across devices.
- **Push Notifications:** Web-Push integration to keep you reminded of your habits and goals.
- **Secure Authentication:** JWT-based user authentication and secure password hashing.
- **Responsive PWA:** Built as a Progressive Web App to use easily on desktop or mobile.

## 🛠️ Tech Stack

**Client:**
- React 19
- Vite
- React Router DOM
- Vite PWA Plugin

**Server:**
- Node.js & Express.js
- MongoDB & Mongoose
- Socket.io 
- JSON Web Token (JWT)
- Web-Push & NodeMailer

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed on your local machine.

### Installation & Execution

1. **Clone the repository** (if not already done).
2. **Install frontend dependencies:**
   ```bash
   npm install
   ```
3. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```
4. **Environment Variables:**
   - Create a `.env` file in your `server` directory.
   - You will need a `MONGO_URI`, `JWT_SECRET`, and VAPID keys for push notifications.

5. **Start the development servers:**
   - Open two terminal windows.
   - Run the frontend:
     ```bash
     npm run dev
     ```
   - Run the backend:
     ```bash
     cd server
     npm run dev
     ```

## 🎮 Badge System Overview

Our application rewards consistency:
- **Streak Badges:** Awarded for meeting continuous completion streaks (e.g., 3 days, 7 days, 100 days).
- **Level Badges:** Earn XP per habit to level up. Reach high levels to achieve prestigious titles like *Momentum Maker* or *Discipline Lord*.

## 💡 About
This is a personal passion project crafted by JPDev. It represents a journey of continuous learning, building, and self-improvement—both in code and in daily habits.
