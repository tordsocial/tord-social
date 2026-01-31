import type { Express, Request, Response } from "express";
import multer, { FileFilterCallback, StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const ext = path.extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export function registerLocalStorageRoutes(app: Express): void {
  app.post("/api/uploads", upload.single("file"), (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const objectPath = `/uploads/${file.filename}`;
      
      res.json({
        objectPath,
        metadata: {
          name: file.originalname,
          size: file.size,
          contentType: file.mimetype,
        },
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/uploads/:filename", (req: Request, res: Response) => {
    try {
      const filename = req.params.filename as string;
      const filePath = path.join(UPLOADS_DIR, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });
}
