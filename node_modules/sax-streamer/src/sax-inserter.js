"use strict";

var utils = require("util");

var merge = require("merge");

var SAXStreamer = require("./sax-streamer"),
    SAXFactory = require("./sax-factory");

var slice = Array.prototype.slice;

var ANY = -1,
    POSITIONAL_MATCH_REGPEXP = /^(.*)\[(\d+)]$/;

/**
 * @constructor - See super constructor for parameters.
 */
function SAXInserter() {
  SAXStreamer.apply(this, slice.call(arguments));

  this.beforeTargets = [];
  this.afterTargets = [];
  this.attributeTargets = [];
  this.seenTags = {};
}

utils.inherits(SAXInserter, SAXStreamer);
module.exports = SAXInserter;

SAXInserter.prototype.insertBefore = function(target, node) {
  insert(this.beforeTargets, target, node);
};

SAXInserter.prototype.insertAfter = function(target, node) {
  insert(this.afterTargets, target, node);
};

SAXInserter.prototype.insertAttributes = function(target, attributes) {
  insert(this.attributeTargets, target, attributes);
};

SAXInserter.prototype.opentag = function(tag) {
  var self = this,
      streamer = this._streamer,
      path = toPath.call(streamer, streamer.tags, tag);

  checkTargets(streamer.attributeTargets, path, function(target) {
    tag.attributes = merge(tag.attributes, target.data);
  });

  checkTargets(streamer.beforeTargets, path, function(target) {
    writeNode.call(self, target.data);
  });

  SAXStreamer.prototype.opentag.apply(this, slice.call(arguments));
};

SAXInserter.prototype.closetag = function() {
  var self = this,
      args = slice.call(arguments),
      streamer = this._streamer,
      path = toPath.call(streamer, streamer.tags),
      hit = false;

  checkTargets(streamer.afterTargets, path, function(target) {
    SAXStreamer.prototype.closetag.apply(self, args);
    writeNode.call(self, target.data);

    hit = true;
  });

  if (!hit) {
    SAXStreamer.prototype.closetag.apply(self, args);
  }
};

/**
 * @private
 * @param node
 */
function writeNode(node) {
  /*jshint validthis:true */
  var self = this,
      streamer = this._streamer;

  function writeChildren() {
    node.children.forEach(function(child) {
      writeNode.call(self, child);
    });
  }

  switch (node.nodeType) {
    case SAXFactory.NodeTypes.NODE:
      writeChildren();

      break;

    case SAXFactory.NodeTypes.PROCESSING_INSTRUCTION:
      streamer.processinginstruction.call(this, node);
      break;

    case SAXFactory.NodeTypes.ELEMENT:
      SAXStreamer.prototype.opentag.call(this, node);
      writeChildren();
      SAXStreamer.prototype.closetag.call(this, node.name);

      break;

     case SAXFactory.NodeTypes.TEXT:
       streamer.text.call(this, node.text);
       break;

     case SAXFactory.NodeTypes.CDATA:
       streamer.opencdata.call(this);
       streamer.cdata.call(this, node.cdata);
       streamer.closecdata.call(this);

       break;

     case SAXFactory.NodeTypes.COMMENT:
       streamer.comment.call(this, node.comment);
  }
}

/**
 * @private
 */
function toPath(tags, tag) {
  /*jshint validthis:true */

  var path = "",
      count,
      seen = this.seenTags;

  tags.forEach(function(tag) {
    path += "/" + tag.name;
    path += "[" + seen[path] + "]";
  });

  if (tag) {
    path += "/" + tag.name;
    count = seen[path];
    count = !count ? 1 : ++count;

    seen[path] = count;
    path += "[" + count + "]";
  }

  return path;
}

function checkTargets(targets, path, cb) {
  targets.forEach(function(target) {
    if (hitTarget(target.target, path)) {
      cb(target);
    }
  });
}

function hitTarget(target, path) {
  path = parsePath(path);

  if (path.length === target.length) {
    for (var i = 0; i < target.length; i++) {
      var targetSegment = target[i],
          pathSegment = path[i];

      if ((pathSegment.name !== targetSegment.name) ||
          (targetSegment.position !== ANY && targetSegment.position !== pathSegment.position)) {
        return false;
      }
    }

    return true;
  }

  return false;
}

function parsePath(path) {
  function nonBlank(segment) {
    return segment !== "";
  }

  path = path.split("/").filter(nonBlank).map(function(segment) {
    var matches = POSITIONAL_MATCH_REGPEXP.exec(segment),
        name = segment,
        pos = ANY;

    if (matches) {
      name = matches[1];
      pos = parseInt(matches[2]);
    }

    return {
      name: name,
      position: pos
    };
  });

  return path;
}

function insert(targets, target, node) {
  target = parsePath(target);

  targets.push({
    target: target,
    data: node
  });
}
