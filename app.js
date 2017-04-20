var express = require('express');
var ejs = require('ejs');
var path = require('path');
var fs= require('fs');
var uuid = require('node-uuid');
var multer = require ('multer');


var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, './public/cover');
  },
  filename: function (req, file, callback) {
    //file.originalname   coffee.jpg
    var fileFormat = (file.originalname).split(".");

    callback(null, uuid.v4() + '.' + fileFormat[fileFormat.length - 1]);
  }
});
var upload = multer({ storage : storage}).single('cover');

var mongoose = require('mongoose');
var app = express();

var ueditor = require("ueditor");
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
// view engine setup

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('.html', ejs.__express);
app.set('view engine', 'html');

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


//增加换行
function appendLine(content,append){
  return content+append+'\r\n';
}

function makeContent(content){
  let result = appendLine('<html>','');
  result= appendLine(result,'<head>');
  result=appendLine(result,'<meta name = "viewport" content = "width=device-width, initial-scale = 1.0, maximum-scale = 1.0, user-scalable = 0" />');
  result=appendLine(result,'<meta http-equiv="Content-Type" content="text/html; charset=utf-8">');
  result=appendLine(result,'</head>');
  result=appendLine(result,'<body>');
  result=appendLine(result,content);
  result=appendLine(result,'</body>');
  result+='</html>';
  return result;
}

//以下为路由

app.post('/submit',function(req,res){
  //let dir = path.join(__dirname, 'public');
  let folder = uuid.v4();
  let dir = path.join(__dirname, 'public','document',folder);
  if (fs.existsSync(dir)) {
     console.log('已经创建过此目录了');
   } else {
     fs.mkdirSync(dir);
   };

   let content = makeContent(req.body.content);
   let fileName = uuid.v4();
   fs.writeFile(path.join(dir, fileName + '.html'), content, 'utf8', (err) => {
   if (err) throw err;
 });
});

app.post('/cover',function(req,res){
  upload(req,res,function(err) {
        if(err) {
          console.log(err);
          res.json({result:'err'});
        }
        res.json({result:'ok',fileName:req.file.filename});
    });
});

app.use('/', function (req, res) {
    res.render('ueditor');
});

app.listen(3000, function () {
    console.log('app listen : 3000');
});

module.exports = app;
