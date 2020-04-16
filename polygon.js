var AWS = require('aws-sdk');
var S3  = require('aws-sdk/clients/s3');

AWS.config.update({
   endpoint: 'https://s3.eu-central-1.wasabisys.com'
});

class DataPolygon {
  constructor({bucket, type}) {
    this.s3 = new AWS.S3();
    this.bucket = bucket;
  }
  upload({
    content, name
  }) {
    return new Promise((resolve, reject) => {
      try {
        this.s3.putObject({
          Body: content,
          Bucket: this.bucket,
          Key: name
        }, (err, data) => {
          if (err) {
            reject(err);
          }else{
            resolve(data);
          }
        })
      }catch(e) {
        reject(e);
      }
    });
  }
}


module.exports = DataPolygon
