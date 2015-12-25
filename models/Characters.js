var mongoose = require('mongoose');

var CharacterSchema = new mongoose.Schema({
  name: String,
  breed: String,
  gender : String,
  age : String,  
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

mongoose.model('Character', CharacterSchema);
