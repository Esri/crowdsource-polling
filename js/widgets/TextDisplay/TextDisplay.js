/*global define,dojo */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
 | Copyright 2015 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/TextDisplay.html",
    "dojo/_base/lang"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    template,
    lang
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

        // Our template - important!
        templateString: template,

        // A class to be applied to the root node in our template
        //baseClass: "popupWidget",

        constructor: function (config) {
            lang.mixin({}, this, config);
        },

        /**
         * Initializes the widget once the DOM structure is ready
         */
        postCreate: function () {

             // Get a DOM node reference for the root of our widget
            //var domNode = this.domNode;
            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);
           // document.getElementById("genericPopup").style.display = "inline";
        }

    });
});
