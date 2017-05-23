var weixinJsConfig = require('weixin-node-jssdk');
const Global = require('../global.js');
const url = require('url');

module.exports.jssdk = function(req, res, next) {
  var options = {};
  options.appId = Global.appId;
  options.appSecret = Global.appSecret;
  options.url = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.originalUrl,
  });

  weixinJsConfig(options, function(error, config) {
    //config
    if (!error) {
      req.jssdk = config;
      next();
    } else {
      next(error);
    }
  });
}
