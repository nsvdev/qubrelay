const mongoLib = require('./mongo.js')
let Mongo = new mongoLib({
  connectString: 'mongodb+srv://boxmetrics:zSL3xC7XswOM1CVG@remotehq.sfcqk.mongodb.net/test?retryWrites=true&w=majority'
});
const Streams = require('./DataModels/DataStream.js');

let run = async () => {
  await Mongo.connect();

}
