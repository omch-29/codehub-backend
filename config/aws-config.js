const AWS = require("aws-sdk");
require("dotenv").config();

// AWS.config.update({ region: "ap-south-1"});
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: "ap-south-1",
});

const s3 = new AWS.S3();
const s3_BUCKET = "gitbuck";

module.exports = {s3, s3_BUCKET};