/*global define,console,mockCurrentItem:true */
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
    "application/lib/LayerAndTableMgmt",
    "application/widgets/DynamicForm/DynamicForm",
    "application/widgets/ItemList/ItemList",
    "application/widgets/Mock/MockDialog",
    "application/widgets/Mock/ItemDetails",
    "application/widgets/Mock/MockWidget",
    "application/widgets/PopupWindow/PopupWindow",
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
    LayerAndTableMgmt,
    DynamicForm,
    ItemList,
    MockDialog,
    ItemDetails,
    MockWidget,
    PopupWindow,
    SidebarContentController,
    SidebarHeader
) {
    return declare(null, {
        config: {},
        map: null,
        mapData: null,
        _linkToMapView: true,
        mockCurrentItem: null,  //???

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
                var itemSpecialFields = this._mapData.getItemSpecialFields(),
                    commentNameField = this._mapData.getCommentSpecialFields().name;

                //----- Merge map-loading info with UI items -----
                this._itemsList.setFields(itemSpecialFields);
                this._itemDetails.setFields(itemSpecialFields);
                this._itemAddComment.setFields(this._mapData.getCommentFields());


                //----- Catch published messages and wire them to their actions -----

                /**
                 * @param {object} item Item whose vote was updated
                 */
                topic.subscribe("addLike", lang.hitch(this, function (item) {
                    console.log(">addLike>", item);  //???
                    this._mapData.incrementVote(item);
                }));

                topic.subscribe("cancelForm", lang.hitch(this, function () {
                    console.log(">cancelForm>");  //???
                    topic.publish("showPanel", "itemDetails");
                }));

                /**
                 * @param {object} item Item that received a comment
                 */
                topic.subscribe("commentAdded", lang.hitch(this, function (item) {
                    console.log(">commentAdded>", item);  //???
                    topic.publish("updateComments", item);
                }));

                /**
                 * @param {string} err Error message for when an item's comment add failed
                 */
                topic.subscribe("commentAddFailed", lang.hitch(this, function (err) {
                    console.log(">commentAddFailed>", err);  //???
                    this._sidebarCnt.showBusy(false);
                    topic.publish("showError", err);
                }));

                topic.subscribe("detailsCancel", lang.hitch(this, function () {
                    console.log(">detailsCancel>");  //???
                    topic.publish("showPanel", "itemsList");
                }));

                /**
                 * @param {object} item Item for which a comment might be submitted
                 */
                topic.subscribe("getComment", lang.hitch(this, function (item) {
                    console.log(">getComment>", item);  //???
                    var userInfo = this._socialDialog.getSignedInUser();
                    this._itemAddComment.setItem(item);

                    // See if we can pre-set its value
                    if (userInfo && userInfo.name) {
                        this._itemAddComment.presetFieldValue(commentNameField, userInfo.name);
                    } else {
                        this._itemAddComment.presetFieldValue(commentNameField, null);
                    }

                    topic.publish("showPanel", "getComment");
                }));

                topic.subscribe("helpSelected", lang.hitch(this, function () {
                    console.log(">helpSelected>");  //???
                    this._helpDialogContainer.set("displayText", this.config.displayText);
                    this._helpDialogContainer.show();
                }));

                /**
                 * @param {object} item Item to find out more about
                 */
                topic.subscribe("itemSelected", lang.hitch(this, function (item) {
                    console.log(">itemSelected>", item);  //???
                    var itemExtent;
                    mockCurrentItem = item;  //???

                    this._itemDetails.setItem(item);
                    topic.publish("updateComments", item);
                    topic.publish("showPanel", "itemDetails");

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

                topic.subscribe("linkToMapViewSelected", lang.hitch(this, function () {
                    console.log(">linkToMapViewSelected>", !this._linkToMapView);  //???
                    this._linkToMapView = !this._linkToMapView;
                    //this._itemsList.setLinkToMapView(this._linkToMapView);
                    topic.publish("updateItems");
                }));

                /**
                 * @param {string} err Error message to display
                 */
                topic.subscribe("showError", lang.hitch(this, function (err) {
                    console.log(">showError>", err);  //???
                    this._helpDialogContainer.set("displayText", err);
                    this._helpDialogContainer.show();
                }));

                /**
                 * @param {string} name Name of sidebar content panel to switch to
                 */
                topic.subscribe("showPanel", lang.hitch(this, function (name) {
                    console.log(">showPanel>", name);  //???
                    this._sidebarCnt.showPanel(name);

                    if (name === "itemsList") {
                        topic.publish("updateItems");
                    }
                }));

                topic.subscribe("signinUpdate", lang.hitch(this, function () {
                    console.log(">signinUpdate>");  //???
                    this._sidebarHdr.updateSignin(this._socialDialog.getSignedInUser());
                }));

                topic.subscribe("socialSelected", lang.hitch(this, function () {
                    console.log(">socialSelected>");  //???
                    this._socialDialog.show();
                }));

                /**
                 * @param {object} item Item to receive a comment
                 * @param {object} comment Comment to add to item
                 */
                topic.subscribe("submitForm", lang.hitch(this, function (item, comment) {
                    console.log(">submitForm>", item, comment);  //???
                    this._sidebarCnt.showBusy(true);
                    this._mapData.addComment(item, comment);
                    topic.publish("showPanel", "itemDetails");
                }));

                /**
                 * @param {object} item Item whose comments list is to be refreshed
                 */
                topic.subscribe("updateComments", lang.hitch(this, function (item) {
                    console.log(">updateComments>", item);  //???
                    this._sidebarCnt.showBusy(true);
                    this._mapData.queryComments(item);
                }));

                /**
                 * @param {array} comments List of comments for the current item
                 */
                topic.subscribe("updatedCommentsList", lang.hitch(this, function (comments) {
                    console.log(">updatedCommentsList>", comments);  //???
                    this._itemDetails.setComments(comments);
                    this._sidebarCnt.showBusy(false);
                }));

                /**
                 * @param {array} items List of items matching update request
                 */
                topic.subscribe("updatedItemsList", lang.hitch(this, function (items) {
                    console.log(">updatedItemsList>", items);  //???
                    this._itemsList.setItems(items);
                    this._sidebarCnt.showBusy(false);
                }));

                topic.subscribe("updateItems", lang.hitch(this, function () {
                    console.log(">updateItems>");  //???
                    this._sidebarCnt.showBusy(true);
                    this._mapData.queryItems(this._linkToMapView ? this.map.extent : null);
                }));

                /**
                 * @param {object} item Item whose votes count is to be refreshed
                 */
                topic.subscribe("updateVotes", lang.hitch(this, function (item) {
                    console.log(">updateVotes>", item);  //???
                    //this._itemsList.updateVotes(item);
                }));

                /**
                 * @param {object} item Item whose votes count was changed
                 */
                topic.subscribe("voteUpdated", lang.hitch(this, function (item) {
                    console.log(">voteUpdated>", item);  //???
                    topic.publish("updateVotes", item);
                }));

                /**
                 * @param {string} err Error message for when an item's votes count change failed
                 */
                topic.subscribe("voteUpdateFailed", lang.hitch(this, function (err) {
                    console.log(">voteUpdateFailed>", err);  //???
                    topic.publish("showError", err);
                }));


                //----- Set up controller-published messages (other than -----
                //----- those that are forwards from subscriptions)      -----

                // Click on an item in the map
                on(this._mapData.getItemLayer(), "click", function (evt) {
                    if (evt.graphic) {
                        topic.publish("itemSelected", evt.graphic);
                    }
                });

                // Support option to reset items list whenever the map is resized
                on(this.map, "extent-change", lang.hitch(this, function (evt) {
                    if (this._linkToMapView) {
                        topic.publish("updateItems");
                    }
                }));

                // Start with items list
                topic.publish("showPanel", "itemsList");
                topic.publish("signinUpdate");


                //----- Done -----
                console.log("app is ready");
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

                //----- Add the widgets -----

                // Sidebar header
                this._sidebarHdr = new SidebarHeader({
                    "appConfig": this.config
                }).placeAt("sidebarHeading");
                this._sidebarHdr.startup();

                // Social media
                this._socialDialog = new MockDialog({
                    "appConfig": this.config,
                    "label": "Social Media Sign-in"
                }).placeAt(document.body);
                this._socialDialog.startup();
                this._socialDialog.createMockClickSource("close", lang.hitch(this, function () {
                    this._socialDialog.hide();
                }));
                this._socialDialog.createMockClickSource("sign in", lang.hitch(this, function () {
                    topic.publish("signinUpdate");
                }));
                this._socialDialog.createMockFunction("getSignedInUser", lang.hitch(this, function () {
                    // Description of signed-in user: "name" {string}, "canSignOut" {boolean};
                    // null indicates that no one is signed in
                    //return {"name": "Fred", "canSignOut": true};
                    //return {"name": "Ginger", "canSignOut": false};
                    return null;
                }));

                // Popup window for help, error messages, social media
                this._helpDialogContainer = new PopupWindow({
                    "appConfig": this.config,
                    "showClose": true
                }).placeAt(document.body);
                this._helpDialogContainer.startup();

                // Sidebar content controller
                this._sidebarCnt = new SidebarContentController({
                    "appConfig": this.config
                }).placeAt("sidebarContent");
                this._sidebarCnt.startup();

                // Items list
                this._itemsList = new ItemList({
                    "appConfig": this.config
                }).placeAt("sidebarContent");
                this._itemsList.startup();
                this._sidebarCnt.addPanel("itemsList", this._itemsList);

                // Item details
                this._itemDetails = new ItemDetails({
                    "appConfig": this.config,
                    "label": "Idea Details"
                }).placeAt("sidebarContent");
                this._itemDetails.startup();
                this._itemDetails.createMockClickSource("back", lang.hitch(this, function () {
                    mockCurrentItem = null;
                    topic.publish("detailsCancel");
                }));
                this._itemDetails.createMockClickSource("like", lang.hitch(this, function () {
                    topic.publish("addLike", mockCurrentItem);
                }));
                this._itemDetails.createMockClickSource("comment", lang.hitch(this, function () {
                    topic.publish("getComment", mockCurrentItem);
                }));
                this._sidebarCnt.addPanel("itemDetails", this._itemDetails);

                // Add comment
                this._itemAddComment = new DynamicForm({
                    "appConfig": this.config
                }).placeAt("sidebarContent");
                this._itemAddComment.startup();
                this._sidebarCnt.addPanel("getComment", this._itemAddComment);



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
                mapCreateDeferred.reject((err ? ": " + err : ""));
            });

            // Once the map and its first layer are loaded, get the layer's data
            mapCreateDeferred.then(lang.hitch(this, function () {
                // At this point, this.config has been supplemented with
                // the first operational layer's layerObject
                this._mapData = new LayerAndTableMgmt(this.config);
                this._mapData.load().then(function () {
                    mapDataReadyDeferred.resolve("map data");
                }, lang.hitch(this, function (err) {
                    mapDataReadyDeferred.reject(this.config.i18n.map.layerLoad + (err ? ": " + err : ""));
                }));
            }), lang.hitch(this, function (err) {
                mapDataReadyDeferred.reject(this.config.i18n.map.layerLoad + (err ? ": " + err : ""));
            }));

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
