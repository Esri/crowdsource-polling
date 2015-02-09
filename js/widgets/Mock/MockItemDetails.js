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
    "application/widgets/Mock/MockWidget",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/json",
    "dojo/on"
], function (
    declare,
    MockWidget,
    lang,
    dom,
    domConstruct,
    domStyle,
    JSON,
    on
) {
    return declare([MockWidget], {
        _itemFormat: "",
        _commentFormat: "",

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
        },

        /**
         * Sets the format to be used to display an item.
         * @param {string} format Format string with attributes enclosed within braces ("${}") using the format expected by
         * Dojo's dojo/string parameterized substitution function substitute()
         * @see <a href="http://dojotoolkit.org/reference-guide/1.10/dojo/string.html#substitute">substitute</a>
         */
        setItemFormat: function (format) {
            this._itemFormat = format;
        },

        /**
         * Sets the format to be used to display a comment.
         * @param {string} format Format string with attributes enclosed within braces ("${}") using the format expected by
         * Dojo's dojo/string parameterized substitution function substitute()
         * @see <a href="http://dojotoolkit.org/reference-guide/1.10/dojo/string.html#substitute">substitute</a>
         */
        setCommentFormat: function (format) {
            this._commentFormat = format;
        },

        /**
         * Sets the item to be displayed.
         * @param {object} item Item to display; items are as returned by the feature layer query
         */
        setItem: function (item) {
            try {
                domConstruct.create("div", {
                    innerHTML: "<br><b>item details for</b><br>" + JSON.stringify(item, function (key, value) {
                        if (key === "") {
                            return value;
                        } else if (key === "type" || key === "attributes" || key === "geometry") {
                            return JSON.stringify(value);
                        } else {
                            return undefined;
                        }
                    })
                }, this.mockContent);
             } catch (ignore) {
                 debugger;
             }
        },

        /**
         * Sets the comments to be displayed in the list.
         * @param {object} items Items to display; items are as returned by the related table query
         */
        setComments: function (comments) {
            try {
                domConstruct.create("div", {
                    innerHTML: "<br><b>comments</b><br>" + JSON.stringify(comments)
                }, this.mockContent);
            } catch (ignore) {
                debugger;
            }
        }

    });
});
