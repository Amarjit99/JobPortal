import cron from 'node-cron';
import { SavedSearch } from '../models/savedSearch.model.js';
import { Job } from '../models/job.model.js';
import { buildSearchQuery } from '../utils/searchUtils.js';
import { sendJobAlertEmail } from '../utils/emailService.js';
import logger from '../utils/logger.js';

/**
 * Job Alert Service
 * Runs daily to check saved searches and notify users of new matching jobs
 */

/**
 * Process a single saved search for job alerts
 */
const processSavedSearch = async (savedSearch) => {
    try {
        const query = buildSearchQuery(savedSearch.searchParams);
        
        // Find jobs created since last notification or in last 24 hours
        const lastCheck = savedSearch.lastNotified || new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.createdAt = { $gt: lastCheck };
        query.isActive = true;

        const newJobs = await Job.find(query)
            .populate({
                path: 'company',
                select: 'name logo location verification'
            })
            .populate({
                path: 'created_by',
                select: 'fullname'
            })
            .sort({ createdAt: -1 })
            .limit(10) // Limit to top 10 new matches
            .lean();

        if (newJobs.length > 0) {
            // Send email notification
            await sendJobAlertEmail(
                savedSearch.userId.email,
                savedSearch.userId.fullname,
                savedSearch.name,
                newJobs
            );

            // Update saved search
            await savedSearch.recordNotification(newJobs.length, newJobs[0]._id);

            logger.info(`Job alert sent for search "${savedSearch.name}" - ${newJobs.length} new jobs`);
            
            return { success: true, jobCount: newJobs.length };
        }

        logger.info(`No new jobs for search "${savedSearch.name}"`);
        return { success: true, jobCount: 0 };

    } catch (error) {
        logger.error(`Error processing saved search ${savedSearch._id}:`, error);
        return { success: false, error: error.message };
    }
};

/**
 * Main job alert cron job
 * Runs daily at 9:00 AM to check all active saved searches
 */
export const scheduleJobAlerts = () => {
    // Schedule: Every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        logger.info('Starting daily job alerts check...');
        
        try {
            // Get all active saved searches with alerts enabled
            const savedSearches = await SavedSearch.getActiveSearchesForNotification();

            logger.info(`Found ${savedSearches.length} saved searches with alerts enabled`);

            let processedCount = 0;
            let emailsSent = 0;
            let errors = 0;

            // Process each saved search
            for (const savedSearch of savedSearches) {
                const result = await processSavedSearch(savedSearch);
                processedCount++;

                if (result.success) {
                    if (result.jobCount > 0) {
                        emailsSent++;
                    }
                } else {
                    errors++;
                }

                // Add small delay between processing to avoid overwhelming the system
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            logger.info(`Job alerts check completed: ${processedCount} processed, ${emailsSent} emails sent, ${errors} errors`);

        } catch (error) {
            logger.error('Error in job alerts cron job:', error);
        }
    });

    logger.info('Job alerts cron job scheduled: Daily at 9:00 AM');
};

/**
 * Manual trigger for job alerts (for testing or manual runs)
 */
export const triggerJobAlertsManually = async () => {
    logger.info('Manually triggering job alerts...');
    
    try {
        const savedSearches = await SavedSearch.getActiveSearchesForNotification();
        
        const results = await Promise.all(
            savedSearches.map(search => processSavedSearch(search))
        );

        const summary = {
            total: results.length,
            successful: results.filter(r => r.success).length,
            withNewJobs: results.filter(r => r.success && r.jobCount > 0).length,
            failed: results.filter(r => !r.success).length
        };

        logger.info('Manual job alerts completed:', summary);
        return summary;

    } catch (error) {
        logger.error('Error in manual job alerts trigger:', error);
        throw error;
    }
};

/**
 * Check a specific saved search for new jobs (on-demand)
 */
export const checkSavedSearchForNewJobs = async (savedSearchId) => {
    try {
        const savedSearch = await SavedSearch.findById(savedSearchId)
            .populate('userId', 'fullname email');

        if (!savedSearch) {
            throw new Error('Saved search not found');
        }

        if (!savedSearch.alertsEnabled) {
            throw new Error('Alerts are not enabled for this saved search');
        }

        const result = await processSavedSearch(savedSearch);
        return result;

    } catch (error) {
        logger.error(`Error checking saved search ${savedSearchId}:`, error);
        throw error;
    }
};

export default {
    scheduleJobAlerts,
    triggerJobAlertsManually,
    checkSavedSearchForNewJobs
};
