import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true
    },
    description:{
        type:String, 
    },
    website:{
        type:String 
    },
    location:{
        type:String 
    },
    logo:{
        type:String // URL to company logo
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    // Company Verification
    verification: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'resubmitted'],
            default: 'pending'
        },
        documents: {
            gstCertificate: {
                url: String,
                uploadedAt: Date
            },
            panCard: {
                url: String,
                uploadedAt: Date
            },
            registrationCertificate: {
                url: String,
                uploadedAt: Date
            }
        },
        verifiedAt: Date,
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rejectionReason: String,
        submittedAt: Date,
        resubmissionCount: {
            type: Number,
            default: 0
        }
    },
    // Additional company details
    industry: {
        type: String,
        enum: [
            'IT/Software',
            'Finance/Banking',
            'Healthcare',
            'Education',
            'E-commerce',
            'Manufacturing',
            'Consulting',
            'Media/Entertainment',
            'Real Estate',
            'Hospitality',
            'Other'
        ]
    },
    companySize: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
    },
    foundedYear: Number,
    headquarters: String
},{timestamps:true})

// Indexes for performance (name index already created by unique: true)
companySchema.index({ userId: 1 });
companySchema.index({ createdAt: -1 });

export const Company = mongoose.model("Company", companySchema);