import { Course, CareerAssessment, Mentorship } from '../models/careerDevelopment.model.js';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

export const getCourseRecommendations = async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId).select('profile');

        const userSkills = user?.profile?.skills || [];
        
        const courses = await Course.find({
            isActive: true,
            $or: [
                { skills: { $in: userSkills } },
                { level: user?.profile?.experienceLevel || 'beginner' }
            ]
        }).limit(10).lean();

        return res.status(200).json({
            message: 'Course recommendations retrieved',
            courses,
            success: true
        });
    } catch (error) {
        logger.error('Error in getCourseRecommendations:', error);
        return res.status(500).json({ message: 'Failed to get recommendations', success: false });
    }
};

export const getAssessments = async (req, res) => {
    try {
        const { skillArea } = req.query;

        const query = { isActive: true };
        if (skillArea) query.skillArea = skillArea;

        const assessments = await CareerAssessment.find(query).select('-questions.correctAnswer').lean();

        return res.status(200).json({
            message: 'Assessments retrieved',
            assessments,
            success: true
        });
    } catch (error) {
        logger.error('Error in getAssessments:', error);
        return res.status(500).json({ message: 'Failed to get assessments', success: false });
    }
};

export const submitAssessment = async (req, res) => {
    try {
        const { assessmentId, answers } = req.body;

        const assessment = await CareerAssessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found', success: false });
        }

        let score = 0;
        assessment.questions.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) {
                score += q.points;
            }
        });

        const totalPoints = assessment.questions.reduce((sum, q) => sum + q.points, 0);
        const percentage = Math.round((score / totalPoints) * 100);
        const passed = percentage >= assessment.passingScore;

        return res.status(200).json({
            message: 'Assessment submitted',
            score,
            totalPoints,
            percentage,
            passed,
            success: true
        });
    } catch (error) {
        logger.error('Error in submitAssessment:', error);
        return res.status(500).json({ message: 'Failed to submit assessment', success: false });
    }
};

export const requestMentorship = async (req, res) => {
    try {
        const menteeId = req.id;
        const { mentorId, skillAreas } = req.body;

        if (menteeId === mentorId) {
            return res.status(400).json({ message: 'Cannot request mentorship from yourself', success: false });
        }

        const mentor = await User.findById(mentorId);
        if (!mentor || mentor.role !== 'recruiter') {
            return res.status(404).json({ message: 'Mentor not found', success: false });
        }

        const mentorship = new Mentorship({
            mentor: mentorId,
            mentee: menteeId,
            skillAreas,
            status: 'pending'
        });

        await mentorship.save();

        return res.status(201).json({
            message: 'Mentorship request sent',
            mentorship,
            success: true
        });
    } catch (error) {
        logger.error('Error in requestMentorship:', error);
        return res.status(500).json({ message: 'Failed to request mentorship', success: false });
    }
};

export const getMentorships = async (req, res) => {
    try {
        const userId = req.id;

        const mentorships = await Mentorship.find({
            $or: [{ mentor: userId }, { mentee: userId }]
        }).populate('mentor mentee', 'fullname email profile').lean();

        return res.status(200).json({
            message: 'Mentorships retrieved',
            mentorships,
            success: true
        });
    } catch (error) {
        logger.error('Error in getMentorships:', error);
        return res.status(500).json({ message: 'Failed to get mentorships', success: false });
    }
};
