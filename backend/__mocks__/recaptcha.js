// Mock reCAPTCHA middleware for testing - bypass verification
export const verifyCaptchaMiddleware = (req, res, next) => next();
