import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, connected } = useSocket();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_job':
                return '💼';
            case 'application_status':
                return '📋';
            case 'new_applicant':
                return '👤';
            case 'job_expiring':
                return '⏰';
            default:
                return '🔔';
        }
    };

    const getNotificationMessage = (notification) => {
        const { type, data } = notification;
        switch (type) {
            case 'new_job':
                return {
                    title: 'New Job Posted',
                    description: `${data.title} in ${data.location}`,
                    action: () => navigate(`/description/${data.jobId}`)
                };
            case 'application_status':
                return {
                    title: 'Application Status Updated',
                    description: `${data.jobTitle} - ${data.status.toUpperCase()}`,
                    action: () => navigate('/profile')
                };
            case 'new_applicant':
                return {
                    title: 'New Application',
                    description: `${data.applicantName} applied for ${data.jobTitle}`,
                    action: () => navigate(`/admin/jobs/${data.jobId}/applicants`)
                };
            case 'job_expiring':
                return {
                    title: 'Job Expiring Soon',
                    description: `${data.title} expires in ${data.daysLeft} days`,
                    action: () => navigate('/admin/jobs')
                };
            default:
                return {
                    title: 'Notification',
                    description: 'You have a new notification',
                    action: null
                };
        }
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        const { action } = getNotificationMessage(notification);
        if (action) {
            action();
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" className="relative p-2">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                    {!connected && (
                        <span className="absolute bottom-0 right-0 h-2 w-2 bg-gray-400 rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex gap-2">
                        {notifications.length > 0 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    className="h-8 px-2"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearNotifications}
                                    className="h-8 px-2"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <Bell className="h-12 w-12 mb-2 opacity-50" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => {
                                const { title, description } = getNotificationMessage(notification);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            !notification.read ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl flex-shrink-0">
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium text-sm truncate">{title}</p>
                                                    {!notification.read && (
                                                        <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                    {description}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDistanceToNow(new Date(notification.timestamp), {
                                                        addSuffix: true
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
                {!connected && (
                    <div className="p-2 bg-yellow-50 border-t text-xs text-center text-yellow-800">
                        Reconnecting...
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
};

export default NotificationBell;
