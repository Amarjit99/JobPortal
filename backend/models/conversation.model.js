import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        content: String,
        sentAt: Date,
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    unreadCount: {
        type: Map,
        of: Number,
        default: {}
    },
    // Typing indicators
    typing: {
        type: Map,
        of: Boolean,
        default: {}
    },
    // For job-related conversations
    relatedJob: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    relatedApplication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    // Conversation status
    isActive: {
        type: Boolean,
        default: true
    },
    // Archived by users
    archivedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// Index for finding conversations by participants
conversationSchema.index({ participants: 1 });
conversationSchema.index({ 'lastMessage.sentAt': -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
