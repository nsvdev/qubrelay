
const mongoose = require('mongoose');
const chalk = require('chalk');

var connected = chalk.bold.cyan;
var error = chalk.bold.yellow;
var disconnected = chalk.bold.red;
var termination = chalk.bold.magenta;
var eventListenerDebug = false;
const initialKillTimer = setTimeout(() => {
  console.log(disconnected('Не смог подключиться к серверу MongoDB (10 sec: dead.).'));
  console.log(error('Старт mognoose отклонен.'));
  process.exit(0);
},10000);

class Mongo {
  constructor(args) {
    this.url = args.connectString;
    this.connected = false;

  }

  connect() {
    return new Promise((resolve, reject) => {
      console.log('Trying to connect to MongoDB...');
      mongoose.connect(
        this.url,
        { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false},(err)=>{
            if(err) {
                this.connected = false;
                reject(err);
            } else {
                this.connected = true;
                resolve(this.connected);
            }
        }
      );
      mongoose.connection.on('connected', function(){
          console.log(connected("Соединился с сервером MongoDB: 200, Ok!"));
          clearInterval(initialKillTimer);
      });

      mongoose.connection.on('error', function(err){
          console.log(error('Произошла ошибка связанная с Mongo DB:'));
          console.log(err);
      });

      mongoose.connection.on('disconnected', function(){
          console.log(disconnected("Отсоединися от сервера MongoDB"));
      });

      process.on('SIGINT', function(){
        console.log('Using SIGINT Handler in (mongo.js)');
        if (!eventListenerDebug) {
           mongoose.connection.close(function(){
               console.log(termination("Экстренное закрытие соединения с MongoDB. Proccess.sigint"));
               process.exit(0)
           });
           eventListenerDebug = true;
         }else{
           console.log('eventListenet (10+) bug prevented successfully')
         }
     });
    });
  }
  get name () {
    return mongoose.connection.name;
  }
  asId(id) {
    return mongoose.Types.ObjectId(id)
  }

}

module.exports = Mongo;
