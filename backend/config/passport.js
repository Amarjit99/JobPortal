import './env.js'; // Load environment variables FIRST
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

// Configure Google OAuth Strategy (only if credentials are provided)
const hasGoogleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (hasGoogleCredentials) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8000/api/v1/auth/google/callback',
                scope: ['profile', 'email']
            },
            async (accessToken, refreshToken, profile, done) => {
            try {
                // Extract user information from Google profile
                const { id, displayName, emails, photos } = profile;
                const email = emails[0].value;
                const profilePhoto = photos[0]?.value || '';

                // Check if user already exists with this Google ID
                let user = await User.findOne({ googleId: id });

                if (user) {
                    // User exists, return user
                    logger.info(`Google OAuth: Existing user logged in - ${email}`);
                    return done(null, user);
                }

                // Check if user exists with this email (account linking)
                user = await User.findOne({ email });

                if (user) {
                    // Link Google account to existing user
                    user.googleId = id;
                    user.oauthProvider = 'google';
                    if (!user.profile.profilePhoto) {
                        user.profile.profilePhoto = profilePhoto;
                    }
                    user.isVerified = true; // Google emails are verified
                    await user.save();
                    
                    logger.info(`Google OAuth: Linked Google account to existing user - ${email}`);
                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    fullname: displayName,
                    email,
                    googleId: id,
                    oauthProvider: 'google',
                    role: 'student', // Default role
                    profile: {
                        profilePhoto
                    },
                    isVerified: true, // Google emails are verified
                    password: Math.random().toString(36).slice(-16) // Random password (won't be used)
                });

                logger.info(`Google OAuth: New user created - ${email}`);
                return done(null, user);
            } catch (error) {
                logger.error('Google OAuth Error:', error);
                return done(error, null);
            }
        }
    )
);
} else {
    logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not found in environment variables');
}

// Configure LinkedIn OAuth Strategy (only if credentials are provided)
const hasLinkedInCredentials = process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET;

if (hasLinkedInCredentials) {
    passport.use(
        new LinkedInStrategy(
            {
                clientID: process.env.LINKEDIN_CLIENT_ID,
                clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
                callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:8000/api/v1/auth/linkedin/callback',
                scope: ['openid', 'profile', 'email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Extract user information from LinkedIn profile
                    const { id, displayName, emails, photos } = profile;
                    const email = emails && emails[0] ? emails[0].value : null;
                    const profilePhoto = photos && photos[0] ? photos[0].value : '';

                    if (!email) {
                        return done(new Error('Email not provided by LinkedIn'), null);
                    }

                    // Check if user already exists with this LinkedIn ID
                    let user = await User.findOne({ linkedinId: id });

                    if (user) {
                        logger.info(`LinkedIn OAuth: Existing user logged in - ${email}`);
                        return done(null, user);
                    }

                    // Check if user exists with this email (account linking)
                    user = await User.findOne({ email });

                    if (user) {
                        // Link LinkedIn account to existing user
                        user.linkedinId = id;
                        user.oauthProvider = 'linkedin';
                        if (!user.profile.profilePhoto && profilePhoto) {
                            user.profile.profilePhoto = profilePhoto;
                        }
                        user.isVerified = true;
                        await user.save();
                        
                        logger.info(`LinkedIn OAuth: Linked LinkedIn account to existing user - ${email}`);
                        return done(null, user);
                    }

                    // Create new user
                    user = await User.create({
                        fullname: displayName,
                        email,
                        linkedinId: id,
                        oauthProvider: 'linkedin',
                        role: 'student',
                        profile: {
                            profilePhoto
                        },
                        isVerified: true,
                        password: Math.random().toString(36).slice(-16)
                    });

                    logger.info(`LinkedIn OAuth: New user created - ${email}`);
                    return done(null, user);
                } catch (error) {
                    logger.error('LinkedIn OAuth Error:', error);
                    return done(error, null);
                }
            }
        )
    );
} else {
    logger.warn('LinkedIn OAuth not configured - LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET not found');
}

// Configure GitHub OAuth Strategy (only if credentials are provided)
const hasGitHubCredentials = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

if (hasGitHubCredentials) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:8000/api/v1/auth/github/callback',
                scope: ['user:email']
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Extract user information from GitHub profile
                    const { id, displayName, username, emails, photos } = profile;
                    const email = emails && emails[0] ? emails[0].value : null;
                    const profilePhoto = photos && photos[0] ? photos[0].value : '';
                    const fullname = displayName || username || 'GitHub User';

                    if (!email) {
                        return done(new Error('Email not provided by GitHub. Please make your email public.'), null);
                    }

                    // Check if user already exists with this GitHub ID
                    let user = await User.findOne({ githubId: id });

                    if (user) {
                        logger.info(`GitHub OAuth: Existing user logged in - ${email}`);
                        return done(null, user);
                    }

                    // Check if user exists with this email (account linking)
                    user = await User.findOne({ email });

                    if (user) {
                        // Link GitHub account to existing user
                        user.githubId = id;
                        user.oauthProvider = 'github';
                        if (!user.profile.profilePhoto && profilePhoto) {
                            user.profile.profilePhoto = profilePhoto;
                        }
                        user.isVerified = true;
                        await user.save();
                        
                        logger.info(`GitHub OAuth: Linked GitHub account to existing user - ${email}`);
                        return done(null, user);
                    }

                    // Create new user
                    user = await User.create({
                        fullname,
                        email,
                        githubId: id,
                        oauthProvider: 'github',
                        role: 'student',
                        profile: {
                            profilePhoto
                        },
                        isVerified: true,
                        password: Math.random().toString(36).slice(-16)
                    });

                    logger.info(`GitHub OAuth: New user created - ${email}`);
                    return done(null, user);
                } catch (error) {
                    logger.error('GitHub OAuth Error:', error);
                    return done(error, null);
                }
            }
        )
    );
} else {
    logger.warn('GitHub OAuth not configured - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET not found');
}

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;
