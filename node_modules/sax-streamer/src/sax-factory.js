"use strict";

exports.NodeTypes = {
  NODE: "Node",
  PROCESSING_INSTRUCTION: "ProcessingInstruction",
  ELEMENT: "Element",
  TEXT: "Text",
  CDATA: "CDATA",
  COMMENT: "Comment"
};

/**
 * Creates a node that is useful for holding other nodes.
 *
 * @return {Node}
 */
exports.createNode = function(parent) {
  var node = new Node();

  if (parent) {
    parent.addChild(node);
  }

  return node;
};

exports.createElement = function(parent, tag) {
  if (!tag) {
    tag = parent;
    parent = undefined;
  }

  tag = typeof tag !== "string" ? tag : {
    name: tag,
    selfClosing: true
  };

  if (!tag || !tag.name) {
    throw new Error("Can't create an element without a name");
  }

  var node = exports.createNode(parent);
  node.nodeType = exports.NodeTypes.ELEMENT;
  node.name = tag.name;
  node.isSelfClosing = tag.selfClosing;
  node.attributes = tag.attributes || {};

  /*
   * Override the addChild method so that if children are added, the isSelfClosing property is set correctly (can't
   * be self closing if the element has child nodes)
   */
  node.addChild = (function() {
    var superMethod = node.addChild;

    return function(child) {
      superMethod.call(node, child);

      node.isSelfClosing = false;
    };
  }());

  return node;
};

exports.createText = function(parent, text) {
  var node = createLeafNode(parent, text, "text");
  node.nodeType =  exports.NodeTypes.TEXT;

  return node;
};

exports.createProcessingInstruction = function(instruction) {
  return {
    nodeType: exports.NodeTypes.PROCESSING_INSTRUCTION,
    name: instruction.name,
    body: (function() {
      var prop,
          instructions = instruction.instructions,
          body = [];
      for (prop in instructions) {
        if (instructions.hasOwnProperty(prop)) {
          body.push(prop + "=\"" + instructions[prop] + "\"");
        }
      }

      return body.join(" ");
    }())
  };
};

exports.createCDATA = function(parent, cdata) {
  var node = createLeafNode(parent, cdata, "cdata");
  node.nodeType =  exports.NodeTypes.CDATA;

  return node;
};

exports.createComment = function(parent, comment) {
  var node = createLeafNode(parent, comment, "comment");
  node.nodeType =  exports.NodeTypes.COMMENT;

  return node;
};

function Node() {
  this.nodeType = exports.NodeTypes.NODE;
  this.children = [];
}

Node.prototype.addChild = function(child) {
  this.children.push(child);
};

function createLeafNode(parent, prop, propName) {
  if (!prop) {
    prop = parent;
    parent = undefined;
  }

  var node = exports.createNode(parent);
  delete node.children;

  node[propName] = prop;

  return node;
}
