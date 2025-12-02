// const AWS = require("aws-sdk");

// AWS.config.update({ region: "ap-south-1"});

// const s3 = new AWS.S3();
// const s3_BUCKET = "gitbuck";

// module.exports = {s3, s3_BUCKET};
const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "ap-south-1",
});

const s3 = new AWS.S3();
const s3_BUCKET = process.env.S3_BUCKET;

module.exports = { s3, s3_BUCKET };
