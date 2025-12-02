const mongoose = require('mongoose');
const {Schema} = mongoose;

const RepositorySchema = new Schema({
    name:{
        type: String,
        required: true,
        // unique: true,
    },
    description: {
        type: String
    },
    content: [ {
    filename: String,
    commit: String,
    path: String,
    folder: String,
    isFolder: Boolean,
    createdAt: { type: Date, default: Date.now }
  }
],
    visibility: {
        type: Boolean,
    },
    message: {
        type: String,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    issues:[{
        type: Schema.Types.ObjectId,
        ref: "Issue",
    }
]
},
{
    timestamps: true
  });

const Repository = mongoose.model("Repository", RepositorySchema);

module.exports =  Repository;