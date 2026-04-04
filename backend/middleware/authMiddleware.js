const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // ✅ THE FIX: Catch the ID no matter what Jhanvi named it!
            const userId = decoded.id || decoded._id || decoded.userId; 
            req.user = await User.findById(userId).select('-password');
            
            next();
        } catch (error) {
            console.error("Backend Error: Token verification crashed ->", error.message);
            res.status(401).json({ message: "Not authorized, token failed" });
        }
    } else {
        res.status(401).json({ message: "Not authorized, no token" });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role '${req.user ? req.user.role : 'Unknown'}' is not authorized to access this route` 
            });
        }
        next();
    };
};

module.exports = { protect, authorize };