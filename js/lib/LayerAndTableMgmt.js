﻿/*global define,dojo,console */
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
    "dojo/_base/array",
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
    array,
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

        /**
         * Encapsulates the management of a layer and its related table.
         * @param {object} config Application configuration
         * @constructor
         */
        constructor: function (config) {
            this.appConfig = config;
        },

        /**
         * Returns the fields of the feature layer holding the items.
         * @return {array} List of fields
         */
        getItemFields: function () {
            return this._itemFields;
        },

        /**
         * Returns the fields of the table holding the comments.
         * @return {array} List of fields
         */
        getCommentFields: function () {
            return this._commentFields;
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
         * Removes the protocol from a URL.
         * @param {string} url URL to modify
         * @return {string} URL with everything before "//" removed
         */
        deprotocolUrl: function (url) {
            return url.substring(url.indexOf("//"));
        },

        /**
         * Extracts the layer and loads its table from the configuration information.
         * @return {object} Deferred for notification of completed load
         */
        load: function () {
            var deferred = new Deferred();
            setTimeout(lang.hitch(this, function () {
                var commentTableURL;

                // Operational layer provides item fields and formats
                if (this.appConfig.itemInfo.itemData.operationalLayers.length === 0) {
                    deferred.reject(this.appConfig.i18n.map.missingItemsFeatureLayer);
                    return;
                }

                this._itemLayerInWebmap = this.appConfig.itemInfo.itemData.operationalLayers[0];
                this._itemLayer = this._itemLayerInWebmap.layerObject;
                if (!this._itemLayerInWebmap) {
                    deferred.reject(this.appConfig.i18n.map.missingItemsFeatureLayer);
                    return;
                }

                // Provides _itemFields[n].{alias, editable, length, name, nullable, type} after adjusting
                // to the presence of editing and visibility controls in the optional popup
                this._itemFields = this.applyWebmapControlsToFields(
                    this._itemLayer.fields,
                    this._itemLayerInWebmap.popupInfo
                );

                // Related table provides comment fields and formats
                this._commentTableInWebmap = this.appConfig.itemInfo.itemData.tables[0];

                // Remove the protocol from the comment table's URL so that it can be loaded in
                // http or https environments
                commentTableURL = this.deprotocolUrl(this._commentTableInWebmap.url);

                // Fetch the related table for the comments
                this._commentTable = new FeatureLayer(commentTableURL);
                on.once(this._commentTable, "load", lang.hitch(this, function (evt) {

                    // Provides _commentFields[n].{alias, editable, length, name, nullable, type} after adjusting
                    // to the presence of editing and visibility controls in the optional popup
                    this._commentFields = this.applyWebmapControlsToFields(
                        this._commentTable.fields,
                        this._commentTableInWebmap.popupInfo
                    );

                    // Formatting of comment display
                    if (this._commentTableInWebmap.popupInfo) {
                        this._commentPopupTemplate = new PopupTemplate(this._commentTableInWebmap.popupInfo);
                    } else {
                        this._commentPopupTemplate = new InfoTemplate();
                    }

                    // Override related record check from the point of view of the comments
                    // table--it's not needed
                    if (this._commentPopupTemplate._getRelatedRecords) {
                        this._commentPopupTemplate._getRelatedRecords = function () {
                            var def = new Deferred();
                            def.resolve();
                            return def.promise;
                        };
                    }

                    // Test that the items layer is related to the comments table and that
                    // the two are not involved in any other relationships
                    if (!this._itemLayer.relationships || !this._commentTable.relationships ||
                            this._itemLayer.relationships.length !== 1 ||
                            this._commentTable.relationships.length !== 1 ||
                            this._itemLayer.relationships[0].relatedTableId !== this._commentTable.layerId ||
                            this._itemLayer.layerId !== this._commentTable.relationships[0].relatedTableId) {
                        deferred.reject(this.appConfig.i18n.map.unsupportedRelationship);
                    }
                    this._primaryKeyField = this._itemLayer.relationships[0].keyField;
                    this._foreignKeyField = this._commentTable.relationships[0].keyField;

                    deferred.resolve();
                }), lang.hitch(this, function () {
                    deferred.reject(this.appConfig.i18n.map.missingCommentsTable);
                }));
            }));
            return deferred;
        },

        /**
         * Amends fields in fields list with popup editing and visibility settings.
         * @param {array} fields Fields associated with layer or table
         * @param {object} [webmapPopup] Popup associated with layer or table
         * @return {array} Amends list with "dtIsEditable" and "dtIsVisible"; if webmapPopup or its fieldInfos
         * property are undefined, dtIsEditable is a copy of "editable" and dtIsVisible is true; otherwise,
         * dtIsEditable is a copy of the popup's fieldInfo's "isEditable" and dtIsVisible is a copy of its
         * "visible" (we have to use dtIs* to avoid conflicts with the API's use of "editable")
         */
        applyWebmapControlsToFields: function (fields, webmapPopup) {
            var fieldInfos = webmapPopup ? webmapPopup.fieldInfos : null;
            array.forEach(fields, function (field) {
                // Cover no-popup and unmatched fieldname cases
                field.dtIsEditable = field.editable;
                field.dtIsVisible = true;
                field.dtStringFieldOption = null;
                field.dtTooltip = null;

                // If we have a popup, seek to update settings
                if (fieldInfos) {
                    array.some(fieldInfos, function (fieldInfo) {
                        if (field.name === fieldInfo.fieldName) {
                            field.dtIsEditable = fieldInfo.isEditable;
                            field.dtIsVisible = fieldInfo.visible;
                            field.dtStringFieldOption = fieldInfo.stringFieldOption;
                            field.dtTooltip = fieldInfo.tooltip;
                            return true;
                        }
                        return false;
                    });
                }
            });
            return fields;
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
            updateQuery.orderByFields = [this._itemLayer.objectIdField + " DESC"];
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
         * Adds a comment to the comment table.
         * @param {string} item Item associated with this comment
         * @param {object} comment Comment as a set of attributes to be added for the item
         * @return {publish} "commentAdded" with the item associated with this comment
         * or "commentAddFailed" with an error message
         */
        addComment: function (item, comment) {
            var attr, gra;

            // Amend a copy of the comment with the foreign key pointing to the
            // associated item
            attr = lang.clone(comment);
            attr[this._foreignKeyField] = item.attributes[this._primaryKeyField];

            // Add the comment to the comment table
            gra = new Graphic(null, null, attr);
            this._commentTable.applyEdits([gra], null, null,
                lang.hitch(this, function (results) {
                    if (results.length === 0) {
                        topic.publish("commentAddFailed", "missing field");  //???
                    } else if (results[0].error) {
                        topic.publish("commentAddFailed", results[0].error);
                    } else {
                        topic.publish("commentAdded", item);
                    }
                }),
                lang.hitch(this, function (err) {
                    topic.publish("commentAddFailed", JSON.stringify(err));
                }));
        },

        /**
         * Retrieves the attachments associated with an item.
         * @param {objectID} item Item whose attachments are sought
         * @return {publish} "updatedAttachments" with results of query
         */
        queryAttachments: function (item) {
            this._itemLayer.queryAttachmentInfos(
                item.attributes[this._itemLayer.objectIdField],
                lang.hitch(this, function (attachments) {
                    topic.publish("updatedAttachments", attachments);
                }),
                lang.hitch(this, function (err) {
                    console.log(JSON.stringify(err));  //???
                })
            );
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
            updateQuery.outFields = ["*"];
            updateQuery.relationshipId = 0;

            this._itemLayer.queryRelatedFeatures(updateQuery, lang.hitch(this, function (results) {
                var pThis = this, fset, i, features;

                // Function for descending-OID-order sort
                function sortByOID(a, b) {
                    if (a.attributes[pThis._commentTable.objectIdField] > b.attributes[pThis._commentTable.objectIdField]) {
                        return -1;  // order a before b
                    }
                    if (a.attributes[pThis._commentTable.objectIdField] < b.attributes[pThis._commentTable.objectIdField]) {
                        return 1;  // order b before a
                    }
                    return 0;  // a & b have same date, so relative order doesn't matter
                }

                fset = results[item.attributes[this._itemLayer.objectIdField]];
                features = fset ? fset.features : [];

                if (features.length > 0) {
                    // Sort by descending OID order
                    features.sort(sortByOID);

                    // Add the comment table popup
                    for (i = 0; i < features.length; ++i) {
                        features[i].setInfoTemplate(this._commentPopupTemplate);
                    }
                }
                topic.publish("updatedCommentsList", features);
            }), lang.hitch(this, function (err) {
                console.log(JSON.stringify(err));  //???
            }));
        },

        /**
         * Increments the designated "votes" field for the specified item.
         * @param {object} item Item to update
         */
        incrementVote: function (item) {
            var numVotes;

            if (this.appConfig.itemVotesField.length > 0) {
                numVotes = 1;
                if (item.attributes[this.appConfig.itemVotesField]) {
                    numVotes = item.attributes[this.appConfig.itemVotesField] + 1;
                }
                item.attributes[this.appConfig.itemVotesField] = numVotes;

                this._itemLayer.applyEdits(null, [item], null, lang.hitch(this, function (ignore, updates) {
                    if (updates.length === 0) {
                        topic.publish("voteUpdateFailed", "missing field");
                    } else if (updates[0].error) {
                        topic.publish("voteUpdateFailed", updates[0].error);
                    } else {
                        topic.publish("voteUpdated", item);
                    }
                }), lang.hitch(this, function (err) {
                    topic.publish("voteUpdateFailed", JSON.stringify(err));
                }));
            }
        }

    });

    //========================================================================================================================//

});
