const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//MongoDB detected face schema
const deviceScheme = new Schema({
  name: String,
  model: String,
  serial: String,
  issueDate: String,
  sk: String,
  discoverSamba: Boolean,
  InputStreams: []
});

const Device = mongoose.model('device', deviceScheme);
module.exports = Device;
