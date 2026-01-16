# Rate Limiting Implementation

## Overview
Comprehensive rate limiting across all API routes to prevent abuse, ensure fair usage, and protect server resources.

## Rate Limiter Types

### 1. Authentication Rate Limiter
- **Routes**: Login, Register, Password Reset, Email Verification
- **Limit**: 5 requests per 15 minutes
- **Window**: 15 minutes
- **Strategy**: Skip successful requests (only failed attempts count)
- **Purpose**: Prevent brute force attacks and credential stuffing

### 2. File Upload Rate Limiter
- **Routes**: Profile photo, Company logo, Resume uploads
- **Limit**: 10 uploads per hour
- **Window**: 1 hour
- **Purpose**: Prevent storage abuse and bandwidth exhaustion

### 3. Job Write Rate Limiter
- **Routes**: Create job, Update job
- **Limit**: 20 operations per hour
- **Window**: 1 hour
- **Purpose**: Prevent spam job postings

### 4. Company Write Rate Limiter
- **Routes**: Register company, Update company
- **Limit**: 15 operations per hour
- **Window**: 1 hour
- **Purpose**: Prevent fake company registrations

### 5. Application Rate Limiter
- **Routes**: Apply to job
- **Limit**: 10 applications per hour
- **Window**: 1 hour
- **Purpose**: Prevent automated bulk applications

### 6. Read Rate Limiter
- **Routes**: Browse jobs, Get job details, Get companies, Get applications
- **Limit**: 200 requests per 15 minutes
- **Window**: 15 minutes
- **Purpose**: Allow legitimate browsing while preventing scraping

### 7. Admin Rate Limiter
- **Routes**: Analytics, Cache management
- **Limit**: 50 requests per 15 minutes
- **Window**: 15 minutes
- **Purpose**: Balance admin operations with server load

## Route-Specific Implementation

### User Routes
| Route | Rate Limiter | Limit |
|-------|--------------|-------|
| POST /api/v1/user/register | authLimiter | 5/15min |
| POST /api/v1/user/login | authLimiter | 5/15min |
| POST /api/v1/user/profile/update | uploadLimiter | 10/hour |
| POST /api/v1/user/forgot-password | authLimiter | 5/15min |
| POST /api/v1/user/reset-password | authLimiter | 5/15min |
| POST /api/v1/user/resend-verification | authLimiter | 5/15min |

### Job Routes
| Route | Rate Limiter | Limit |
|-------|--------------|-------|
| POST /api/v1/job/post | jobWriteLimiter | 20/hour |
| GET /api/v1/job/get | readLimiter | 200/15min |
| GET /api/v1/job/get/:id | readLimiter | 200/15min |
| GET /api/v1/job/getadminjobs | readLimiter | 200/15min |

### Company Routes
| Route | Rate Limiter | Limit |
|-------|--------------|-------|
| POST /api/v1/company/register | companyWriteLimiter | 15/hour |
| PUT /api/v1/company/update/:id | uploadLimiter + companyWriteLimiter | 10/hour + 15/hour |
| GET /api/v1/company/get | readLimiter | 200/15min |
| GET /api/v1/company/get/:id | readLimiter | 200/15min |

### Application Routes
| Route | Rate Limiter | Limit |
|-------|--------------|-------|
| GET /api/v1/application/apply/:id | applicationLimiter | 10/hour |
| GET /api/v1/application/get | readLimiter | 200/15min |
| GET /api/v1/application/:id/applicants | readLimiter | 200/15min |
| POST /api/v1/application/status/:id/update | None | Unlimited |

