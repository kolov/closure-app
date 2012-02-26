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
    classElement = goog.dom.createDom('div', {'class': 'clazz'}, this.packageName + "." + this.className);

    goog.dom.appendChild(this.parent, classElement);
    goog.events.listen(classElement, goog.events.EventType.CLICK,
                    function(e) {
                        alert(this.innerHTML);
                    }, false, classElement);

};

tutorial.notepad.JavaLib.prototype.makeDom = function() {
    goog.dom.appendChild(this.parent, goog.dom.createDom('div', {'class': 'clazz'}, this.packageId + ":" + this.artifactId));
};



    
    
