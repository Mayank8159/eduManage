"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = authorize;
const http_status_codes_1 = require("http-status-codes");
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({ message: "Forbidden: insufficient role" });
        }
        return next();
    };
}
