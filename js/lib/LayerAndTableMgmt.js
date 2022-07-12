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
    "dojo/query",
    "dojo/dom-style",
    "dojo/promise/all",
    "dojo/topic",
    "esri/dijit/PopupTemplate",
    "esri/graphic",
    "esri/InfoTemplate",
    "esri/layers/FeatureLayer",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/tasks/RelationshipQuery"
], function (
    declare,
    array,
    lang,
    Deferred,
    JSON,
    on,
    dojoQuery,
    domStyle,
    all,
    topic,
    PopupTemplate,
    Graphic,
    InfoTemplate,
    FeatureLayer,
    Query,
    QueryTask,
    RelationshipQuery
) {

    //========================================================================================================================//

    return declare([], {

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
         * @return {object} Deferred for notification of completed load; deferred's result
         * indicates if there is a comment table or not
         */
        load: function () {
            var deferred = new Deferred();
            setTimeout(lang.hitch(this, function () {
                var opLayers, iOpLayer = 0, isValidFeatureLayer = false,
                    promises = [];

                // Operational layer provides item fields and formats
                if (this.appConfig.itemInfo.itemData.operationalLayers.length === 0) {
                    deferred.reject(this.appConfig.i18n.map.missingItemsFeatureLayer);
                    return;
                }

                // Find the configured layer; if not yet configured, use the first
                opLayers = this.appConfig.itemInfo.itemData.operationalLayers;
                if (this.appConfig.featureLayer && this.appConfig.featureLayer.id) {
                    for (iOpLayer = 0; iOpLayer < opLayers.length; iOpLayer++) {
                        if (this.appConfig.featureLayer.id === opLayers[iOpLayer].id &&
                            opLayers[iOpLayer].layerType === "ArcGISFeatureLayer" &&
                            !opLayers[iOpLayer].hasOwnProperty("featureCollection")) {
                            isValidFeatureLayer = true;
                            break;
                        }
                    }
                }

                // Or if configured to an un matching feature layer
                // then use the first available feature layer from the web map
                if (!isValidFeatureLayer) {
                    for (var i = 0; i < opLayers.length; i++) {
                        if (opLayers[i].layerType === "ArcGISFeatureLayer" &&
                            !opLayers[i].hasOwnProperty("featureCollection")) {
                            iOpLayer = i;
                            isValidFeatureLayer = true;
                            break;
                        }
                    }
                }

                // if no valid feature layer is configured or no feature layer is being present in the 
                // web map then show the warning message
                if (!isValidFeatureLayer) {
                    deferred.reject(this.appConfig.i18n.map.missingItemsFeatureLayer);
                    return;
                }

                // Get the layer definition
                this._itemLayerInWebmap = opLayers[iOpLayer];
                if (this._itemLayerInWebmap.errors) { //Add by Mike M, itemLayer is null on secure data if signed in with wrong user

                    if (this._itemLayerInWebmap.errors.length > 0) {
                        deferred.reject(this._itemLayerInWebmap.errors[0]);
                        return;
                    }
                }
                this._itemLayer = this._itemLayerInWebmap.layerObject;
                //If layer is hosted on portal
                //Keep the item id for getting access properties of a layer
                if (this._itemLayerInWebmap.itemId) {
                    this._itemLayer.itemId = this._itemLayerInWebmap.itemId;
                }
                //Check if refresh interval exist for the layer
                //Accordingly add the refresh-tick handler
                if (this._itemLayer.refreshInterval !== 0) {
                    if (this.layerRefreshHandler) {
                        this.layerRefreshHandler.remove();
                    }
                    //Attach refresh handle to the layer to fetch the add/updated features
                    this.layerRefreshHandler = on(this._itemLayer, "refresh-tick",
                        lang.hitch(this, function () {
                            this.queryItems();
                            this.canUpdateFeatureData = true;
                        }));
                }
                //Honor the webmap popup info settings for showing/hiding attachments
                if (this._itemLayerInWebmap.popupInfo && this._itemLayer.hasAttachments) {
                    this._itemLayer.hasAttachments = this._itemLayerInWebmap.popupInfo.showAttachments;
                }
                if (!this._itemLayerInWebmap || !this._itemLayer) {
                    deferred.reject(this.appConfig.i18n.map.missingItemsFeatureLayer);
                    return;
                }

                // Provides _itemFields[n].{alias, editable, length, name, nullable, type} after adjusting
                // to the presence of editing and visibility controls in the optional popup
                this._itemFields = this.amendFieldInformation(
                    this._itemLayer,
                    this._itemLayerInWebmap.popupInfo
                );

                // Related table provides comment fields and formats; use the first relationship
                if (this._itemLayer.relationships &&
                    this._itemLayer.relationships.length > 0) {

                    // Try to find the table that's in this relationship. We'll do parallel searches in
                    // the hope that it'll be on average faster than serially stepping through the tables.
                    array.forEach(this.appConfig.itemInfo.itemData.tables, lang.hitch(this, function (table) {
                        var commentTableURL, commentTableInWebmap = table,
                            commentTable, loadDeferred = new Deferred();

                        // Remove the protocol from the comment table's URL so that it can be loaded in
                        // http or https environments
                        commentTableURL = this.deprotocolUrl(commentTableInWebmap.url);

                        // Fetch the related table for the comments
                        promises.push(loadDeferred.promise);
                        commentTable = new FeatureLayer(commentTableURL);
                        on.once(commentTable, "load", lang.hitch(this, function (evt) {
                            var relateFound = array.some(this._itemLayer.relationships, lang.hitch(this, function (relate, i) {
                                if (relate.relatedTableId === commentTable.layerId) {
                                    var tableKeyField = "";
                                    array.some(commentTable.relationships, lang.hitch(this, function (tablerelate, i) {
                                        if (tablerelate.relatedTableId === this._itemLayer.layerId) {
                                            tableKeyField = tablerelate.keyField;
                                            return true;
                                        }
                                        return false;
                                    }));
                                    loadDeferred.resolve({
                                        "commentTableInWebmap": commentTableInWebmap,
                                        "commentTableURL": commentTableURL,
                                        "commentTable": commentTable,
                                        "commentTableRelateID": i,
                                        "pollingKeyField": relate.keyField,
                                        "tableKeyField": tableKeyField
                                    });
                                    return true;
                                }
                                return false;
                            }));

                            if (relateFound === false) {
                                loadDeferred.resolve();
                            }
                        }), lang.hitch(this, function () {
                            loadDeferred.resolve();
                        }));
                    }));

                    all(promises).then(lang.hitch(this, function (results) {
                        // Find the matching relationship, if any; array.some will short-circuit if found
                        array.some(results, lang.hitch(this, function (result) {
                            if (result) {
                                // Save the links to the matching table
                                this._commentTableInWebmap = result.commentTableInWebmap;
                                this._commentTableURL = result.commentTableURL;
                                this._commentTable = result.commentTable;
                                //Honor the showAttachments flag for related layer
                                if (result.commentTableInWebmap.popupInfo && this._commentTable.hasAttachments) {
                                    this._commentTable.hasAttachments = result.commentTableInWebmap.popupInfo.showAttachments;
                                }
                                this._commentTableRelateID = result.commentTableRelateID;
                                // Provides _commentFields[n].{alias, editable, length, name, nullable, type} after adjusting
                                // to the presence of editing and visibility controls in the optional popup
                                this._commentFields = this.amendFieldInformation(
                                    this._commentTable,
                                    this._commentTableInWebmap.popupInfo
                                );

                                // Formatting of comment display
                                if (this._commentTableInWebmap.popupInfo) {
                                    this._commentPopupTemplate = new PopupTemplate(this._commentTableInWebmap.popupInfo);
                                }
                                else {
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

                                // Save the field names for the linkage between the item layer and its table
                                // Note that we only consider the first relationship in the items layer
                                this._primaryKeyField = result.pollingKeyField;
                                this._foreignKeyField = result.tableKeyField;

                                return true;
                            }
                            return false;
                        }));

                        // We're done whether or not a table matched
                        deferred.resolve(this._commentTable !== undefined);
                    }));
                }
                else {
                    // No comments for this webmap
                    deferred.resolve(false);
                }
            }));
            return deferred;
        },

        /**
         * Amends fields in fields list with popup editing and visibility settings, domains, defaults.
         * @param {object} featureSvc Feature service containing fields
         * @param {object} [webmapPopup] Popup associated with layer or table
         * @return {array} Amends list with "dtIsEditable" and "dtIsVisible"; if webmapPopup or its fieldInfos
         * property are undefined, dtIsEditable is a copy of "editable" and dtIsVisible is true; otherwise,
         * dtIsEditable is a copy of the popup's fieldInfo's "isEditable" and dtIsVisible is a copy of its
         * "visible" (we have to use dtIs* to avoid conflicts with the API's use of "editable")
         * Amendments:
         *   dtIsEditable: {boolean}
         *   dtIsVisible: {boolean}
         *   dtStringFieldOption: {string} copied from popup
         *   dtTooltip: {null|string} copied from popup
         *   dtDefault: {null|value}
         */
        amendFieldInformation: function (featureSvc, webmapPopup) {
            var fields = featureSvc.fields,
                defaults = null,
                sortedFields, fieldInfos = webmapPopup ? webmapPopup.fieldInfos : null;

            // Do we have defaults in this feature service?
            if (featureSvc.templates && featureSvc.templates.length > 0 && featureSvc.templates[0].prototype.attributes) {
                defaults = featureSvc.templates[0].prototype.attributes;
            }

            // Amend fields
            array.forEach(fields, lang.hitch(this, function (field) {
                // Cover no-popup and unmatched fieldname cases
                field.dtIsEditable = field.editable;
                field.dtIsVisible = true;
                field.dtStringFieldOption = null;
                field.dtTooltip = null;

                // Add in default either from template or from field itself, falling back to null
                if (defaults && defaults[field.name]) {
                    field.dtDefault = field.defaultValue || defaults[field.name];
                }
                else {
                    field.dtDefault = field.defaultValue || null;
                }

                // If the default is a string, trim it because Server is delivering cannot-be-null string fields as a
                // string with a blank
                if (typeof field.dtDefault === "string") {
                    field.dtDefault = field.dtDefault.trim();
                }

                // Convert dates from ArcGIS format of days since 12/31/1899 to JavaScript format of days since 1/1/1970
                if (field.type === "esriFieldTypeDate") {
                    field.dtDefault = this.convertArcGISDaysToLocalDays(field.dtDefault);
                }

                // If we have a popup, seek to update settings
                if (fieldInfos) {
                    array.some(fieldInfos, function (fieldInfo) {
                        if (field.name === fieldInfo.fieldName) {
                            if (fieldInfo.label) {
                                field.alias = fieldInfo.label;
                            }
                            field.dtIsEditable = fieldInfo.isEditable;
                            field.dtIsVisible = fieldInfo.visible;
                            field.dtStringFieldOption = fieldInfo.stringFieldOption;
                            field.dtTooltip = fieldInfo.tooltip;
                            field.dtFormat = fieldInfo.format;
                            return true;
                        }
                        return false;
                    });
                }
            }));

            // Reorder fields to match popup
            if (fieldInfos) {
                sortedFields = [];
                array.forEach(fieldInfos, function (fieldInfo) {
                    array.some(fields, function (field) {
                        if (field.name === fieldInfo.fieldName) {
                            sortedFields.push(field);
                            return true;
                        }
                        return false;
                    });
                });
                return sortedFields;
            }

            return fields;
        },

        /**
         * Converts from ArcGIS format of days since 12/31/1899 to JavaScript format of days since 1/1/1970
         * @param {number} arcGISDays Days in the ArcGIS format
         * @return {number} Days in the JavaScript format
         **/
        convertArcGISDaysToLocalDays: function (arcGISDays) {
            if (!arcGISDays) {
                return arcGISDays;
            }
            return new Date(
                ((arcGISDays -
                        25569) // days from 12/31/1899 to 1/1/1970
                    *
                    86400000) // milliseconds in a day
                +
                ((new Date()).getTimezoneOffset() // minutes to add to time so that it is interpreted as local
                    *
                    60000) // milliseconds in a minute
            );
        },

        /**
         * Retrieves the items within the map extent.
         * @param {Extent} [extent] Outer bounds of items to retrieve
         * @return {publish} "updatedItemsList" with results of query
         */
        queryItems: function (extent, isURL) {
            var now = Date.now();
            var updateQuery = new Query();
            updateQuery.where = now + "=" + now; // Needed to break JSAPI cache
            updateQuery.returnGeometry = true;
            updateQuery.orderByFields = [this._itemLayer.objectIdField + " DESC"];
            updateQuery.outFields = ["*"];
            if (extent) {
                updateQuery.geometry = extent;
            }

            this._itemLayer.queryFeatures(updateQuery, lang.hitch(this, function (results) {
                topic.publish("updatedItemsList", results ? results.features : [], isURL);
            }), lang.hitch(this, function (err) {
                console.log(err.message || "queryFeatures");
            }));
        },

        /**
         * Adds a comment to the comment table.
         * @param {string} item Item associated with this comment
         * @param {object} comment Structure containing two properties: attrs--properties matching the form field names
         * each of which has a value matching its corresponding input form item's value--and attachments--an array
         * of file upload forms
         * @return {publish} "commentAdded" with the item associated with this comment
         * or "commentAddFailed" with an error message
         */
        addComment: function (item, comment) {
            var attr, gra;

            // Amend a copy of the comment with the foreign key pointing to the
            // associated item
            attr = lang.clone(comment.attributes);
            attr[this._foreignKeyField] = item.attributes[this._primaryKeyField];

            // Add the comment to the comment table
            gra = new Graphic(null, null, attr);
            this._commentTable.applyEdits([gra], null, null,
                lang.hitch(this, function (results) {
                    var fileAttachedCounter = 0,
                        fileAttachFailedCounter = 0;

                    if (results.length === 0) {
                        topic.publish("commentAddFailed", "missing field");
                    }
                    else if (results[0].error) {
                        topic.publish("commentAddFailed", results[0].error);
                    }
                    else {
                        if (comment.attachments.length > 0) {
                            topic.publish("startUploadProgress");
                            comment.attachments.forEach(lang.hitch(this, function (node) {
                                this._commentTable.addAttachment(results[0].objectId, node,
                                    lang.hitch(this, function () { // success callback
                                        this.monitorAttachmentUpload(item, comment.attachments.length,
                                            ++fileAttachedCounter, fileAttachFailedCounter);
                                    }),
                                    lang.hitch(this, function () { // failure callback
                                        this.monitorAttachmentUpload(item, comment.attachments.length,
                                            fileAttachedCounter, ++fileAttachFailedCounter);
                                    })
                                );
                            }));
                        }
                        else {
                            topic.publish("showMessage", this.appConfig.submitMessage, true);
                            topic.publish("commentAdded", item);
                        }
                    }
                }),
                lang.hitch(this, function (err) {
                    topic.publish("commentAddFailed", err.message || "commentAddFailed");
                }));
        },

        /**
         * Publishes "commentAdded" when the expected number of uploads has succeeded or failed.
         * @param {object} item Item being updated
         * @param {number} numToUpload Total number of files to upload
         * @param {number} numSucceeded Number of successes so far
         * @param {number} numFailed Number of failures so far
         */
        monitorAttachmentUpload: function (item, numToUpload, numSucceeded, numFailed) {
            topic.publish("updateUploadProgress", (100 * numSucceeded / numToUpload));
            if (numToUpload === numSucceeded + numFailed) {
                topic.publish("stopUploadProgress", numSucceeded, numFailed);
                topic.publish("commentAdded", item);
            }
        },

        /**
         * Retrieves the attachments associated with an item.
         * @param {objectID} item Item whose attachments are sought
         * @return {publish} "updatedAttachments" with the item and the results of the query
         */
        queryAttachments: function (item) {
            this._itemLayer.queryAttachmentInfos(
                item.attributes[this._itemLayer.objectIdField],
                lang.hitch(this, function (attachments) {
                    topic.publish("updatedAttachments", item, attachments);
                }),
                lang.hitch(this, function (err) {
                    console.log(err.message || "queryAttachmentInfos");
                })
            );
        },

        /**
         * Retrieves the comments associated with an item.
         * @param {objectID} item Item whose comments are sought
         * @return {publish} "updatedCommentsList" with the item and the results of the query
         */
        queryComments: function (item) {
            var updateQuery = new RelationshipQuery();
            updateQuery.objectIds = [item.attributes[this._itemLayer.objectIdField]];
            updateQuery.returnGeometry = true;
            updateQuery.outFields = ["*"];

            // Apply filter if it exists
            if (this._commentTableInWebmap.layerDefinition &&
                this._commentTableInWebmap.layerDefinition.definitionExpression) {
                updateQuery.definitionExpression = this._commentTableInWebmap.layerDefinition.definitionExpression;
            }

            // Fetch the comments
            updateQuery.relationshipId = this._itemLayer.relationships[this._commentTableRelateID].id; // Note that we only consider the first relationship in the items layer
            this._itemLayer.queryRelatedFeatures(updateQuery, lang.hitch(this, function (results) {
                var pThis = this,
                    fset, i, features;

                // Function for descending-OID-order sort
                function sortByOID(a, b) {
                    if (a.attributes[pThis._commentTable.objectIdField] > b.attributes[pThis._commentTable.objectIdField]) {
                        return -1; // order a before b
                    }
                    if (a.attributes[pThis._commentTable.objectIdField] < b.attributes[pThis._commentTable.objectIdField]) {
                        return 1; // order b before a
                    }
                    return 0; // a & b have same date, so relative order doesn't matter
                }

                fset = results[item.attributes[this._itemLayer.objectIdField]];
                features = fset ? fset.features : [];

                if (features.length > 0) {
                    // Sort by descending OID order
                    features.sort(sortByOID);

                    // Update each comment to support its display in the item detail section
                    for (i = 0; i < features.length; ++i) {

                        // Replace the layer that comes with the comment item with one that's
                        // better for getting comment attachments
                        features[i]._layer = this._commentTable;

                        // Add the comment table popup
                        features[i].setInfoTemplate(this._commentPopupTemplate);
                    }
                }
                topic.publish("updatedCommentsList", item, features);
            }), lang.hitch(this, function (err) {
                console.log(err.message || "queryRelatedFeatures");
            }));
        },

        /**
         * Updates the vote count in an item.
         * @param {object} item Item to be updated
         * @param {string} votesField Name of field containing votes
         * @return {object} Deferred for notification of completed update
         */
        refreshVoteCount: function (item, votesField) {
            var updateQuery, updateQueryTask, deferred = new Deferred();

            if (votesField && votesField.length > 0) {
                // Get the latest vote count from the server, not just the feature layer
                updateQuery = new Query();
                updateQuery.objectIds = [item.attributes[this._itemLayer.objectIdField]];
                updateQuery.returnGeometry = false;
                updateQuery.outFields = [votesField];

                updateQueryTask = new QueryTask(this._itemLayer.url);
                updateQueryTask.execute(updateQuery, lang.hitch(this, function (results) {
                    var retrievedVotes;
                    if (results && results.features && results.features.length > 0) {
                        retrievedVotes = results.features[0].attributes[votesField];
                        if (retrievedVotes !== undefined) {
                            item.attributes[votesField] = retrievedVotes;
                            deferred.resolve(item);
                        }
                    }
                    deferred.reject(item);
                }), function () {
                    deferred.reject(item);
                });
            }
            else {
                deferred.resolve(item);
            }

            return deferred;
        },

        /**
         * Increments the designated "votes" field for the specified item.
         * @param {object} item Item to update
         * @param {string} votesField Name of field containing votes
         * @return {publish} "voteUpdated" with updated item
         */
        incrementVote: function (item, votesField) {
            if (votesField && votesField.length > 0) {
                // Get the latest vote count
                this.refreshVoteCount(item).then(lang.hitch(this, function (item) {
                    // Increment the vote
                    item.attributes[votesField] = item.attributes[votesField] + 1;

                    // Update the item in the feature layer
                    this._itemLayer.applyEdits(null, [item], null, lang.hitch(this, function (ignore, updates) {
                        if (updates.length === 0) {
                            topic.publish("voteUpdateFailed", "missing field");
                        }
                        else if (updates[0].error) {
                            topic.publish("voteUpdateFailed", updates[0].error);
                        }
                        else {
                            topic.publish("voteUpdated", item);
                        }
                    }), lang.hitch(this, function (err) {
                        topic.publish("voteUpdateFailed", err.message || "voteUpdateFailed");
                    }));
                }), function (err) {
                    topic.publish("voteUpdateFailed", err.message || "voteUpdateFailed");
                });
            }
        }

    });

    //========================================================================================================================//

});
