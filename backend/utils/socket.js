import { Server } from 'socket.io';

let io;
const userSocketMap = new Map(); // userId -> socketId mapping

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
            methods: ['GET', 'POST']
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Register user
        socket.on('register', (userId) => {
            if (userId) {
                userSocketMap.set(userId, socket.id);
                socket.userId = userId;
                console.log(`User ${userId} registered with socket ${socket.id}`);
                
                // Join user's personal room
                socket.join(`user:${userId}`);
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            if (socket.userId) {
                userSocketMap.delete(socket.userId);
                console.log(`User ${socket.userId} disconnected`);
            }
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const getSocketId = (userId) => {
    return userSocketMap.get(userId);
};

export const emitToUser = (userId, event, data) => {
    try {
        const io = getIO();
        io.to(`user:${userId}`).emit(event, data);
        console.log(`Emitted ${event} to user ${userId}`);
    } catch (error) {
        console.error('Error emitting to user:', error);
    }
};

export const emitToMultipleUsers = (userIds, event, data) => {
    try {
        const io = getIO();
        userIds.forEach(userId => {
            io.to(`user:${userId}`).emit(event, data);
        });
        console.log(`Emitted ${event} to ${userIds.length} users`);
    } catch (error) {
        console.error('Error emitting to multiple users:', error);
    }
};

// Notification types
export const NOTIFICATION_TYPES = {
    NEW_JOB: 'new_job',
    APPLICATION_STATUS: 'application_status',
    NEW_APPLICANT: 'new_applicant',
    JOB_EXPIRING: 'job_expiring',
    PROFILE_VIEW: 'profile_view',
    SAVED_JOB_ALERT: 'saved_job_alert'
};
