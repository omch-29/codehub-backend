# CodeHub GHX CLI

A lightweight command-line tool for the **CodeHub web application**, allowing users to add files, commit changes, and push code directly from their terminal — similar to Git, but simpler and fully connected to the CodeHub backend.

---

## Features

- Initialize a CodeHub repo locally  
- Add files or entire folders to staging  
- Ignore `node_modules`, `.git`, `.env`, `.codehub` automatically  
- Commit with messages  
- Push all commits to the CodeHub backend  
- Automatically uploads data to AWS S3 through CodeHub API  
- Works inside any project folder  
- CLI friendly, fast, and beginner-friendly  

---

## 📦 Installation

Install the CLI globally:

```bash
npm install -g codehub-ghx-cli



| Commands                | Description                       |
| ------------------      | --------------------------------- |
| `ghx init <repolink> `  | Initialize a local CodeHub repo   |
| `ghx add <file>`        | Add a file to staging             |
| `ghx add .`             | Add all files except ignored ones |
| `ghx commit "msg"`      | Commit staged files               |
| `ghx push`              | Upload commit to CodeHub          |


Quick Start
1️⃣ Initialize a new CodeHub repo, user will be provided with repolink whenever they create repository.
ghx init <repo-link>

2️⃣ Add files:
Add a single file:
ghx add <file-name>

Add everything in the current folder:
ghx add .

3️⃣ Commit your changes
ghx commit "your commit message"

4️⃣ Push to CodeHub cloud
ghx push


📁 Ignored Files (Auto-Ignored)

The CLI automatically ignores the following when using ghx add .:

node_modules/
.git/
.codehub/
.env
Any .env inside subfolders
Any node_modules inside subfolders