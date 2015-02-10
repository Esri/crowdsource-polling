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
    "dojo/_base/lang",
    "esri/arcgis/utils",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/on",
    "dojo/parser",
    "dojo/_base/fx",
    "dojo/Deferred",
    "dojo/promise/first",
    "dojo/_base/Color",
    "application/widgets/SidebarHeader/SidebarHeader",
    "application/widgets/PopupWindow/PopupWindow",
    "application/widgets/TextDisplay/TextDisplay",
    "dijit/layout/LayoutContainer",
    "dijit/layout/ContentPane",
    "dojox/color/_base",
    "dojo/domReady!"
], function (
    declare,
    lang,
    arcgisUtils,
    dom,
    domClass,
    domGeom,
    style,
    on,
    parser,
    fx,
    Deferred,
    first,
    Color,
    SidebarHeader,
    PopupWindow,
    TextDisplay
) {
    return declare(null, {
        config: {},
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
                    node.innerHTML = this.config.i18n.map.error + ": " + error.message;
                } else {
                    node.innerHTML = "Unable to create map: " + error.message;
                }
            }
        },

        //========================================================================================================================//

        /**
         * Launches app.
         * @param {object|string} itemInfo Configuration object created by template.js or webmap id
         */
        _launch: function (itemInfo) {
            var setupUI, processMap, createMap;

            // Perform setups in parallel
            setupUI = this._setupUI();
            processMap = this._processMap();
            createMap = this._createWebMap(itemInfo);

            // Show the app when the first of the setups completes
            first([setupUI, processMap, createMap]).then(lang.hitch(this, function () {
                this._revealApp();
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
                var widget = new SidebarHeader(this.config);
                widget.placeAt("sidebarHeading");
                widget.startup();
                widget.set("signInBtnOnClick", function () {
                    console.log("Clicked sign-in button");
                });
                widget.set("helpBtnOnClick", function () {
                    var popupWidget, textDisplayWidget;
                    
                   // Create popup widget and place it
                    popupWidget = new PopupWindow({
                        i18n: this.i18n,
                        showClose: true
                    }).placeAt(document.body);

                    // Create helpContent widget and place it in genericPopupContainer
                    textDisplayWidget = new TextDisplay();
                    popupWidget.setContent(textDisplayWidget);
                    popupWidget.show();
                });
                deferred.resolve();
            }));
            return deferred.promise;
        },

        /**
         * Process the configuration's map information to extract layers and fields.
         * @return {object} Deferred
         */
        _processMap: function () {
            var deferred = new Deferred();
            setTimeout(lang.hitch(this, function () {
                deferred.resolve();
            }), 2000);
            return deferred.promise;
        },

        /**
         * Creates a map based on the input item info or web map id.
         * @param {object|string} itemInfo Configuration object created by template.js or webmap id
         * @return {object} Deferred
         */
        _createWebMap: function (itemInfo) {
            var deferred = new Deferred();

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
                // console.log(this.config);
                this.map = response.map;
                // make sure map is loaded
                if (this.map.loaded) {
                    deferred.resolve();
                } else {
                    on.once(this.map, "load", lang.hitch(this, function () {
                        deferred.resolve();
                    }));
                }
            }), lang.hitch(this, function (err) {
                this.reportError(err);
                deferred.reject();
            }));

            return deferred.promise;
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
