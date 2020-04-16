const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//MongoDB detected face schema
const DataStreamScheme = new Schema({
  name: String
});

const DataStream = mongoose.model('dataStream', DataStreamScheme);
module.exports = DataStream;
