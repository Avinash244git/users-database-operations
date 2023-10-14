const express = require("express");
const app = express();

const bcrypt = require("bcrypt");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

let db = null;

app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Register a particular user

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userExistDetails = await db.get(selectUserQuery);
  if (userExistDetails === undefined) {
    if (password.length < 5) {
      response.status = 400;
      response.send("Password is too short");
    } else {
      const createUserQuery = `
    INSERT INTO user(username, name, password, gender, location)
    VALUES(
        '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        '${location}'
    );`;
      await db.run(createUserQuery);
      response.status = 200;
      response.send("User created successfully");
    }
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

module.exports = app;

//login user API

app.post("/login", async (request, response) => {
  const { username, password } = request.body;

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userExistDetails = await db.get(selectUserQuery);
  if (userExistDetails === undefined) {
    response.status = 400;
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      password,
      userExistDetails.password
    );
    if (isPasswordMatch) {
      response.status = 200;
      response.send("Login success!");
    } else {
      response.status = 400;
      response.send("Invalid password");
    }
  }
});

module.exports = app;

// change password API

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const userExistDetails = await db.get(selectUserQuery);
  if (userExistDetails === undefined) {
    response.status = 400;
    response.send("No user Found");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userExistDetails.password
    );
    if (isPasswordMatch) {
      if (newPassword.length < 5) {
        response.status = 400;
        response.send("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const updateUserQuery = `
          UPDATE user
          SET password = '${encryptedPassword}'
          WHERE username = '${username}';`;
        await db.run(updateUserQuery);
        response.status = 200;
        response.send("Password updated");
      }
    } else {
      response.status = 400;
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
