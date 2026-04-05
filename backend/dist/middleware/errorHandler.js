"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const http_status_codes_1 = require("http-status-codes");
const logger_1 = require("../utils/logger");
function notFoundHandler(req, res) {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({ message: `Route not found: ${req.originalUrl}` });
}
function errorHandler(error, _req, res, _next) {
    logger_1.logger.error("Unhandled error", error);
    return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
    });
}
