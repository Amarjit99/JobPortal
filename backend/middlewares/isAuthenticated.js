import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const isAuthenticated = async (req, res, next) => {
    try {
        console.log('isAuthenticated middleware called');
        console.log('Cookies:', req.cookies);
        
        const token = req.cookies.token;
        if (!token) {
            console.log('isAuthenticated: No token found in cookies');
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            })
        }
        
        console.log('isAuthenticated: Token found');
        
        try {
            const decode = await jwt.verify(token, process.env.SECRET_KEY);
            console.log('isAuthenticated: Token decoded, userId:', decode.userId);
            
            if(!decode){
                console.log('isAuthenticated: Decode failed');
                return res.status(401).json({
                    message:"Invalid token",
                    success:false
                })
            };
            req.id = decode.userId;
            console.log('isAuthenticated: Set req.id to:', req.id);
            next();
        } catch (jwtError) {
            console.log('isAuthenticated: JWT error:', jwtError.message);
            // Token expired or invalid
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    message: "Access token expired. Please refresh your token.",
                    success: false,
                    code: "TOKEN_EXPIRED"
                });
            }
            return res.status(401).json({
                message: "Invalid token",
                success: false
            });
        }
    } catch (error) {
        console.error('isAuthenticated: Unexpected error:', error);
        logger.error('Error in authentication middleware:', error);
        return res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
export { isAuthenticated };
export default isAuthenticated;
