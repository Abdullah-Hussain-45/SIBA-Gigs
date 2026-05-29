// server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const protectRoute = (req, res, next) => {
    let token;

    // Check header configuration
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Decrypt token variables
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Appends { id, role } to current req scope
            
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Session expired or invalid token architecture.' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access Denied: Token missing.' });
    }
};

// Role Access Guard
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized system role clearance.' });
        }
        next();
    };
};