"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const ActivityLog_1 = require("../models/ActivityLog");
async function logActivity(input) {
    await ActivityLog_1.ActivityLog.create(input);
}
