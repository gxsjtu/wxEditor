var mongoose = require('mongoose');
mongoose.connect('mongodb://root:shyr021191@172.20.70.231:27017/wxEditor');

var db = mongoose.connection;
db.once('open', function (callback) {
    console.log("数据库成功打开");
});

module.exports = db;
