const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const http = require('http');
const {Server} = require('socket.io');
const mainRouter = require('./routes/main.router.js');

const yargs = require("yargs");
const {hideBin} = require('yargs/helpers');

const {initRepo} = require('./controllers/init.js');
const {addRepo} = require('./controllers/add.js');
const {commitRepo} = require('./controllers/commit.js');
const {pushRepo} = require('./controllers/push.js');
const {pullRepo} = require('./controllers/pull.js');
const {revertRepo} = require('./controllers/revert.js');

dotenv.config();

yargs(hideBin(process.argv))
.command('start', "Starts a new server", {}, startServer)
.command('init', "initialise a new repository", {}, initRepo)
.command('add <file>', "Add a file to the repository", (yargs)=>
    {yargs.positional("file",{
        describe:"File to add to staging area", type: "string"
    })
},
(argv) => {
 addRepo(argv.file);
}
)
 .command('commit <message>', "Commit the staged files", (yargs)=>
    {
        yargs.positional("message",{
            describe: "Commit message",
            type: "string",
        });
    },
    (argv)=>{
     commitRepo(argv.message);
    }
 )
.command('push', "Push commits to S3", {}, pushRepo)
.command('pull', "Pull commits from S3", {}, pullRepo)
.command(
    'revert <commitID>', "revert to specific commit",(yargs)=> {
        yargs.positional("commitID",{
            describe: "Commit Id to revert",
            type: "string",
        })
    },
    (argv)=>{ revertRepo(argv.commitID);
    })
.demandCommand(1, "you need at least one command")
.help().argv;

function startServer(){
    const app = express();
    const port=process.env.PORT || 3000;

    app.use(bodyParser.json());
    app.use(express.json());

    const mongoURI = process.env.MONGODB_URI;
    mongoose.connect(mongoURI)
    .then(()=>console.log("MongoDB connected!"))
    .catch((err)=>console.error("Unable to connect",err));


    const allowedOrigins = [
  "http://localhost:3000",
  "https://main.dc5bs2bxp9e9j.amplifyapp.com",
  "https://codehub-frontend-d66m.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



//     app.use(cors({origin: function(origin, callback) {
//     if (origin === "https://main.dc5bs2bxp9e9j.amplifyapp.com" || 
//         origin === "https://codehub-frontend-d66m.onrender.com") {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },   
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],

//     }));
    app.use("/", mainRouter);
   

    let user = "test";
    const httpServer = http.createServer(app);
    const io = new Server(httpServer,{
        cors: {
            origin:"*",
            methods:["GET", "POST"],
        },
    });
    io.on("connection", (socket)=>{
        socket.on("joinRoom", (userID)=>{
            user = userID;
            console.log("====");
            console.log(user);
            console.log("====");
            socket.join(userID);
        });
    });

    const db = mongoose.connection;
    db.once("open", async()=>{
        console.log("CRUD opeartions called");
    });

    httpServer.listen(port, ()=>{
        console.log(`listening on ${port}`);
    });
}