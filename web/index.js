const express = require('express');
const path = require('path');
const expressLogging = require('express-logging');
const logger = require('logops');
const port = process.env.PORT || 8080;
const app = express();

app.use(expressLogging(logger));

// Needs to be served with this exact url but with JSON
app.use(
  '/.well-known/apple-app-site-association',
  express.static(
    __dirname + '/build/.well-known/apple-app-site-association',
    { setHeaders: (res) => res.type('json') }
  )
);

// serve static assets normally
app.use(express.static(__dirname + '/build'));

// handle every other route with index.html, which will contain
// a script tag to your application's JavaScript file(s).
app.get('*', function (request, response){
  response.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

app.listen(port);
console.log("server started on port " + port);