const fs = require("fs");
const path = require('path');
const { promisify } = require("util");
const {s3, s3_BUCKET} = require('../config/aws-config');

const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);


async function revertRepo(commitID) {
  const repopath = path.resolve(process.cwd(), ".codehub");
 const commitsPath = path.join(repopath, "commits");


 try {
    const commitDir = path.join(commitsPath, commitID);
    const files = await readdir(commitDir);
    const parentDir = path.resolve(repopath, "..");

    for(const file of files){
        await copyFile(path.join(commitDir, file), path.join(parentDir, file));
    }
    console.log(`Commit ${commitID} reverted successfully!`);
 } catch (err) {
    console.error("Unable to revert:", err);
 }
}

module.exports = {revertRepo};