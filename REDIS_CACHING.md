# Redis Caching Implementation

## Overview
High-performance Redis caching layer for frequently accessed data with automatic cache invalidation on updates.

## Features Implemented

### 1. Cached Resources

#### Job Listings
- **Endpoint**: `GET /api/v1/job/get`
- **Cache Key**: `jobs:all:{base64_query}`
- **TTL**: 5 minutes (MEDIUM)
- **Invalidation**: On new job creation, company update
- **Benefits**: Reduces database load on popular searches

#### Individual Jobs
- **Endpoint**: `GET /api/v1/job/get/:id`
- **Cache Key**: `job:{jobId}`
- **TTL**: 15 minutes (LONG)
- **Invalidation**: On application submission (count changes)
- **Benefits**: Fast job detail page loads

#### Company Listings (Per User)
- **Endpoint**: `GET /api/v1/company/get`
- **Cache Key**: `companies:user:{userId}`
- **TTL**: 15 minutes (LONG)
- **Invalidation**: On company creation, company update
- **Benefits**: Fast recruiter dashboard loads

#### Individual Companies
- **Endpoint**: `GET /api/v1/company/get/:id`
- **Cache Key**: `company:{companyId}`
- **TTL**: 1 hour (VERY_LONG)
- **Invalidation**: On company update
- **Benefits**: Company profiles rarely change

### 2. Cache Infrastructure

#### Redis Client Configuration
- **File**: `backend/utils/redis.js`
- **Connection**: Auto-reconnect with exponential backoff (max 10 retries)
- **Error Handling**: Graceful degradation (app works without Redis)
- **Logging**: All cache operations logged via Winston

#### Cache Helper Functions
```javascript
// Get cached data
await cacheHelper.get(key)

// Set with TTL
await cacheHelper.set(key, value, ttl)

// Delete single key
await cacheHelper.del(key)

// Delete by pattern
await cacheHelper.delPattern('jobs:all:*')

// Check existence
await cacheHelper.exists(key)

// Get statistics
await cacheHelper.getStats()
```

#### Cache Key Generators
```javascript
cacheKeys.allJobs(query)           // jobs:all:{base64_query}
cacheKeys.jobById(id)              // job:{id}
cacheKeys.allCompanies(userId)     // companies:user:{userId}
cacheKeys.companyById(id)          // company:{id}
cacheKeys.jobApplicants(jobId)     // job:{jobId}:applicants
cacheKeys.userProfile(userId)      // user:{userId}:profile
```

#### TTL Constants
```javascript
TTL.SHORT = 60         // 1 minute
TTL.MEDIUM = 300       // 5 minutes
TTL.LONG = 900         // 15 minutes
TTL.VERY_LONG = 3600   // 1 hour
```

### 3. Cache Invalidation Strategy

#### Automatic Invalidation Triggers

**Job Operations:**
- `postJob()` → Clear all job listings, user's companies
- `applyJob()` → Clear specific job cache (application count changed)

**Company Operations:**
- `registerCompany()` → Clear user's company list
- `updateCompany()` → Clear company cache, user's companies, all job listings

**Pattern-Based Invalidation:**
- `jobs:all:*` → All job search queries (on job/company changes)
- `companies:user:{userId}` → User's company list
- Surgical precision to minimize unnecessary invalidations

### 4. Cache Management API

#### Admin Endpoints (Authenticated)

**Get Cache Statistics**
```
GET /api/v1/cache/stats
Response: { connected: true, info: "redis_stats..." }
```

**Clear All Caches**
```
POST /api/v1/cache/clear-all
Response: { message: "All caches cleared successfully" }
```

**Clear Cache Pattern**
```
POST /api/v1/cache/clear-pattern
Body: { pattern: "jobs:all:*" }
Response: { deletedCount: 42 }
```

### 5. Performance Metrics

#### Expected Improvements
- **Job Listings**: 80-90% reduction in database queries for popular searches
- **Company Profiles**: 95%+ cache hit rate (rarely updated)
- **Response Time**: 10-50ms (cache) vs 50-200ms (database)
- **Database Load**: 60-70% reduction during peak hours

#### Cache Hit Scenarios
- Same job search within 5 minutes → Instant
- Company profile view → Instant for 1 hour
- Job detail page → Instant for 15 minutes
- Paginated job results → Each page cached separately

## Configuration

### Environment Variables (.env)
```
REDIS_URL=redis://localhost:6379
```

For remote Redis or Redis Cloud:
```
REDIS_URL=redis://username:password@host:port
```

### Redis Installation

**Local Development (Windows):**
```bash
# Using Chocolatey
choco install redis-64

# Start Redis
redis-server

# Or use WSL2 + Docker
docker run -d -p 6379:6379 redis:alpine
```

**Production:**
- Redis Cloud (free tier available)
- AWS ElastiCache
- Azure Cache for Redis
- DigitalOcean Managed Redis

## Monitoring & Debugging

### Check Redis Connection
```bash
redis-cli ping
# Response: PONG
```

### View All Keys
```bash
redis-cli keys "*"
```

### View Specific Key
```bash
redis-cli get "job:12345"
```

