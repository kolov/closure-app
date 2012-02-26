// Copyright 2009 Google Inc. All Rights Reserved

goog.provide('tutorial.notepad');
goog.provide('tutorial.notepad.Note');

goog.require('goog.dom');
goog.require('goog.ui.Zippy');
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.ui.AutoComplete.RichRemote");


/**
 * Iterates over a list of note data objects, creates a Note instance
 * for each one, and tells the instance to build its DOM structure.
 * @param {Array.<Object>} data The notes data.
 * @param {Element} noteContainer The element under which DOM nodes for
 *     the notes should be added.
 * @return {Array.<tutorial.notepad.Note>} An array containing the resulting
 *     instances.
 */
tutorial.notepad.makeNotes = function(data, noteContainer) {
    var notes = [];
    for (var i = 0; i < data.length; i++) {
        var note =
            new tutorial.notepad.Note(data[i].title, data[i].content, noteContainer);
        notes.push(note);
        note.makeNoteDom();
    }
    return notes;
};


/**
 * Manages the data and interface for a single note.
 * @param {string} title The title of the note.
 * @param {string} content The body of the note.
 * @param {Element} noteContainer The element under which DOM nodes for
 *     the notes should be added.
 * @constructor
 */
tutorial.notepad.JavaClass = function(packageName, className, container) {
    this.packageName = packageName;
    this.className = className;
    this.parent = container;
};

tutorial.notepad.JavaLib = function(packageId, artifactId, container) {
    this.packageId = packageId;
    this.artifactId = artifactId;
    this.parent = container;
};


/**
 * Creates the DOM structure for the note and adds it to the document.
 */
tutorial.notepad.JavaClass.prototype.makeDom = function() {
    goog.dom.appendChild(this.parent, goog.dom.createDom('div', {'class': 'clazz'}, this.packageName + "." + this.className));
};

tutorial.notepad.JavaLib.prototype.makeDom = function() {
    goog.dom.appendChild(this.parent, goog.dom.createDom('div', {'class': 'clazz'}, this.packageId + ":" + this.artifactId));
};


tutorial.notepad.makeRichRow_ = function(item, itemType, itemClassName) {
    item.type = itemType;

    item.render = function(node, token) {
        var dom_ = goog.dom.getDomHelper(node);
        var typeNode = dom_.createDom("span", itemClassName);
        dom_.appendChild(typeNode, dom_.createTextNode(itemType));

        var nameNode = dom_.createDom("span");
        dom_.appendChild(nameNode, dom_.createTextNode(item.name));

        dom_.appendChild(node, typeNode);
        dom_.appendChild(node, nameNode);
    };

    item.select = function(target) {
        target.value = item.name;
    };

    return item;
};

tutorial.notepad.apple = function(item) {
    return tutorial.notepad.makeRichRow_(item, "Apple", "apple");
};

tutorial.notepad.citrus = function(item) {
    return tutorial.notepad.makeRichRow_(item, "Citrus", "citrus");
};

tutorial.notepad.berry = function(item) {
    return tutorial.notepad.makeRichRow_(item, "Berry", "berry");
};

javaClass = function(item) {
    return tutorial.notepad.makeRichRow_(item, "Class", "class");
};


totalJavaClasses = function(item) {
    return tutorial.notepad.makeRichRow_(item, "Class", "class");
};

    
    
