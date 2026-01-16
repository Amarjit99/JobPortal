/**
 * Candidate-Job Matching Algorithm
 * Calculates match score between candidate profile and job requirements
 * Uses weighted scoring across multiple dimensions (total 100 points)
 */

/**
 * Normalize skills for comparison (lowercase, trim, remove special chars)
 */
const normalizeSkills = (skills) => {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(skill => 
    skill.toLowerCase().trim().replace(/[^a-z0-9+#\s]/g, '')
  ).filter(Boolean);
};

/**
 * Calculate skills match score (0-35 points)
 * @param {Array} candidateSkills - User's skills array
 * @param {Array} jobSkills - Job required skills array
 * @returns {Object} { score, matchedSkills, missingSkills }
 */
const calculateSkillsMatch = (candidateSkills, jobSkills) => {
  const normalizedCandidateSkills = normalizeSkills(candidateSkills);
  const normalizedJobSkills = normalizeSkills(jobSkills);

  if (normalizedJobSkills.length === 0) {
    return { score: 35, matchedSkills: [], missingSkills: [], matchPercentage: 100 };
  }

  const matchedSkills = normalizedJobSkills.filter(jobSkill =>
    normalizedCandidateSkills.some(candidateSkill =>
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    )
  );

  const missingSkills = normalizedJobSkills.filter(jobSkill =>
    !matchedSkills.includes(jobSkill)
  );

  const matchPercentage = (matchedSkills.length / normalizedJobSkills.length) * 100;
  const score = Math.round((matchPercentage / 100) * 35);

  return {
    score,
    matchedSkills: matchedSkills.map(skill => jobSkills.find(js => 
      normalizeSkills([js])[0] === skill
    )),
    missingSkills: missingSkills.map(skill => jobSkills.find(js => 
      normalizeSkills([js])[0] === skill
    )),
    matchPercentage: Math.round(matchPercentage)
  };
};

/**
 * Calculate experience match score (0-20 points)
 * @param {Number} candidateExperience - Years of experience
 * @param {Number} jobMinExperience - Job minimum experience requirement
 * @param {Number} jobMaxExperience - Job maximum experience requirement
 */
const calculateExperienceMatch = (candidateExperience, jobMinExperience, jobMaxExperience) => {
  if (!jobMinExperience && jobMinExperience !== 0) {
    return { score: 20, status: 'not-specified' };
  }

  const candidateYears = candidateExperience || 0;
  const minRequired = jobMinExperience || 0;
  const maxRequired = jobMaxExperience || minRequired + 10;

  // Perfect match: within range
  if (candidateYears >= minRequired && candidateYears <= maxRequired) {
    return { score: 20, status: 'perfect-match' };
  }

  // Under-qualified: below minimum
  if (candidateYears < minRequired) {
    const gap = minRequired - candidateYears;
    // Penalize heavily for large gaps
    if (gap >= 3) return { score: 0, status: 'significantly-under-qualified', gap };
    if (gap >= 2) return { score: 5, status: 'under-qualified', gap };
    return { score: 12, status: 'slightly-under-qualified', gap };
  }

  // Over-qualified: above maximum
  if (candidateYears > maxRequired) {
    const excess = candidateYears - maxRequired;
    // Slight penalty for being over-qualified (may leave for better opportunities)
    if (excess >= 5) return { score: 10, status: 'significantly-over-qualified', excess };
    return { score: 15, status: 'over-qualified', excess };
  }

  return { score: 20, status: 'match' };
};

/**
 * Compare education levels and calculate match score (0-15 points)
 * @param {String} candidateDegree - Candidate's highest degree
 * @param {String} jobRequiredDegree - Job required degree
 */
const calculateEducationMatch = (candidateDegree, jobRequiredDegree) => {
  const educationHierarchy = {
    'high-school': 1,
    'diploma': 2,
    'associate': 3,
    'bachelor': 4,
    'bachelors': 4,
    'master': 5,
    'masters': 5,
    'phd': 6,
    'doctorate': 6
  };

  if (!jobRequiredDegree || jobRequiredDegree === 'any') {
    return { score: 15, status: 'not-specified' };
  }

  const candidateLevel = educationHierarchy[candidateDegree?.toLowerCase()] || 0;
  const requiredLevel = educationHierarchy[jobRequiredDegree?.toLowerCase()] || 0;

  if (candidateLevel >= requiredLevel) {
    return { 
      score: 15, 
      status: candidateLevel === requiredLevel ? 'perfect-match' : 'exceeds-requirement' 
    };
  }

  // Under-qualified
  const gap = requiredLevel - candidateLevel;
  if (gap >= 3) return { score: 0, status: 'significantly-under-qualified' };
  if (gap === 2) return { score: 5, status: 'under-qualified' };
  return { score: 10, status: 'slightly-under-qualified' };
};

/**
 * Calculate location match score (0-10 points)
 * @param {String} candidateLocation - Candidate's location
 * @param {String} jobLocation - Job location
 * @param {String} jobType - Job type (remote/hybrid/on-site)
 * @param {Number} candidateLocationRadius - Candidate's willing to travel radius (km)
 */
const calculateLocationMatch = (candidateLocation, jobLocation, jobType, candidateLocationRadius = 0) => {
  // Remote jobs get full points
  if (jobType === 'remote' || jobType === 'work-from-home') {
    return { score: 10, status: 'remote-job' };
  }

  if (!candidateLocation || !jobLocation) {
    return { score: 5, status: 'location-not-specified' };
  }

  // Exact city match
  const candidateCity = candidateLocation.toLowerCase().trim();
  const jobCity = jobLocation.toLowerCase().trim();

  if (candidateCity === jobCity) {
    return { score: 10, status: 'same-city' };
  }

  // Hybrid jobs with different cities
  if (jobType === 'hybrid') {
    return { score: 7, status: 'hybrid-different-city' };
  }

  // Check if willing to relocate (if candidateLocationRadius is high, e.g., > 100km)
  if (candidateLocationRadius && candidateLocationRadius >= 100) {
    return { score: 6, status: 'willing-to-relocate' };
  }

  // Different cities, on-site job
  return { score: 2, status: 'location-mismatch' };
};

/**
 * Calculate salary expectations match score (0-10 points)
 * @param {Number} candidateExpectedSalary - Candidate's expected salary
 * @param {Number} jobMinSalary - Job minimum salary
 * @param {Number} jobMaxSalary - Job maximum salary
 */
const calculateSalaryMatch = (candidateExpectedSalary, jobMinSalary, jobMaxSalary) => {
  if (!candidateExpectedSalary || (!jobMinSalary && !jobMaxSalary)) {
    return { score: 10, status: 'not-specified' };
  }

  const minSalary = jobMinSalary || 0;
  const maxSalary = jobMaxSalary || jobMinSalary || Infinity;

  // Candidate expects within or below salary range
  if (candidateExpectedSalary <= maxSalary && candidateExpectedSalary >= minSalary) {
    return { score: 10, status: 'within-range' };
  }

  // Candidate expects slightly above range (negotiable)
  if (candidateExpectedSalary > maxSalary) {
    const excess = ((candidateExpectedSalary - maxSalary) / maxSalary) * 100;
    if (excess <= 10) return { score: 7, status: 'slightly-above-range' };
    if (excess <= 20) return { score: 4, status: 'above-range' };
    return { score: 0, status: 'significantly-above-range' };
  }

  // Candidate expects below range (good for employer, but candidate may be under-valuing)
  return { score: 8, status: 'below-range' };
};

/**
 * Calculate assessment completion score (0-10 points)
 * @param {Array} completedAssessments - User's completed assessments with skills
 * @param {Array} jobRequiredSkills - Job required skills
 */
const calculateAssessmentMatch = (completedAssessments, jobRequiredSkills) => {
  if (!jobRequiredSkills || jobRequiredSkills.length === 0) {
    return { score: 10, status: 'not-required', relevantAssessments: [] };
  }

  if (!completedAssessments || completedAssessments.length === 0) {
    return { score: 0, status: 'no-assessments', relevantAssessments: [] };
  }

  const normalizedJobSkills = normalizeSkills(jobRequiredSkills);

  // Find assessments that match job skills
  const relevantAssessments = completedAssessments.filter(assessment => {
    const assessmentSkills = normalizeSkills(assessment.skills || []);
    return assessmentSkills.some(skill =>
      normalizedJobSkills.some(jobSkill =>
        skill.includes(jobSkill) || jobSkill.includes(skill)
      )
    );
  });

  if (relevantAssessments.length === 0) {
    return { score: 2, status: 'no-relevant-assessments', relevantAssessments: [] };
  }

  // Calculate average score of relevant assessments
  const passedAssessments = relevantAssessments.filter(a => a.passed);
  const averageScore = relevantAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / relevantAssessments.length;

  let score = 0;
  let status = '';

  if (passedAssessments.length === 0) {
    score = 3;
    status = 'attempted-but-not-passed';
  } else if (averageScore >= 80) {
    score = 10;
    status = 'excellent-assessment-scores';
  } else if (averageScore >= 60) {
    score = 7;
    status = 'good-assessment-scores';
  } else {
    score = 5;
    status = 'passed-assessments';
  }

  return {
    score,
    status,
    relevantAssessments: relevantAssessments.map(a => ({
      title: a.title,
      score: a.score,
      passed: a.passed,
      skills: a.skills
    }))
  };
};

/**
 * Main function: Calculate overall match score between candidate and job
 * @param {Object} candidate - User profile with skills, experience, education, etc.
 * @param {Object} job - Job posting with requirements
 * @returns {Object} Overall match score and detailed breakdown
 */
export const calculateMatchScore = (candidate, job) => {
  try {
    // Skills match (35 points)
    const skillsMatch = calculateSkillsMatch(
      candidate.profile?.skills || candidate.skills || [],
      job.skills || []
    );

    // Experience match (20 points)
    const experienceMatch = calculateExperienceMatch(
      candidate.profile?.experience?.totalYears || 0,
      job.experienceLevel?.min || job.experience || 0,
      job.experienceLevel?.max
    );

    // Education match (15 points)
    const educationMatch = calculateEducationMatch(
      candidate.profile?.education?.degree || candidate.education?.[0]?.degree,
      job.education || job.requiredEducation
    );

    // Location match (10 points)
    const locationMatch = calculateLocationMatch(
      candidate.profile?.location || candidate.location,
      job.location,
      job.jobType,
      candidate.profile?.locationPreferences?.willingToRelocate ? 200 : 0
    );

    // Salary match (10 points)
    const salaryMatch = calculateSalaryMatch(
      candidate.profile?.expectedSalary || candidate.expectedSalary,
      job.salary,
      job.maxSalary || job.salary
    );

    // Assessment match (10 points)
    const assessmentMatch = calculateAssessmentMatch(
      candidate.completedAssessments || [],
      job.skills || []
    );

    // Calculate total score
    const totalScore = 
      skillsMatch.score +
      experienceMatch.score +
      educationMatch.score +
      locationMatch.score +
      salaryMatch.score +
      assessmentMatch.score;

    // Determine match level
    let matchLevel = '';
    if (totalScore >= 85) matchLevel = 'excellent';
    else if (totalScore >= 70) matchLevel = 'very-good';
    else if (totalScore >= 55) matchLevel = 'good';
    else if (totalScore >= 40) matchLevel = 'fair';
    else matchLevel = 'poor';

    return {
      totalScore: Math.round(totalScore),
      matchLevel,
      breakdown: {
        skills: {
          score: skillsMatch.score,
          maxScore: 35,
          percentage: Math.round((skillsMatch.score / 35) * 100),
          matchedSkills: skillsMatch.matchedSkills || [],
          missingSkills: skillsMatch.missingSkills || [],
          status: skillsMatch.status
        },
        experience: {
          score: experienceMatch.score,
          maxScore: 20,
          percentage: Math.round((experienceMatch.score / 20) * 100),
          status: experienceMatch.status,
          gap: experienceMatch.gap,
          excess: experienceMatch.excess
        },
        education: {
          score: educationMatch.score,
          maxScore: 15,
          percentage: Math.round((educationMatch.score / 15) * 100),
          status: educationMatch.status
        },
        location: {
          score: locationMatch.score,
          maxScore: 10,
          percentage: Math.round((locationMatch.score / 10) * 100),
          status: locationMatch.status
        },
        salary: {
          score: salaryMatch.score,
          maxScore: 10,
          percentage: Math.round((salaryMatch.score / 10) * 100),
          status: salaryMatch.status
        },
        assessments: {
          score: assessmentMatch.score,
          maxScore: 10,
          percentage: Math.round((assessmentMatch.score / 10) * 100),
          status: assessmentMatch.status,
          relevantAssessments: assessmentMatch.relevantAssessments || []
        }
      },
      strengths: [],
      weaknesses: []
    };
  } catch (error) {
    console.error('Error calculating match score:', error);
    return {
      totalScore: 0,
      matchLevel: 'error',
      error: error.message,
      breakdown: {}
    };
  }
};

/**
 * Batch calculate match scores for multiple candidates
 * @param {Array} candidates - Array of user profiles
 * @param {Object} job - Job posting
 * @param {Number} minScore - Minimum threshold score (default 40)
 * @returns {Array} Sorted array of matched candidates
 */
export const calculateBatchMatchScores = (candidates, job, minScore = 40) => {
  const matches = candidates
    .map(candidate => ({
      candidate,
      matchData: calculateMatchScore(candidate, job)
    }))
    .filter(match => match.matchData.totalScore >= minScore)
    .sort((a, b) => b.matchData.totalScore - a.matchData.totalScore);

  return matches;
};

export default {
  calculateMatchScore,
  calculateBatchMatchScores,
  calculateSkillsMatch,
  calculateExperienceMatch,
  calculateEducationMatch,
  calculateLocationMatch,
  calculateSalaryMatch,
  calculateAssessmentMatch
};
