var wxDoc = require("../models/wxDoc.js");
var path = require('path');
var fs = require('fs');
var uuid = require('node-uuid');
var multer = require('multer');
var util = require('util');
var request = require('request');
var url = require('url');

var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, './public/cover');
    },
    filename: function(req, file, callback) {
        //file.originalname   coffee.jpg
        var fileFormat = (file.originalname).split(".");

        callback(null, uuid.v4() + '.' + fileFormat[fileFormat.length - 1]);
    }
});
var upload = multer({
    storage: storage
}).single('cover');

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

function makeContent(content) {
    let result = appendLine('<html>', '');
    result = appendLine(result, '<head>');
    result = appendLine(result, '<meta name = "viewport" content = "width=device-width, initial-scale = 1.0, maximum-scale = 1.0, user-scalable = 0" />');
    result = appendLine(result, '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">');
    result = appendLine(result, '</head>');
    result = appendLine(result, '<body>');
    result = appendLine(result, content);
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
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

exports.cover = function(req, res) {
    upload(req, res, function(err) {
        if (err) {
            console.log(err);
            res.json({
                result: 'err'
            });
        }
        res.json({
            result: 'ok',
            fileName: req.file.filename
        });
    });
}

exports.ueupload = function(req, res, next) {
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
}

exports.addDoc = function(req, res, next) {
    res.render('ueditor', {
        "doc": {}
    });
}

exports.showMaterials = function(req, res, next) {

    // let str = {
    //     item: [{
    //         media_id: "7MxGeDIa82aJS6IvrdTtavR5cfVi-0h4IGIxguPrqlE",
    //         content: {
    //             news_item: [{
    //                 title: "十大孕妇常见问题，必有一条戳中你！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg0yhCpJSQsCVKjDl1uCQspQIrwbIChiagcepWj6wEFyK9lZB5gCWia49AQ2bpZ9s2RQU68BM2AVm82g/0?wx_fmt=jpeg"
    //             }],
    //             create_time: 1493868475,
    //             update_time: 1493880760
    //         },
    //         update_time: 1493880760
    //     }, {
    //         media_id: "7MxGeDIa82aJS6IvrdTtatOUMj_wGypNc9Hy4RE52bw",
    //         content: {
    //             news_item: [{
    //                 title: "忘不了：孕检、办证一个也忘不了",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg0yhCpJSQsCVKjDl1uCQspQLuMct8CQicOBqW210W5XzHr3iapN0diavpwT7UFHHw0BKzkhFWd58gYmA/0?wx_fmt=jpeg"
    //             }],
    //             create_time: 1493864986,
    //             update_time: 1493868898
    //         },
    //         update_time: 1493868898
    //     }, {
    //         media_id: "7MxGeDIa82aJS6IvrdTtasaF1OROJrA3yUJameY90tA",
    //         content: {
    //             news_item: [{
    //                 title: "十月怀胎之通关秘籍",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg2YX0x708ibyV2ORBuvaWf5rpANhqJkzibA3J05y5euQcNVD9E3k7SuuaXD1JJKOuZcfz8KzjeEiaoZw/0?wx_fmt=png"
    //             }, {
    //                 title: "最贴心的孕产妇办事工具来啦！！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg23FytQzWrPp82qV8K5HibecNGfWcVbJ0WQvwjwCxWO8Fp6aOW8SiaEp7asBaOAuyvyxgosfQSwuRhQ/0?wx_fmt=png"
    //             }, {
    //                 title: "高能预警：如何顺利建大卡？",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg0vY8ia2q779DeGgzOVqrF4ndAiabGEn83ZFp7ClVoEWVE1SG4l96KSZfkpdpKiaEHADX1WVAozydwibg/0?wx_fmt=png"
    //             }, {
    //                 title: "0元购 有底气才敢让您免费体验的优质产品",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg1cFv9ib56ePjwoR1nEdStwnU3giaKy2e9WxoH4SC7sI2icIhvvhpbmxlVeXaafEnTHazeYLL2nQDuRg/0?wx_fmt=jpeg"
    //             }],
    //             create_time: 1493862319,
    //             update_time: 1493863485
    //         },
    //         update_time: 1493863485
    //     }, {
    //         media_id: "7MxGeDIa82aJS6IvrdTtatkpRu8RW47mi62nx2XncHc",
    //         content: {
    //             news_item: [{
    //                 title: "十月怀胎之通关秘籍",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg2YX0x708ibyV2ORBuvaWf5rpANhqJkzibA3J05y5euQcNVD9E3k7SuuaXD1JJKOuZcfz8KzjeEiaoZw/0?wx_fmt=png"
    //             }, {
    //                 title: "高能预警：如何顺利建大卡？",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg0vY8ia2q779DeGgzOVqrF4nLavprDtibCbbckEx222HKttIf3iaodanBM50avJXToE4ua9Fb9JGF5ibg/0?wx_fmt=png"
    //             }, {
    //                 title: "央视CCTV1王小丫：白色卫生纸正在慢慢危害家人的健康！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg093icAISoic4JqLjtMtehzxHXmKrk8CUtQt7PUiaOD0MicFTiaXHtNo3F4XRU7DpcHGUk2ribrqJw7W07Q/0?wx_fmt=jpeg"
    //             }, {
    //                 title: "测评：面膜成分篇 厉害了Word姐，怀孕也可以美美哒！事妈为您面膜避雷，安心在家敷面膜",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg2YX0x708ibyV2ORBuvaWf5ry2L55GObUA83kLv7fnb7DibVwZmqhvIkuK5QrVuiaRVEOfCSzK0ibRXWw/0?wx_fmt=jpeg"
    //             }, {
    //                 title: "事妈祝孕妈妈劳动节快乐！妙思乐0元抢，帮宝适8折买！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg1cFv9ib56ePjwoR1nEdStwnU3giaKy2e9WxoH4SC7sI2icIhvvhpbmxlVeXaafEnTHazeYLL2nQDuRg/0?wx_fmt=jpeg"
    //             }],
    //             create_time: 1493088487,
    //             update_time: 1493379535
    //         },
    //         update_time: 1493379535
    //     }, {
    //         media_id: "7MxGeDIa82aJS6IvrdTtartcUuv49-9ZWnVXkvY7uRg",
    //         content: {
    //             news_item: [{
    //                 title: "孕期营养不知道补什么？！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg1cFv9ib56ePjwoR1nEdStwndp90SjrtAJNTK4AzR0777xWFC5gKkicEuMZIfBybc0WFiaR72vrCuo8A/0?wx_fmt=jpeg"
    //             }, {
    //                 title: "最贴心的孕产妇办事工具来啦！！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg23FytQzWrPp82qV8K5HibecNGfWcVbJ0WQvwjwCxWO8Fp6aOW8SiaEp7asBaOAuyvyxgosfQSwuRhQ/0?wx_fmt=png"
    //             }, {
    //                 title: "晒晒你的哪个产品有世界上最权威的食品药品检测机构FDA的认证！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg093icAISoic4JqLjtMtehzxHXmKrk8CUtQt7PUiaOD0MicFTiaXHtNo3F4XRU7DpcHGUk2ribrqJw7W07Q/0?wx_fmt=jpeg"
    //             }, {
    //                 title: "快快检查一下你的护肤品是否含有对宝宝有安全隐患的成分！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg23FytQzWrPp82qV8K5Hibec7EF80awaknSpFCZueA3Twh9aCFM50CuRzSfg37fjFJBorLp48Sc39A/0?wx_fmt=jpeg"
    //             }, {
    //                 title: "0元购 有底气才敢让您免费体验的优质产品",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg1cFv9ib56ePjwoR1nEdStwnU3giaKy2e9WxoH4SC7sI2icIhvvhpbmxlVeXaafEnTHazeYLL2nQDuRg/0?wx_fmt=jpeg"
    //             }],
    //             create_time: 1492001769,
    //             update_time: 1493863606
    //         },
    //         update_time: 1493863606
    //     }, {
    //         media_id: "7MxGeDIa82aJS6IvrdTtaphEReYHRWqf1RTgy5stkP8",
    //         content: {
    //             news_item: [{
    //                 title: "事妈专享优惠，好物大搜罗！",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg1MzmhxCvORdOBFHsENDpQKU85jTNZGice1Lq47WOOFSLdkY84CUNbHL98icbTcicPp0HAWDWJkjicTqQ/0"
    //             }, {
    //                 title: "【五谷粮膜面膜】纯粮食萃取，0添加，孕婴适用，致敬SKII级品牌。**首次购买返现10元**",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_png/QDMXCbnVwg093icAISoic4JqLjtMtehzxHzqWzfFEzZUBaibhv8lywq79rgc5Iu2bibNK6zeQaoNL5fYw1DibyvjQQw/0?wx_fmt=png"
    //             }, {
    //                 title: "【贝瑞滋孕婴洗衣液】纯净植物溶液，清除螨虫细菌，健康孕育。**首次购买，8折优惠**",
    //                 thumb_url: "http://mmbiz.qpic.cn/mmbiz_jpg/QDMXCbnVwg093icAISoic4JqLjtMtehzxHxA2PGqB9rn5cC2SzB7MedPxt9pq1VuNficwatGdJXOc5scwSxibgMEVA/0?wx_fmt=jpeg"
    //             }],
    //             create_time: 1491455294,
    //             update_time: 1492562964
    //         },
    //         update_time: 1492562964
    //     }],
    //     total_count: 6,
    //     item_count: 6
    // }
    //
    // let obj = str.item;
    // if (obj) {
    //     let materials = [];
    //     for (var i = 0; i < obj.length; i++) {
    //         let material = {};
    //         material.media_id = obj[i].media_id;
    //         material.items = [];
    //         let items = obj[i].content.news_item;
    //         for (var j = 0; j < items.length; j++) {
    //             let materialItem = {};
    //             materialItem.title = items[j].title;
    //             // let p = url.parse(items[j].thumb_url,true);
    //             // materialItem.thumb_url = p.protocol+'//'+p.hostname+p.pathname;
    //             materialItem.thumb_url = items[j].thumb_url;
    //             material.items.push(materialItem);
    //         }
    //         materials.push(material);
    //     }
    //     console.log(materials);
    //     res.render('materials', {
    //         "materials": materials
    //     });
    // } else {
    //     res.end('we can not get the materials!');
    // }


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
}

exports.editDoc = function(req, res, next) {
    var docId = req.params["docId"];
    wxDoc.findById(docId, function(err, doc) {
        res.render("ueditor", {
            "doc": doc
        });
    });
}

exports.deleteDoc = function(req, res, next) {
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
}

exports.showIndex = function(req, res, next) {
    wxDoc.findAll(function(err, result) {
        res.render("index", {
            "docs": result
        });
    });
}

exports.save = function(req, res, next) {

    let doc = req.body;
    let uid = '';
    if (doc.id) {
        uid = doc.id;
    } else {
        uid = uuid.v4();
    }

    let dir = path.join(process.cwd(), 'public', 'document', uid);
    if (fs.existsSync(dir)) {
        deleteall(dir); //删除
    }
    fs.mkdirSync(dir);

    for (var i = 0; i < doc.arr.length; i++) {
        let fileName = uuid.v4() + '.html';
        doc.arr[i].fileName = fileName;
        let content = makeContent(doc.arr[i].content);
        fs.writeFileSync(path.join(dir, fileName), content);
    }
    saveData(doc, uid, res);

}
