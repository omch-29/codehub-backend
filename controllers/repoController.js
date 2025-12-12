const mongoose = require('mongoose');
const Repository = require('../models/repoModel');
const User = require('../models/userModel');
const Issue = require('../models/issueModel');
const PushLog = require('../models/pushModel');
async function createRepository(req, res){

    const { owner, name, issues, content, description, visibility } = req.body;
   try {
    if(!name){
        return res.status(400).json({ error: "Repository name is required!"});
    }
    // let dupname = await Repository.findOne({nmae: name});
    // if(dupname) res.status(500).json({ error: "Server error" });
    if(!mongoose.Types.ObjectId.isValid(owner)){
    return res.status(400).json({ error: "Invalid user ID!"});
    }
    const newRepository = new Repository({
        name, description, visibility, owner,content,issues,
    });
    const result = await newRepository.save();

    res.status(201).json({
        message:"Repository created!",
        repositoryID:result._id,
    })

   } catch (err) {
      console.error("error during repository creation:", err.message);
     res.status(500).json({ error: "Server error" });

   }
};

async function getAllRepositories(req, res){
    try {
        
        const repositories = await Repository.find({visibility: true})
        .populate("owner")
        .populate("issues");

        res.json(repositories);

    } catch (err) {
     console.error("error during fetching repository:", err.message);
     res.status(500).json({ error: "Server error" });

    }
};

async function fetchRepositoryById(req, res){
    const { id } = req.params;
    try {
        const repository = await Repository.find({_id:id})
        .populate("owner")
        .populate("issues");
        res.json(repository);
    } catch (err) {
    console.error("error during fetching repository:", err.message);
     res.status(500).json({ error: "Server error" });

    }
}

async function fetchRepositoryByName(req, res){
    const { name } = req.params;
    try {
        const repository = await Repository.find({name:name})
        .populate("owner")
        .populate("issues");
        res.json(repository);
    } catch (err) {
    console.error("error during fetching repository:", err.message);
     res.status(500).json({ error: "Server error" });

    }
};
async function fetchRepositoryForCurrentUser(req, res){
    const { userID } = req.params;

  try {
    const repositories = await Repository.find({ owner: userID });

    if (!repositories || repositories.length == 0) {
      return res.json({ message: "No repositories yet", repositories: [] });
      // return res.status(404).json({ error: "User Repositories not found!" });
    }
    // console.log(repositories);
    res.json({ message: "Repositories found!", repositories });
  } catch (err) {
    console.error("Error during fetching user repositories : ", err.message);
    res.status(500).json({ error: "Server error" });

  }
};

async function updateRepositoryById(req, res){
    const {id} = req.params;
    const {content, description} = req.body;

    try{
         const repository = await Repository.findById(id);
        if (!repository) {
            return res.status(404).json({ error: "Repository not found!" });
        }
        
        repository.content = content;
    // repository.content.push(content);
    repository.description = description;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
    }catch (err) {
    console.error("Error during updating repository : ", err.message);
    res.status(500).json({ error: "Server error" });

  }
};
async function toggleVisibilityById(req, res){
    const { id } = req.params;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility : ", err.message);
    res.status(500).json({ error: "Server error" });

  }
}
async function deleteRepositoryById(req, res){
    const { id } = req.params;
  try {
    const repository = await Repository.findByIdAndDelete(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    res.json({ message: "Repository deleted successfully!" });
  } catch (err) {
    console.error("Error during deleting repository : ", err.message);
    res.status(500).json({ error: "Server error" });

  };
};
async function getActivityForUser(req, res) {
  const { userID } = req.params;
  try {
    // aggregate by createdAt date (YYYY-MM-DD) and count
    const data = await Repository.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userID) } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } } // oldest -> newest
    ]);


    res.json(data);
  } catch (err) {
    console.error("Error fetching activity:", err);
   res.status(500).json({ error: "Server error" });

  }
}


async function logPush(req, res){
  try {
    const { repoId, date } = req.body;

    await PushLog.create({
      repoId,
      pushedAt: date ? new Date(date) : new Date()
    });

    return res.status(201).json({ message: "Push logged" });

  } catch (err) {
    console.error("LOG PUSH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


async function getPushData(req, res) {
  try {
    const { repoId } = req.params;

    const pushes = await PushLog.find().sort({ pushedAt: 1 });

    return res.status(200).json(pushes);

  } catch (err) {
    console.log("Error fetching contributions", err);
    return res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
     createRepository,
     getAllRepositories,
     fetchRepositoryById,
     fetchRepositoryByName,
     fetchRepositoryForCurrentUser,
     updateRepositoryById,
     toggleVisibilityById,
     deleteRepositoryById,
     getActivityForUser,
     getPushData,
     logPush,
};