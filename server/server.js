const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
// Load environment variables
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this in production
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'] // Ensure compatibility
});

// Middleware (CRITICAL: CORS and JSON must be at the top)
app.use(cors());
app.use(express.json());
app.use(helmet());

// Explicitly handle /socket.io requests for Vercel stability
app.all('/socket.io/*', (req, res) => {
    io.engine.handleRequest(req, res);
});

// Socket.io logic
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Export io to use in controllers
app.set('io', io);

// Database Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is missing!');
        return;
    }
    try {
        await mongoose.connect(uri);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
};

// Routes
app.use('/api/health', require('./routes/healthRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/heatmap', require('./routes/heatmapRoutes'));
app.use('/api/leaderboard', require('./routes/leaderboardRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/friends', require('./routes/friendRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// Root Route
app.get('/', (req, res) => {
    res.send('Habit Tracker API is running...');
});

const PORT = process.env.PORT || 5000;

// Start Server if run directly
if (require.main === module) {
    connectDB().then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });
}

module.exports = { app, connectDB };
