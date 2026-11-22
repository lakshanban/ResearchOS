import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

const uploadDirectory = path.resolve("uploads");

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();

    callback(null, `${randomUUID()}${extension}`);
  },
});

export const documentUpload = multer({
  storage,

  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      callback(
        new Error("Only PDF, DOCX and TXT files are supported")
      );
      return;
    }

    callback(null, true);
  },
});