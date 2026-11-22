import { Router } from "express";

import {
  uploadDocumentController,
  getDocumentsController,
  askDocumentsController,
} from "./document.controller.js";

import { documentUpload } from "./document-upload.middleware.js";

const router = Router({
  mergeParams: true,
});

router.post("/", documentUpload.single("document"), uploadDocumentController);

router.get("/", getDocumentsController);

router.post("/ask", askDocumentsController);

export default router;
