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
    "dojo/on",
    "dojo/topic",
    "esri/layers/FeatureLayer",
    "dojo/domReady!"
], function (
    declare,
    lang,
    Deferred,
    on,
    topic,
    FeatureLayer
) {

    //========================================================================================================================//

    return declare([], {
        _config: null,
        _ideasFields: null,
        _commentFields: null,

        /**
         * Encapsulates the management of a layer and its related table.
         * @param {object} config Application configuration
         * @constructor
         */
        constructor: function (config) {
            this._config = config;
        },

        /**
         * Loads the layer and its table from the configuration information.
         * @return {object} Deferred for notification of completed load
         */
        load: function () {
            var deferred = new Deferred();
            setTimeout(lang.hitch(this, function () {
                var itemTitle, relatedTableId, relatedTableURL;

                this._operationalLayer = this._config.itemInfo.itemData.operationalLayers[0];
                itemTitle = this._operationalLayer.popupInfo.title;
                relatedTableURL = this._config.itemInfo.itemData.tables[0].url;

                this._ideasFields = this._operationalLayer.popupInfo.fieldInfos;

                this._commentsTable = new FeatureLayer(relatedTableURL);
                on.once(this._commentsTable, "load", lang.hitch(this, function (evt) {
                    console.log("Loaded comments table");
                    this._commentFields = evt.layer.fields;
                    // Use _commentFields[n].{alias, editable, length, name, nullable, type}



                }));


                deferred.resolve();
            }));
            return deferred;
        },

        /**
         * Returns the feature layer holding the items.
         * @return {object} Feature layer
         */
        getGeometryLayer: function () {
            return this._operationalLayer.layerObject;
        },

        /**
         * Returns the format to use to display an item summary.
         * @return {string} Format string with attributes enclosed within braces ("${}") using the format expected by
         * Dojo's dojo/string parameterized substitution function substitute()
         * @see <a href="http://dojotoolkit.org/reference-guide/1.10/dojo/string.html#substitute">substitute</a>
         */
        getItemSummaryFormat: function () {
            return "Ideas: {Name}";
        },

        /**
         * Returns the format to use to display item details.
         * @return {string} Format string with attributes enclosed within braces ("${}") using the format expected by
         * Dojo's dojo/string parameterized substitution function substitute()
         * @see <a href="http://dojotoolkit.org/reference-guide/1.10/dojo/string.html#substitute">substitute</a>
         */
        getItemDetailFormat: function () {
            // operationalLayers[n].itemProperties.popInfo.description; if null, we're using a fieldlist
            return "${Idea} by ${Name}<div>on ${Date}</div>";
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
         * @param {Extent} extent Outer bounds of items to retrieve
         * @return {publish} "updatedItemsList" with results of query
         */
        queryItems: function (extent) {
            var results = {"objectIdFieldName":"OBJECTID","globalIdFieldName":"","geometryType":"esriGeometryPoint","spatialReference":{"wkid":102100,"latestWkid":3857},"fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","domain":null,"defaultValue":null},{"name":"Idea","type":"esriFieldTypeString","alias":"Idea","sqlType":"sqlTypeOther","length":255,"domain":null,"defaultValue":null},{"name":"Name","type":"esriFieldTypeString","alias":"Name","sqlType":"sqlTypeOther","length":50,"domain":null,"defaultValue":null},{"name":"Date","type":"esriFieldTypeDate","alias":"Date","sqlType":"sqlTypeOther","length":8,"domain":null,"defaultValue":null},{"name":"Votes","type":"esriFieldTypeSmallInteger","alias":"Votes","sqlType":"sqlTypeOther","domain":null,"defaultValue":null}],"features":[{"attributes":{"OBJECTID":4,"Idea":"","Name":"","Date":1420525290553,"Votes":0},"geometry":{"x":-13046856.38424792,"y":4037275.1940484862}},{"attributes":{"OBJECTID":3,"Idea":"","Name":"My Name is Moderately Long","Date":1420524782564,"Votes":20},"geometry":{"x":-13046889.377574572,"y":4037251.3074771543}},{"attributes":{"OBJECTID":6,"Idea":"a properly-dated idea","Name":"fred","Date":1420497265187,"Votes":0},"geometry":{"x":-13046785.91886249,"y":4037314.0097269}},{"attributes":{"OBJECTID":5,"Idea":"","Name":"","Date":1420496807344,"Votes":0},"geometry":{"x":-13045852.700378427,"y":4037523.6143904249}},{"attributes":{"OBJECTID":1,"Idea":"first idea","Name":"my name","Date":1417392000000,"Votes":1},"geometry":{"x":-13046642,"y":4036747}},{"attributes":{"OBJECTID":2,"Idea":"Penn Ave","Name":"My Name is Very Long and Will be Cut Off","Date":null,"Votes":0},"geometry":{"x":-13045728.490207464,"y":4038765.7161000567}}]};
            setTimeout(function () {
                topic.publish("updatedItemsList", results);
            }, 2000);
        },

        /**
         * Retrieves the comments associated with an item.
         * @param {objectID} item Item whose comments are sought
         * @return {publish} "updatedCommentsList" with results of query
         */
        queryComments: function (item) {
           var results = {"objectIdFieldName":"OBJECTID","globalIdFieldName":"","geometryType":"esriGeometryPoint","spatialReference":{"wkid":102100,"latestWkid":3857},"fields":[{"name":"OBJECTID","type":"esriFieldTypeOID","alias":"OBJECTID","sqlType":"sqlTypeOther","domain":null,"defaultValue":null},{"name":"Idea","type":"esriFieldTypeString","alias":"Idea","sqlType":"sqlTypeOther","length":255,"domain":null,"defaultValue":null},{"name":"Name","type":"esriFieldTypeString","alias":"Name","sqlType":"sqlTypeOther","length":50,"domain":null,"defaultValue":null},{"name":"Date","type":"esriFieldTypeDate","alias":"Date","sqlType":"sqlTypeOther","length":8,"domain":null,"defaultValue":null},{"name":"Votes","type":"esriFieldTypeSmallInteger","alias":"Votes","sqlType":"sqlTypeOther","domain":null,"defaultValue":null}],"features":[{"attributes":{"OBJECTID":4,"Idea":"","Name":"","Date":1420525290553,"Votes":0},"geometry":{"x":-13046856.38424792,"y":4037275.1940484862}},{"attributes":{"OBJECTID":3,"Idea":"","Name":"My Name is Moderately Long","Date":1420524782564,"Votes":20},"geometry":{"x":-13046889.377574572,"y":4037251.3074771543}},{"attributes":{"OBJECTID":6,"Idea":"a properly-dated idea","Name":"fred","Date":1420497265187,"Votes":0},"geometry":{"x":-13046785.91886249,"y":4037314.0097269}},{"attributes":{"OBJECTID":5,"Idea":"","Name":"","Date":1420496807344,"Votes":0},"geometry":{"x":-13045852.700378427,"y":4037523.6143904249}},{"attributes":{"OBJECTID":1,"Idea":"first idea","Name":"my name","Date":1417392000000,"Votes":1},"geometry":{"x":-13046642,"y":4036747}},{"attributes":{"OBJECTID":2,"Idea":"Penn Ave","Name":"My Name is Very Long and Will be Cut Off","Date":null,"Votes":0},"geometry":{"x":-13045728.490207464,"y":4038765.7161000567}}]};
           setTimeout(function () {
               topic.publish("updatedCommentsList", results);
           }, 2000);
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
