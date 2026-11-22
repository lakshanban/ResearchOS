import type { Request, Response, NextFunction } from "express";

import mongoose from "mongoose";

import { ResearchProject } from "../projects/models/research-project.model.js";

import { ResearchDocument } from "./models/research-document.model.js";

import { ingestDocument } from "./document-ingestion.service.js";

import { answerFromDocuments } from "./document-qa.service.js";

export async function uploadDocumentController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: "Please upload a document",
      });
      return;
    }

    const document = await ingestDocument({
      projectId: req.params.projectId as string,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath: file.path,
    });

    res.status(201).json({
      success: true,
      message: "Document uploaded and indexed successfully",
      data: document,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!mongoose.isValidObjectId(req.params.projectId)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
      return;
    }

    const project = await ResearchProject.findOne({
      _id: req.params.projectId,
      ownerId: "local-user",
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const documents = await ResearchDocument.find({
      projectId: project._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
}

export async function askDocumentsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { query } = req.body;

    if (
      typeof query !== "string" ||
      query.trim().length < 5 ||
      query.length > 5000
    ) {
      res.status(400).json({
        success: false,
        message: "A valid research query is required",
      });
      return;
    }

    if (!mongoose.isValidObjectId(req.params.projectId)) {
      res.status(400).json({
        success: false,
        message: "Invalid project ID",
      });
      return;
    }

    const project = await ResearchProject.findOne({
      _id: req.params.projectId,
      ownerId: "local-user",
    });

    if (!project) {
      res.status(404).json({
        success: false,
        message: "Project not found",
      });
      return;
    }

    const result = await answerFromDocuments(
      project._id.toString(),
      query.trim(),
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
