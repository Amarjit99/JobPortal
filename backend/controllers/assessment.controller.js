import { Assessment } from "../models/assessment.model.js";
import { UserAssessment } from "../models/userAssessment.model.js";
import logger from "../utils/logger.js";

// Get available assessments with optional skill filtering
export const getAvailableAssessments = async (req, res) => {
    try {
        const { skill, category, level, page = 1, limit = 20 } = req.query;

        let query = { isActive: true, isPublic: true };

        // Filter by skill
        if (skill) {
            query.skills = { $in: [skill] };
        }

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by level
        if (level) {
            query.level = level;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const assessments = await Assessment.find(query)
            .select('title description skills category level duration passingScore stats tags prerequisites')
            .sort({ 'stats.totalAttempts': -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalAssessments = await Assessment.countDocuments(query);

        return res.status(200).json({
            success: true,
            assessments,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalAssessments / parseInt(limit)),
                totalAssessments,
                hasMore: skip + assessments.length < totalAssessments
            }
        });

    } catch (error) {
        logger.error('Error fetching assessments:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch assessments'
        });
    }
};

// Start an assessment
export const startAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const assessment = await Assessment.findById(id);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment not found'
            });
        }

        if (!assessment.isActive) {
            return res.status(400).json({
                success: false,
                message: 'This assessment is not currently available'
            });
        }

        // Check if user already has an in-progress assessment
        const existingInProgress = await UserAssessment.findOne({
            user: userId,
            assessment: id,
            status: 'in-progress'
        });

        if (existingInProgress) {
            // Check if expired
            if (existingInProgress.hasExpired()) {
                existingInProgress.status = 'expired';
                await existingInProgress.save();
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Resuming existing assessment',
                    userAssessment: existingInProgress,
                    questions: assessment.questions.map(q => ({
                        _id: q._id,
                        questionText: q.questionText,
                        questionType: q.questionType,
                        options: q.options,
                        points: q.points,
                        codeTemplate: q.codeTemplate
                    }))
                });
            }
        }

        // Calculate expiration time
        const expiresAt = new Date(Date.now() + assessment.duration * 60 * 1000);

        // Create new assessment attempt
        const userAssessment = new UserAssessment({
            user: userId,
            assessment: id,
            allowedDuration: assessment.duration,
            expiresAt: expiresAt,
            totalPoints: assessment.totalPoints,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        });

        // Get attempt number
        const previousAttempts = await UserAssessment.countDocuments({
            user: userId,
            assessment: id,
            status: { $in: ['completed', 'expired'] }
        });
        userAssessment.attemptNumber = previousAttempts + 1;

        await userAssessment.save();

        // Return questions without correct answers
        const questions = assessment.questions.map(q => ({
            _id: q._id,
            questionText: q.questionText,
            questionType: q.questionType,
            options: q.options,
            points: q.points,
            codeTemplate: q.codeTemplate,
            skillsTested: q.skillsTested
        }));

        logger.info(`User ${userId} started assessment ${id}`);

        return res.status(201).json({
            success: true,
            message: 'Assessment started successfully',
            userAssessment: {
                _id: userAssessment._id,
                expiresAt: userAssessment.expiresAt,
                allowedDuration: userAssessment.allowedDuration,
                attemptNumber: userAssessment.attemptNumber
            },
            assessment: {
                title: assessment.title,
                description: assessment.description,
                duration: assessment.duration,
                totalPoints: assessment.totalPoints,
                passingScore: assessment.passingScore
            },
            questions
        });

    } catch (error) {
        logger.error('Error starting assessment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to start assessment'
        });
    }
};

