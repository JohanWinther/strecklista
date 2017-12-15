// Node.js notation for importing packages
var express = require('express');

// Spin up a server
var app = express();

// Get configurations for which directory to serve
var config = {
    "production" : {
        buildPath: "/build/default"
    },
    "development": {
        buildPath: ""
    }
}

// Serve static files from the main build directory
app.use(express.static(__dirname + config[app.get('env')].buildPath));

// Render index.html on the main page, specify the root
app.get('*', function(req, res){
    res.sendFile("index.html", {root: '.'});
});

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

// Tell the app to listen for requests on port 3000
app.listen(port, function () {
    console.log('App is up and running in ' + app.get('env') + ' mode!');
});
