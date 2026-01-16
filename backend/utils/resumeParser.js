import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import logger from './logger.js';

/**
 * Extract text from PDF buffer
 */
const parsePDF = async (buffer) => {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        logger.error('Error parsing PDF:', error);
        throw new Error('Failed to parse PDF file');
    }
};

/**
 * Extract text from DOCX buffer
 */
const parseDOCX = async (buffer) => {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        logger.error('Error parsing DOCX:', error);
        throw new Error('Failed to parse DOCX file');
    }
};

/**
 * Extract email addresses from text
 */
const extractEmails = (text) => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const emails = text.match(emailRegex) || [];
    return [...new Set(emails)];
};

/**
 * Extract phone numbers from text
 */
const extractPhoneNumbers = (text) => {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = text.match(phoneRegex) || [];
    return [...new Set(phones)];
};

/**
 * Extract URLs from text
 */
const extractURLs = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    return [...new Set(urls)];
};

/**
 * Extract name (assumes name is at the beginning)
 */
const extractName = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    // First non-empty line is usually the name
    for (let line of lines) {
        const trimmed = line.trim();
        // Skip if it's an email, phone, or URL
        if (!trimmed.includes('@') && !trimmed.match(/\d{3}/) && !trimmed.startsWith('http')) {
            // Name should be relatively short
            if (trimmed.length < 50 && trimmed.length > 3) {
                return trimmed;
            }
        }
    }
    return null;
};

/**
 * Extract skills from text based on common tech skills
 */
const extractSkills = (text) => {
    const commonSkills = [
        // Programming Languages
        'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
        'TypeScript', 'Rust', 'Scala', 'Perl', 'R', 'MATLAB', 'Dart',
        
        // Web Technologies
        'HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Next.js', 'Nuxt',
        'jQuery', 'Bootstrap', 'Tailwind', 'SASS', 'LESS', 'Webpack', 'Vite',
        
        // Backend & Databases
        'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'SQLite', 'Oracle', 'SQL Server',
        'GraphQL', 'REST API', 'Django', 'Flask', 'Spring Boot', 'Laravel', '.NET',
        
        // Cloud & DevOps
        'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins',
        'CI/CD', 'Terraform', 'Ansible', 'Git', 'GitHub', 'GitLab', 'Bitbucket',
        
        // Mobile
        'Android', 'iOS', 'React Native', 'Flutter', 'Xamarin', 'Ionic',
        
        // Data Science & AI
        'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras',
        'Data Analysis', 'Pandas', 'NumPy', 'Scikit-learn', 'NLP', 'Computer Vision',
        
        // Testing & Tools
        'Jest', 'Mocha', 'Cypress', 'Selenium', 'JUnit', 'Postman', 'Swagger',
        
        // Soft Skills
        'Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Agile', 'Scrum',
        'Project Management', 'Critical Thinking', 'Time Management',
        
        // Others
        'Blockchain', 'Solidity', 'Web3', 'Microservices', 'Serverless', 'SEO',
        'UI/UX', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator'
    ];

    const textLower = text.toLowerCase();
    const foundSkills = commonSkills.filter(skill => 
        textLower.includes(skill.toLowerCase())
    );

    return [...new Set(foundSkills)];
};

/**
 * Extract education information
 */
const extractEducation = (text) => {
    const education = [];
    
    // Common degree patterns
    const degreePatterns = [
        /Bachelor(?:'s)?(?:\s+of\s+)?(?:Science|Arts|Engineering|Technology|Commerce|Business Administration)?/gi,
        /Master(?:'s)?(?:\s+of\s+)?(?:Science|Arts|Engineering|Technology|Business Administration|Computer Applications)?/gi,
        /PhD|Ph\.D\.?|Doctorate/gi,
        /B\.?Tech|M\.?Tech|B\.?E\.?|M\.?E\.?|B\.?Sc|M\.?Sc|BCA|MCA|MBA|BBA/gi,
        /Diploma/gi,
        /Associate Degree/gi
    ];

    const lines = text.split('\n');
    let inEducationSection = false;

    lines.forEach((line, index) => {
        const lineLower = line.toLowerCase();
        
        // Check if we're in education section
        if (lineLower.includes('education') || lineLower.includes('qualification') || 
            lineLower.includes('academic')) {
            inEducationSection = true;
        }
        
        // Check if we left education section (next major section)
        if (inEducationSection && (lineLower.includes('experience') || 
            lineLower.includes('skills') || lineLower.includes('projects'))) {
            inEducationSection = false;
        }

        // Try to match degree patterns
        degreePatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches && (inEducationSection || index < 20)) {
                // Try to get more context (next few lines might have university, year)
                const context = lines.slice(index, Math.min(index + 3, lines.length)).join(' ');
                
                // Extract year
                const yearMatch = context.match(/\b(19|20)\d{2}\b/);
                const year = yearMatch ? yearMatch[0] : null;

                education.push({
                    degree: matches[0],
                    field: extractFieldOfStudy(context),
                    institution: extractInstitution(context),
                    year: year
                });
            }
        });
    });

    return education;
};

