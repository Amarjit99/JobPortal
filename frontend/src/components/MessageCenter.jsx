import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from '@/utils/axios';
import { toast } from 'sonner';
import { Send, Paperclip, MoreVertical, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { io } from 'socket.io-client';

const MESSAGE_API_END_POINT = "http://localhost:8000/api/v1/messages";

const MessageCenter = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageContent, setMessageContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const { user } = useSelector(store => store.auth);

    // Initialize Socket.io connection
    useEffect(() => {
        socketRef.current = io('http://localhost:8000', {
            auth: {
                userId: user?._id
            }
        });

        // Listen for new messages
        socketRef.current.on('new_message', ({ message, conversationId }) => {
            // Update messages if viewing this conversation
            if (selectedConversation?._id === conversationId) {
                setMessages(prev => [...prev, message]);
                markConversationAsRead(conversationId);
            }

            // Update conversation list
            fetchConversations();
        });

        // Listen for interview invitations
        socketRef.current.on('interview_invitation', ({ invitation, job }) => {
            toast.success(`New interview invitation for ${job.title}`);
            fetchConversations();
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user, selectedConversation]);

    // Fetch conversations
    const fetchConversations = async () => {
        try {
            const res = await axios.get(`${MESSAGE_API_END_POINT}/conversations`, {
                withCredentials: true
            });
            if (res.data.success) {
                setConversations(res.data.conversationsWithUnread);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Fetch messages for selected conversation
    const fetchMessages = async (conversationId) => {
        try {
            setLoading(true);
            const res = await axios.get(`${MESSAGE_API_END_POINT}/${conversationId}/messages`, {
                withCredentials: true
            });
            if (res.data.success) {
                setMessages(res.data.messages);
                markConversationAsRead(conversationId);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    // Mark conversation as read
    const markConversationAsRead = async (conversationId) => {
        try {
            await axios.put(`${MESSAGE_API_END_POINT}/${conversationId}/read`, {}, {
                withCredentials: true
            });
            // Update unread count in conversation list
            setConversations(prev => prev.map(conv => 
                conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Send message
    const sendMessage = async (e) => {
        e.preventDefault();
        if (!messageContent.trim() || !selectedConversation) return;

        try {
            const otherParticipant = selectedConversation.participants.find(
                p => p._id !== user._id
            );

            const res = await axios.post(`${MESSAGE_API_END_POINT}/send`, {
                receiverId: otherParticipant._id,
                content: messageContent,
                conversationId: selectedConversation._id,
                messageType: 'text'
            }, {
                withCredentials: true
            });

            if (res.data.success) {
                setMessages(prev => [...prev, res.data.message]);
                setMessageContent('');
                fetchConversations(); // Update conversation list with latest message
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        }
    };

    // Load conversations on mount
    useEffect(() => {
        fetchConversations();
    }, []);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle conversation selection
    const handleConversationSelect = (conversation) => {
        setSelectedConversation(conversation);
        fetchMessages(conversation._id);
    };

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv => {
        const otherParticipant = conv.participants.find(p => p._id !== user._id);
        return otherParticipant?.fullname?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Format timestamp
    const formatTime = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return messageDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Conversations Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold mb-3">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            type="text"
                            placeholder="Search conversations..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No conversations yet
                        </div>
                    ) : (
                        filteredConversations.map(conversation => {
                            const otherParticipant = conversation.participants.find(
                                p => p._id !== user._id
                            );
                            const isSelected = selectedConversation?._id === conversation._id;

                            return (
                                <div
                                    key={conversation._id}
                                    onClick={() => handleConversationSelect(conversation)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar>
                                            <AvatarImage 
                                                src={otherParticipant?.profile?.profilePhoto} 
                                                alt={otherParticipant?.fullname} 
                                            />
                                            <AvatarFallback>
                                                {otherParticipant?.fullname?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-medium text-sm truncate">
                                                    {otherParticipant?.fullname}
                                                </h3>
                                                {conversation.lastMessage && (
                                                    <span className="text-xs text-gray-500">
                                                        {formatTime(conversation.lastMessage.sentAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-600 truncate">
                                                    {conversation.lastMessage?.content || 'No messages yet'}
                                                </p>
                                                {conversation.unreadCount > 0 && (
                                                    <Badge 
                                                        variant="destructive" 
                                                        className="ml-2 h-5 min-w-5 flex items-center justify-center text-xs"
                                                    >
                                                        {conversation.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                            {conversation.relatedJob && (
                                                <p className="text-xs text-blue-600 mt-1 truncate">
                                                    Re: {conversation.relatedJob.title}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Message Thread */}
            <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                    <>
                        {/* Thread Header */}
                        <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage 
                                        src={selectedConversation.participants.find(p => p._id !== user._id)?.profile?.profilePhoto}
                                        alt={selectedConversation.participants.find(p => p._id !== user._id)?.fullname}
                                    />
                                    <AvatarFallback>
                                        {selectedConversation.participants.find(p => p._id !== user._id)?.fullname?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold">
                                        {selectedConversation.participants.find(p => p._id !== user._id)?.fullname}
                                    </h3>
                                    {selectedConversation.relatedJob && (
                                        <p className="text-xs text-gray-500">
                                            {selectedConversation.relatedJob.title}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="text-center py-8 text-gray-500">
                                    Loading messages...
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                messages.map((message, index) => {
                                    const isSender = message.senderId._id === user._id;
                                    const showAvatar = index === 0 || messages[index - 1].senderId._id !== message.senderId._id;

                                    return (
                                        <div
                                            key={message._id}
                                            className={`flex gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isSender && showAvatar && (
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage 
                                                        src={message.senderId.profile?.profilePhoto} 
                                                        alt={message.senderId.fullname} 
                                                    />
                                                    <AvatarFallback>
                                                        {message.senderId.fullname?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            {!isSender && !showAvatar && <div className="w-8" />}
                                            
                                            <div className={`max-w-md ${isSender ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {message.messageType === 'interview_invite' ? (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge variant="outline" className="bg-blue-100">
                                                                Interview Invitation
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm whitespace-pre-line">
                                                            {message.content}
                                                        </div>
                                                        {message.interviewData?.meetingLink && (
                                                            <a 
                                                                href={message.interviewData.meetingLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 text-sm underline mt-2 inline-block"
                                                            >
                                                                Join Meeting
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`rounded-lg px-4 py-2 ${
                                                            isSender
                                                                ? 'bg-blue-600 text-white'
                                                                : 'bg-gray-200 text-gray-900'
                                                        }`}
                                                    >
                                                        <p className="text-sm whitespace-pre-line">
                                                            {message.content}
                                                        </p>
                                                    </div>
                                                )}
                                                <span className="text-xs text-gray-500 mt-1">
                                                    {formatTime(message.createdAt)}
                                                </span>
                                            </div>

                                            {isSender && showAvatar && (
                                                <Avatar className="w-8 h-8">
                                                    <AvatarImage 
                                                        src={message.senderId.profile?.profilePhoto} 
                                                        alt={message.senderId.fullname} 
                                                    />
                                                    <AvatarFallback>
                                                        {message.senderId.fullname?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            )}
                                            {isSender && !showAvatar && <div className="w-8" />}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <Button type="button" variant="ghost" size="icon">
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <Input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={!messageContent.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a conversation to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageCenter;
