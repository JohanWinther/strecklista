// Node.js notation for importing packages
const express = require("express");
const path = require("path");
// Spin up a server
const app = express();

// Get configurations for which directory to serve
const config = {
  "production": {
    buildPath: "/build/default",
  },
  "development": {
    buildPath: "",
  },
};

// Set path for build directory
const fullPath = path.join(__dirname, config[app.get("env")].buildPath);

// Serve static files from the main build directory
app.use(express.static(fullPath));

// Render index.html on the main page, specify the root
app.get("*", function(req, res) {
  res.sendFile("index.html", {root: fullPath});
});

// set the port of our application
// process.env.PORT lets the port be set by Heroku
const port = process.env.PORT || 8080;

// Tell the app to listen for requests on port 3000
app.listen(port, function() {
  console.log("App is up and running in " + app.get("env") + " mode!");
});
