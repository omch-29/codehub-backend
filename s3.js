const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const S3 = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    }
});
module.exports = S3;