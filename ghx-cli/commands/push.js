

const fs = require("fs").promises;
const fssync = require("fs");
const path = require("path");
const axios = require("axios");
const mongoose = require('mongoose');
const { s3, s3_BUCKET } = require("../config/aws-config");
// const PushLog = require('../../models/pushModel');
require('dotenv').config;


// async function connectDB(){
//     const mongoURI = process.env.MONGODB_URI;
//         mongoose.connect(mongoURI)
//         .then(()=>console.log("push date saved"))
//         .catch((err)=>console.error("Unable to connect",err));
// }




async function uploadRecursive(localPath, baseDir, commitId, collectedFiles, repoId) {

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
        // const s3Key = `commits/${commitId}/${relative}`;
        const s3Key = `repo/${commitId}/${cleanPath}`;
        const fileIdPath = cleanPath;
        const fileContent = await fs.readFile(localPath);

        

        const fileBase64 = fileContent.toString("base64");

                await axios.post(
                "https://codehub-backend-jj4b.onrender.com/push-log/upload",
                {
                    repoId,                   
            s3Key,
            content: fileBase64,
            filename: path.basename(localPath),
            folder: path.dirname(relative).replace(/\\/g, "/") === "." ? "" : path.dirname(relative).replace(/\\/g, "/"),
            isFolder: false
                }
                );





        // await s3.upload({
        //     Bucket: s3_BUCKET,
        //     Key: s3Key,
        //     Body: fileContent
        // }).promise();

        const filename = path.basename(localPath);
        const folder = path.dirname(relative).replace(/\\/g, "/"); 

        collectedFiles.push({
            // filename,
            // commit: commitId,
            // // path: s3Key,      // 
            // // folder: folder === "." ? "" : folder,
            // // isFolder: false
            // path: cleanPath,   //
            // folder: folder === "." ? "" : folder,
            // fullS3Path: s3Key,  // 
            // fullPath: cleanPath,
            // isFolder: false
             filename,
    commit: commitId,
    path: s3Key,        
    folder: folder === "." ? "" : folder,
    fullS3Path: s3Key,  
    fullPath: s3Key,    
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
            console.log(" repoId missing in .codehub/config.json");
            return;
        }


        const commitDirs = await fs.readdir(commitsPath);

        if (commitDirs.length === 0) {
            console.log(" No commits to push");
            return;
        }

        const lastCommit = commitDirs[commitDirs.length - 1];
        const metaFile = path.join(commitsPath, lastCommit, "commit.json");

        let commitMessage = "No commit message";
        if (fssync.existsSync(metaFile)) {
            const metaData = JSON.parse(await fs.readFile(metaFile, "utf8"));
            commitMessage = metaData.message;
        }



        const dbRes = await axios.get(`https://codehub-backend-jj4b.onrender.com/repo/id/${repoId}`);
        
        const existing = (dbRes.data && dbRes.data[0] && dbRes.data[0].content) || [];

    
        const contentMap = {};
        existing.forEach(f => {
            if (!f || !f.path) return;
            contentMap[f.path] = f;
        });

        
        let newFiles = [];

        for (const commitId of commitDirs) {
            const commitFolder = path.join(commitsPath, commitId);

            // commitFolder
            await uploadRecursive(
                commitFolder,
                commitFolder, 
                commitId,
                newFiles,repoId,
            );
        }

        
        for (const f of newFiles) {

            for (const existingPath in contentMap) {
        const old = contentMap[existingPath];

    
        if (old.filename === f.filename && old.folder === f.folder) {
            delete contentMap[existingPath];
        }
    }


            contentMap[f.path] = f;
        }



        
        const finalFiles = Object.values(contentMap);

        // push
        await axios.put(`https://codehub-backend-jj4b.onrender.com/repo/update/${repoId}`, {
            content: finalFiles,
            message: commitMessage,
            description: ""
        });


        await fs.rm(commitsPath, { recursive: true, force: true });
        await fs.mkdir(commitsPath);
        // await connectDB();


        console.log(" Push complete!");
        // console.log("Using repoId:", repoId);

        try {
            await axios.post('https://codehub-backend-jj4b.onrender.com/push-log', {
                repoId: repoId,
                pushedAt: new Date()
            });
            console.log("Push log saved to backend");
        } catch (err) {
            console.error("Failed to save push log:", err.message);
        }
//         await PushLog.create({
//     repoId: repoId,
//     pushedAt: new Date()
// });

        process.exit(0);
    } catch (err) {
        console.error(" Push error:", err);
        process.exit(1);
    }
}

module.exports = { pushRepo };
