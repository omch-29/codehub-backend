const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient, ObjectId, ReturnDocument } = require('mongodb');
const dotenv = require('dotenv');
// const ObjectId = require("mongodb").ObjectId;
dotenv.config();
const uri = process.env.MONGODB_URI;

let client;

async function connectClient() {
    if(!client){
        client = new MongoClient(uri,
        //      {useNewUrlParser:true,
        //       useUnifiedTopology:true,
        //  }
        );
         await client.connect();
    }
}

async function  signUp(req, res){
    const {username, password, email} = req.body;
    try{
        await connectClient();
        const db = client.db("codehub");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({username});
        if (user){
            return res.status(400).json({message:"User alraedy exists!!"})
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            password: hashedPassword,
            email,
            repositories : [],
            followedUsers : [],
            starRepos: []
        }
        const result = await usersCollection.insertOne(newUser);

        const token = jwt.sign(
            {id:result.insertedId},
             process.env.JWT_SECRET_KEY,
              {expiresIn:"1h"}
            );
        res.json({token:token, userId:result.insertedId});
    }catch(err){
        console.error("error during signup:", err.message);
        res.status(500).send("Server error");
        }
    
};
async function login(req, res){
    const { email, password } = req.body;
    try {
        await connectClient();
        const db = client.db("codehub");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({email});
        if (!user){
            return res.status(400).json({message:"Invalid credentials!!"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials!!"});
        }
        const token = jwt.sign({id:user._id}, process.env.JWT_SECRET_KEY, {expiresIn:"1h"});
        res.json({token:token, userId:user._id});

    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).send("Server error");
    }
};
async function getAllUsers(req, res){
   try {
        await connectClient();
        const db = client.db("codehub");
        const usersCollection = db.collection("users");

        const users = await usersCollection.find({}).toArray();
        res.json(users);
   } catch (error) {
        console.error("Error during fetching:", error.message);
        res.status(500).send("Server error");
   }
};

async function getUserProfile(req, res){
    const currentID = req.params.id;

    try {
        await connectClient();
        const db = client.db("codehub");
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({
            _id: new ObjectId(currentID),
        });
        if (!user){
            return res.status(404).json({message:"User not found!!"});
        }
        res.json(user, {message: "Profile fetched!"});
    } catch (error) {
        console.error("Error during fetching:", error.message);
        res.status(500).send("Server error");
    }
    
};

async function updateUserProfile(req, res) {
  const currentID = req.params.id;
  const { email, password } = req.body;

//   console.log("🟡 Received ID:", currentID);

  try {
    await connectClient();
    const db = client.db("codehub");
    const usersCollection = db.collection("users");

    const updateFields = {};
    if (email) updateFields.email = email;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateFields.password = hashedPassword;
    }

    // 👇 Debugging
    // console.log("🟢 Trying to update user with ID:", currentID);
    // console.log("🟢 Update fields:", updateFields);

    const result = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(currentID) },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    // console.log("🔵 Raw result:", result);

    if (!result) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.json(result);
  } catch (err) {
    console.error("Error during updating:", err.message);
    res.status(500).send("Server error!");
  }
}

// async function updateUserProfile(req, res) {
//   const currentID = req.params.id;   // e.g. "6910208de2bb20a243e4118d"
//   const { email, password } = req.body;

//   try {
//     await connectClient();
//     const db = client.db("githubclone");
//     const usersCollection = db.collection("users");

//     const updateFields = {};
//     if (email) updateFields.email = email;

//     if (password) {
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);
//       updateFields.password = hashedPassword;
//     }

//     const result = await usersCollection.findOneAndUpdate(
//       { _id: new ObjectId(currentID) },
//       { $set: updateFields },
//       { returnDocument: "after" }
//     );

//     if (!result || !result.value) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     res.json(result.value);
//   } catch (err) {
//     console.error("Error during updating:", err.message);
//     res.status(500).send("Server error!");
//   }
// }
// async function updateUserProfile(req, res){
//     const currentID = req.params.id;
//     const {email, password} = req.body;

//     try {
//         await connectClient();
//         const db = client.db("codehub");
//         const usersCollection = db.collection("users");

//         let updateFields = {email};
//         if(password){
//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);
//             updateFields.password = hashedPassword;
//         }
//         const result = await usersCollection.findOneAndUpdate({
//             _id: new ObjectId(currentID),
//         },
//          {$set: updateFields},
//         {returnDocument: "after"}
//     );
//     if(!result.value){
//         return res.status(404).json({message:"User not found!!"});
//     }
//     res.send(result.value);
//     } catch (error) {
//          console.error("Error during updating:", error.message);
//         res.status(500).send("Server error");
//     }
// };
// const currentID = req.params.id;
//   const { email, password } = req.body;

//   try {
//     await connectClient();
//     const db = client.db("githubclone");
//     const usersCollection = db.collection("users");

//     let updateFields = { email };
//     if (password) {
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);
//       updateFields.password = hashedPassword;
//     }

//     const result = await usersCollection.findOneAndUpdate(
//       {
//         _id: new ObjectId(currentID),
//       },
//       { $set: updateFields },
//       { returnDocument: "after" }
//     );
//     if (!result.value) {
//       return res.status(404).json({ message: "User not found!" });
//     }

//     res.send(result.value);
//   } catch (err) {
//     console.error("Error during updating : ", err.message);
//     res.status(500).send("Server error!");
//   }
// }

async function deleteUserProfile(req, res){
     const currentID = req.params.id;
    try {
         await connectClient();
        const db = client.db("codehub");
        const usersCollection = db.collection("users");
        const result = await usersCollection.deleteOne({
            _id: new ObjectId(currentID),
        });
         if(result.deletedCount==0){
        return res.status(404).json({message:"User not found!!"});
        }
        res.json({message: "User Profile Deleted"});
    } catch (error) {
         console.error("Error during updating:", error.message);
        res.status(500).send("Server error");
    }
};

module.exports = {
    getAllUsers,
    signUp,
    login,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile
};