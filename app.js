var express = require('express');
var ejs = require('ejs');
var path = require('path');
var fs= require('fs');
var uuid = require('node-uuid');
var app = express();

var router = require("./router/router.js");
var db = require("./models/db.js");

var ueditor = require("ueditor");
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
// view engine setup

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');

app.use("/ueditor/ue", ueditor(path.join(__dirname, 'public'), function (req, res, next) {
    //客户端上传文件设置
    var imgDir = '/img/ueditor/';
    var ActionType = req.query.action;
    if (ActionType === 'uploadimage' || ActionType === 'uploadfile' || ActionType === 'uploadvideo') {
        var file_url = imgDir;//图片上传地址
        /*其他上传格式的地址*/
        if (ActionType === 'uploadfile') {
            file_url = 'document/file/ueditor/'; //附件
        }
        if (ActionType === 'uploadvideo') {
            file_url = 'document/video/ueditor/'; //视频
        }
        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
    //  客户端发起图片列表请求
    else if (req.query.action === 'listimage') {
        var dir_url = imgDir;
        res.ue_list(dir_url); // 客户端会列出 dir_url 目录下的所有图片
    }
    // 客户端发起其它请求
    else {
        // console.log('config.json')
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
}));

app.post('/submit',router.save);

app.post('/cover',router.cover);

app.use('/add', router.addDoc);
app.use('/edit/:docId', router.editDoc);
app.use('/delete/:docId', router.deleteDoc);
app.use('/', router.showIndex);

app.listen(3000, function () {
    console.log('app listen : 3000');
});

module.exports = app;
