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
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on"
], function (
    declare,
    _WidgetBase,
    lang,
    dom,
    domConstruct,
    domStyle,
    on
) {
    return declare([_WidgetBase], {

        /**
         * Widget constructor
         * @param {object} initialProps Initialization properties:
         *     appConfig: Application configuration
         *     label: Text to put into app's div for labeling
         * @constructor
         */

        /**
         * Initializes the widget once the DOM structure is ready
         */
        postCreate: function () {
            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);

            this.label = this.label || "";

            domStyle.set(this.domNode, "color", this.appConfig.theme.foreground);
            domStyle.set(this.domNode, "background-color", this.appConfig.theme.background);
            this.mockContent.innerHTML = this.label + "<br>";
            this.mockContent.title = this.label;

            this.hide();
        },

        /**
         * Causes the widget to become visible.
         */
        show: function () {
            domStyle.set(this.domNode, "display", "block");
        },

        /**
         * Causes the widget to become hidden.
         */
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        },

        /**
         * Adds a button to the content or root div of the widget for mocking behavior.
         * @param {string} label Button's label
         * @param {function} clickHandler Function to run when button is clicked
         */
        createMockClickSource: function (label, clickHandler) {
            var button = domConstruct.create("button", {
                innerHTML: label,
                style: "margin:10px;z-index:200"
            }, this.mockActions || this.domNode);
            this.own(on(button, "click", lang.hitch(this, clickHandler)));
        },

        /**
         * Adds a function to the mock.
         * @param {string} name Name of function
         * @param {function} embodiment Body of function
         */
        createMockFunction: function (name, embodiment) {
            this[name] = embodiment;
        },

        /**
         * Changes nulls in the supplied object to the specified string.
         * @param {object} obj Object to modify
         * @param {string} showNullValueAs String to replace each null with
         */
        stringizeNullValues: function (obj, showNullValueAs) {
            var index;
            for (index in obj) {
                if (obj.hasOwnProperty(index)) {
                    if (!obj[index]) {
                        obj[index] = showNullValueAs;
                    }
                }
            }
        }

    });
});