/**
 * Extract field of study from context
 */
const extractFieldOfStudy = (text) => {
    const fields = [
        'Computer Science', 'Information Technology', 'Software Engineering',
        'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
        'Electronics', 'Business Administration', 'Commerce', 'Economics',
        'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Data Science',
        'Artificial Intelligence', 'Cybersecurity'
    ];

    for (let field of fields) {
        if (text.toLowerCase().includes(field.toLowerCase())) {
            return field;
        }
    }
    return null;
};

/**
 * Extract institution name from context
 */
const extractInstitution = (text) => {
    // Common institution keywords
    const keywords = ['University', 'College', 'Institute', 'School', 'Academy'];
    
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
        if (keywords.some(k => words[i].includes(k))) {
            // Get surrounding words (institution name)
            const start = Math.max(0, i - 3);
            const end = Math.min(words.length, i + 4);
            const institutionName = words.slice(start, end).join(' ');
            
            // Clean up
            return institutionName
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 100);
        }
    }
    return null;
};

/**
 * Extract work experience
 */
const extractExperience = (text) => {
    const experiences = [];
    const lines = text.split('\n');
    let inExperienceSection = false;

    // Common job titles
    const jobTitlePatterns = [
        /Software\s+(?:Engineer|Developer)/gi,
        /Full\s+Stack\s+Developer/gi,
        /Front(?:-|\s)?end\s+Developer/gi,
        /Back(?:-|\s)?end\s+Developer/gi,
        /Web\s+Developer/gi,
        /Mobile\s+Developer/gi,
        /Data\s+(?:Scientist|Analyst|Engineer)/gi,
        /DevOps\s+Engineer/gi,
        /Product\s+Manager/gi,
        /Project\s+Manager/gi,
        /UI\/UX\s+Designer/gi,
        /QA\s+Engineer/gi,
        /Team\s+Lead/gi,
        /Technical\s+Lead/gi,
        /Senior|Junior|Lead/gi
    ];

    lines.forEach((line, index) => {
        const lineLower = line.toLowerCase();
        
        // Check if we're in experience section
        if (lineLower.includes('experience') || lineLower.includes('employment') ||
            lineLower.includes('work history')) {
            inExperienceSection = true;
        }

        // Check if we left experience section
        if (inExperienceSection && (lineLower.includes('education') || 
            lineLower.includes('skills') || lineLower.includes('projects') ||
            lineLower.includes('certifications'))) {
            inExperienceSection = false;
        }

        // Try to match job title patterns
        jobTitlePatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches && inExperienceSection) {
                // Get context (next few lines for company, duration)
                const context = lines.slice(index, Math.min(index + 4, lines.length)).join('\n');
                
                // Extract dates
                const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4}/gi;
                const dates = context.match(datePattern) || [];
                
                // Extract company (look for common patterns)
                const companyMatch = context.match(/(?:at|@)\s+([A-Z][A-Za-z0-9\s&.,]+(?:Inc|LLC|Ltd|Corp|Company)?)/);
                
                experiences.push({
                    title: matches[0],
                    company: companyMatch ? companyMatch[1].trim() : null,
                    duration: dates.length >= 2 ? `${dates[0]} - ${dates[1]}` : dates[0] || null,
                    description: null // Could be extracted with more sophisticated parsing
                });
            }
        });
    });

    return experiences;
};

/**
 * Calculate years of experience based on dates
 */
const calculateExperienceYears = (text) => {
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const years = text.match(yearPattern) || [];
    
    if (years.length < 2) return 0;
    
    const numericYears = years.map(y => parseInt(y)).sort();
    const earliest = numericYears[0];
    const latest = numericYears[numericYears.length - 1];
    const currentYear = new Date().getFullYear();
    
    // Calculate experience
    const experienceYears = Math.min(latest, currentYear) - earliest;
    
    return experienceYears > 0 ? experienceYears : 0;
};

/**
 * Main resume parser function
 * @param {Buffer} fileBuffer - Resume file buffer
 * @param {String} mimeType - File MIME type
 * @returns {Object} Parsed resume data
 */
