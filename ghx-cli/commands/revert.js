

const fs = require("fs").promises;
const fssync = require("fs");
const path = require("path");

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

async function revertRepo(commitID) {
    const repoPath = path.join(process.cwd(), ".codehub");
    const commitsPath = path.join(repoPath, "commits");
    const commitFolder = path.join(commitsPath, commitID);

    
    if (!fssync.existsSync(commitFolder)) {
        console.log(`❌ Commit "${commitID}" not found.`);
        return;
    }

    console.log(`🔄 Reverting to commit: ${commitID}`);

    const items = await fs.readdir(commitFolder);

    for (const item of items) {
        const src = path.join(commitFolder, item);
        const dest = path.join(process.cwd(), item);

        await copyRecursive(src, dest);
    }

    console.log("✅ Revert complete! Project reset to the selected commit.");
}

module.exports = { revertRepo };