// Submit assessment
export const submitAssessment = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;
        const userId = req.id;

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: 'Answers array is required'
            });
        }

        const userAssessment = await UserAssessment.findById(id)
            .populate('assessment');

        if (!userAssessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment attempt not found'
            });
        }

        // Authorization check
        if (userAssessment.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to submit this assessment'
            });
        }

        // Check if already completed
        if (userAssessment.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Assessment already submitted'
            });
        }

        // Check if expired
        if (userAssessment.hasExpired()) {
            userAssessment.status = 'expired';
            await userAssessment.save();
            return res.status(400).json({
                success: false,
                message: 'Assessment time has expired'
            });
        }

        // Store answers
        userAssessment.answers = answers;

        // Calculate score
        userAssessment.calculateScore(userAssessment.assessment);

        await userAssessment.save();

        // Update assessment statistics
        await userAssessment.assessment.updateStats(userAssessment.score, userAssessment.passed);

        // Populate for response
        await userAssessment.populate('assessment', 'title skills category level');

        logger.info(`User ${userId} submitted assessment ${id} with score ${userAssessment.score}`);

        return res.status(200).json({
            success: true,
            message: 'Assessment submitted successfully',
            results: {
                score: userAssessment.score,
                passed: userAssessment.passed,
                pointsEarned: userAssessment.pointsEarned,
                totalPoints: userAssessment.totalPoints,
                timeSpent: userAssessment.timeSpent,
                skillBreakdown: userAssessment.skillBreakdown,
                completedAt: userAssessment.completedAt
            }
        });

    } catch (error) {
        logger.error('Error submitting assessment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit assessment'
        });
    }
};

// Get assessment results with detailed statistics
export const getAssessmentResults = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.id;

        const userAssessment = await UserAssessment.findById(id)
            .populate('assessment', 'title description skills category level passingScore questions')
            .populate('user', 'fullname email');

        if (!userAssessment) {
            return res.status(404).json({
                success: false,
                message: 'Assessment results not found'
            });
        }

        // Authorization: User can see own results, recruiters/admins can see all
        if (userAssessment.user._id.toString() !== userId && req.role !== 'admin' && req.role !== 'recruiter') {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view these results'
            });
        }

        if (userAssessment.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Assessment not yet completed'
            });
        }

        // Build detailed results with correct answers (only for completed assessments)
        const detailedAnswers = userAssessment.answers.map(answer => {
            const question = userAssessment.assessment.questions.find(
                q => q._id.toString() === answer.questionId.toString()
            );

            return {
                questionId: answer.questionId,
                questionText: answer.questionText,
                userAnswer: answer.userAnswer,
                correctAnswer: question?.correctAnswer,
                isCorrect: answer.isCorrect,
                pointsEarned: answer.pointsEarned,
                explanation: question?.explanation,
                timeSpent: answer.timeSpent
            };
        });

        // Get user's assessment history for this assessment
        const history = await UserAssessment.find({
            user: userAssessment.user._id,
            assessment: userAssessment.assessment._id,
            status: 'completed'
        })
        .select('score passed completedAt attemptNumber')
        .sort({ completedAt: -1 })
        .lean();

        return res.status(200).json({
            success: true,
            results: {
                assessmentTitle: userAssessment.assessment.title,
                score: userAssessment.score,
                passed: userAssessment.passed,
                passingScore: userAssessment.assessment.passingScore,
                pointsEarned: userAssessment.pointsEarned,
                totalPoints: userAssessment.totalPoints,
                timeSpent: userAssessment.timeSpent,
                allowedDuration: userAssessment.allowedDuration,
                completedAt: userAssessment.completedAt,
                attemptNumber: userAssessment.attemptNumber,
                skillBreakdown: userAssessment.skillBreakdown,
                detailedAnswers: detailedAnswers,
                attemptHistory: history,
                certificate: userAssessment.certificate
            }
        });

    } catch (error) {
        logger.error('Error fetching assessment results:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch results'
        });
    }
};

// Get user's assessment history
export const getMyAssessments = async (req, res) => {
    try {
        const userId = req.id;
        const { status, page = 1, limit = 20 } = req.query;

        let query = { user: userId };

        if (status) {
            query.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const assessments = await UserAssessment.find(query)
            .populate('assessment', 'title skills category level passingScore')
            .sort({ completedAt: -1, startedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const totalAssessments = await UserAssessment.countDocuments(query);

        // Get overall statistics
        const stats = await UserAssessment.getUserAverageScore(userId);

        return res.status(200).json({
            success: true,
            assessments,
            stats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalAssessments / parseInt(limit)),
                totalAssessments,
                hasMore: skip + assessments.length < totalAssessments
            }
        });

    } catch (error) {
        logger.error('Error fetching user assessments:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch assessments'
        });
    }
};

export default {
    getAvailableAssessments,
    startAssessment,
    submitAssessment,
    getAssessmentResults,
    getMyAssessments
};
