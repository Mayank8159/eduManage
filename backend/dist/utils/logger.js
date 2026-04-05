"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/* eslint-disable no-console */
exports.logger = {
    info: (message, meta) => console.log(`[INFO] ${message}`, meta || ""),
    error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ""),
};
