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
    "dojo/on",
    "dojo/string",
    "dojo/topic",
    "dijit/layout/ContentPane"
], function (
    declare,
    MockWidget,
    lang,
    dom,
    domConstruct,
    domStyle,
    JSON,
    on,
    string,
    topic,
    ContentPane
) {
    return declare([MockWidget], {

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
         * Sets the items to be displayed in the list.
         * @param {object} items Items to display; items are as returned by the features part of the
         * result of a feature layer query
         */
        setItems: function (items) {
            var i, item, rec;

            // Clear the results area
            domConstruct.empty(this.mockContent);

            // Add a summary entry for each item
            if (items && items.length) {
                for (i = 0; i < items.length; i++) {
                    item = items[i];

                    // Create the item's display
                    rec = domConstruct.create("div", {style: "cursor: pointer"}, this.mockContent);
                    new ContentPane({
                        content: item.getTitle()
                    }, rec).startup();
                    domStyle.set(rec, "border-bottom", "1px solid #ccc");

                    // Forward a click on the item's display
                    on(rec, "click", lang.hitch(this, function (item) {
                        topic.publish("itemSelected", item);
                    }, item));
                }
            }
        }

    });
});
