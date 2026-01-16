import { InterviewQuestion } from '../models/interviewQuestion.model.js';
import { Company } from '../models/company.model.js';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

/**
 * Get interview questions by role
 * @route GET /api/v1/interview-prep/questions
 */
export const getInterviewQuestions = async (req, res) => {
    try {
        const { role, category, difficulty, companyId, page = 1, limit = 20 } = req.query;

        const match = { isActive: true };
        const skip = (page - 1) * limit;

        if (role) {
            match.jobRole = { $regex: role, $options: 'i' };
        }
        if (category) match.category = category;
        if (difficulty) match.difficulty = difficulty;
        if (companyId) match.company = companyId;

        const questions = await InterviewQuestion.find(match)
            .sort({ upvotes: -1, askedCount: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .populate('company', 'name logo')
            .populate('addedBy', 'fullname');

        const total = await InterviewQuestion.countDocuments(match);

        return res.status(200).json({
            message: "Interview questions retrieved successfully",
            questions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalQuestions: total,
                hasMore: skip + questions.length < total
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getInterviewQuestions:', error);
        return res.status(500).json({
            message: 'Failed to get interview questions',
            success: false
        });
    }
};

/**
 * Get company-specific interview questions
 * @route GET /api/v1/interview-prep/company/:companyId
 */
export const getCompanyQuestions = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        // Verify company exists
        const company = await Company.findById(companyId).select('name logo');
        
        if (!company) {
            return res.status(404).json({
                message: 'Company not found',
                success: false
            });
        }

        const questions = await InterviewQuestion.find({
            company: companyId,
            isActive: true
        })
            .sort({ askedCount: -1, upvotes: -1 })
            .limit(parseInt(limit))
            .skip(skip)
            .populate('addedBy', 'fullname');

        const total = await InterviewQuestion.countDocuments({
            company: companyId,
            isActive: true
        });

        // Get category distribution
        const categoryDistribution = await InterviewQuestion.aggregate([
            { $match: { company: mongoose.Types.ObjectId(companyId), isActive: true } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        return res.status(200).json({
            message: "Company interview questions retrieved successfully",
            company: {
                id: company._id,
                name: company.name,
                logo: company.logo
            },
            questions,
            categoryDistribution,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalQuestions: total
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getCompanyQuestions:', error);
        return res.status(500).json({
            message: 'Failed to get company questions',
            success: false
        });
    }
};

/**
 * Get interview tips and resources
 * @route GET /api/v1/interview-prep/tips
 */
export const getInterviewTips = async (req, res) => {
    try {
        const { category = 'general' } = req.query;

        const tips = {
            general: {
                title: "General Interview Tips",
                tips: [
                    "Research the company thoroughly before the interview",
                    "Prepare examples using the STAR method (Situation, Task, Action, Result)",
                    "Dress professionally and arrive 10-15 minutes early",
                    "Bring copies of your resume and a notepad",
                    "Practice common interview questions with a friend",
                    "Prepare thoughtful questions to ask the interviewer",
                    "Send a thank-you email within 24 hours after the interview",
                    "Be honest and authentic in your responses",
                    "Maintain good eye contact and positive body language",
                    "Listen carefully to the questions before answering"
                ],
                resources: [
                    {
                        title: "Common Interview Questions",
                        description: "100+ frequently asked questions with sample answers",
                        type: "article"
                    },
                    {
                        title: "Body Language Guide",
                        description: "Master non-verbal communication in interviews",
                        type: "video"
                    }
                ]
            },
            technical: {
                title: "Technical Interview Tips",
                tips: [
                    "Understand the fundamentals (data structures, algorithms, OOP)",
                    "Practice coding on a whiteboard or shared editor",
                    "Think out loud while solving problems",
                    "Ask clarifying questions about requirements and constraints",
                    "Start with a brute force solution, then optimize",
                    "Test your code with edge cases",
                    "Discuss time and space complexity",
                    "Be prepared to explain your approach and trade-offs",
                    "Review system design concepts for senior roles",
                    "Practice on platforms like LeetCode, HackerRank"
                ],
                resources: [
                    {
                        title: "Data Structures & Algorithms",
                        description: "Essential concepts for coding interviews",
                        type: "course"
                    },
                    {
                        title: "System Design Primer",
                        description: "Learn to design scalable systems",
                        type: "guide"
                    }
                ]
            },
            behavioral: {
                title: "Behavioral Interview Tips",
                tips: [
                    "Use the STAR method for structured answers",
                    "Prepare stories demonstrating key competencies",
                    "Focus on your specific role and contributions",
                    "Be honest about failures and what you learned",
                    "Show self-awareness and growth mindset",
                    "Demonstrate teamwork and collaboration skills",
                    "Highlight conflict resolution abilities",
                    "Discuss how you handle stress and deadlines",
                    "Show enthusiasm for the role and company",
                    "Quantify your achievements when possible"
                ],
                resources: [
                    {
                        title: "STAR Method Guide",
                        description: "Master the STAR technique for behavioral questions",
                        type: "article"
                    }
                ]
            },
            remote: {
                title: "Remote Interview Tips",
                tips: [
                    "Test your technology (camera, microphone, internet) beforehand",
                    "Choose a quiet, well-lit location with a clean background",
                    "Look at the camera, not the screen, when speaking",
                    "Eliminate distractions and notifications",
                    "Have a backup plan (phone number) in case of technical issues",
                    "Position the camera at eye level",
                    "Wear professional attire (full outfit, not just top)",
                    "Keep water and notes nearby but off-camera",
                    "Practice with the video conferencing platform",
                    "Close unnecessary applications to ensure smooth performance"
                ],
                resources: [
                    {
                        title: "Virtual Interview Setup",
                        description: "Optimize your home interview environment",
                        type: "checklist"
                    }
                ]
            }
        };

        return res.status(200).json({
            message: "Interview tips retrieved successfully",
            tips: tips[category] || tips.general,
            allCategories: Object.keys(tips),
            success: true
        });

    } catch (error) {
        logger.error('Error in getInterviewTips:', error);
        return res.status(500).json({
            message: 'Failed to get interview tips',
            success: false
        });
    }
};

/**
 * Get personalized interview preparation guide
 * @route GET /api/v1/interview-prep/guide
 */
export const getPreparationGuide = async (req, res) => {
    try {
        const userId = req.id;
        const { jobId } = req.query;

        // Get user profile
        const user = await User.findById(userId).select('profile fullname');
        
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false
            });
        }

        const userSkills = user.profile?.skills || [];
        const userExperience = user.profile?.experience || [];

        // Get relevant questions based on user skills
        const relevantQuestions = await InterviewQuestion.find({
            $or: [
                { skills: { $in: userSkills } },
                { jobRole: { $in: userExperience.map(exp => exp.title) } }
            ],
            isActive: true
        })
            .sort({ upvotes: -1 })
            .limit(10)
            .select('question category difficulty');

        // Generate preparation checklist
        const checklist = [
            {
                category: "Research",
                items: [
                    { task: "Research company background and culture", completed: false },
                    { task: "Review job description and requirements", completed: false },
                    { task: "Research interviewer profiles (if known)", completed: false },
                    { task: "Understand company's products/services", completed: false }
                ]
            },
            {
                category: "Practice",
                items: [
                    { task: "Practice common interview questions", completed: false },
                    { task: "Prepare STAR method examples", completed: false },
                    { task: "Review technical concepts relevant to role", completed: false },
                    { task: "Mock interview with friend or mentor", completed: false }
                ]
            },
            {
                category: "Preparation",
                items: [
                    { task: "Prepare questions to ask interviewer", completed: false },
                    { task: "Plan interview outfit", completed: false },
                    { task: "Print extra copies of resume", completed: false },
                    { task: "Prepare portfolio/work samples", completed: false }
                ]
            },
            {
                category: "Day Before",
                items: [
                    { task: "Confirm interview time and location/link", completed: false },
                    { task: "Test video/audio setup (if remote)", completed: false },
                    { task: "Review your resume and application", completed: false },
                    { task: "Get good rest", completed: false }
                ]
            }
        ];

        // Skills to focus on
        const skillsFocus = userSkills.slice(0, 5).map(skill => ({
            skill,
            reason: "Mentioned in your profile",
            questions: relevantQuestions.filter(q => q.skills?.includes(skill)).length
        }));

        return res.status(200).json({
            message: "Interview preparation guide generated",
            guide: {
                candidate: {
                    name: user.fullname,
                    skills: userSkills.length,
                    experience: userExperience.length
                },
                checklist,
                recommendedQuestions: relevantQuestions,
                skillsFocus,
                timeline: {
                    "1 week before": [
                        "Research the company and role",
                        "Start practicing common questions",
                        "Review technical concepts"
                    ],
                    "3 days before": [
                        "Conduct mock interviews",
                        "Prepare your questions for the interviewer",
                        "Finalize your examples/stories"
                    ],
                    "1 day before": [
                        "Review your application and resume",
                        "Test your setup (if remote)",
                        "Prepare materials and outfit"
                    ],
                    "Day of": [
                        "Arrive/log in 10 minutes early",
                        "Stay calm and confident",
                        "Listen carefully and think before answering"
                    ]
                },
                resources: [
                    "Interview Question Bank",
                    "STAR Method Guide",
                    "Company Research Template",
                    "Mock Interview Platform"
                ]
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in getPreparationGuide:', error);
        return res.status(500).json({
            message: 'Failed to generate preparation guide',
            success: false
        });
    }
};

/**
 * Submit a new interview question
 * @route POST /api/v1/interview-prep/questions
 */
export const submitInterviewQuestion = async (req, res) => {
    try {
        const userId = req.id;
        const {
            question,
            category,
            difficulty,
            jobRole,
            skills,
            companyId,
            companyName,
            sampleAnswer,
            tips
        } = req.body;

        if (!question || !category) {
            return res.status(400).json({
                message: 'Question and category are required',
                success: false
            });
        }

        const newQuestion = await InterviewQuestion.create({
            question,
            category,
            difficulty: difficulty || 'medium',
            jobRole: jobRole || [],
            skills: skills || [],
            company: companyId || undefined,
            companyName,
            sampleAnswer,
            tips: tips || [],
            source: 'user',
            isVerified: false,
            addedBy: userId
        });

        return res.status(201).json({
            message: 'Interview question submitted successfully',
            question: newQuestion,
            note: 'Your question will be reviewed and published soon',
            success: true
        });

    } catch (error) {
        logger.error('Error in submitInterviewQuestion:', error);
        return res.status(500).json({
            message: 'Failed to submit question',
            success: false
        });
    }
};

/**
 * Upvote/downvote an interview question
 * @route PUT /api/v1/interview-prep/questions/:id/vote
 */
export const voteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { vote } = req.body; // 'up' or 'down'

        if (!['up', 'down'].includes(vote)) {
            return res.status(400).json({
                message: 'Invalid vote type. Must be "up" or "down"',
                success: false
            });
        }

        const question = await InterviewQuestion.findById(id);

        if (!question) {
            return res.status(404).json({
                message: 'Question not found',
                success: false
            });
        }

        if (vote === 'up') {
            await question.upvote();
        } else {
            await question.downvote();
        }

        return res.status(200).json({
            message: `Question ${vote}voted successfully`,
            votes: {
                upvotes: question.upvotes,
                downvotes: question.downvotes
            },
            success: true
        });

    } catch (error) {
        logger.error('Error in voteQuestion:', error);
        return res.status(500).json({
            message: 'Failed to vote on question',
            success: false
        });
    }
};

/**
 * Mark question as asked in an interview
 * @route PUT /api/v1/interview-prep/questions/:id/mark-asked
 */
export const markQuestionAsAsked = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await InterviewQuestion.findById(id);

        if (!question) {
            return res.status(404).json({
                message: 'Question not found',
                success: false
            });
        }

        await question.markAsAsked();

        return res.status(200).json({
            message: 'Question marked as asked',
            askedCount: question.askedCount,
            success: true
        });

    } catch (error) {
        logger.error('Error in markQuestionAsAsked:', error);
        return res.status(500).json({
            message: 'Failed to mark question',
            success: false
        });
    }
};
