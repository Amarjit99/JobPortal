import cron from 'node-cron';
import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import { SavedSearch } from '../models/savedSearch.model.js';
import { sendJobAlertEmail } from '../utils/emailService.js';
import { buildSearchQuery } from '../utils/searchUtils.js';
import logger from '../utils/logger.js';

// Find users who want job alerts and send them matching jobs
const sendJobAlerts = async () => {
    try {
        logger.info('Starting job alert cron job...');

        // Find users who have job alerts enabled
        const usersWithAlerts = await User.find({
            'emailNotifications.jobAlerts': true,
            role: 'student',
            isVerified: true
        });

        logger.info(`Found ${usersWithAlerts.length} users with job alerts enabled`);

        // Get jobs posted in the last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        for (const user of usersWithAlerts) {
            try {
                // Build query based on user preferences
                const query = {
                    createdAt: { $gte: yesterday },
                    isActive: true,
                    $or: [
                        { expiresAt: { $exists: false } },
                        { expiresAt: { $gt: new Date() } }
                    ]
                };

                // Add filters based on user preferences
                const prefs = user.jobAlertPreferences;
                
                if (prefs?.jobTypes && prefs.jobTypes.length > 0) {
                    query.jobType = { $in: prefs.jobTypes };
                }

                if (prefs?.locations && prefs.locations.length > 0) {
                    query.location = { 
                        $in: prefs.locations.map(loc => new RegExp(loc, 'i')) 
                    };
                }

                if (prefs?.minSalary) {
                    query.salary = { $gte: prefs.minSalary };
                }

                if (prefs?.maxSalary) {
                    query.salary = query.salary || {};
                    query.salary.$lte = prefs.maxSalary;
                }

                // Find matching jobs
                const matchingJobs = await Job.find(query)
                    .populate('company')
                    .limit(10)
                    .sort({ createdAt: -1 });

                // Send email if there are matching jobs
                if (matchingJobs.length > 0) {
                    await sendJobAlertEmail(
                        user.email,
                        user.fullname,
                        'Your Job Alert',
                        matchingJobs
                    );
                    logger.info(`Sent job alert to ${user.email} with ${matchingJobs.length} jobs`);
                }
            } catch (userError) {
                logger.error(`Error processing job alerts for user ${user.email}:`, userError);
                // Continue with next user
            }
        }

        // Process saved searches with alerts enabled
        const savedSearches = await SavedSearch.getActiveSearchesForNotification();
        logger.info(`Found ${savedSearches.length} saved searches with alerts enabled`);

        for (const savedSearch of savedSearches) {
            try {
                const query = buildSearchQuery(savedSearch.searchParams);
                
                // Find jobs created since last notification or in last 24 hours
                const lastCheck = savedSearch.lastNotified || yesterday;
                query.createdAt = { $gt: lastCheck };
                query.isActive = true;

                const newJobs = await Job.find(query)
                    .populate({
                        path: 'company',
                        select: 'name logo location verification'
                    })
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .lean();

                if (newJobs.length > 0) {
                    await sendJobAlertEmail(
                        savedSearch.userId.email,
                        savedSearch.userId.fullname,
                        savedSearch.name,
                        newJobs
                    );

                    // Update saved search
                    await savedSearch.recordNotification(newJobs.length, newJobs[0]._id);

                    logger.info(`Sent saved search alert for "${savedSearch.name}" with ${newJobs.length} jobs`);
                }
            } catch (searchError) {
                logger.error(`Error processing saved search ${savedSearch._id}:`, searchError);
                // Continue with next search
            }
        }

        logger.info('Job alert cron job completed');
    } catch (error) {
        logger.error('Error in job alert cron job:', error);
    }
};

// Schedule job alerts to run daily at 9 AM
export const scheduleJobAlerts = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', sendJobAlerts, {
        timezone: "Asia/Kolkata"
    });
    
    logger.info('Job alert scheduler initialized - will run daily at 9:00 AM IST');
};

// Export for manual testing
export { sendJobAlerts };
