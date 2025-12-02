const { s3, s3_BUCKET } = require("./config/aws-config");

s3.listBuckets((err, data) => {
  if (err) {
    console.log("❌ AWS ERROR:", err);
  } else {
    console.log("✅ AWS CONNECTED! Buckets:");
    console.log(data.Buckets);
  }
});
