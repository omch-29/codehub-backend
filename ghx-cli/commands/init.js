
const fs = require("fs").promises;
const path = require("path");


async function initRepo(repoLink) {

    function extractRepoId(repoLink) {
  const url = new URL(repoLink);
  return url.searchParams.get("repoId");
}

    const repoPath = path.resolve(process.cwd(), ".codehub");
    const commitsPath = path.join(repoPath, "commits");

    try {
        await fs.mkdir(repoPath, { recursive: true });
        await fs.mkdir(commitsPath, { recursive: true });

        const repoId = extractRepoId(repoLink);
    
    if (!repoId) {
        console.error("repoId missing in clone URL!");
        return;
    }

        await fs.writeFile(
            path.join(repoPath, "config.json"),
            JSON.stringify({
                bucket: process.env.S3_BUCKET,
                repoLink,
                repoId
            })
        );

        console.log("Repository initialized!");
        console.log("Repo ID saved:", repoId);

        if (repoLink) console.log("Linked to:", repoLink);

    } catch (error) {
        console.error("Error initializing repository", error);
    }
}

module.exports = { initRepo };
