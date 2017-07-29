/*jshint expr: true*/

"use strict";

//noinspection JSUnresolvedVariable
var chai = require("chai"),
    expect = chai.expect,
    should = require("mocha-should");

var SAXFactory = require("../src/sax-factory");

describe("SAX Factory Tests", function() {
  should("create empty node", function() {
    var node = SAXFactory.createNode();

    expect(node.nodeType, "Incorrect node type").to.equal(SAXFactory.NodeTypes.NODE);
    expect(node.children, "Node is missing children").to.not.be.undefined;
    expect(node.children.length).to.equal(0);
  });

  should("add new node to parent", function() {
    var parent = SAXFactory.createNode(),
        child = SAXFactory.createNode(parent);

    expect(parent.children.length, "child node not added to parent").to.equal(1);
    expect(parent.children[0], "Child node reference not correct").to.equal(child);
  });

  should("create element", function() {
    var name = "tag";

    var tag = SAXFactory.createElement(name);

    expect(tag.nodeType, "Incorrect node type").to.equal(SAXFactory.NodeTypes.ELEMENT);
    expect(tag.name, "Tag has incorrect name").to.equal(name);
  });

  should("throw error creating element with no name", function() {
    expect(function() {
      SAXFactory.createElement();
    }).to.throw(Error);
  });

  should("create element to be self closing", function() {
    var tag = SAXFactory.createElement("tag");

    expect(tag.isSelfClosing, "Tag is not self closing").to.be.true;
  });

  should("create element to be not self closing", function() {
    var tag = SAXFactory.createElement({
      name: "tag",
      selfClosing: false
    });

    expect(tag.isSelfClosing, "Tag is self closing").to.be.false;
  });

  should("add element to parent element", function() {
    var parent = SAXFactory.createElement("tag"),
        child = SAXFactory.createElement(parent, "tag");

    expect(parent.children.length, "child element not added to parent").to.equal(1);
    expect(parent.children[0], "Child element reference not correct").to.equal(child);
  });

  should("override self closing config given element has children", function() {
    var tag = SAXFactory.createElement("tag");

    SAXFactory.createNode(tag);

    expect(tag.isSelfClosing, "Tag is self closing").to.be.false;
  });

  should("have empty attributes in element", function() {
    var el = SAXFactory.createElement("tag");

    expect(el.attributes).to.not.be.undefined;
  });

  should("add attributes to element", function() {
    var attribs = {
      "a": "b"
    };

    var el = SAXFactory.createElement({
      name: "tag",
      attributes: attribs
    });

    expect(el.attributes, "Attributes not set").to.equal(attribs);
  });

  should("create text node", function() {
    var text = "Hello World";

    var node = SAXFactory.createText(text);

    expect(node.nodeType, "Incorrect node type").to.equal(SAXFactory.NodeTypes.TEXT);
    expect(node.text, "Text not set").to.equal(text);
  });

  should("add text node to parent element", function() {
    var parent = SAXFactory.createElement("tag"),
        child = SAXFactory.createText(parent, "text");

    expect(parent.children.length, "child text not added to parent").to.equal(1);
    expect(parent.children[0], "Child text reference not correct").to.equal(child);
  });

  should("create processing instruction node", function() {
    var name = "xml",
        version = "1.0",
        encoding = "UTF-8",
        instructions = {
          version: version,
          encoding: encoding
        };

    var node = SAXFactory.createProcessingInstruction({
      name: name,
      instructions: instructions
    });

    expect(node.nodeType, "Incorrect node type").to.equal(SAXFactory.NodeTypes.PROCESSING_INSTRUCTION);
    expect(node.name, "Name not correct").to.equal(name);
    expect(node.body, "Instructions missing version").to.contain("version=\"" + version + "\"");
    expect(node.body, "Instructions missing encoding").to.contain("encoding=\"" + encoding + "\"");
  });

  should("create cdata node", function() {
    var cdata = "<p>HTML</p>";

    var node = SAXFactory.createCDATA(cdata);

    expect(node.nodeType, "Incorrect node type").to.equal(SAXFactory.NodeTypes.CDATA);
    expect(node.cdata, "CDATA not set").to.equal(cdata);
  });

  should("add cdata to parent element", function() {
    var parent = SAXFactory.createElement("tag"),
        child = SAXFactory.createCDATA(parent, "data");

    expect(parent.children.length, "child cdata not added to parent").to.equal(1);
    expect(parent.children[0], "Child cdata reference not correct").to.equal(child);
  });

  should("create comment node", function() {
    var comment = "This is a comment";

    var node = SAXFactory.createComment(comment);

    expect(node.nodeType, "Incorrect node type").to.equal(SAXFactory.NodeTypes.COMMENT);
    expect(node.comment, "Comment not set").to.equal(comment);
  });

  should("add comment to parent element", function() {
    var parent = SAXFactory.createElement("tag"),
        child = SAXFactory.createComment(parent, "comment");

    expect(parent.children.length, "child comment not added to parent").to.equal(1);
    expect(parent.children[0], "Child comment reference not correct").to.equal(child);
  });
});