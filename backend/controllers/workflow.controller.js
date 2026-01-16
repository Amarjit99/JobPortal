import { ApplicationWorkflow } from '../models/applicationWorkflow.model.js';
import { Application } from '../models/application.model.js';
import logger from '../utils/logger.js';

export const createWorkflow = async (req, res) => {
    try {
        const userId = req.id;
        const { name, description, company, job, stages, webhooks, isDefault } = req.body;

        const workflow = await ApplicationWorkflow.create({
            name,
            description,
            company,
            job,
            stages,
            webhooks,
            isDefault,
            createdBy: userId
        });

        return res.status(201).json({
            message: 'Workflow created successfully',
            workflow,
            success: true
        });
    } catch (error) {
        logger.error('Error in createWorkflow:', error);
        return res.status(500).json({ message: 'Failed to create workflow', success: false });
    }
};

export const getWorkflows = async (req, res) => {
    try {
        const { companyId, page = 1, limit = 10 } = req.query;
        const match = { isActive: true };
        if (companyId) match.company = companyId;

        const workflows = await ApplicationWorkflow.find(match)
            .sort({ isDefault: -1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * limit)
            .populate('company', 'name')
            .populate('job', 'title');

        const total = await ApplicationWorkflow.countDocuments(match);

        return res.status(200).json({
            workflows,
            pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / limit), total },
            success: true
        });
    } catch (error) {
        logger.error('Error in getWorkflows:', error);
        return res.status(500).json({ message: 'Failed to get workflows', success: false });
    }
};

export const getWorkflowById = async (req, res) => {
    try {
        const workflow = await ApplicationWorkflow.findById(req.params.id)
            .populate('company', 'name')
            .populate('job', 'title')
            .populate('createdBy', 'fullname');

        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found', success: false });
        }

        return res.status(200).json({ workflow, success: true });
    } catch (error) {
        logger.error('Error in getWorkflowById:', error);
        return res.status(500).json({ message: 'Failed to get workflow', success: false });
    }
};

export const updateWorkflow = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const workflow = await ApplicationWorkflow.findByIdAndUpdate(id, updates, { new: true });
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found', success: false });
        }

        return res.status(200).json({
            message: 'Workflow updated successfully',
            workflow,
            success: true
        });
    } catch (error) {
        logger.error('Error in updateWorkflow:', error);
        return res.status(500).json({ message: 'Failed to update workflow', success: false });
    }
};

export const deleteWorkflow = async (req, res) => {
    try {
        const workflow = await ApplicationWorkflow.findByIdAndDelete(req.params.id);
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found', success: false });
        }

        return res.status(200).json({ message: 'Workflow deleted successfully', success: true });
    } catch (error) {
        logger.error('Error in deleteWorkflow:', error);
        return res.status(500).json({ message: 'Failed to delete workflow', success: false });
    }
};

export const applyWorkflowToApplication = async (req, res) => {
    try {
        const { workflowId, applicationId } = req.body;

        const workflow = await ApplicationWorkflow.findById(workflowId);
        if (!workflow) {
            return res.status(404).json({ message: 'Workflow not found', success: false });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Application not found', success: false });
        }

        // Apply workflow logic here (simplified)
        application.currentStage = workflow.stages[0].name;
        await application.save();

        return res.status(200).json({
            message: 'Workflow applied successfully',
            application,
            success: true
        });
    } catch (error) {
        logger.error('Error in applyWorkflowToApplication:', error);
        return res.status(500).json({ message: 'Failed to apply workflow', success: false });
    }
};
