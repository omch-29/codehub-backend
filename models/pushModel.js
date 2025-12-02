// const mongoose = require("mongoose");

// const PushLogSchema = new mongoose.Schema({
//   repoId: { type: mongoose.Schema.Types.ObjectId, ref: "Repository", required: true },
//   date: { type: Date, required: true }
// });

// module.exports = mongoose.model("PushLog", PushLogSchema);

const mongoose = require("mongoose");

const pushLogSchema = new mongoose.Schema({
    repoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Repository",
        required: true
    },
    pushedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("PushLog", pushLogSchema);
