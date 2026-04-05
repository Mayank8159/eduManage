import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { ROLES } from "../constants/roles";
import { asyncHandler } from "../utils/asyncHandler";
import { getStudentDashboard } from "../services/student.service";

const router = Router();

router.use(authenticate, authorize(ROLES.STUDENT));

router.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    const data = await getStudentDashboard(req.user!.id);
    if (!data) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    return res.json(data);
  })
);

export default router;
