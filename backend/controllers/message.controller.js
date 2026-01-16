import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import logger from "../utils/logger.js";
import { getIO, getSocketId } from "../utils/socket.js";

/**
 * Get all conversations for logged-in user
 */
export const getConversations = async (req, res) => {
    try {
        const userId = req.id;

        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'fullname email profile.profilePhoto')
        .populate('relatedJob', 'title')
        .populate('relatedApplication')
        .sort({ 'lastMessage.sentAt': -1 })
        .lean();

        // Add unread count for current user
        const conversationsWithUnread = conversations.map(conv => ({
            ...conv,
            unreadCount: conv.unreadCount?.get(userId.toString()) || 0
        }));

        return res.status(200).json({
            success: true,
            conversations: conversationsWithUnread
        });

    } catch (error) {
        logger.error('Error fetching conversations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch conversations'
        });
    }
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.id;

        // Verify user is part of conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: 'Conversation not found'
            });
        }

        if (!conversation.participants.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'You are not part of this conversation'
            });
        }

        const skip = (page - 1) * limit;

        const messages = await Message.find({
            conversationId,
            isDeleted: false
        })
        .populate('senderId', 'fullname profile.profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

        const total = await Message.countDocuments({ conversationId, isDeleted: false });

        return res.status(200).json({
            success: true,
            messages: messages.reverse(), // Oldest first
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error('Error fetching messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch messages'
        });
    }
};

/**
 * Send a message
 */
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content, conversationId, messageType = 'text', attachments, interviewData } = req.body;
        const senderId = req.id;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Find or create conversation
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: 'Conversation not found'
                });
            }
        } else {
            // Create new conversation
            conversation = await Conversation.findOne({
                participants: { $all: [senderId, receiverId] }
            });

            if (!conversation) {
                conversation = await Conversation.create({
                    participants: [senderId, receiverId],
                    unreadCount: new Map([[receiverId, 0]])
                });
            }
        }

        // Create message
        const message = await Message.create({
            conversationId: conversation._id,
            senderId,
            receiverId,
            content,
            messageType,
            attachments: attachments || [],
            interviewData: interviewData || undefined
        });

        // Update conversation
        const currentUnreadCount = conversation.unreadCount.get(receiverId.toString()) || 0;
        conversation.unreadCount.set(receiverId.toString(), currentUnreadCount + 1);
        
        conversation.lastMessage = {
            content,
            sentAt: new Date(),
            senderId
        };
        
        await conversation.save();

        // Populate sender info
        await message.populate('senderId', 'fullname profile.profilePhoto');

        // Emit via Socket.io for real-time delivery
        const receiverSocketId = getSocketId(receiverId);
        if (receiverSocketId) {
            const io = getIO();
            io.to(receiverSocketId).emit('new_message', {
                message,
                conversationId: conversation._id
            });
        }

        logger.info(`Message sent from ${senderId} to ${receiverId}`);

        return res.status(201).json({
            success: true,
            message: message,
            conversationId: conversation._id
        });

    } catch (error) {
        logger.error('Error sending message:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.id;

        // Update all unread messages in conversation
        await Message.updateMany(
            {
                conversationId,
                receiverId: userId,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        // Reset unread count in conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
            conversation.unreadCount.set(userId.toString(), 0);
            await conversation.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });

    } catch (error) {
        logger.error('Error marking messages as read:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark messages as read'
        });
    }
};

/**
 * Delete a message
 * @route DELETE /api/v1/messages/:id
 */
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Only sender can delete message
        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages'
            });
        }

        // Soft delete
        message.isDeleted = true;
        await message.save();

        // Emit via Socket.io
        const receiverSocketId = getSocketId(message.receiverId);
        if (receiverSocketId) {
            const io = getIO();
            io.to(receiverSocketId).emit('message_deleted', {
                messageId: id,
                conversationId: message.conversationId
            });
        }

        logger.info(`Message ${id} deleted by user ${userId}`);

        return res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        logger.error('Error deleting message:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete message'
        });
    }
};

/**
 * Search messages
 * @route GET /api/v1/messages/search
 */
export const searchMessages = async (req, res) => {
    try {
        const userId = req.id;
        const { query, conversationId, page = 1, limit = 20 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const searchFilter = {
            $or: [
                { senderId: userId },
                { receiverId: userId }
            ],
            content: { $regex: query, $options: 'i' },
            isDeleted: false
        };

        if (conversationId) {
            searchFilter.conversationId = conversationId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const messages = await Message.find(searchFilter)
            .populate('senderId', 'fullname profile.profilePhoto')
            .populate('receiverId', 'fullname profile.profilePhoto')
            .populate('conversationId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Message.countDocuments(searchFilter);

        return res.status(200).json({
            success: true,
            messages,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        logger.error('Error searching messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search messages'
        });
    }
};

/**
 * Emit typing indicator
 * @route POST /api/v1/messages/typing
 */
export const emitTyping = async (req, res) => {
    try {
        const { conversationId, receiverId, isTyping } = req.body;
        const senderId = req.id;

        // Emit via Socket.io
        const receiverSocketId = getSocketId(receiverId);
        if (receiverSocketId) {
            const io = getIO();
            io.to(receiverSocketId).emit('user_typing', {
                conversationId,
                senderId,
                isTyping
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Typing indicator sent'
        });

    } catch (error) {
        logger.error('Error emitting typing indicator:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to emit typing indicator'
        });
    }
};

export default {
    getConversations,
    getMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    searchMessages,
    emitTyping
};
