import express from 'express';
import isAuthenticated from '../middlewares/isAuthenticated.js';
import { Application } from '../models/application.model.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Add note to application
 */
router.post('/:applicationId/notes', isAuthenticated, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { noteText } = req.body;
        const userId = req.id;

        if (!noteText || !noteText.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Note text is required'
            });
        }

        const application = await Application.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        application.notes.push({
            noteText: noteText.trim(),
            createdBy: userId,
            createdAt: new Date()
        });

        await application.save();

        // Populate the newly added note
        await application.populate('notes.createdBy', 'fullname email');

        const addedNote = application.notes[application.notes.length - 1];

        logger.info(`Note added to application ${applicationId} by user ${userId}`);

        return res.status(201).json({
            success: true,
            message: 'Note added successfully',
            note: addedNote
        });

    } catch (error) {
        logger.error('Error adding note:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add note'
        });
    }
});

/**
 * Update note
 */
router.put('/:applicationId/notes/:noteId', isAuthenticated, async (req, res) => {
    try {
        const { applicationId, noteId } = req.params;
        const { noteText } = req.body;
        const userId = req.id;

        if (!noteText || !noteText.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Note text is required'
            });
        }

        const application = await Application.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const note = application.notes.id(noteId);
        
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Only the creator can update the note
        if (note.createdBy.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own notes'
            });
        }

        note.noteText = noteText.trim();
        note.updatedAt = new Date();

        await application.save();
        await application.populate('notes.createdBy', 'fullname email');

        logger.info(`Note ${noteId} updated in application ${applicationId}`);

        return res.status(200).json({
            success: true,
            message: 'Note updated successfully',
            note
        });

    } catch (error) {
        logger.error('Error updating note:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update note'
        });
    }
});

/**
 * Delete note
 */
router.delete('/:applicationId/notes/:noteId', isAuthenticated, async (req, res) => {
    try {
        const { applicationId, noteId } = req.params;
        const userId = req.id;
        const userRole = req.user.role;

        const application = await Application.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        const note = application.notes.id(noteId);
        
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Only the creator or admin can delete the note
        if (note.createdBy.toString() !== userId && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own notes'
            });
        }

        note.deleteOne();
        await application.save();

        logger.info(`Note ${noteId} deleted from application ${applicationId}`);

        return res.status(200).json({
            success: true,
            message: 'Note deleted successfully'
        });

    } catch (error) {
        logger.error('Error deleting note:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete note'
        });
    }
});

/**
 * Get all notes for an application
 */
router.get('/:applicationId/notes', isAuthenticated, async (req, res) => {
    try {
        const { applicationId } = req.params;

        const application = await Application.findById(applicationId)
            .populate('notes.createdBy', 'fullname email profilePhoto');
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        return res.status(200).json({
            success: true,
            notes: application.notes.sort((a, b) => b.createdAt - a.createdAt)
        });

    } catch (error) {
        logger.error('Error fetching notes:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch notes'
        });
    }
});

/**
 * Bulk update application statuses
 */
router.put('/bulk-update', isAuthenticated, async (req, res) => {
    try {
        const { applicationIds, status } = req.body;
        const userId = req.id;

        if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Application IDs array is required'
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['pending', 'accepted', 'rejected', 'interview_scheduled', 'interview_confirmed', 'interview_declined'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const result = await Application.updateMany(
            { _id: { $in: applicationIds } },
            { 
                $set: { status },
                $push: {
                    statusHistory: {
                        status,
                        changedAt: new Date(),
                        changedBy: userId,
                        note: 'Bulk status update'
                    }
                }
            }
        );

        logger.info(`Bulk update: ${result.modifiedCount} applications updated to ${status} by user ${userId}`);

        return res.status(200).json({
            success: true,
            message: `${result.modifiedCount} applications updated successfully`,
            updatedCount: result.modifiedCount
        });

    } catch (error) {
        logger.error('Error in bulk update:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update applications'
        });
    }
});

export default router;