export const parseResume = async (fileBuffer, mimeType) => {
    try {
        let text = '';

        // Parse based on file type
        if (mimeType === 'application/pdf') {
            text = await parsePDF(fileBuffer);
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            text = await parseDOCX(fileBuffer);
        } else {
            throw new Error('Unsupported file format. Please upload PDF or DOCX');
        }

        // Extract various sections
        const parsedData = {
            name: extractName(text),
            emails: extractEmails(text),
            phones: extractPhoneNumbers(text),
            urls: extractURLs(text),
            skills: extractSkills(text),
            education: extractEducation(text),
            experience: extractExperience(text),
            experienceYears: calculateExperienceYears(text),
            rawText: text // Keep raw text for further processing
        };

        logger.info('Resume parsed successfully');
        return parsedData;

    } catch (error) {
        logger.error('Error in parseResume:', error);
        throw error;
    }
};

/**
 * Generate AI-powered resume suggestions
 * @param {Object} parsedData - Parsed resume data
 * @param {String} targetRole - Target job role
 * @returns {Object} Suggestions for improvement
 */
export const generateSuggestions = (parsedData, targetRole = null) => {
    const suggestions = {
        skillSuggestions: [],
        formatSuggestions: [],
        contentSuggestions: [],
        overallScore: 0
    };

    let score = 0;

    // Check completeness
    if (parsedData.name) score += 10;
    else suggestions.contentSuggestions.push('Add your full name at the top of the resume');

    if (parsedData.emails.length > 0) score += 10;
    else suggestions.contentSuggestions.push('Include a professional email address');

    if (parsedData.phones.length > 0) score += 5;
    else suggestions.contentSuggestions.push('Add a contact phone number');

    if (parsedData.skills.length >= 5) score += 20;
    else if (parsedData.skills.length > 0) {
        score += 10;
        suggestions.skillSuggestions.push(`Add more relevant skills (currently ${parsedData.skills.length}, recommended: 5-15)`);
    } else {
        suggestions.skillSuggestions.push('Add a skills section with relevant technical and soft skills');
    }

    if (parsedData.education.length > 0) score += 15;
    else suggestions.contentSuggestions.push('Add your educational qualifications');

    if (parsedData.experience.length > 0) score += 20;
    else suggestions.contentSuggestions.push('Include your work experience and internships');

    if (parsedData.experience.length >= 3) score += 10;

    // Format suggestions
    if (parsedData.rawText.length < 500) {
        suggestions.formatSuggestions.push('Resume seems too short. Add more details about your achievements');
    } else if (parsedData.rawText.length > 5000) {
        suggestions.formatSuggestions.push('Resume might be too long. Keep it concise (1-2 pages)');
        score -= 5;
    } else {
        score += 10;
    }

    // URL suggestions (LinkedIn, GitHub, Portfolio)
    const hasLinkedIn = parsedData.urls.some(url => url.includes('linkedin'));
    const hasGitHub = parsedData.urls.some(url => url.includes('github'));
    
    if (!hasLinkedIn) {
        suggestions.contentSuggestions.push('Add your LinkedIn profile URL');
    } else {
        score += 5;
    }

    if (!hasGitHub && targetRole && targetRole.toLowerCase().includes('developer')) {
        suggestions.skillSuggestions.push('Add your GitHub profile to showcase your projects');
    } else if (hasGitHub) {
        score += 5;
    }

    // Role-specific suggestions
    if (targetRole) {
        const roleLower = targetRole.toLowerCase();
        
        if (roleLower.includes('frontend') || roleLower.includes('front-end')) {
            const frontendSkills = ['React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'JavaScript', 'TypeScript'];
            const missingSkills = frontendSkills.filter(skill => 
                !parsedData.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            );
            
            if (missingSkills.length > 0) {
                suggestions.skillSuggestions.push(`Consider adding these frontend skills: ${missingSkills.slice(0, 3).join(', ')}`);
            }
        }
        
        if (roleLower.includes('backend') || roleLower.includes('back-end')) {
            const backendSkills = ['Node.js', 'Python', 'Java', 'MongoDB', 'PostgreSQL', 'REST API'];
            const missingSkills = backendSkills.filter(skill => 
                !parsedData.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            );
            
            if (missingSkills.length > 0) {
                suggestions.skillSuggestions.push(`Consider adding these backend skills: ${missingSkills.slice(0, 3).join(', ')}`);
            }
        }

        if (roleLower.includes('full stack') || roleLower.includes('fullstack')) {
            const fullStackSkills = ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'TypeScript'];
            const missingSkills = fullStackSkills.filter(skill => 
                !parsedData.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
            );
            
            if (missingSkills.length > 0) {
                suggestions.skillSuggestions.push(`Consider adding these full stack skills: ${missingSkills.slice(0, 3).join(', ')}`);
            }
        }
    }

    suggestions.overallScore = Math.min(100, Math.max(0, score));

    return suggestions;
};

export default { parseResume, generateSuggestions };
