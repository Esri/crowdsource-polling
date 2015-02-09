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
    "application/widgets/Mock/Mock",
    "dijit/_TemplatedMixin",
    "dojo/text!./templates/MockDialog.html",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-style",
    "dojo/on"
], function (
    declare,
    Mock,
    _TemplatedMixin,
    template,
    lang,
    dom,
    domStyle,
    on
) {
    return declare([Mock, _TemplatedMixin], {
        templateString: template,

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

            domStyle.set(this.domNode, "display", "none");
            domStyle.set(this.domNode, "position", "absolute");
            domStyle.set(this.domNode, "left", "16px");
            domStyle.set(this.domNode, "right", "16px");
            domStyle.set(this.domNode, "top", "16px");
            domStyle.set(this.domNode, "bottom", "16px");
            domStyle.set(this.domNode, "z-index", "100");

            on(this.domNode, "click", lang.hitch(this, function () {
                this.hide();
            }));
        }

    });
});
