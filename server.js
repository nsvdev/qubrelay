var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
const chalk = require('chalk')
const mongoLib = require('./mongo.js')
const bodyParser = require('body-parser')
const log_helper = require('./log-helper.js')
const logger = new log_helper({prefix: 'boxrelay'})
const jwtkey = require('./master.key')
const jwt = require('jsonwebtoken');
const DataPolygon = require('./polygon.js');
let Mongo = new mongoLib({
  connectString: 'mongodb+srv://boxmetrics:zSL3xC7XswOM1CVG@remotehq.sfcqk.mongodb.net/test?retryWrites=true&w=majority'
});
const Wasabi = new DataPolygon({
  type: 's3',
  bucket: 'varchive'
});


//data models

const Device = require('./DataModels/Device.js');
let Devices = [];
const loadDevices = () => {
  return new Promise(async (res, rej) => {
    try {
      let devices = await Device.find({}).lean();
      Devices = devices;
      res();
    }catch(e) {
      rej(e);
    }
  });
}
const doWeHaveDevice = (sk) => {
  return new Promise((resolve, reject) => {
    try {
      let level = 0;
      for (let i = 0; i<Devices.length; i++) {
        if (Devices[i].sk == sk) {level++;}
      }
      if (level == 1) {
        resolve();
      }else if (level > 1){
        reject(`Panic! More than 1 Device with sk ${sk} found!`);
      }else{
        reject(`No devices with sk ${sk} found.`);
      }
    }catch(e) {
      reject(e);
    }
  });
}

//main code



const signToken = ({content, key}) => {
  return new Promise((resolve, reject) => {
    try {
      jwt.sign(content, key, (err, token) => {
        if (err) {
          reject(err);
        }else{
          resolve(token);
        }
      });
    }catch(e) {
      reject(e);
    }
  });
}
const unpack = (token) => {
  return new Promise((resolve, reject) => {
    try {
      jwt.verify(token, jwtkey, async (err, decoded) => {
        if (err) {
          reject('cant decode token');
        }else{
          resolve(decoded);
        }
      });
    }catch(e) {
      reject(e);
    }
  });
}
let jwtCheck = (req, res, next) => {
  try {
    if (req.body.key == undefined) {
      res.send({
        error: true,
        reason: 'no api key supplied'
      });
    }else{
      jwt.verify(req.body.key, jwtkey, (err, decoded) => {
        if (err) {
          res.send({
            error: true,
            reason: 'key error [1]'
          });
        }else{
          req.jwtPayload = decoded;
          next();
        }
      });
    }
  }catch(e) {
    console.log(e);
    res.send({
      error: true,
      reason: 'key error [2]'
    });
  }
}

app.use(bodyParser.json({
  limit: '10kb'
}))  // стандартный модуль, для парсинга JSON в запросах

// respond with "hello world" when a GET request is made to the homepage
app.get('/', async (req, res) => {
  logger.log(req.ip, 'hit /')
  res.sendStatus(404)
})

app.post('/deviceSignup', async (req, res) => {

  logger.log(req.ip, `hit /deviceSignup`)

  let  {
    model,
    serial,
    issueDate,
    serialKey
  } = req.body.device;

  try {
    let token = await signToken({content: {
      model, serial, issueDate, serialKey, verified: true
    }, key: jwtkey});

    // console.log('sending', {token})
    res.send({token});

  }catch(e) {
    logger.log('/deviceSignup error', e);
  }

});


app.get('*', (r, res) => {
  logger.log(req.ip, `hit ${req.path}`)
  res.sendStatus(404)
})


io.on('connection', socket => {


  socket.on('pull streams', async (q, resolve) => {
    try {
      let {token} = q;
      let device = await unpack(token);
      let streams = await Device.find({
        sk: device.serialKey
      }, 'InputStreams').lean();
      if (streams.length == 1) {
        resolve(streams[0].InputStreams);
      }else{
        console.log('length > 1', token);
        resolve(false);
      }
    }catch(e) {
      resolve(false);
    }
  })
  socket.on('telemetry', async telemetry => {
    try {
      jwt.verify(telemetry.token, jwtkey, async (err, decoded) => {
        if (err) {
          console.log('cant decode token');
        }else{
          // console.log({decoded, telemetry})
        }
      });
    }catch(e) {
      console.log(e)
    }
  });
  socket.on('device cfg', async (q, resolve) => {
    try {
      let {token} = q;
      let device = await unpack(token);
      let dbDevice = await Device.findOne({
        sk: device.serialKey
      }).lean();
      let res = {
        RestreamingAgent: dbDevice.restream,
        DoSambaDevicesDiscovery: dbDevice.discoverSamba
      }
      resolve(res);
    }catch(e) {
      console.log(e);
      resolve(false);
    }
  });
  socket.on('file transfer', async (q) => {
    try {
      let {token} = q;
      let device = await unpack(token);
      let dbDevice = await Device.findOne({
        sk: device.serialKey
      }).lean();
      console.log(`Recieved file ${q.meta.Name}`);

      let data = await Wasabi.upload({
        content: q.content,
        name: 'videos/'+q.meta.Name
      })

      console.log(`File Uploaded`, data);
    }catch(e) {
      console.log(e);
    }
  });
});

(async () => {
  await Mongo.connect();
  await loadDevices();
  server.listen(3003, () => {
    logger.log('boot', `Started at port ${3003}`)
  })
})()
