#!/usr/bin/env node
process.env.DOTENV_SILENT = "true";
process.env.DOTENVX_SILENT = "true";

const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env")  
});
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

// Import your command functions
const { initRepo } = require("./commands/init");
const { addRepo } = require("./commands/add");
const { commitRepo } = require("./commands/commit");
const mongoose = require('mongoose');
const { pushRepo } = require("./commands/push");
const { pullRepo } = require("./commands/pull");
const { revertRepo } = require("./commands/revert");

yargs(hideBin(process.argv))

  // init
  .command(
    "init <repoLink>",
    "Initialize a repository in the current folder",
    (yargs) => {
      yargs
      .positional("repoLink", {
        type: "string",
        describe: "Repository link from CodeHub"
    })
    // .positional("repoId",{
    //       type: "string",
    //       describe: "Repository ID from CodeHub backend"
    //     });
    },
    (argv) => {
      initRepo(argv.repoLink);
    }
  )

  // add
  .command(
    "add <file>",
    "Add a file to staging",
    (y) => {
      y.positional("file", {
        describe: "File to stage",
        type: "string",
      });
    },
    (args) => {
      addRepo(args.file);
    }
  )

  // commit
  .command(
    "commit <message>",
    "Commit staged files",
    (y) => {
      y.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    (args) => {
      commitRepo(args.message);
    }
  )

  // push
  .command(
    "push",
    "Push commits to the remote backend/S3",
    () => {},
    () => {
      pushRepo();
    }
  )

  // pull
  .command(
    "pull",
    "Pull commits from the remote backend/S3",
    () => {},
    () => {
      pullRepo();
    }
  )

  // revert
  .command(
    "revert <commitID>",
    "Revert to a specific commit",
    (y) => {
      y.positional("commitID", {
        describe: "Commit ID to revert to",
        type: "string",
      });
    },
    (args) => {
      revertRepo(args.commitID);
    }
  )

  // default behavior
  .demandCommand(1, "You must supply a valid command")
  .help()
  .parse();
