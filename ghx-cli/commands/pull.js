const fs = require("fs").promises;
const path = require("path");
const { s3, s3_BUCKET } = require("../config/aws-config");

async function pullRepo() {
    const repopath = path.resolve(process.cwd(), ".codehub");
    const commitsPath = path.join(repopath, "commits");

    try {
        const data = await s3.listObjectsV2({
            Bucket: s3_BUCKET,
            Prefix: "commits/",
        }).promise();

        for (const obj of data.Contents) {
            const parts = obj.Key.split("/");
            if (parts.length < 3) continue;

            const commitId = parts[1];
            const filename = parts[2];

            const commitDirPath = path.join(commitsPath, commitId);
            await fs.mkdir(commitDirPath, { recursive: true });

            const fileData = await s3.getObject({
                Bucket: s3_BUCKET,
                Key: obj.Key,
            }).promise();

            await fs.writeFile(
                path.join(commitDirPath, filename),
                fileData.Body
            );
        }

        console.log("All commits pulled from S3!");
    } catch (err) {
        console.error("Unable to pull:", err);
    }
}

module.exports = { pullRepo };
