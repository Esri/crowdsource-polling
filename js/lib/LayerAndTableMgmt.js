/*global define,dojo */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
 | Copyright 2014 Esri
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
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/json",
    "dojo/on",
    "dojo/topic",
    "esri/layers/FeatureLayer",
    "esri/tasks/query",
    "esri/tasks/RelationshipQuery",
    "dojo/domReady!"
], function (
    declare,
    lang,
    Deferred,
    JSON,
    on,
    topic,
    FeatureLayer,
    Query,
    RelationshipQuery
) {

    //========================================================================================================================//

    return declare([], {
        appConfig: null,
        _itemFields: null,
        _commentFields: null,

        /**
         * Encapsulates the management of a layer and its related table.
         * @param {object} config Application configuration
         * @constructor
         */
        constructor: function (config) {
            var ideaFieldsSplit;
            this.appConfig = config;

            // Save the names of ideas layer fields that we'll need to interact with
            ideaFieldsSplit = this.appConfig.ideaFields.trim().split(",").concat("", "");  // provide defaults
            this._ideaFields = {
                "name": ideaFieldsSplit[0].trim(),
                "date": ideaFieldsSplit[1].trim(),
                "votes": ideaFieldsSplit[2].trim()
            }

            // Save the names of comment table fields that we'll need to interact with
            this._commentFields = {
                "name": this.appConfig.commentFields.trim()
            }
        },

        /**
         * Extracts the layer and loads its table from the configuration information.
         * @return {object} Deferred for notification of completed load
         */
        load: function () {
            var deferred = new Deferred();
            setTimeout(lang.hitch(this, function () {
                var relatedTableURL;

                // Operational layer provides item fields and formats
                this._itemLayerInWebmap = this.appConfig.itemInfo.itemData.operationalLayers[0];
                this._itemLayer = this._itemLayerInWebmap.layerObject;

                // Provides _itemFields[n].{alias, editable, length, name, nullable, type}
                this._itemFields = this._itemLayer.fields;

                // Formatting of item display; if description is null, we're to use a fieldlist
                if (this._itemLayerInWebmap.popupInfo) {
                    this._itemSummaryFormat = (this._itemLayerInWebmap.popupInfo.title || "").replace(/\{/g, "${");
                    this._itemDetailsFormat = (this._itemLayerInWebmap.popupInfo.description || "").replace(/\{/g, "${");
                } else {
                    this._itemSummaryFormat = "${" + this._ideaFields["name"] + "}";
                }


                // Related table provides comment fields and formats
                this._commentTableInWebmap = this.appConfig.itemInfo.itemData.tables[0];

                // Fetch the related table for the comments
                this._commentTable = new FeatureLayer(this._commentTableInWebmap.url);
                on.once(this._commentTable, "load", lang.hitch(this, function (evt) {

                    // Provides _commentFields[n].{alias, editable, length, name, nullable, type}
                    this._commentFields = this._commentTable.fields;

                    // Formatting of comment display; if description is null, we're to use a fieldlist
                    if (this._commentTableInWebmap.popupInfo) {
                        this._commentSummaryFormat = (this._commentTableInWebmap.popupInfo.title || "").replace(/\{/g, "${");
                        this._commentDetailsFormat = (this._commentTableInWebmap.popupInfo.description || "").replace(/\{/g, "${");
                    } else {
                        this._commentSummaryFormat = "${" + this._commentFields["name"] + "}";
                    }

                    deferred.resolve();
                }));
            }));
            return deferred;
        },

        /**
         * Returns the feature layer holding the items.
         * @return {object} Feature layer
         */
        getItemLayer: function () {
            return this._itemLayer;
        },

        /**
         * Returns the table holding the comments.
         * @return {object} Table
         */
        getCommentTable: function () {
            return this._commentTable;
        },

        /**
         * Returns the format to use to display an item summary.
         * @return {string} Format string with attributes enclosed within braces ("${}") using the format expected by
         * Dojo's dojo/string parameterized substitution function substitute()
         * @see <a href="http://dojotoolkit.org/reference-guide/1.10/dojo/string.html#substitute">substitute</a>
         */
        getItemSummaryFormat: function () {
            return this._itemSummaryFormat;
        },

        /**
         * Returns the format to use to display item details.
         * @return {string} Format string with attributes enclosed within braces ("${}") using the format expected by
         * Dojo's dojo/string parameterized substitution function substitute()
         * @see <a href="http://dojotoolkit.org/reference-guide/1.10/dojo/string.html#substitute">substitute</a>
         */
        getItemDetailFormat: function () {
            return this._itemDetailsFormat;
        },

        /**
         * Returns the format to use to display comment details.
         * @return {string} Format string with attributes enclosed within braces ("${}") using the format expected by
         * Dojo's dojo/string parameterized substitution function substitute()
         * @see <a href="http://dojotoolkit.org/reference-guide/1.10/dojo/string.html#substitute">substitute</a>
         */
        getCommentDetailFormat: function () {
            // operationalLayers[n].itemProperties.popInfo.description; if null, we're using a fieldlist
            return "${Comment} by ${Name} on ${Date}";
        },

        /**
         * Retrieves the items within the map extent.
         * @param {Extent} [extent] Outer bounds of items to retrieve
         * @return {publish} "updatedItemsList" with results of query
         */
        queryItems: function (extent) {
            var updateQuery = new Query();
            updateQuery.where = "1=1";
            updateQuery.returnGeometry = true;
            updateQuery.orderByFields = [this._ideaFields["date"] + " DESC"];
            updateQuery.outFields = ["*"];
            if (extent) {
                updateQuery.geometry = extent;
            }

            this._itemLayer.queryFeatures(updateQuery, lang.hitch(this, function (results) {
                topic.publish("updatedItemsList", (results) ? results.features : []);
            }), lang.hitch(this, function (err) {
                console.log(JSON.stringify(err));
            }));
        },

        /**
         * Retrieves the comments associated with an item.
         * @param {objectID} item Item whose comments are sought
         * @return {publish} "updatedCommentsList" with results of query
         */
        queryComments: function (item) {
           var updateQuery = new RelationshipQuery();
           updateQuery.objectIds = [item.attributes[this._itemLayer.objectIdField]];
           updateQuery.returnGeometry = true;
           updateQuery.orderByFields = [this._ideaFields["date"] + " DESC"];
           updateQuery.outFields = ["*"];
           updateQuery.relationshipId = 0;

           this._itemLayer.queryRelatedFeatures(updateQuery, lang.hitch(this, function (results) {
               var fset = results[item.attributes[this._itemLayer.objectIdField]];
               topic.publish("updatedCommentsList", (fset) ? fset.features : []);
           }), lang.hitch(this, function (err) {
                console.log(JSON.stringify(err));
           }));
        },

        /**
         * Increments the designated "votes" field for the specified item.
         * @param {string} itemId Identifier of item to modify
         */
        incrementVote: function (itemId) {
        },

        /**
         * Returns the generated form for adding comments.
         */
        getAddCommentForm: function () {
            return null;
        },

        /**
         * Adds a comment to the comment table.
         * @param {string} itemId Identifier of item to modify
         * @param {object} comment Comment to be added for the specified item
         */
        addComment: function (itemId, comment) {
        }

    });

    //========================================================================================================================//

});
