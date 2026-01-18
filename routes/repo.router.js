
const express = require("express");
const repoController = require("../controllers/repoController");
const Repository = require("../models/repoModel");

const path = require("path");
const dotenv = require('dotenv');
const fs = require("fs");
const repoRouter = express.Router();
dotenv.config();



const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: "eu-north-1" || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});


repoRouter.post("/create", repoController.createRepository);
repoRouter.get("/all", repoController.getAllRepositories);
repoRouter.get("/id/:id", repoController.fetchRepositoryById);
repoRouter.get("/name/:name", repoController.fetchRepositoryByName);
repoRouter.get("/user/:userID", repoController.fetchRepositoryForCurrentUser);
repoRouter.get("/activity/:userID", repoController.getActivityForUser);
repoRouter.put("/update/:id", repoController.updateRepositoryById);
repoRouter.put("/visibility/:id", repoController.toggleVisibilityById);
repoRouter.delete("/delete/:id", repoController.deleteRepositoryById);
repoRouter.get("/contributions/repo/:repoId", repoController.getPushData);
repoRouter.post("/log-push", repoController.logPush);


// 🔥 SEARCH ROUTE
repoRouter.get("/search", async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) return res.json([]);

    const results = await Repository.find({
      name: { $regex: name, $options: "i" },
      visibility: true,
    });

    res.json(results);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});




repoRouter.get("/file/:repoId", async (req, res) => {
  try {
    const key = decodeURIComponent(req.query.path);

    const data = await s3.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key
    }));

    let chunks = [];
    for await (const chunk of data.Body) chunks.push(chunk);
    const content = Buffer.concat(chunks).toString("utf8");

    res.setHeader("Content-Type", "text/plain");
    return res.send(content);

  } catch (err) {
    console.error("S3 ERROR:", err);
    return res.status(500).json({ error: "S3 read failed" });
  }
});



const { ListObjectsV2Command } = require("@aws-sdk/client-s3");

repoRouter.get("/folder/:repoId", async (req, res) => {
  try {
    const prefix = decodeURIComponent(req.query.prefix || "");  

    const data = await s3.send(
      new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        Prefix: prefix,
        Delimiter: "/"   
      })
    );

    const folders = data.CommonPrefixes?.map(p => ({
      name: p.Prefix.split("/").slice(-2, -1)[0],
      path: p.Prefix,
      type: "folder"
    })) || [];

    const files = data.Contents?.filter(obj => obj.Key !== prefix)
      .map(obj => ({
        name: obj.Key.split("/").pop(),
        path: obj.Key,
        type: "file"
      })) || [];

    res.json({ folders, files });
  } catch (err) {
    console.error("S3 LIST ERROR:", err);
    res.status(500).json({ error: "Cannot list folder" });
  }
});






//     let chunks = [];
//     for await (const chunk of data.Body) chunks.push(chunk);
//     const content = Buffer.concat(chunks).toString("utf8");

//     return res.json({ content });

//   } catch (err) {
//     console.error("S3 ERROR:", err);
//     return res.status(500).json({ error: "S3 read failed" });
//   }
// });

// repoRouter.get("/file/:repoId", async (req, res) => {
//   const { repoId } = req.params;
//   const { path } = req.query;

//   try {
//     const repo = await Repository.findById(repoId);
//     if (!repo) return res.status(404).send("Repo not found");



module.exports = repoRouter;
