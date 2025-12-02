import { Router } from "express";
import applicationsController from "./applications.controller";

/**
 * Applications Routes
 */
const router = Router();

// Public routes
// Note: File upload is handled in the controller using multer
router.get("/", applicationsController.getApplications); // Add GET route for checking applications
router.get("/files/:filename", applicationsController.downloadFile); // File download route
router.post("/", applicationsController.submitApplication);

export default router;
