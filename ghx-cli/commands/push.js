

// ghx-cli/commands/push.js
const fs = require("fs").promises;
const fssync = require("fs");
const path = require("path");
const axios = require("axios");
const mongoose = require('mongoose');
const { s3, s3_BUCKET } = require("../config/aws-config");
const PushLog = require('../../models/pushModel');
require('dotenv').config;


async function connectDB(){
    const mongoURI = process.env.MONGODB_URI;
        mongoose.connect(mongoURI)
        .then(()=>console.log("push date saved"))
        .catch((err)=>console.error("Unable to connect",err));
}



// uploadRecursive:

async function uploadRecursive(localPath, baseDir, commitId, collectedFiles) {

    const relative = path.relative(baseDir, localPath).replace(/\\/g, "/");

    if (relative !== "") {
        collectedFiles.push({
            filename: path.basename(localPath),
            commit: commitId,
            path: `repo/${commitId}/${relative}`,
            folder: path.dirname(relative).replace(/\\/g, "/"),
            fullS3Path: `repo/${commitId}/${relative}`,
            fullPath: `repo/${commitId}/${relative}`,
            isFolder: true
        });
    }


    const stats = fssync.statSync(localPath);

    if (stats.isDirectory()) {
        const items = await fs.readdir(localPath);
        for (const item of items) {
            const itemLocal = path.join(localPath, item);
            await uploadRecursive(itemLocal, baseDir, commitId, collectedFiles);
        }
    } else {
        
        const relative = path.relative(baseDir, localPath).replace(/\\/g, "/");

        const cleanPath = relative.replace(/\\/g, "/");
        // const s3Key = `commits/${commitId}/${relative}`; // canonical S3 key and DB path
        const s3Key = `repo/${commitId}/${cleanPath}`;
        const fileIdPath = cleanPath;
        const fileContent = await fs.readFile(localPath);

        // upload to S3 under canonical key
        await s3.upload({
            Bucket: s3_BUCKET,
            Key: s3Key,
            Body: fileContent
        }).promise();

        const filename = path.basename(localPath);
        const folder = path.dirname(relative).replace(/\\/g, "/"); // relative folder inside commit

        collectedFiles.push({
            // filename,
            // commit: commitId,
            // // path: s3Key,      // canonical path saved to DB
            // // folder: folder === "." ? "" : folder,
            // // isFolder: false
            // path: cleanPath,   // <-- canonical
            // folder: folder === "." ? "" : folder,
            // fullS3Path: s3Key,  // <-- actual file stored in S3
            // fullPath: cleanPath,
            // isFolder: false
             filename,
    commit: commitId,
    path: s3Key,        // <--- ALWAYS THIS
    folder: folder === "." ? "" : folder,
    fullS3Path: s3Key,  // <--- ALWAYS THIS
    fullPath: s3Key,    // <--- ALWAYS THIS
    isFolder: false
        });
    }
}

async function pushRepo() {
    const repoPath = path.resolve(process.cwd(), ".codehub");
    const commitsPath = path.join(repoPath, "commits");
    const configPath = path.join(repoPath, "config.json");

    try {
        const config = JSON.parse(await fs.readFile(configPath, "utf8"));
        const repoId = config.repoId;

        if (!repoId) {
            console.log("❌ repoId missing in .codehub/config.json");
            return;
        }


        const commitDirs = await fs.readdir(commitsPath);

        if (commitDirs.length === 0) {
            console.log("❌ No commits to push");
            return;
        }

        const lastCommit = commitDirs[commitDirs.length - 1];
        const metaFile = path.join(commitsPath, lastCommit, "commit.json");

        let commitMessage = "No commit message";
        if (fssync.existsSync(metaFile)) {
            const metaData = JSON.parse(await fs.readFile(metaFile, "utf8"));
            commitMessage = metaData.message;
        }




        // Fetch existing repo content so we can merge (and dedupe)
        const dbRes = await axios.get(`http://localhost:3000/repo/id/${repoId}`);
        // backend returns array; first element is repo object
        const existing = (dbRes.data && dbRes.data[0] && dbRes.data[0].content) || [];

        // map existing by path for fast overwrite
        const contentMap = {};
        existing.forEach(f => {
            if (!f || !f.path) return;
            contentMap[f.path] = f;
        });

        // const commitDirs = await fs.readdir(commitsPath);
        let newFiles = [];

        for (const commitId of commitDirs) {
            const commitFolder = path.join(commitsPath, commitId);

            // commitFolder may contain files/folders
            await uploadRecursive(
                commitFolder,
                commitFolder, // baseDir
                commitId,
                newFiles
            );
        }

        // merge/overwrite: newFiles wins
        for (const f of newFiles) {

            for (const existingPath in contentMap) {
        const old = contentMap[existingPath];

        // compare logical location (folder + filename)
        if (old.filename === f.filename && old.folder === f.folder) {
            delete contentMap[existingPath];
        }
    }


            contentMap[f.path] = f;
        }



        
        const finalFiles = Object.values(contentMap);

        // push finalFiles to backend (replace content)
        await axios.put(`http://localhost:3000/repo/update/${repoId}`, {
            content: finalFiles,
            message: commitMessage,
            description: ""
        });


        await fs.rm(commitsPath, { recursive: true, force: true });
        await fs.mkdir(commitsPath);
        await connectDB();


        console.log("✅ Push complete!");
        // console.log("Using repoId:", repoId);

        await PushLog.create({
    repoId: repoId,
    pushedAt: new Date()
});

        process.exit(0);
    } catch (err) {
        console.error("❌ Push error:", err);
        process.exit(1);
    }
}

module.exports = { pushRepo };