### Analytics Routes
| Route | Rate Limiter | Limit |
|-------|--------------|-------|
| GET /api/v1/analytics/* | adminLimiter | 50/15min |

### Cache Routes
| Route | Rate Limiter | Limit |
|-------|--------------|-------|
| GET /api/v1/cache/stats | adminLimiter | 50/15min |
| POST /api/v1/cache/clear-all | adminLimiter | 50/15min |
| POST /api/v1/cache/clear-pattern | adminLimiter | 50/15min |

## Response Headers

All rate-limited responses include standard headers:
- `RateLimit-Limit`: Total requests allowed in window
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Time when the limit resets (Unix timestamp)

## Rate Limit Exceeded Response

When a rate limit is exceeded, the API returns:
```json
{
  "message": "Too many requests from this IP, please try again later.",
  "success": false
}
```

HTTP Status Code: `429 Too Many Requests`

## Configuration

All rate limiters are configured in: `backend/middlewares/rateLimiter.js`

### Customizing Limits

Edit the rate limiter configurations:

```javascript
export const jobWriteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Change this number
    message: {
        message: 'Custom error message',
        success: false
    },
    standardHeaders: true,
    legacyHeaders: false,
});
```

## Testing Rate Limits

### Manual Testing

**Test Authentication Limit:**
```bash
# Make 6 login attempts quickly
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/v1/user/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# 6th request should return 429
```

**Test Job Application Limit:**
```bash
# Apply to same job 11 times
for i in {1..11}; do
  curl -X GET http://localhost:8000/api/v1/application/apply/JOB_ID \
    -H "Cookie: token=YOUR_JWT"
done
# 11th request should return 429
```

**Test Read Limit:**
```bash
# Make 201 rapid job search requests
for i in {1..201}; do
  curl http://localhost:8000/api/v1/job/get
done
# 201st request should return 429
```

## Bypass Options

### IP Whitelisting
To exempt certain IPs (e.g., internal monitoring):

```javascript
export const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    skip: (req) => {
        // Whitelist specific IPs
        const whitelist = ['127.0.0.1', '::1'];
        return whitelist.includes(req.ip);
    }
});
```

### User-Based Rate Limiting
Change from IP-based to user-based:

```javascript
export const jobWriteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => {
        // Use user ID instead of IP
        return req.id || req.ip;
    }
});
```

## Best Practices

### DO:
✅ Set reasonable limits based on typical user behavior
✅ Use stricter limits for write operations
✅ Use more lenient limits for read operations
✅ Monitor rate limit hits in logs
✅ Adjust limits based on actual usage patterns
✅ Consider user tiers (free vs premium)

### DON'T:
❌ Set limits too strict (frustrates legitimate users)
❌ Set limits too loose (allows abuse)
❌ Apply same limit to all routes
❌ Forget to test limits under load
❌ Block legitimate traffic spikes

## Monitoring

### Check Rate Limit Hits
Rate limit violations are automatically logged by Winston. Check logs:

```bash
cat logs/app-2026-01-13.log | grep "429"
```

### Track Most Limited Routes
Analyze which routes hit limits most frequently:

```bash
cat logs/app-2026-01-13.log | grep "Too many" | awk '{print $X}' | sort | uniq -c | sort -nr
```

## Production Considerations

### Redis-Based Rate Limiting
For distributed systems, use Redis store:

```javascript
import RedisStore from 'rate-limit-redis';
import redisClient from '../utils/redis.js';

export const jobWriteLimiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rl:job:',
    }),
    windowMs: 60 * 60 * 1000,
    max: 20
});
```

### Nginx Rate Limiting
Add additional layer at reverse proxy level:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:8000;
}
```

## Troubleshooting

### Issue: Legitimate users getting rate limited
**Solution**: 
- Increase limits for affected routes
- Implement user-based rate limiting
- Add IP whitelisting for known users

### Issue: Rate limits not working
**Solution**:
- Check middleware order (rate limiter before routes)
- Verify express-rate-limit package installed
- Check for proxy configuration issues (req.ip)

### Issue: Rate limits reset too quickly
**Solution**:
- Increase windowMs value
- Consider using fixed window instead of sliding window

### Issue: Different users sharing rate limit
**Solution**:
- App might be behind proxy
- Set `trust proxy` in Express:
```javascript
app.set('trust proxy', 1);
```

## Security Benefits

1. **DDoS Protection**: Limits request flood attacks
2. **Brute Force Prevention**: Restricts login attempts
3. **API Scraping Prevention**: Blocks automated data harvesting
4. **Resource Protection**: Prevents server overload
5. **Fair Usage**: Ensures equal access for all users
6. **Cost Control**: Reduces bandwidth and compute costs

## Performance Impact

- **Overhead**: ~1-2ms per request (negligible)
- **Memory**: Minimal (stores IP + timestamp)
- **CPU**: Very low (simple counter operations)
- **Network**: No additional latency

## Future Enhancements

1. **Dynamic Rate Limiting**: Adjust limits based on server load
2. **User Tier System**: Different limits for free/premium users
3. **Geographic Rate Limiting**: Different limits per region
4. **Endpoint-Specific Limits**: More granular control
5. **Rate Limit Dashboard**: Real-time monitoring UI
6. **Grace Period**: Warn users before blocking
7. **CAPTCHA Integration**: Solve challenge instead of blocking
8. **Rate Limit Tokens**: Allow burst usage with token bucket

## Code Locations

- **Rate Limiters**: `backend/middlewares/rateLimiter.js`
- **User Routes**: `backend/routes/user.route.js`
- **Job Routes**: `backend/routes/job.route.js`
- **Company Routes**: `backend/routes/company.route.js`
- **Application Routes**: `backend/routes/application.route.js`
- **Analytics Routes**: `backend/routes/analytics.route.js`
- **Cache Routes**: `backend/routes/cache.route.js`

## Dependencies

- `express-rate-limit@7.x` - Core rate limiting middleware

## Migration Notes

**Breaking Changes:**
- Removed global API limiter
- Now using route-specific limiters
- Some routes may have stricter limits than before

**Upgrade Path:**
1. Monitor logs for rate limit hits
2. Adjust limits based on patterns
3. Notify users of new limits
4. Add retry logic in frontend
