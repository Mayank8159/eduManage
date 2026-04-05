"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const http_status_codes_1 = require("http-status-codes");
function validate(schema) {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body,
            params: req.params,
            query: req.query,
        });
        if (!result.success) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }
        return next();
    };
}
