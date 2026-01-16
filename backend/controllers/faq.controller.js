import { FAQ } from "../models/faq.model.js";

// Get all FAQs for public (published only)
export const getPublicFAQs = async (req, res) => {
    try {
        const { category, search } = req.query;

        const query = { isPublished: true };
        
        if (category) {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { question: { $regex: search, $options: 'i' } },
                { answer: { $regex: search, $options: 'i' } }
            ];
        }

        const faqs = await FAQ.find(query).sort({ category: 1, order: 1 });

        return res.status(200).json({
            success: true,
            faqs
        });
    } catch (error) {
        console.error('Get public FAQs error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get all FAQs for admin (including unpublished)
export const getAllFAQs = async (req, res) => {
    try {
        const { category } = req.query;

        const query = {};
        if (category) {
            query.category = category;
        }

        const faqs = await FAQ.find(query)
            .populate('lastModifiedBy', 'fullname email')
            .sort({ category: 1, order: 1 });

        return res.status(200).json({
            success: true,
            faqs
        });
    } catch (error) {
        console.error('Get all FAQs error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Get FAQ by ID
export const getFAQById = async (req, res) => {
    try {
        const faq = await FAQ.findById(req.params.id)
            .populate('lastModifiedBy', 'fullname email');

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        return res.status(200).json({
            success: true,
            faq
        });
    } catch (error) {
        console.error('Get FAQ error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Create FAQ (admin)
export const createFAQ = async (req, res) => {
    try {
        const { question, answer, category, order } = req.body;
        const adminId = req.id;

        if (!question || !answer) {
            return res.status(400).json({
                success: false,
                message: "Question and answer are required"
            });
        }

        const faq = await FAQ.create({
            question,
            answer,
            category: category || 'general',
            order: order || 0,
            lastModifiedBy: adminId
        });

        console.log(`FAQ created by admin ${adminId}`);

        return res.status(201).json({
            success: true,
            message: "FAQ created successfully",
            faq
        });
    } catch (error) {
        console.error('Create FAQ error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update FAQ (admin)
export const updateFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const adminId = req.id;

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        const allowedFields = ['question', 'answer', 'category', 'order', 'isPublished'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                faq[field] = updates[field];
            }
        });

        faq.lastModifiedBy = adminId;
        await faq.save();

        console.log(`FAQ updated by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: "FAQ updated successfully",
            faq
        });
    } catch (error) {
        console.error('Update FAQ error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Delete FAQ (admin)
export const deleteFAQ = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.id;

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        await faq.deleteOne();

        console.log(`FAQ deleted by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: "FAQ deleted successfully"
        });
    } catch (error) {
        console.error('Delete FAQ error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Toggle FAQ published status (admin)
export const toggleFAQStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.id;

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        faq.isPublished = !faq.isPublished;
        faq.lastModifiedBy = adminId;
        await faq.save();

        console.log(`FAQ ${faq.isPublished ? 'published' : 'unpublished'} by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: `FAQ ${faq.isPublished ? 'published' : 'unpublished'}`,
            faq
        });
    } catch (error) {
        console.error('Toggle FAQ error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Record view (public)
export const recordFAQView = async (req, res) => {
    try {
        const { id } = req.params;

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        await faq.recordView();

        return res.status(200).json({
            success: true,
            message: "View recorded"
        });
    } catch (error) {
        console.error('Record view error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Record feedback (public)
export const recordFAQFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { helpful } = req.body;

        const faq = await FAQ.findById(id);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: "FAQ not found"
            });
        }

        await faq.recordFeedback(helpful);

        return res.status(200).json({
            success: true,
            message: "Feedback recorded"
        });
    } catch (error) {
        console.error('Record feedback error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Reorder FAQs (admin)
export const reorderFAQs = async (req, res) => {
    try {
        const { updates } = req.body; // Array of { id, order }
        const adminId = req.id;

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                message: "Updates array is required"
            });
        }

        await Promise.all(
            updates.map(update =>
                FAQ.findByIdAndUpdate(
                    update.id,
                    { order: update.order, lastModifiedBy: adminId }
                )
            )
        );

        console.log(`FAQs reordered by admin ${adminId}`);

        return res.status(200).json({
            success: true,
            message: "FAQs reordered successfully"
        });
    } catch (error) {
        console.error('Reorder FAQs error:', error);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
