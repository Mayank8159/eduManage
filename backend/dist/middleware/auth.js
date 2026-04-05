"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const http_status_codes_1 = require("http-status-codes");
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ message: "Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];
    try {
        req.user = (0, jwt_1.verifyAccessToken)(token);
        return next();
    }
    catch {
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ message: "Token expired or invalid" });
    }
}
