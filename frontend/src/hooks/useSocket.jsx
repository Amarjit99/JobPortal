import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const { user } = useSelector(store => store.auth);

    useEffect(() => {
        if (!user) {
            // Disconnect socket if user logs out
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
                setNotifications([]);
            }
            return;
        }

        // Create socket connection
        const newSocket = io('http://localhost:8000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setConnected(true);
            // Register user with their ID
            newSocket.emit('register', user._id);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setConnected(false);
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setConnected(false);
        });

        // Listen for notifications
        newSocket.on('new_job', (data) => {
            console.log('New job notification:', data);
            toast.success(`New Job Posted: ${data.title}`, {
                description: `${data.jobType} in ${data.location}`,
                duration: 5000,
            });
            setNotifications(prev => [{
                id: Date.now(),
                type: 'new_job',
                data,
                timestamp: new Date(),
                read: false
            }, ...prev]);
        });

        newSocket.on('application_status', (data) => {
            console.log('Application status update:', data);
            const statusColors = {
                'accepted': '✅',
                'rejected': '❌',
                'pending': '⏳'
            };
            toast.info(`Application Update ${statusColors[data.status] || '📋'}`, {
                description: `${data.jobTitle} - Status: ${data.status.toUpperCase()}${data.message ? '\n' + data.message : ''}`,
                duration: 6000,
            });
            setNotifications(prev => [{
                id: Date.now(),
                type: 'application_status',
                data,
                timestamp: new Date(),
                read: false
            }, ...prev]);
        });

        newSocket.on('new_applicant', (data) => {
            console.log('New applicant notification:', data);
            toast.info('New Application Received', {
                description: `${data.applicantName} applied for ${data.jobTitle}`,
                duration: 5000,
            });
            setNotifications(prev => [{
                id: Date.now(),
                type: 'new_applicant',
                data,
                timestamp: new Date(),
                read: false
            }, ...prev]);
        });

        newSocket.on('job_expiring', (data) => {
            console.log('Job expiring notification:', data);
            toast.warning('Job Expiring Soon', {
                description: `${data.title} expires in ${data.daysLeft} days`,
                duration: 5000,
            });
            setNotifications(prev => [{
                id: Date.now(),
                type: 'job_expiring',
                data,
                timestamp: new Date(),
                read: false
            }, ...prev]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId ? { ...notif, read: true } : notif
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notif => ({ ...notif, read: true }))
        );
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    const value = {
        socket,
        connected,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        markAsRead,
        markAllAsRead,
        clearNotifications
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};
