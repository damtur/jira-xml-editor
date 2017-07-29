// Imports
var fileStreams = require('./fileStreams.js');
var J2M = require('J2M');
var SAXStreamer = require("sax-streamer").SAXStreamer;

// Main function
// 
function main() {
  var inFilename = "a.xml";
  var outFilename = "entities_out.xml";

  // Create input stream
  var srcFileStream = fileStreams.createReadStream(inFilename, errorCallback);

  // Main stream to convert the file
  var saxStreamer = new SAXStreamer();
  // Sax streamer global data
  saxStreamer.tempData = {};
  saxStreamer.tempData.numberOfNodes = 0;
  saxStreamer.tempData.processNextCdata = false;

  // Tag processing
  saxStreamer.opentag = function (tag) {
    this._streamer.tempData.numberOfNodes += 1;
    if (this._streamer.tempData.numberOfNodes % 1000 == 0) {
      console.log("processing ", this._streamer.tempData.numberOfNodes);
    }

    // Do neccesary conversions
    if (tag.name == "Action") {
      tag = processAction(this, tag);
    }

    if (tag.name == "Issue") {
      tag = processIssue(this, tag);
    }

    // Write to output
    writeTagToOutput(this, tag);

    this._streamer.tags.push(tag);
  };

  // Cdata converting
  saxStreamer.cdata = function (data) {
    if (saxStreamer.tempData.processNextCdata) {
      data = convertToMarkdown(data);
      this._streamer.tempData.processNextCdata = false;
    }

    this.print(data);
  };

  // Don't change anything what we don't have to!
  var options = {
    trim: false,
    normalize: false,
  };
  var saxStream = saxStreamer.createStream(srcFileStream, true, options);

  // Output to another file
  var outFileStream = fileStreams.createWriteStream(outFilename, errorCallback);

  // Direct stream to output file
  saxStream.pipe(outFileStream);

  console.log("Program prepared. Let's start");
}

// Writes tag to the output stream. Aim is to not change in this function
function writeTagToOutput(stream, tag) {
  stream.print("<" + tag.name);
  var attributes = tag.attributes;
  for (var i in attributes) {
    if (attributes.hasOwnProperty(i)) {
      stream.print(" " + i + "=\"" + stream.encodeEntities(attributes[i]) + "\"");
    }
  }
  if (tag.isSelfClosing) {
    if (stream._streamer.opts.formatting.spaceBeforeSelfClosingTag) {
      stream.print(" ");
    }
    stream.print("/");
  }
  stream.print(">");
}

// Converting from Jira Wiki Syntax to Markdown: 
function convertToMarkdown(jira) {
  var md = J2M.toM(jira);
  return md;
}

// Action contains comments
function processAction(stream, tag) {
  var attributes = tag.attributes;
  for (var i in attributes) {

    // Comment
    if (i == "type" && attributes[i] == "comment") {
      for (var j in attributes) {
        if (attributes.hasOwnProperty(j) && j == "body") {
          tag.attributes[j] = convertToMarkdown(attributes[j]);
          return tag;
        }
      }

      // We did not find body. It will be in cdata (hopefully);
      stream._streamer.tempData.processNextCdata = true;
    }

  }
  // Next CDATA needs to be processed
  return tag;
}

// Issues are normal Jira tickets
function processIssue(stream, tag) {
  var attributes = tag.attributes;

  for (var i in attributes) {
    if (attributes.hasOwnProperty(i) && i == "description") {
      tag.attributes[i] = convertToMarkdown(attributes[i]);
      return tag;
    }
  }

  // We did not find body. It will be in cdata (hopefully);
  // Next CDATA needs to be processed
  stream._streamer.tempData.processNextCdata = true;

  return tag;
}

function errorCallback(error) {
  console.log("Error occured: ", error);
  console.log("Program will exit now!")
  process.exit()
}

main();
