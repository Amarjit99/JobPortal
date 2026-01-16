import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    provider: { type: String, required: true },
    duration: { type: String },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    skills: [{ type: String }],
    url: { type: String },
    price: { type: Number, default: 0 },
    rating: { type: Number, min: 0, max: 5 },
    thumbnail: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const assessmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    skillArea: { type: String, required: true },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        points: { type: Number, default: 1 }
    }],
    duration: { type: Number, default: 30 },
    passingScore: { type: Number, default: 70 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const mentorshipSchema = new mongoose.Schema({
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillAreas: [{ type: String }],
    status: { type: String, enum: ['pending', 'active', 'completed', 'cancelled'], default: 'pending' },
    sessions: [{
        scheduledAt: Date,
        duration: Number,
        topic: String,
        notes: String,
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' }
    }],
    startDate: { type: Date },
    endDate: { type: Date }
}, { timestamps: true });

export const Course = mongoose.model('Course', courseSchema);
export const CareerAssessment = mongoose.model('CareerAssessment', assessmentSchema);
export const Mentorship = mongoose.model('Mentorship', mentorshipSchema);
