import natural from 'natural';
import { Job } from '../models/job.model.js';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

export const extractKeywords = async (req, res) => {
    try {
        const { text, limit = 10 } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Text is required', success: false });
        }

        const tfidf = new TfIdf();
        tfidf.addDocument(text);

        const keywords = [];
        tfidf.listTerms(0).slice(0, limit).forEach(item => {
            keywords.push({ term: item.term, score: item.tfidf.toFixed(2) });
        });

        return res.status(200).json({
            message: 'Keywords extracted',
            keywords,
            success: true
        });
    } catch (error) {
        logger.error('Error in extractKeywords:', error);
        return res.status(500).json({ message: 'Failed to extract keywords', success: false });
    }
};

export const optimizeJobDescription = async (req, res) => {
    try {
        const { description } = req.body;

        const tokens = tokenizer.tokenize(description.toLowerCase());
        const wordCount = tokens.length;
        const sentenceCount = description.split(/[.!?]+/).filter(s => s.trim()).length;
        const avgWordsPerSentence = Math.round(wordCount / sentenceCount);

        const suggestions = [];
        if (wordCount < 100) suggestions.push('Description is too short. Add more details (aim for 200-400 words)');
        if (wordCount > 500) suggestions.push('Description is too long. Keep it concise (200-400 words recommended)');
        if (avgWordsPerSentence > 25) suggestions.push('Sentences are too long. Break them into shorter sentences for readability');
        if (!description.match(/\b(responsibility|responsibilities|duties)\b/i)) suggestions.push('Add a "Responsibilities" section');
        if (!description.match(/\b(requirement|requirements|qualification|qualifications)\b/i)) suggestions.push('Add a "Requirements" section');
        if (!description.match(/\b(benefit|benefits|perk|perks)\b/i)) suggestions.push('Consider adding a "Benefits" section');

        const score = Math.max(0, 100 - (suggestions.length * 15));

        return res.status(200).json({
            message: 'Job description analyzed',
            analysis: {
                wordCount,
                sentenceCount,
                avgWordsPerSentence,
                score,
                rating: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement'
            },
            suggestions,
            success: true
        });
    } catch (error) {
        logger.error('Error in optimizeJobDescription:', error);
        return res.status(500).json({ message: 'Failed to optimize description', success: false });
    }
};

export const autoTagJobs = async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        const jobs = await Job.find({ tags: { $exists: false } })
            .limit(parseInt(limit))
            .select('title description requirements');

        let updated = 0;
        for (const job of jobs) {
            const text = `${job.title} ${job.description} ${job.requirements.join(' ')}`;
            const tfidf = new TfIdf();
            tfidf.addDocument(text);

            const tags = tfidf.listTerms(0).slice(0, 5).map(item => item.term);
            job.tags = tags;
            await job.save();
            updated++;
        }

        return res.status(200).json({
            message: 'Jobs auto-tagged',
            updated,
            success: true
        });
    } catch (error) {
        logger.error('Error in autoTagJobs:', error);
        return res.status(500).json({ message: 'Failed to auto-tag jobs', success: false });
    }
};

export const normalizeSkills = async (req, res) => {
    try {
        const { skills } = req.body;

        const skillMap = {
            'js': 'JavaScript', 'javascript': 'JavaScript', 'nodejs': 'Node.js', 'node': 'Node.js',
            'reactjs': 'React', 'react.js': 'React', 'vuejs': 'Vue.js', 'vue': 'Vue.js',
            'py': 'Python', 'python3': 'Python', 'ts': 'TypeScript', 'typescript': 'TypeScript',
            'mongo': 'MongoDB', 'mongodb': 'MongoDB', 'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL',
            'aws': 'Amazon Web Services', 'gcp': 'Google Cloud Platform', 'azure': 'Microsoft Azure',
            'ml': 'Machine Learning', 'ai': 'Artificial Intelligence', 'dl': 'Deep Learning'
        };

        const normalized = skills.map(skill => {
            const lower = skill.toLowerCase().trim();
            return skillMap[lower] || skill;
        });

        return res.status(200).json({
            message: 'Skills normalized',
            original: skills,
            normalized: [...new Set(normalized)],
            success: true
        });
    } catch (error) {
        logger.error('Error in normalizeSkills:', error);
        return res.status(500).json({ message: 'Failed to normalize skills', success: false });
    }
};
