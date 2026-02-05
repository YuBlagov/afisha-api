const jwt = require("jsonwebtoken");
const JWT_SECRET = "my-super-secret-key";

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(authHeader, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: "Invalid token" });
    }
}

module.exports = { authenticateToken, JWT_SECRET };