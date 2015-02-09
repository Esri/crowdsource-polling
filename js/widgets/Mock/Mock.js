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
    "dojo/on",
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
        _config: null,
        _label: "",

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

            domStyle.set(this.mockContent, "color", this.appConfig.theme.foreground);
            domStyle.set(this.mockContent, "background-color", this.appConfig.theme.background);
            this.mockContent.innerHTML = this.label + "<br>";
            this.mockContent.title = this.label;
        },

        show: function () {
            domStyle.set(this.domNode, "display", "block");
        },

        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        },

        createMockClickSource: function (label, clickHandler) {
            var button = domConstruct.create("button", {
                innerHTML: label,
                style: "margin:10px;z-index:200"
            }, this.mockContent || this.domNode);
            this.own(on(button, "click", lang.hitch(this, clickHandler)));
        }

    });
});
