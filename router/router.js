var wxDoc = require("../models/wxDoc.js");
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

function saveData(doc, uid, res){
  var docs = [];
  for (var i = 0; i < doc.arr.length; i++) {
    var d = {};
    d.title = doc.arr[i].title;
    d.author = doc.arr[i].author;
    d.cover = doc.arr[i].cover;
    d.fileName = doc.arr[i].fileName;
    d.content = doc.arr[i].content;
    docs.push(d);
  }

  if(!doc.id){
    //新增
    var newDoc  =new wxDoc({
      id:uid,
      docs:docs
    });
    wxDoc.create(newDoc,function(err){
      if(err)
          res.json({result:'err'});
      res.json({result:'ok'});
    });
  }
  else{
    //修改
    let id = doc.id;
    wxDoc.findById(id,function(err,result){
      if(result){
        result.docs = docs;
        result.save(err,function(){
          if(err)
              res.json({result:'err'});
          res.json({result:'ok'});
        });
      }
    });
  }
}

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

function deleteall(path) {
    var files = [];
    if(fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach(function(file, index) {
            var curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()) { // recurse
                deleteall(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

exports.cover = function(req,res){
  upload(req,res,function(err) {
        if(err) {
          console.log(err);
          res.json({result:'err'});
        }
        res.json({result:'ok',fileName:req.file.filename});
    });
}

exports.ueupload = function (req, res, next) {
    //客户端上传文件设置
    var imgDir = '/img/ueditor/';
    var ActionType = req.query.action;
    if (ActionType === 'uploadimage') {
        var file_url = imgDir;//图片上传地址

        res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
        res.setHeader('Content-Type', 'text/html');
    }
    // 客户端发起其它请求
    else {
        // console.log('config.json')
        res.setHeader('Content-Type', 'application/json');
        res.redirect('/ueditor/nodejs/config.json');
    }
}

exports.addDoc = function(req,res,next){
  console.log('add');
    res.render('ueditor');
}

exports.showIndex = function(req,res,next){
    wxDoc.findAll(function(err,result){
      console.log('all');
      console.log(result);
        // res.render("index",{
        //     "students" : result
        // });
    });
}

exports.save = function(req,res,next){
  let doc = req.body;
  let uid = '';
  if(doc.id){
    uid = doc.id;
  }
  else{
    uid = uuid.v4();
  }
  let dir = path.join(process.cwd(),'public','document',uid);
  console.log(dir);
  if(fs.existsSync(dir)){
      deleteall(dir);//删除
  }
  fs.mkdirSync(dir);

  for (var i = 0; i < doc.arr.length; i++) {
    let fileName = uuid.v4() + '.html';
    doc.arr[i].fileName = fileName;
    let content = makeContent(doc.arr[i].content);
    fs.writeFileSync(path.join(dir,fileName),content);
  }
  saveData(doc,uid,res);

}
