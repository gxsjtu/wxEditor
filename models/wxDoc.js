var mongoose = require('mongoose');

var docSchema = new mongoose.Schema({
  title : String,
  author : String,
  cover : String,
  mediaId : String,
  fileName : String,
  content : String
});

var wxDocSchema = new mongoose.Schema({
  id:String,
  create:{ type: Date, default: Date.now },
  docs:[docSchema]
});
wxDocSchema.index({"id":1});
wxDocSchema.statics.findAll = function(callback){
  return this.model('wxDoc').find({},null,{sort: {'create': -1}}, callback);
}
wxDocSchema.statics.findById = function(id,callback){
  return this.model('wxDoc').findOne({id: id}, callback);
}
wxDocSchema.statics.deleteById = function(id,callback){
  return this.model('wxDoc').remove({id: id},callback);
}
var wxDoc = mongoose.model("wxDoc",wxDocSchema);
module.exports = wxDoc;
