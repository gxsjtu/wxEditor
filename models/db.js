const Promise = require('promise');
var mongoose = require('mongoose');

mongoose.Promise = Promise;
// Build the connection string
var dbURI = 'mongodb://root:shyr021191@172.20.70.231:27017/wxEditor';
// var dbURI = 'mongodb://root:root@172.20.67.109:27060/babydate'

// Create the database connection
mongoose.connect(dbURI);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function() {
    console.log('Mongoose default connection open to ' + dbURI);
});

// If the connection throws an error
mongoose.connection.on('error', function(err) {
    console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function() {
    console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
    mongoose.connection.close(function() {
        console.log('Mongoose default connection disconnected through app termination');
        process.exit(0);
    });
});
