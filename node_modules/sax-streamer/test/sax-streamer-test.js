/*jshint expr: true*/

"use strict";

var fs = require("fs"),
    path = require("path");

var chai = require("chai"),
    expect = chai.expect,
    should = require("mocha-should");

var clone = require("clone"),
    concat = require("concat-stream"),
    glob = require("glob"),
    nimble = require("nimble"),
    sax = require("sax");

var SAXStreamer = require("../src/sax-streamer");

describe("SAX Streamer tests", function() {
  var opts, expectedFile;

  function testFiles(done) {
    return function(err, files) {
      if (err) {
        return done(err);
      }

      nimble.series(files.map(function(filename) {
        return function(next) {
          //console.log("Testing '" + filename + "'");

          var file = createFileReadStream(filename, next);

          var expected, result;

          nimble.parallel([
            // load the expected representation
            function(cb) {
              createFileReadStream(expectedFile(filename), cb).pipe(concat(function(data) {
                expected = data;

                cb();
              }));
            },

            // stream the file through the parser
            function(cb) {
              var saxStreamer = new SAXStreamer(opts);
              saxStreamer.error = function(err) {
                cb(err);
              };

              saxStreamer.createStream(file, true, {}).pipe(concat(function(data) {
                result = data;

                cb();
              }));
            }
          ], function(err) {
            if (err) {
              return next(err);
            }

            expect(result.trim(), "Output from file '" + filename + "' not correct").to.equal(expected);

            next();
          });
        };
      }), done);
    };
  }

  beforeEach(function() {
    expectedFile = null;
    opts = null;
  });

  should("output identical copy of input", function(done) {
    expectedFile = function(filename) {
      return path.dirname(filename) + "/expected/defaults/" + path.basename(filename);
    };

    glob("test/files/*.xml", testFiles(done));
  });

  should("not use space before self closing tag when formatting not set", function(done) {
    opts = {
      formatting: {
        spaceBeforeSelfClosingTag: false
      }
    };

    expectedFile = function(filename) {
      return path.dirname(filename) + "/expected/nospace-self-closing-tags.xml";
    };

    glob("test/files/formatting.xml", testFiles(done));
  });

  should("use entities provided", function(done) {
    var entities = clone(sax.XML_ENTITIES);
    delete entities.apos;

    opts = {
      entities: entities
    };

    expectedFile = function(filename) {
      return path.dirname(filename) + "/expected/xml-entities-provided-entities.xml";
    };

    glob("test/files/xml-entities.xml", testFiles(done));
  });
});

function createFileReadStream(filename, cb) {
  var file = fs.createReadStream(filename);
  file.setEncoding("utf8");
  file.on("error", function(err) {
    cb(err);
  });

  return file;
}