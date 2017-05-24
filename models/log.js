var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const moment = require('moment');

var logSchema = new Schema({
  docId: String,
  items: [{
    _id: false,
    openId: String,
    forwards: [String],
    parent: String
  }],
  created: {
    type: String,
    default: () => {
      return moment().format('YYYY-MM-DD HH:mm:ss')
    }
  }
}, {
  versionKey: false
});

var Log = mongoose.model('Log', logSchema);
module.exports = Log;
