

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

async function addRepo(filepath) {
    const repoPath = path.resolve(process.cwd(), ".codehub");
    const stagingPath = path.join(repoPath, "staging");
    const ROOT_IGNORE = [".env", "node_modules", ".codehub", ".git"];


    try {
        await fs.access(repoPath);
        await fs.mkdir(stagingPath, { recursive: true });

        if(filepath === "." || filepath === "./"){
            const currentDir = process.cwd();
            const items = await fs.readdir(currentDir);
            for (const item of items) {
                // if ([".codehub", "node_modules", ".git"].includes(item)) continue;
                if (ROOT_IGNORE.includes(item)) {
                        console.log(`Skipped ignored item: ${item}`);
                        continue;
                    }
                const src = path.join(currentDir, item);
                const dest = path.join(stagingPath, item);

                const stats = fssync.statSync(src);

                if (stats.isDirectory()) {
                    await copyRecursive(src, dest);
                } else {
                    await fs.copyFile(src, dest);
                }

                console.log(`Added: ${item}`);
            }

            return;
        }

        const fileName = path.basename(filepath);
        if (ROOT_IGNORE.includes(fileName)) {
                console.log(`Cannot add "${fileName}" — It is ignored for security reasons.`);
                return;
            }

        const destination = path.join(stagingPath, fileName);

        
        const stats = fssync.statSync(filepath);

        if (stats.isDirectory()) {
            await copyRecursive(filepath, destination);
        } else {
            await fs.copyFile(filepath, destination);
        }

        console.log(`✅ Added: ${fileName}`);
    } catch (err) {
        console.log("❌ error adding file:", err);
    }
}

module.exports = { addRepo };
