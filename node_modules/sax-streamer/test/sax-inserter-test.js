/*jshint expr: true*/

"use strict";

var collect = require("concat-stream"),
    select = require("xpath.js"),
    DOMParser = require("xmldom").DOMParser;

//noinspection JSUnresolvedVariable
var chai = require("chai"),
    expect = chai.expect,
    should = require("mocha-should");

var newStream = require("resumer");

var SAXInserter = require("../src/sax-inserter"),
    SAXFactory = require("../src/sax-factory");

var XML =
    "<?xml version=\"1.0\" charset=\"UTF-8\" ?>" +
    "<book>" +
    "  <chapter>" +
    "    <number>1</number>" +
    "  </chapter>" +
    "  <chapter>" +
    "    <number>2</number>" +
    "  </chapter>" +
    "  <chapter>" +
    "    <number>3</number>" +
    "  </chapter>" +
    "</book>";

var TITLE = "Greatest Story Ever Told",
    NUM_CHAPTERS = 3;

describe("SAX Inserter test", function() {
  var src, saxInserter, node;

  beforeEach(function() {
    src = newStream().queue(XML).end();
    saxInserter = new SAXInserter();

    node = SAXFactory.createElement("title");
    SAXFactory.createText(node, TITLE);
  });

  should("not insert node due to target path not being matched", function(done) {
    saxInserter.insertBefore("/book/chapter[1]/title", node);
    saxInserter.insertAfter("/book/chapter[1]/title", node);

    saxInserter.createStream(src, true).pipe(collect(function(xml) {
      expect(xml).to.equal(XML);

      done();
    }));
  });

  should("insert node before target node", function(done) {
    saxInserter.insertBefore("/book/chapter[1]/number", node);

    saxInserter.createStream(src, true).pipe(collect(function(xml) {
      var doc = new DOMParser().parseFromString(xml);

      var results = select(doc, "/book/chapter[1]/number/preceding-sibling::title/text()");
      expect(results.length, "Didn't insert title node correctly").to.equal(1);
      expect(results[0].data, "Didn't insert correct title").to.equal(TITLE);

      expect(select(doc, "/book/chapter[2]/title").length, "Inserted title node incorrectly").to.equal(0);
      expect(select(doc, "/book/chapter[3]/title").length, "Inserted title node incorrectly").to.equal(0);

      done();
    }));
  });

  should("insert node before every target node", function(done) {
    saxInserter.insertBefore("/book/chapter/number", node);

    saxInserter.createStream(src, true).pipe(collect(function(xml) {
      var doc = new DOMParser().parseFromString(xml);

      for (var i = 1; i <= NUM_CHAPTERS; i++) {
        var results = select(doc, "/book/chapter[" + i + "]/number/preceding-sibling::title/text()");
        expect(results.length, "Didn't insert title node correctly").to.equal(1);
        expect(results[0].data, "Didn't insert correct title").to.equal(TITLE);
      }

      done();
    }));
  });

  should("insert node after target node", function(done) {
    saxInserter.insertAfter("/book/chapter[1]/number", node);

    saxInserter.createStream(src, true).pipe(collect(function(xml) {
      var doc = new DOMParser().parseFromString(xml);

      var results = select(doc, "/book/chapter[1]/number/following-sibling::title/text()");
      expect(results.length, "Didn't insert title node correctly").to.equal(1);
      expect(results[0].data, "Didn't insert correct title").to.equal(TITLE);

      expect(select(doc, "/book/chapter[2]/title").length, "Inserted title node incorrectly").to.equal(0);
      expect(select(doc, "/book/chapter[3]/title").length, "Inserted title node incorrectly").to.equal(0);

      done();
    }));
  });

  should("insert node after every target node", function(done) {
    saxInserter.insertAfter("/book/chapter/number", node);

    saxInserter.createStream(src, true).pipe(collect(function(xml) {
      var doc = new DOMParser().parseFromString(xml);

      for (var i = 1; i <= NUM_CHAPTERS; i++) {
        var results = select(doc, "/book/chapter[" + i + "]/number/following-sibling::title/text()");
        expect(results.length, "Didn't insert title node correctly").to.equal(1);
        expect(results[0].data, "Didn't insert correct title").to.equal(TITLE);
      }

      done();
    }));
  });

  should("insert attribute into target node", function(done) {
    saxInserter.insertAttributes("/book/chapter[1]", {
      title: TITLE
    });

    saxInserter.createStream(src, true).pipe(collect(function(xml) {
      var doc = new DOMParser().parseFromString(xml);

      var results = select(doc, "/book/chapter[1]/@title");
      expect(results.length, "Didn't insert title attribute correctly").to.equal(1);
      expect(results[0].value, "Didn't insert correct title").to.equal(TITLE);

      expect(select(doc, "/book/chapter[2]/@title").length, "Inserted title attribute incorrectly").to.equal(0);
      expect(select(doc, "/book/chapter[3]/@title").length, "Inserted title attribute incorrectly").to.equal(0);

      done();
    }));
  });

  should("insert attribute into every target node", function(done) {
    saxInserter.insertAttributes("/book/chapter", {
      title: TITLE
    });

    saxInserter.createStream(src, true).pipe(collect(function(xml) {
      var doc = new DOMParser().parseFromString(xml);

      for (var i = 1; i <= NUM_CHAPTERS; i++) {
        var results = select(doc, "/book/chapter[" + i + "]/@title");
        expect(results.length, "Didn't insert title attribute correctly").to.equal(1);
        expect(results[0].value, "Didn't insert correct title").to.equal(TITLE);
      }

      done();
    }));
  });
});