"use strict";

var stream = require("stream"),
    PassThrough = stream.PassThrough;

var clone = require("clone"),
    sax = require("sax");

Array.prototype.top = function() { // jshint ignore:line
  return this[this.length - 1];
};

var ENTITY_REGEXP = new RegExp("<!ENTITY (\\w+) \"(.*?)\">", "g");

function SAXStreamer(opts) {
  this.opts = opts || {};
  this.opts.formatting = this.opts.formatting || {};

  var formatting = this.opts.formatting;
  formatting.spaceBeforeSelfClosingTag = formatting.spaceBeforeSelfClosingTag !== undefined ? formatting.spaceBeforeSelfClosingTag : true;

  this.tags = [];

  // maps entity value to entity key eg: " => &quot;
  this.ents = {};
}

module.exports = SAXStreamer;

/**
 * Pipes src through the sax module.  Other args are passed to sax.createStream.
 *
 * Attaches default event listeners.
 *
 * @param {Readable} src
 * @param {boolean} strict
 * @param [options]
 * @return {PassThrough} dest stream
 */
SAXStreamer.prototype.createStream = function(src, strict, options) {
  options = options || {};
  options.strictEntities = options.strictEntities || true;

  function srcInFlowingMode() {
    return src._readableState.flowing;
  }

  var dest = new PassThrough();
  dest.setEncoding("utf8");

  dest.on("drain", function () {
    if (!srcInFlowingMode()) {
      src.resume();
    }
  });

  var saxStream = sax.createStream(strict, options);

  /*
   * sax-js handlers are called with the saxSteam being `this`.  Therefore we want to maintain a reference to us.
   */
  saxStream._streamer = this;

  saxStream.print = function() {
    var args = Array.prototype.slice.apply(arguments);

    if (!dest.write.apply(dest, args)) {
      if (!srcInFlowingMode()) {
        // can't pause a flowing stream
        // see http://stackoverflow.com/questions/30816096/how-to-pause-nodejs-flowing-stream-when-destination-is-full
        src.pause();
      }
    }
  };

  saxStream.encodeEntities = encodeEntities.bind(saxStream);

  saxStream.on("text", this.text);
  saxStream.on("doctype", this.doctype);
  saxStream.on("opentag", this.opentag);
  saxStream.on("closetag", this.closetag);
  saxStream.on("processinginstruction", this.processinginstruction);
  saxStream.on("opencdata", this.opencdata);
  saxStream.on("cdata", this.cdata);
  saxStream.on("closecdata", this.closecdata);
  saxStream.on("comment", this.comment);
  saxStream.on("error", this.error);
  saxStream.on("end", function() {
    dest.end();
  });

  setEntities(this, saxStream);

  src.pipe(saxStream);

  return dest;
};

SAXStreamer.prototype.identity = function(text) {
  this.print(this.encodeEntities(text));
};

SAXStreamer.prototype.text = SAXStreamer.prototype.identity;
SAXStreamer.prototype.doctype = function(doctype) {
  parseEntities(this, doctype);

  this.print("<!DOCTYPE");
  this.print(doctype);
  this.print(">");
};

SAXStreamer.prototype.opentag = function (tag) {
  this.print("<" + tag.name);

  var attributes = tag.attributes;
  for (var i in  attributes) {
    if (attributes.hasOwnProperty(i)) {
      this.print(" " + i + "=\""+ this.encodeEntities(attributes[i]) + "\"");
    }
  }

  if (tag.isSelfClosing) {
    if (this._streamer.opts.formatting.spaceBeforeSelfClosingTag) {
      this.print(" ");
    }

    this.print("/");
  }

  this.print(">");

  this._streamer.tags.push(tag);
};

SAXStreamer.prototype.closetag = function (name) {
  var tags = this._streamer.tags;

  if (!tags.top().isSelfClosing) {
    this.print("</" + name + ">");
  }

  tags.pop();
};

SAXStreamer.prototype.processinginstruction = function(instruction) {
  this.print("<?");
  this.print(instruction.name);
  this.print(" ");

  if (instruction.body) {
    this.print(instruction.body.replace(new RegExp(" = ", "g"), "=").replace(new RegExp("'", "g"), "\""));
  }

  this.print("?>");
};

SAXStreamer.prototype.opencdata = function() {
  this.print("<![CDATA[");
};

SAXStreamer.prototype.cdata = function (data) {
  this.print(data);
};

SAXStreamer.prototype.closecdata = function() {
  this.print("]]>");
};

SAXStreamer.prototype.comment = function (comment) {
  this.print("<!--" + comment + "-->");
};

SAXStreamer.prototype.error = function(err) {
  throw err;
};

function setEntities(saxStreamer, saxStream) {
  if (saxStreamer.opts.entities) {
    saxStream._parser.ENTITIES = saxStreamer.opts.entities;
  }
  else {
    // For some reason the ENTITIES aren't being created properly with Object.create().
    saxStream._parser.ENTITIES = saxStream._parser.strictEntities ? clone(sax.XML_ENTITIES) : clone(sax.ENTITIES);
  }

  Object.keys(saxStream._parser.ENTITIES).forEach(function(entity) {
    saxStream._streamer.ents[saxStream._parser.ENTITIES[entity]] = entity;
  });
}

function encodeEntities(str) {
  var ents = this._streamer.ents; // jshint ignore:line

  Object.keys(ents).forEach(function(entity) {
    str = str.replace(new RegExp(entity, "g"), "&" + ents[entity] + ";");
  });

  return str;
}

function parseEntities(saxStream, doctype) {
  var entities;
  do {
    entities = ENTITY_REGEXP.exec(doctype);

    if (entities) {
      saxStream._parser.ENTITIES[entities[1]] = entities[2];
    }
  }
  while(entities);
}
