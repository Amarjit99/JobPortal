import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { User } from '../models/user.model.js';
import logger from '../utils/logger.js';

/**
 * Setup 2FA - Generate secret and QR code
 * GET /api/v1/2fa/setup
 */
export const setup2FA = async (req, res) => {
    try {
        const userId = req.id; // From isAuthenticated middleware
        
        const user = await User.findById(userId).select('+twoFactorSecret');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if 2FA is already enabled
        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is already enabled. Disable it first to generate a new secret.'
            });
        }

        // Generate a secret for the user
        const secret = speakeasy.generateSecret({
            name: `Job Portal (${user.email})`,
            issuer: 'Job Portal',
            length: 32
        });

        // Store the secret temporarily (not enabled yet)
        user.twoFactorSecret = secret.base32;
        await user.save();

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        logger.info(`2FA setup initiated for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: '2FA setup initiated. Scan the QR code with your authenticator app.',
            data: {
                secret: secret.base32, // User should save this as backup
                qrCode: qrCodeUrl,
                manualEntry: secret.otpauth_url
            }
        });
    } catch (error) {
        logger.error('2FA setup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to setup 2FA',
            error: error.message
        });
    }
};

/**
 * Verify TOTP token
 * POST /api/v1/2fa/verify
 * Body: { token }
 */
export const verify2FA = async (req, res) => {
    try {
        const userId = req.id;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'TOTP token is required'
            });
        }

        const user = await User.findById(userId).select('+twoFactorSecret');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Please setup 2FA first'
            });
        }

        // Verify the token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps before and after for clock skew
        });

        if (!verified) {
            logger.warn(`Failed 2FA verification attempt for user: ${user.email}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid token. Please try again.'
            });
        }

        logger.info(`2FA token verified for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Token verified successfully'
        });
    } catch (error) {
        logger.error('2FA verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify token',
            error: error.message
        });
    }
};

/**
 * Enable 2FA after verification
 * POST /api/v1/2fa/enable
 * Body: { token }
 */
export const enable2FA = async (req, res) => {
    try {
        const userId = req.id;
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'TOTP token is required to enable 2FA'
            });
        }

        const user = await User.findById(userId).select('+twoFactorSecret +backupCodes');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is already enabled'
            });
        }

        if (!user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: 'Please setup 2FA first'
            });
        }

        // Verify the token one final time before enabling
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 2
        });

        if (!verified) {
            logger.warn(`Failed 2FA enable attempt for user: ${user.email}`);
            return res.status(400).json({
                success: false,
                message: 'Invalid token. Cannot enable 2FA.'
            });
        }

        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);
        }

        // Hash backup codes before storing
        user.backupCodes = backupCodes.map(code => 
            crypto.createHash('sha256').update(code).digest('hex')
        );
        user.twoFactorEnabled = true;
        await user.save();

        logger.info(`2FA enabled for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: '2FA enabled successfully',
            data: {
                backupCodes: backupCodes // Show these only once
            }
        });
    } catch (error) {
        logger.error('2FA enable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enable 2FA',
            error: error.message
        });
    }
};

/**
 * Disable 2FA
 * POST /api/v1/2fa/disable
 * Body: { password }
 */
export const disable2FA = async (req, res) => {
    try {
        const userId = req.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to disable 2FA'
            });
        }

        const user = await User.findById(userId).select('+twoFactorSecret +backupCodes +password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled'
            });
        }

        // Verify password
        const bcrypt = await import('bcryptjs');
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            logger.warn(`Failed 2FA disable attempt (wrong password) for user: ${user.email}`);
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Disable 2FA and remove secrets
        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        user.backupCodes = [];
        await user.save();

        logger.info(`2FA disabled for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: '2FA disabled successfully'
        });
    } catch (error) {
        logger.error('2FA disable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable 2FA',
            error: error.message
        });
    }
};

/**
 * Regenerate backup codes
 * POST /api/v1/2fa/regenerate-backup-codes
 * Body: { password }
 */
export const regenerateBackupCodes = async (req, res) => {
    try {
        const userId = req.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const user = await User.findById(userId).select('+backupCodes +password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled'
            });
        }

        // Verify password
        const bcrypt = await import('bcryptjs');
        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        // Generate new backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);
        }

        // Hash and store
        user.backupCodes = backupCodes.map(code => 
            crypto.createHash('sha256').update(code).digest('hex')
        );
        await user.save();

        logger.info(`Backup codes regenerated for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Backup codes regenerated successfully',
            data: {
                backupCodes: backupCodes
            }
        });
    } catch (error) {
        logger.error('Regenerate backup codes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to regenerate backup codes',
            error: error.message
        });
    }
};

/**
 * Get 2FA status
 * GET /api/v1/2fa/status
 */
export const get2FAStatus = async (req, res) => {
    try {
        const userId = req.id;

        const user = await User.findById(userId).select('twoFactorEnabled');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                twoFactorEnabled: user.twoFactorEnabled
            }
        });
    } catch (error) {
        logger.error('Get 2FA status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get 2FA status',
            error: error.message
        });
    }
};
