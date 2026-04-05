"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const roles_1 = require("../constants/roles");
const asyncHandler_1 = require("../utils/asyncHandler");
const student_service_1 = require("../services/student.service");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, authorize_1.authorize)(roles_1.ROLES.STUDENT));
router.get("/dashboard", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await (0, student_service_1.getStudentDashboard)(req.user.id);
    if (!data) {
        return res.status(404).json({ message: "Student profile not found" });
    }
    return res.json(data);
}));
exports.default = router;
