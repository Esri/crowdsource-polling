/*global define,console */
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
define([
    "dojo/_base/declare",
    "dojo/_base/Color",
    "dojo/_base/fx",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/json",
    "dojo/on",
    "dojo/parser",
    "dojo/promise/all",
    "dojo/promise/first",
    "dojo/topic",
    "esri/arcgis/utils",
    "esri/dijit/LocateButton",
    "esri/geometry/Point",  //???
    "application/lib/LayerAndTableMgmt",
    "application/widgets/Mock/MockDialog",
    "application/widgets/Mock/MockItemDetails",
    "application/widgets/Mock/MockItemsList",
    "application/widgets/Mock/MockWidget",
    "application/widgets/SidebarContentController/SidebarContentController",
    "application/widgets/SidebarHeader/SidebarHeader",
    "dijit/layout/LayoutContainer",
    "dijit/layout/ContentPane",
    "dojox/color/_base",
    "dojo/domReady!"
], function (
    declare,
    Color,
    fx,
    lang,
    Deferred,
    dom,
    domClass,
    domConstruct,
    domStyle,
    JSON,
    on,
    parser,
    all,
    first,
    topic,
    arcgisUtils,
    LocateButton,
    Point,  //???
    LayerAndTableMgmt,
    MockDialog,
    MockItemDetails,
    MockItemsList,
    MockWidget,
    SidebarContentController,
    SidebarHeader
) {
    return declare(null, {
        config: {},
        map: null,
        mapData: null,

        startup: function (config) {
            var itemInfo, error;

            parser.parse();

            // config will contain application and user defined info for the template such as i18n strings, the web map id
            // and application id
            // any url parameters and any application specific configuration information.
            if (config) {
                this.config = config;
                //supply either the webmap id or, if available, the item info
                itemInfo = this.config.itemInfo || this.config.webmap;
                this._launch(itemInfo);
            } else {
                error = new Error("Main:: Config is not defined");
                this.reportError(error);
            }
        },

        reportError: function (error) {
            // remove loading class from body
            domClass.remove(document.body, "app-loading");
            domClass.add(document.body, "app-error");
            // an error occurred - notify the user. In this example we pull the string from the
            // resource.js file located in the nls folder because we've set the application up
            // for localization. If you don't need to support multiple languages you can hardcode the
            // strings here and comment out the call in index.html to get the localization strings.
            // set message
            var node = dom.byId("loading_message");
            if (node) {
                if (this.config && this.config.i18n) {
                    node.innerHTML = this.config.i18n.map.error + ": " + ((error && error.message) || error || "");
                } else {
                    node.innerHTML = "Unable to create map: " + ((error && error.message) || error || "");
                }
            }
        },

        //========================================================================================================================//

        /**
         * Launches app.
         * @param {object|string} itemInfo Configuration object created by template.js or webmap id
         */
        _launch: function (itemInfo) {
            var setupUI, createMap;

            // Perform setups in parallel
            setupUI = this._setupUI();
            createMap = this._createWebMap(itemInfo);

            // Show the app when the first of the setups completes
            first([setupUI, createMap]).then(lang.hitch(this, function () {
                this._revealApp();
            }));

            // Complete wiring-up when all of the setups complete
            all([setupUI, createMap]).then(lang.hitch(this, function (statusList) {

                // Published by SidebarHeader
                topic.subscribe("socialConnectSelected", lang.hitch(this, function () {
                    this._socialDialog.show();
                }));

                // Published by SidebarHeader
                topic.subscribe("helpSelected", lang.hitch(this, function () {
                    this._helpDialog.show();
                }));

                // Published upon startup and by click on button to reset item list to match
                // current map extents
                topic.subscribe("updateItemsList", lang.hitch(this, function () {
                    this._mapData.queryItems(this.map.extent);
                    this._sidebarCnt.showPanel("ideasList");
                    this._sidebarCnt.showBusy(true);
                }));

                // Published by LayerAndTableManagement
                topic.subscribe("updatedItemsList", lang.hitch(this, function (items) {
                    this._itemsList.setItems(items);
                    this._sidebarCnt.showBusy(false);
                }));

                // Published by layer click handler and by ItemList
                on(this._mapData.getGeometryLayer(), "click", function (evt) {
                    if (evt.graphic) {
                        topic.publish("itemSelected", evt.graphic);
                    }
                });
                topic.subscribe("itemSelected", lang.hitch(this, function (item) {
                    var itemExtent;

                    //???
                    if(!item) {
                        item = new Point(JSON.parse(
                            '{"geometry":{"x":-13046642,"y":4036747,"spatialReference":{"wkid":102100,"latestWkid":3857}},"attributes":{"OBJECTID":1,"Idea":"first idea","Name":"my name","Date":1417392000000,"Votes":0,"GlobalID":"773da25c-abf1-4856-8bb8-323c07284398"}}'));
                    }
                    //???

                    this._itemDetails.setItem(item);
                    this._sidebarCnt.showPanel("ideaDetails");
                    topic.publish("updateCommentsList", item);

                    // Zoom to item if possible
                    if (item.geometry.getExtent) {
                        itemExtent = item.geometry.getExtent();
                    }
                    if (itemExtent) {
                        this.map.setExtent(itemExtent.expand(1.5));
                    } else {
                        this.map.centerAndZoom(item.geometry,
                            Math.min(2 + this.map.getZoom(), this.map.getMaxZoom()));
                    }
                }));

                // Published by ItemDetails
                topic.subscribe("showItemsList", lang.hitch(this, function () {
                    this._sidebarCnt.showPanel("ideasList");
                }));

                // Published when an item is selected and after a comment is added
                topic.subscribe("updateCommentsList", lang.hitch(this, function (item) {
                    this._mapData.queryComments(item);
                    this._sidebarCnt.showBusy(true);
                }));

                // Published by LayerAndTableManagement
                topic.subscribe("updatedCommentsList", lang.hitch(this, function (comments) {
                    this._itemDetails.setComments(comments);
                    this._sidebarCnt.showBusy(false);
                }));

                // Display formats are defined by the webmap
                this._itemsList.setItemFormat(this._mapData.getItemSummaryFormat());
                this._itemDetails.setItemFormat(this._mapData.getItemDetailFormat());
                this._itemDetails.setCommentFormat(this._mapData.getCommentDetailFormat());

                // Initial population of items list
                topic.publish("updateItemsList");


                //??? Cancellation handling: e.g., select two+ items from map or items list rapidly



                console.log("app is ready: " + JSON.stringify(statusList));
            }), lang.hitch(this, function (err) {
                this.reportError(err);
            }));
        },

        /**
         * Sets up UI.
         * @return {object} Deferred
         */
        _setupUI: function () {
            var deferred = new Deferred();
            setTimeout(lang.hitch(this, function () {

                // Set the theme
                if (new Color(this.config.color).toHsl().l > 60) {
                    this.config.theme = {
                        "background": this.config.color,
                        "foreground": "black",
                        "shading": "white"
                    };
                } else {
                    this.config.theme = {
                        "background": this.config.color,
                        "foreground": "white",
                        "shading": "black"
                    };
                }

                // Add the widgets
                this._sidebarHdr = new SidebarHeader({
                    "appConfig": this.config
                }).placeAt("sidebarHeading");
                this._sidebarHdr.startup();
                this._sidebarHdr.set("signInBtnOnClick", lang.hitch(this, function () {
                    topic.publish("socialConnectSelected");
                }));
                this._sidebarHdr.set("helpBtnOnClick", lang.hitch(this, function () {
                    topic.publish("helpSelected");
                }));

                this._socialDialog = new MockDialog({
                    "appConfig": this.config,
                    "label": "Social Media Sign-in"
                }).placeAt(document.body);
                this._socialDialog.startup();
                this._socialDialog.createMockClickSource("close", lang.hitch(this, function () {
                    this._socialDialog.hide();
                }));
                this._socialDialog.createMockClickSource("sign in", lang.hitch(this, function () {
                    topic.publish("signedIn");
                }));

                this._helpDialog = new MockDialog({
                    "appConfig": this.config,
                    "label": "Help"
                }).placeAt(document.body);
                this._helpDialog.startup();
                this._helpDialog.createMockClickSource("close", lang.hitch(this, function () {
                    this._helpDialog.hide();
                }));


                this._sidebarCnt = new SidebarContentController({
                    "appConfig": this.config
                }).placeAt("sidebarContent");
                this._sidebarCnt.startup();

                this._itemsList = new MockItemsList({
                    "appConfig": this.config,
                    "label": "Ideas List"
                }).placeAt("sidebarContent");
                this._itemsList.startup();
                this._itemsList.createMockClickSource("an idea", lang.hitch(this, function () {
                    topic.publish("itemSelected");
                }));
                this._sidebarCnt.addPanel("ideasList", this._itemsList);

                this._itemDetails = new MockItemDetails({
                    "appConfig": this.config,
                    "label": "Idea Details"
                }).placeAt("sidebarContent");
                this._itemDetails.startup();
                this._itemDetails.createMockClickSource("back", lang.hitch(this, function () {
                    topic.publish("showItemsList");
                }));
                this._sidebarCnt.addPanel("ideaDetails", this._itemDetails);



                deferred.resolve("ui");
            }));
            return deferred.promise;
        },

        /**
         * Creates a map based on the input item info or web map id.
         * @param {object|string} itemInfo Configuration object created by template.js or webmap id
         * @return {object} Deferred
         */
        _createWebMap: function (itemInfo) {
            var mapCreateDeferred, mapDataReadyDeferred;
            mapCreateDeferred = new Deferred();
            mapDataReadyDeferred = new Deferred();

            // Create and load the map
            arcgisUtils.createMap(itemInfo, "mapDiv", {
                mapOptions: {
                    // Optionally define additional map config here for example you can
                    // turn the slider off, display info windows, disable wraparound 180, slider position and more.
                },
                usePopupManager: true,
                editable: this.config.editable,
                bingMapsKey: this.config.bingKey
            }).then(lang.hitch(this, function (response) {
                // Once the map is created we get access to the response which provides important info
                // such as the map, operational layers, popup info and more. This object will also contain
                // any custom options you defined for the template. In this example that is the 'theme' property.
                // Here' we'll use it to update the application to match the specified color theme.
                this.map = response.map;

                // start up locate widget
                var geoLocate = new LocateButton({
                    map: this.map
                }, "LocateButton");
                geoLocate.startup();

                // make sure map is loaded
                if (this.map.loaded) {
                    mapCreateDeferred.resolve();
                } else {
                    on.once(this.map, "load", lang.hitch(this, function () {
                        mapCreateDeferred.resolve();
                    }));
                }
            }), function (err) {
                //this.reportError(err);
                mapCreateDeferred.reject("Unable to create map" + (err ? ": " + err : ""));
            });

            // Once the map and its first layer are loaded, get the layer's data
            mapCreateDeferred.then(lang.hitch(this, function () {
                // At this point, this.config has been supplemented with
                // the first operational layer's layerObject
                this._mapData = new LayerAndTableMgmt(this.config);
                this._mapData.load().then(function () {
                    mapDataReadyDeferred.resolve("map data");
                });
            }), function (err) {
                mapDataReadyDeferred.reject();
            });

            return mapDataReadyDeferred.promise;
        },

        /**
         * Hides the loading indicator and reveals the content.
         */
        _revealApp: function () {
            domClass.remove(document.body, "app-loading");
            fx.fadeIn({
                node: "contentDiv",
                duration: 1000,
                onEnd: function () {
                    domClass.remove("contentDiv", "transparent");
                }
            }).play();
        }
    });
});
