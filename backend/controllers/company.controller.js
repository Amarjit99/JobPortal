import { Company } from "../models/company.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import logger from "../utils/logger.js";
import { cacheHelper, cacheKeys, TTL } from "../utils/redis.js";

export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }
        let company = await Company.findOne({ name: companyName });
        if (company) {
            return res.status(400).json({
                message: "You can't register same company.",
                success: false
            })
        };
        company = await Company.create({
            name: companyName,
            userId: req.id
        });

        // Invalidate company list cache for this user
        await cacheHelper.del(cacheKeys.allCompanies(req.id));

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true
        })
    } catch (error) {
        logger.error('Error in registerCompany:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export const getCompany = async (req, res) => {
    try {
        const userId = req.id; // logged in user id
        
        // Check cache first
        const cacheKey = cacheKeys.allCompanies(userId);
        const cachedData = await cacheHelper.get(cacheKey);
        if (cachedData) {
            logger.info('Serving companies from cache');
            return res.status(200).json(cachedData);
        }
        
        const companies = await Company.find({ userId });
        if (!companies) {
            return res.status(404).json({
                message: "Companies not found.",
                success: false
            })
        }
        
        const responseData = {
            companies,
            success: true
        };
        
        // Cache for 15 minutes
        await cacheHelper.set(cacheKey, responseData, TTL.LONG);
        
        return res.status(200).json(responseData);
    } catch (error) {
        logger.error('Error in getCompany:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
// get company by id
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        
        // Check cache first
        const cacheKey = cacheKeys.companyById(companyId);
        const cachedData = await cacheHelper.get(cacheKey);
        if (cachedData) {
            logger.info(`Serving company ${companyId} from cache`);
            return res.status(200).json(cachedData);
        }
        
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        
        const responseData = {
            company,
            success: true
        };
        
        // Cache for 1 hour
        await cacheHelper.set(cacheKey, responseData, TTL.VERY_LONG);
        
        return res.status(200).json(responseData);
    } catch (error) {
        logger.error('Error in getCompanyById:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
 
        const updateData = { name, description, website, location };

        // Handle optional logo upload
        const file = req.file;
        if(file){
            const fileUri = getDataUri(file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            updateData.logo = cloudResponse.secure_url;
        }

        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        
        // Invalidate caches
        await cacheHelper.del(cacheKeys.companyById(req.params.id));
        await cacheHelper.del(cacheKeys.allCompanies(company.userId));
        await cacheHelper.delPattern('jobs:all:*'); // Jobs contain company data
        
        return res.status(200).json({
            message:"Company information updated.",
            success:true
        })

    } catch (error) {
        logger.error('Error in updateCompany:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}

// Upload verification documents
export const uploadVerificationDocuments = async (req, res) => {
    try {
        const companyId = req.params.id;
        const userId = req.id;
        
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }
        
        // Check if user owns this company
        if (company.userId.toString() !== userId) {
            return res.status(403).json({
                message: "You don't have permission to upload documents for this company.",
                success: false
            });
        }
        
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                message: "No documents uploaded.",
                success: false
            });
        }
        
        // Upload documents to Cloudinary
        const documents = {};
        
        if (req.files.gstCertificate) {
            const gstFile = req.files.gstCertificate[0];
            const gstUri = getDataUri(gstFile);
            const gstResult = await cloudinary.uploader.upload(gstUri.content, {
                folder: 'company_verification/gst',
                resource_type: 'auto'
            });
            documents.gstCertificate = {
                url: gstResult.secure_url,
                uploadedAt: new Date()
            };
        }
        
        if (req.files.panCard) {
            const panFile = req.files.panCard[0];
            const panUri = getDataUri(panFile);
            const panResult = await cloudinary.uploader.upload(panUri.content, {
                folder: 'company_verification/pan',
                resource_type: 'auto'
            });
            documents.panCard = {
                url: panResult.secure_url,
                uploadedAt: new Date()
            };
        }
        
        if (req.files.registrationCertificate) {
            const regFile = req.files.registrationCertificate[0];
            const regUri = getDataUri(regFile);
            const regResult = await cloudinary.uploader.upload(regUri.content, {
                folder: 'company_verification/registration',
                resource_type: 'auto'
            });
            documents.registrationCertificate = {
                url: regResult.secure_url,
                uploadedAt: new Date()
            };
        }
        
        // Update company with verification documents
        company.verification.documents = {
            ...company.verification.documents,
            ...documents
        };
        company.verification.submittedAt = new Date();
        
        // If resubmitting after rejection
        if (company.verification.status === 'rejected') {
            company.verification.status = 'resubmitted';
            company.verification.resubmissionCount += 1;
        } else {
            company.verification.status = 'pending';
        }
        
        await company.save();
        
        // Invalidate caches
        await cacheHelper.del(cacheKeys.companyById(companyId));
        await cacheHelper.del(cacheKeys.allCompanies(userId));
        
        logger.info(`Verification documents uploaded for company ${companyId}`);
        
        return res.status(200).json({
            message: "Verification documents uploaded successfully.",
            company,
            success: true
        });
        
    } catch (error) {
        logger.error('Error in uploadVerificationDocuments:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}