const express = require('express');
const router = express.Router();
const PushLog = require('../models/pushModel');
const { s3, s3_BUCKET } = require('../config/aws-config');
const Repo = require("../models/repoModel");
router.post('/', async (req, res) => {
    try {
        const { repoId, pushedAt } = req.body;

        if (!repoId) {
            return res.status(400).json({ message: "repoId is required" });
        }

        const log = await PushLog.create({ repoId, pushedAt: pushedAt || new Date() });

        res.status(201).json({ message: "Push log saved", log });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});
// router.post("/upload", async (req, res) => {
//   try {
//     const { repoId, s3Key, content } = req.body;

//     if (!repoId || !s3Key || !content) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     await s3.upload({
//       Bucket: s3_BUCKET,
//       Key: s3Key,
//       Body: Buffer.from(content, "base64")
//     }).promise();

//     await PushLog.create({ repoId });

//     res.status(201).json({ success: true });
//   } catch (err) {
//     console.error("Push upload error:", err);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });
router.post("/upload", async (req, res) => {
  try {
    const { repoId, s3Key, content, filename, folder, isFolder } = req.body;

    if (!repoId || !s3Key || !filename) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1️⃣ Upload to S3 only if it's a file
    if (!isFolder) {
      if (!content) {
        return res.status(400).json({ error: "File content missing" });
      }

      await s3.upload({
        Bucket: s3_BUCKET,
        Key: s3Key,
        Body: Buffer.from(content, "base64")
      }).promise();
    }

    // 2️⃣ Save metadata to MongoDB
    await Repo.findByIdAndUpdate(repoId, {
      $push: {
        content: {
          filename,
          path: s3Key,
          folder: folder || "",
          fullS3Path: s3Key,
          fullPath: s3Key,
          isFolder: !!isFolder
        }
      }
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Push upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});
module.exports = router;