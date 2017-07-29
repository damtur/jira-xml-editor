var fs = require('fs');

function createWriteStream(filename, cb) {
  var file = fs.createWriteStream(filename);
  file.on("error", function (err) {
    cb(err);
  });
  return file;
}

function createReadStream(filename, cb) {
  var file = fs.createReadStream(filename);
  file.setEncoding("utf8");
  file.on("error", function (err) {
    cb(err);
  });
  return file;
}

module.exports = {
    createWriteStream: createWriteStream,
    createReadStream: createReadStream
}