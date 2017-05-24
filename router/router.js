var wxDoc = require("../models/wxDoc.js");
var path = require('path');
var fs = require('fs');
var path = require('path');
var uuid = require('node-uuid');
var multer = require('multer');
var util = require('util');
var request = require('request');
var url = require('url');
var express = require('express');
var router = express.Router();
const Jssdk = require('../services/jssdk.js');

var storage = multer.diskStorage({
  destination: function(req, file, callback) {
    if (req.query.folder) {
      let p = path.join(process.cwd(), 'public', 'document', req.query.folder);
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p);
      }
      callback(null, p);
    } else {
      var folder = uuid.v4();
      fs.mkdir('./public/document/' + folder, () => {
        req.query.folder = folder;
        callback(null, './public/document/' + folder);
      });
    }
  },
  filename: function(req, file, callback) {
    //file.originalname   coffee.jpg
    //var fileFormat = (file.originalname).split(".");
    callback(null, uuid.v4());
  }
});

var upload = multer({
  storage: storage
});

function saveData(doc, uid, res) {
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

  if (!doc.id) {
    //新增
    var newDoc = new wxDoc({
      id: uid,
      docs: docs
    });
    wxDoc.create(newDoc, function(err) {
      if (err)
        res.json({
          result: 'err'
        });
      res.json({
        result: 'ok'
      });
    });
  } else {
    //修改
    let id = doc.id;
    wxDoc.findById(id, function(err, result) {
      if (err) {
        console.log(err);
      }
      if (result) {
        result.docs = docs;
        result.save(result, function(err, result) {
          if (err)
            res.json({
              result: 'err'
            });
          res.json({
            result: 'ok'
          });
        });
      }
    });
  }
}

//增加换行
function appendLine(content, append) {
  return content + append + '\r\n';
}

function makeContent(doc,req) {
  let content = doc.content;
  let result = appendLine('<html>', '');
  result = appendLine(result, '<head>');
  result = appendLine(result, '<meta name = "viewport" content = "width=device-width, initial-scale = 1.0, maximum-scale = 1.0, user-scalable = 0" />');
  result = appendLine(result, '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">');
  result = appendLine(result, '</head>');
  result = appendLine(result, '<body>');
  result = appendLine(result, content);
  result = appendLine(result, '<script src="http://res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>');
  result = appendLine(result, '<script>');
  result = appendLine(result, 'wx.config({');
  result = appendLine(result, 'debug: false,');
  result = appendLine(result, 'appId: "'+req.jssdk.appId+'", ');
  result = appendLine(result, 'timestamp: "'+req.jssdk.timestamp+'", ');
  result = appendLine(result, 'nonceStr: "'+req.jssdk.nonceStr+'", ');
  result = appendLine(result, 'signature: "'+req.jssdk.signature+'", ');
  result = appendLine(result, "jsApiList: ['onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone'] });" );

  result = appendLine(result, 'wx.ready(function(){');
  result = appendLine(result, "wx.onMenuShareTimeline({title: '"+doc.title+"', link: '', imgUrl: 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png', success: function () { }});");
  result = appendLine(result, '});');
  result = appendLine(result, '</body>');
  result += '</html>';
  return result;
}

function deleteall(path) {
  var files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      var curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) { // recurse
        deleteall(curPath);
      } else { // delete file
        let fileFormat = file.split(".")[1];
        if (fileFormat == "html") {
          fs.unlinkSync(curPath);
        }
      }
    });
    //fs.rmdirSync(path);
  }
};

router.post('/cover', upload.single('cover'), (req, res, next) => {
  res.json({
    folder: req.query.folder,
    result: 'ok',
    fileName: req.file.filename
  });
});

router.post('/ueupload', (req, res, next) => {
  //客户端上传文件设置
  var imgDir = '/img/ueditor/';
  var ActionType = req.query.action;
  if (ActionType === 'uploadimage') {
    var file_url = imgDir; //图片上传地址

    res.ue_up(file_url); //你只要输入要保存的地址 。保存操作交给ueditor来做
    res.setHeader('Content-Type', 'text/html');
  }
  // 客户端发起其它请求
  else {
    // console.log('config.json')
    res.setHeader('Content-Type', 'application/json');
    res.redirect('/ueditor/nodejs/config.json');
  }
});

router.get('/add', function(req, res, next) {
  let folder = uuid.v4();
  res.render('ueditor', {
    "folder": folder,
    "doc": {}
  });
});

router.get('/showMaterials', function(req, res, next) {
  request('http://miaozhun.shtx.com.cn/56f87e5085200685087e805f2ae361e7/materials', function(error, response, body) {
    if (!error && response.statusCode == 200) {
      let obj = JSON.parse(body).item;
      if (obj) {
        let materials = [];
        for (var i = 0; i < obj.length; i++) {
          let material = {};
          material.media_id = obj[i].media_id;
          material.items = [];
          let items = obj[i].content.news_item;
          for (var j = 0; j < items.length; j++) {
            let materialItem = {};
            materialItem.title = items[j].title;
            // let p = url.parse(items[j].thumb_url,true);
            // materialItem.thumb_url = p.protocol+'//'+p.hostname+p.pathname;
            materialItem.thumb_url = items[j].thumb_url;
            material.items.push(materialItem);
          }
          materials.push(material);
        }
        res.render('materials', {
          "materials": materials
        });
      } else {
        res.end('we can not get the materials!');
      }
    } else {
      res.end('we can not get the materials!');
    }
  })
});

router.get('/edit/:docId', function(req, res, next) {
  wxDoc.findById(req.params.docId, function(err, doc) {
    let folder = doc.id;
    res.render("ueditor", {
      "folder": folder,
      "doc": doc
    });
  });
});

router.get('/delete', function(req, res, next) {
  var docId = req.params["docId"];
  wxDoc.deleteById(docId, function(err, doc) {
    let dir = path.join(process.cwd(), 'public', 'document', docId);
    if (fs.existsSync(dir)) {
      deleteall(dir); //删除
    }
    wxDoc.findAll(function(err, result) {
      res.render("index", {
        "docs": result
      });
    });
  });
});

router.get('/', function(req, res, next) {
  wxDoc.findAll(function(err, result) {
    res.render("index", {
      "docs": result
    });
  });
});

router.post('/save', Jssdk.jssdk, function(req, res, next) {
  let doc = req.body;
  let uid = doc.folder;

  let dir = path.join(process.cwd(), 'public', 'document', uid);
  if (fs.existsSync(dir)) {
    deleteall(dir); //删除html
  } else {
    fs.mkdirSync(dir);
  }

  for (var i = 0; i < doc.arr.length; i++) {
    let fileName = uuid.v4() + '.html';
    doc.arr[i].fileName = fileName;
    let content = makeContent(doc.arr[i],req);
    fs.writeFile(path.join(dir, fileName), content);
  }
  saveData(doc, uid, res);
});

module.exports = router;
