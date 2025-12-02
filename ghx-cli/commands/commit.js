const fs = require("fs").promises;
const path = require('path');
const axios = require('axios');
const {v4: uuidv4} = require("uuid");
const fssync = require("fs");

async function copyRecursive(src, dest) {
    const stats = fssync.statSync(src);

    if (stats.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        const items = await fs.readdir(src);

        for (const item of items) {
            const srcItem = path.join(src, item);
            const destItem = path.join(dest, item);
            await copyRecursive(srcItem, destItem);
        }
    } else {
        await fs.copyFile(src, dest);
    }
}


async function commitRepo(message) {
    const repopath = path.resolve(process.cwd(), ".codehub");
    const stagedPath = path.join(repopath, "staging");
    const commitPath = path.join(repopath, "commits");
    const configPath = path.join(repopath, "config.json");

    try {
        const config = JSON.parse(await fs.readFile(configPath, "utf8"));
        const repoId = config.repoId;
        const commitID = uuidv4();
        const commitDir = path.join(commitPath, commitID);
        await fs.mkdir(commitDir, {recursive: true});

        const files = await fs.readdir(stagedPath);
        if (files.length === 0) {
        console.log(" Nothing to commit. Run: ghx add <file>");
        return;
    }
        for(const file of files){
            await copyRecursive(
                path.join(stagedPath, file),
                path.join(commitDir, file)
            );
        }

        await axios.put(`https://codehub-backend-jj4b.onrender.com/repo/update/${repoId}`, {
                    message:message,
                });

        await fs.writeFile(path.join(commitDir, "commit.json"),JSON.stringify({message, date:new Date().toISOString()}));
        console.log(`Commit ${commitID} created with message: ${message}`);
    } catch (err) {
        console.error("Error committing files: ",err);
    }
}

module.exports = {commitRepo};