import { Router } from "express";
import authRoutes from "./auth.routes";
import principalRoutes from "./principal.routes";
import teacherRoutes from "./teacher.routes";
import studentRoutes from "./student.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/principal", principalRoutes);
router.use("/teacher", teacherRoutes);
router.use("/student", studentRoutes);
router.use("/notifications", notificationRoutes);

export default router;
