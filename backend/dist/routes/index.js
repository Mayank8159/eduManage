"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const principal_routes_1 = __importDefault(require("./principal.routes"));
const teacher_routes_1 = __importDefault(require("./teacher.routes"));
const student_routes_1 = __importDefault(require("./student.routes"));
const notification_routes_1 = __importDefault(require("./notification.routes"));
const router = (0, express_1.Router)();
router.use("/auth", auth_routes_1.default);
router.use("/principal", principal_routes_1.default);
router.use("/teacher", teacher_routes_1.default);
router.use("/student", student_routes_1.default);
router.use("/notifications", notification_routes_1.default);
exports.default = router;
