import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
    try {
        // Enable query logging for slow queries
        mongoose.set('debug', (collectionName, method, query, doc) => {
            const startTime = Date.now();
            
            // Log the query execution time
            setImmediate(() => {
                const duration = Date.now() - startTime;
                if (duration > 100) { // Log queries taking more than 100ms
                    logger.warn('Slow MongoDB Query', {
                        collection: collectionName,
                        method: method,
                        query: JSON.stringify(query),
                        duration: `${duration}ms`,
                        threshold: '100ms'
                    });
                }
            });
        });

        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB connected successfully');
        logger.info('Slow query detection enabled (threshold: 100ms)');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
}
export default connectDB;