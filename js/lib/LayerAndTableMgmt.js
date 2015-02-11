/*global define,dojo,console */
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
    "esri/dijit/PopupTemplate",
    "esri/graphic",
    "esri/InfoTemplate",
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
    PopupTemplate,
    Graphic,
    InfoTemplate,
    FeatureLayer,
    Query,
    RelationshipQuery
) {

    //========================================================================================================================//

    return declare([], {
        appConfig: null,
        itemSpecialFields: null,
        commentSpecialFields: null,
        _foreignKey: "ParentID",

        /**
         * Encapsulates the management of a layer and its related table.
         * @param {object} config Application configuration
         * @constructor
         */
        constructor: function (config) {
            var fieldsSplit;
            this.appConfig = config;

            // Save the names of ideas layer fields that we'll need to interact with
            fieldsSplit = this.appConfig.ideaFields.trim().split(",").concat("", "");  // provide defaults
            this.itemSpecialFields = {
                "name": fieldsSplit[0].trim(),
                "date": fieldsSplit[1].trim(),
                "votes": fieldsSplit[2].trim()
            };

            // Save the names of comment table fields that we'll need to interact with
            fieldsSplit = this.appConfig.commentFields.trim().split(",").concat("", "");  // provide defaults
            this.commentSpecialFields = {
                "name": fieldsSplit[0].trim(),
                "date": fieldsSplit[1].trim()
            };
        },

        /**
         * Returns the layer fields names of the item layer's special-purpose fields.
         * @return {object} Returns the layer field names serving the roles of "name",
         * "date", and "votes"
         */
        getItemSpecialFields: function () {
            return this.itemSpecialFields;
        },

        /**
         * Returns the layer fields names of the item comment table's special-purpose fields.
         * @return {object} Returns the table field name serving the role of "name"
         */
        getCommentSpecialFields: function () {
            return this.commentSpecialFields;
        },

        /**
         * Extracts the layer and loads its table from the configuration information.
         * @return {object} Deferred for notification of completed load
         */
        load: function () {
            var deferred = new Deferred();
            setTimeout(lang.hitch(this, function () {

                // Operational layer provides item fields and formats
                this._itemLayerInWebmap = this.appConfig.itemInfo.itemData.operationalLayers[0];
                this._itemLayer = this._itemLayerInWebmap.layerObject;

                // Provides _itemFields[n].{alias, editable, length, name, nullable, type}
                this._itemFields = this._itemLayer.fields;

                // Related table provides comment fields and formats
                this._commentTableInWebmap = this.appConfig.itemInfo.itemData.tables[0];

                // Fetch the related table for the comments
                this._commentTable = new FeatureLayer(this._commentTableInWebmap.url);
                on.once(this._commentTable, "load", lang.hitch(this, function (evt) {

                    // Provides _commentFields[n].{alias, editable, length, name, nullable, type}
                    this._commentFields = this._commentTable.fields;

                    // Formatting of comment display
                    if (this._commentTableInWebmap.popupInfo) {
                        this._commentPopupTemplate = new PopupTemplate(this._commentTableInWebmap.popupInfo);
                    } else {
                        this._commentInfoTemplate = new InfoTemplate();
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
         * Retrieves the items within the map extent.
         * @param {Extent} [extent] Outer bounds of items to retrieve
         * @return {publish} "updatedItemsList" with results of query
         */
        queryItems: function (extent) {
            var updateQuery = new Query();
            updateQuery.where = "1=1";
            updateQuery.returnGeometry = true;
            updateQuery.orderByFields = [this.itemSpecialFields.date + " DESC"];
            updateQuery.outFields = ["*"];
            if (extent) {
                updateQuery.geometry = extent;
            }

            this._itemLayer.queryFeatures(updateQuery, lang.hitch(this, function (results) {
                topic.publish("updatedItemsList", results ? results.features : []);
            }), lang.hitch(this, function (err) {
                console.log(JSON.stringify(err));
            }));
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
         * @param {object} comment Comment as a set of attributes to be added for the specified item
         * @return {publish} "commentAdded" with copy of comment arg amended with foreign key
         */
        addComment: function (itemId, comment) {
            var attr, gra;

            attr = lang.clone(comment);
            if (this._foreignKey) {
                attr[this._foreignKey] = itemId;
            }

            gra = new Graphic(null, null, attr);
            this._commentTable.applyEdits([gra], null, null,
                lang.hitch(this, function (results) {
                    if (results[0].error) {
                        console.log(JSON.stringify(results[0].error));
                    } else {
                        topic.publish("commentAdded", attr);
                    }
                }),
                lang.hitch(this, function (err) {
                    console.log(JSON.stringify(err));
                }));
        },

        /**
         * Retrieves the comments associated with an item.
         * @param {objectID} item Item whose comments are sought
         * @return {publish} "updatedCommentsList" with results of query
         */
        queryComments: function (item) {
            var expr, updateQuery;

            // Relationship based on explicit foreign key
            if (this._foreignKey) {
                expr =  this._foreignKey + " = " + item.attributes[this._itemLayer.objectIdField];
                updateQuery = new Query();
                updateQuery.where = expr;
                updateQuery.returnGeometry = false;
                updateQuery.orderByFields = [this.commentSpecialFields.date + " DESC"];
                updateQuery.outFields = ["*"];

                this._commentTable.queryFeatures(updateQuery, lang.hitch(this, function (results) {
                    var i, features;
                    features = results ? results.features : [];
                    for (i = 0; i < features.length; ++i) {
                        features[i].setInfoTemplate(this._commentPopupTemplate);
                    }
                    topic.publish("updatedCommentsList", features);
                }), lang.hitch(this, function (err) {
                    console.log(JSON.stringify(err));
                }));

            // Relationship based on GUIDs
            } else {
                updateQuery = new RelationshipQuery();
                updateQuery.objectIds = [item.attributes[this._itemLayer.objectIdField]];
                updateQuery.returnGeometry = true;
                updateQuery.orderByFields = [this.commentSpecialFields.date + " DESC"];
                updateQuery.outFields = ["*"];
                updateQuery.relationshipId = 0;

                this._itemLayer.queryRelatedFeatures(updateQuery, lang.hitch(this, function (results) {
                    var fset, i, features;
                    fset = results[item.attributes[this._itemLayer.objectIdField]];
                    features = fset ? fset.features : [];
                    for (i = 0; i < features.length; ++i) {
                        features[i].setInfoTemplate(this._commentPopupTemplate);
                    }
                    topic.publish("updatedCommentsList", features);
                }), lang.hitch(this, function (err) {
                    console.log(JSON.stringify(err));
                }));
            }
        },

        /**
         * Increments the designated "votes" field for the specified item.
         * @param {string} itemId Identifier of item to modify
         */
        incrementVote: function (itemId) {
            return null;
        }

    });

    //========================================================================================================================//

});
