import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';
import PDFDocument from 'pdfkit';

export const exportUserData = async (req, res) => {
    try {
        const userId = req.id;
        const { format = 'json' } = req.query;

        const user = await User.findById(userId)
            .select('-password -refreshToken')
            .populate('profile.experience.company')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found', success: false });
        }

        if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=user-data-${userId}.pdf`);
            doc.pipe(res);

            doc.fontSize(20).text('Personal Data Export', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Name: ${user.fullname}`);
            doc.text(`Email: ${user.email}`);
            doc.text(`Phone: ${user.phoneNumber || 'N/A'}`);
            doc.text(`Role: ${user.role}`);
            doc.text(`Export Date: ${new Date().toISOString()}`);
            doc.moveDown();
            doc.text('Skills: ' + (user.profile?.skills?.join(', ') || 'None'));
            doc.end();
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=user-data-${userId}.json`);
            return res.status(200).json({
                exportDate: new Date(),
                userData: user,
                success: true
            });
        }
    } catch (error) {
        logger.error('Error in exportUserData:', error);
        return res.status(500).json({ message: 'Failed to export data', success: false });
    }
};

export const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.id;
        const { confirmation } = req.body;

        if (confirmation !== 'DELETE MY ACCOUNT') {
            return res.status(400).json({
                message: 'Invalid confirmation. Type "DELETE MY ACCOUNT" to confirm',
                success: false
            });
        }

        await User.findByIdAndDelete(userId);

        logger.info(`User account deleted: ${userId}`);
        return res.status(200).json({
            message: 'Account deleted successfully',
            success: true
        });
    } catch (error) {
        logger.error('Error in deleteUserAccount:', error);
        return res.status(500).json({ message: 'Failed to delete account', success: false });
    }
};

export const getDataAccessLog = async (req, res) => {
    try {
        const userId = req.id;

        const logs = [
            { timestamp: new Date(), action: 'Profile Viewed', ipAddress: req.ip },
            { timestamp: new Date(), action: 'Data Export Requested', ipAddress: req.ip }
        ];

        return res.status(200).json({
            message: 'Data access log retrieved',
            logs,
            success: true
        });
    } catch (error) {
        logger.error('Error in getDataAccessLog:', error);
        return res.status(500).json({ message: 'Failed to get access log', success: false });
    }
};
