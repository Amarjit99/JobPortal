import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'interview_invite', 'system'],
        default: 'text'
    },
    attachments: [{
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number
    }],
    // Interview invitation data (if messageType is 'interview_invite')
    interviewData: {
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application'
        },
        scheduledDate: Date,
        scheduledTime: String,
        location: String,
        meetingLink: String,
        interviewType: {
            type: String,
            enum: ['in-person', 'phone', 'video']
        },
        notes: String
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ isRead: 1 });

export const Message = mongoose.model('Message', messageSchema);