### Check TTL
```bash
redis-cli ttl "job:12345"
# Response: seconds remaining
```

### Monitor Real-Time Operations
```bash
redis-cli monitor
```

### Cache Statistics via API
```bash
curl -X GET http://localhost:8000/api/v1/cache/stats \
  -H "Cookie: token=your_jwt_token"
```

## Code Integration Examples

### Adding Cache to New Endpoint

```javascript
import { cacheHelper, cacheKeys, TTL } from '../utils/redis.js';

export const getSomething = async (req, res) => {
    try {
        // Check cache first
        const cacheKey = `something:${req.params.id}`;
        const cached = await cacheHelper.get(cacheKey);
        if (cached) {
            logger.info('Serving from cache');
            return res.status(200).json(cached);
        }
        
        // Query database
        const data = await Model.find({ ... });
        
        const response = { data, success: true };
        
        // Cache for 5 minutes
        await cacheHelper.set(cacheKey, response, TTL.MEDIUM);
        
        return res.status(200).json(response);
    } catch (error) {
        // Handle error
    }
};
```

### Invalidating Cache on Update

```javascript
export const updateSomething = async (req, res) => {
    try {
        // Update database
        await Model.findByIdAndUpdate(id, data);
        
        // Invalidate caches
        await cacheHelper.del(`something:${id}`);
        await cacheHelper.delPattern('related:*');
        
        return res.status(200).json({ success: true });
    } catch (error) {
        // Handle error
    }
};
```

## Best Practices

### DO:
✅ Cache read-heavy data (job listings, profiles)
✅ Use appropriate TTLs (volatile data = shorter TTL)
✅ Invalidate aggressively on updates
✅ Log cache hits/misses for monitoring
✅ Handle Redis failures gracefully
✅ Use pattern-based deletion for related data

### DON'T:
❌ Cache user-specific sensitive data without encryption
❌ Set extremely long TTLs for frequently updated data
❌ Cache large objects (>1MB per key)
❌ Forget to invalidate on updates
❌ Use Redis as primary data store
❌ Cache error responses

## Troubleshooting

### Issue: Redis connection refused
**Solution**: 
1. Check if Redis is running: `redis-cli ping`
2. Verify REDIS_URL in .env
3. Check firewall rules

### Issue: High memory usage
**Solution**:
1. Reduce TTL values
2. Implement LRU eviction: `redis-cli CONFIG SET maxmemory-policy allkeys-lru`
3. Clear old caches: `POST /api/v1/cache/clear-all`

### Issue: Stale data being served
**Solution**:
1. Check cache invalidation logic
2. Reduce TTL for that resource
3. Clear specific pattern: `POST /api/v1/cache/clear-pattern`

### Issue: Cache misses despite caching
**Solution**:
1. Check cache key consistency (query parameter order)
2. Verify Redis connection is stable
3. Check Winston logs for cache errors

## Future Enhancements

1. **Cache Warming**: Pre-populate popular searches on startup
2. **Distributed Caching**: Redis Cluster for high availability
3. **Cache Analytics Dashboard**: Hit rates, memory usage charts
4. **Smart TTL**: Dynamic TTL based on access patterns
5. **Cache Tags**: Group related caches for easier invalidation
6. **Write-Through Cache**: Update cache and DB simultaneously
7. **Cache Versioning**: Handle schema changes gracefully
8. **Compression**: Compress large cached objects
9. **Multi-Level Cache**: Redis + In-Memory for ultra-fast reads
10. **Cache Preloading**: Background job to warm critical caches

## Dependencies Added
- `redis@4.x` - Official Redis client for Node.js

## Performance Testing

### Load Test Commands
```bash
# Without cache (first run)
ab -n 1000 -c 10 http://localhost:8000/api/v1/job/get

# With cache (subsequent runs)
ab -n 1000 -c 10 http://localhost:8000/api/v1/job/get

# Compare response times
```

### Expected Results
- Cache Miss: ~100-200ms average
- Cache Hit: ~10-30ms average
- Throughput: 3-5x improvement

## Security Considerations

- Redis runs on localhost by default (no external access)
- Authentication via REDIS_URL with password
- No sensitive data cached without encryption
- Cache management endpoints require authentication
- Regular cache clearing for compliance (GDPR)

## Maintenance

### Daily Tasks
- Monitor memory usage: `redis-cli info memory`
- Check connection count: `redis-cli info clients`

### Weekly Tasks
- Review cache hit rates in logs
- Adjust TTLs based on usage patterns
- Clear unused key patterns

### Monthly Tasks
- Analyze cache effectiveness
- Update invalidation strategies
- Review and optimize cache keys

## Code Locations

- **Redis Client**: `backend/utils/redis.js`
- **Cache Controller**: `backend/controllers/cache.controller.js`
- **Cache Routes**: `backend/routes/cache.route.js`
- **Job Controller**: `backend/controllers/job.controller.js`
- **Company Controller**: `backend/controllers/company.controller.js`
- **Application Controller**: `backend/controllers/application.controller.js`
- **Server Init**: `backend/index.js`
