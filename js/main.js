/*global esri */
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
    "dojo/_base/array",
    "dojo/_base/Color",
    "dojo/_base/fx",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/html",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-geometry",
    "dojo/json",
    "dojo/on",
    "dojo/parser",
    "dojo/promise/all",
    "dojo/promise/first",
    "dojo/query",
    "dojo/topic",
    "dojox/color",
    "esri/arcgis/utils",
    "esri/config",
    "esri/dijit/HomeButton",
    "esri/dijit/LocateButton",
    "esri/graphic",
    "esri/lang",
    "esri/request",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/tasks/query",
    "esri/tasks/QueryTask",
    "esri/urlUtils",
    "esri/tasks/RelationshipQuery",
    "esri/layers/FeatureLayer",
    "dijit/registry",
    "application/lib/LayerAndTableMgmt",
    "application/lib/SearchDijitHelper",
    "application/widgets/ItemDetails/ItemDetailsController",
    "application/widgets/ItemList/ItemList",
    "application/widgets/PopupWindow/PopupWindow",
    "application/widgets/PopupWindow/SocialMediaSignin",
    "application/widgets/SidebarContentController/SidebarContentController",
    "application/widgets/SidebarHeader/SidebarHeader",
    "application/widgets/Help/Help",
    "application/utils/utils",
    "dijit/layout/LayoutContainer",
    "dijit/layout/ContentPane",
    "dojo/domReady!"
], function (
    declare,
    array,
    Color,
    fx,
    lang,
    Deferred,
    dom,
    domClass,
    html,
    domConstruct,
    domStyle,
    domGeom,
    JSON,
    on,
    parser,
    all,
    first,
    query,
    topic,
    dojoxColor,
    arcgisUtils,
    esriConfig,
    HomeButton,
    LocateButton,
    Graphic,
    esriLang,
    esriRequest,
    SimpleFillSymbol,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    Query,
    QueryTask,
    urlUtils,
    RelationshipQuery,
    FeatureLayer,
    registry,
    LayerAndTableMgmt,
    SearchDijitHelper,
    ItemDetails,
    ItemList,
    PopupWindow,
    SocialMediaSignin,
    SidebarContentController,
    SidebarHeader,
    Help,
    AppUtils
) {
    return declare(null, {
        config: {},
        map: null,
        _mapData: null,
        _linkToMapView: false,
        _currentlyCommenting: false,
        _hasCommentTable: false,
        _sortField: null,
        _votesField: null,
        _outlineFillColor: new Color([0, 255, 255, 0]),
        _fillHiliteColor: new Color([0, 255, 255, 0.1]),
        _lineHiliteColor: new Color("aqua"),
        _windowResizeTimer: null,
        _searchControls: {},
        _layersDefaultDefExpr: {},
        _layerAccessInfoObj: {},
        _urlDefExpr: {},
        _relatedDefExpr: {},
        _staticTimeDefExp: {},
        startup: function (config) {
            var promise, itemInfo, error, link;

            parser.parse();

            //  Dojo Mobile's click setting of 'true' breaks feature layer click generation
            // See https://bugs.dojotoolkit.org/ticket/15878
            window.document.dojoClick = false;

            if (this._isIE()) {
                setTimeout(lang.hitch(this, function () {
                    this._showWarningMessage(config);
                }), 500);
            }

            // config will contain application and user defined info for the template such as i18n strings,
            // the web map id and application id
            // any url parameters and any application specific configuration information.
            if (config) {
                this.config = config;

                // Remove access to Facebook and Google plus due to unsupportable changes in its API
                this.config.allowFacebook = false;
                this.config.allowGoogle = false;

                // Normalize string booleans
                this.config.ascendingSortOrder = this._toBoolean(this.config.ascendingSortOrder);
                this.config.showAllFeatures = this._toBoolean(config.showAllFeatures);
                this.config.showListViewFirst = this._toBoolean(config.showListViewFirst);

                //supply either the webmap id or, if available, the item info
                itemInfo = this.config.itemInfo || this.config.webmap;

                //If application is loaded in RTL mode, change styles of required nodes
                if (this.config.i18n.direction === "rtl") {
                    link = document.createElement("link");
                    link.rel = "stylesheet";
                    link.type = "text/css";
                    link.href = "./css/rtl.css";
                    document.getElementsByTagName("head")[0].appendChild(link);
                }

                promise = this._launch(itemInfo);
            }
            else {
                error = new Error("Main:: Config is not defined");
                promise = this.reportError(error);
            }

            return promise;
        },

        /**
         * Reports an error to the screen
         * @param {Error} error Object reporting error condition
         * @return {promise} Promise from a rejected Deferred
         */
        reportError: function (error) {
            // remove loading class from body and the busy cursor from the sidebar controller
            domClass.remove(document.body, "app-loading");

            // Get the text of the message
            if (error) {
                if (error.message) {
                    error = error.message;
                }
            }
            else {
                error = this.config.i18n.map.error;
            }

            // Do we have a UI yet?
            if (this._sidebarCnt) {
                this._sidebarCnt.showBusy(false);

                // Display the error to the side of the map
                domConstruct.create("div", {
                    className: "absoluteCover",
                    innerHTML: error
                }, "sidebarContent", "first");

            }
            // Otherwise, we need to use the backup middle-of-screen error display
            else {
                domStyle.set("contentDiv", "display", "none");
                domClass.add(document.body, "app-error");
                dom.byId("loading_message").innerHTML = error;
            }

            var def = new Deferred();
            def.reject(error);
            return def.promise;
        },

        //============================================================================================================//
        /**
         * Window resize handler
         **/
        _resize: function () {
            if (this._itemsList || this._itemsList.searchContainer) {
                domClass.add(this._itemsList.searchContainer, "hideItemListSearch");
            }
            if (this._windowResizeTimer) {
                clearTimeout(this._windowResizeTimer);
            }
            this._windowResizeTimer = setTimeout(lang.hitch(this, this._resizeSearchControl),
                500);
        },

        /**
         * Resize the search control in item list according to updated window size
         **/
        _resizeSearchControl: function () {
            var containerGeom, calculatedWidth, searchGroup, sidebarContent, searchContainerNodeElement,
                searchContainerPresentationNodeElements;
            if (!this._itemsList || !this._itemsList.searchContainer) {
                return;
            }
            //get search group to override max width overridden by some themes
            searchGroup = query(
                ".arcgisSearch .searchGroup", this._itemsList.searchContainer
            )[0];

            if (!searchContainerNodeElement) {
                searchContainerNodeElement = query(
                    ".arcgisSearch .searchGroup .searchInput", this._itemsList.searchContainer
                )[0];
            }
            sidebarContent = dom.byId("sidebarContent");
            //reset the width of search control to fit in available panel width
            if (sidebarContent && searchContainerNodeElement) {
                containerGeom = domGeom.position(sidebarContent);
                if (containerGeom && containerGeom.w) {
                    calculatedWidth = (containerGeom.w - 102);
                    searchContainerPresentationNodeElements = query(
                        ".arcgisSearch .hasMultipleSources .searchInput", this._itemsList.searchContainer
                    );
                    if (searchContainerPresentationNodeElements.length === 0) {
                        // If the search dijit doesn't contain class hasMultipleSources, its dropdown
                        // button is hidden, so we need to stretch the input field to compensate
                        calculatedWidth += 32;
                    }
                    if (calculatedWidth > 0) {
                        searchContainerNodeElement.style.setProperty("width",
                            calculatedWidth + "px", "important");
                        if (searchGroup) {
                            searchGroup.style.setProperty("max-width", "100%", "important");
                        }
                    }
                }
                domClass.remove(this._itemsList.searchContainer, "hideItemListSearch");
            }
        },


        /**
         * Launches app.
         * @param {object|string} itemInfo Configuration object created by template.js or webmap id
         * @return {promise} Promise from a the _createWebMap Deferred
         */
        _launch: function (itemInfo) {
            var setupUI, createMapPromise, urlObject, searchValue, customUrlParamUC, prop, searchLayer, searchField,
                _this = this;

            document.title = this.config.title || "";

            this.config.isIE8 = this._isIE8();

            // Perform setups in parallel
            setupUI = this._setupUI();
            createMapPromise = this._createWebMap(itemInfo);

            // Show the app when the first of the setups completes
            first([setupUI, createMapPromise]).then(lang.hitch(this, function () {
                this._revealApp();
            }));

            // Complete wiring-up when all of the setups complete
            all([setupUI, createMapPromise]).then(lang.hitch(this, function (statusList) {
                var configuredSortField, configuredVotesField, commentFields, contentContainer,
                    needToggleCleanup, needToggleCleanupForMobile, compareFunction, userCanEdit = true,
                    searchControl;

                //----- Merge map-loading info with UI items -----
                if (this.config.featureLayer && this.config.featureLayer.fields &&
                    this.config.featureLayer.fields.length > 0) {
                    array.forEach(this.config.featureLayer.fields, function (fieldSpec) {
                        if (fieldSpec.id === "sortField") {
                            configuredSortField = fieldSpec.fields[0];
                        }
                        else if (fieldSpec.id === "itemVotesField") {
                            configuredVotesField = fieldSpec.fields[0];
                        }
                    });

                    // Make sure that the configured votes field exists
                    array.forEach(this._mapData.getItemFields(), lang.hitch(this, function (field) {
                        if (configuredSortField === field.name) {
                            this._sortField = configuredSortField;
                        }
                        if (configuredVotesField === field.name &&
                            (field.type === "esriFieldTypeInteger" || field.type === "esriFieldTypeSmallInteger")) {
                            this._votesField = configuredVotesField;
                        }
                    }));
                }

                // Create search bar in issueList
                // Add search control with always expanded mode
                searchControl = SearchDijitHelper.createSearchDijit(
                    this.map, this.config.itemInfo.itemData.operationalLayers,
                    this.config.helperServices.geocode, this.config.itemInfo.itemData.applicationProperties,
                    this._itemsList.searchBar, true);

                // If the search dijit is enabled, connect the results of selecting a search result with
                // displaying the details about the item
                if (searchControl) {
                    //set the search control in _searchControls which will be used to sync text
                    this._searchControls.itemList = searchControl;
                    //subscribe the syncSearchText event
                    topic.subscribe("syncSearchText", lang.hitch(this, this._syncSearchText));
                    on.once(searchControl, "load", lang.hitch(this, function () {
                        this._connectSearchResult(this._searchControls.itemList);
                    }));
                    if (searchControl.loaded) {
                        searchControl.emit("load");
                        this._resize();
                    }
                    //reset the search component width window resize
                    on(window, "resize", lang.hitch(this, this._resize));
                }

                commentFields = this._mapData.getCommentFields();
                this._itemsList.setFields(this._votesField);
                this._itemDetails.setItemFields(this._votesField, commentFields);

                // Adjust icon visibilities based on user level; need to also check user access to voting
                // and comment layers;
                // Visibility function's signature:
                // itemDetails.setActionsVisibility(showVotes, addComments, showComments, showGallery);
                if (esriLang.isDefined(this.config.userPrivileges)) {
                    if (!this._mapData.getItemLayer().itemId || (this._mapData.getItemLayer().itemId &&
                        this._layerAccessInfoObj.hasOwnProperty(this._mapData.getItemLayer().itemId) &&
                        (this._layerAccessInfoObj[this._mapData.getItemLayer().itemId] === "public"))) {
                        userCanEdit = true;
                    } else if (array.indexOf(this.config.userPrivileges, "features:user:edit") === -1 &&
                        array.indexOf(this.config.userPrivileges, "features:user:fullEdit") === -1) {
                        userCanEdit = false;
                    }
                }
                this._itemDetails.setActionsVisibility(userCanEdit && this._votesField, userCanEdit && commentFields,
                    commentFields, this._mapData.getItemLayer().hasAttachments);

                //----- Catch published messages and wire them to their actions -----

                /**
                 * @param {object} item Item whose vote was updated
                 */
                topic.subscribe("addLike", lang.hitch(this, function (item) {
                    if (this._votesField) {
                        this._mapData.incrementVote(item, this._votesField);
                    }
                }));

                topic.subscribe("cancelForm", lang.hitch(this, function () {
                    this._itemDetails.destroyCommentForm();
                    this._currentlyCommenting = false;
                }));

                /**
                 * @param {object} item Item that received a comment
                 */
                topic.subscribe("commentAdded", lang.hitch(this, function (item) {
                    this._itemDetails.destroyCommentForm();
                    topic.publish("updateComments", item);
                }));

                /**
                 * @param {string} err Error message for when an item's comment add failed
                 */
                topic.subscribe("commentAddFailed", lang.hitch(this, function (err) {
                    this._sidebarCnt.showBusy(false);
                    topic.publish("showErrorPopup", err);
                }));

                topic.subscribe("detailsCancel", lang.hitch(this, function (forceToMap, layerId) {
                    if (this._currentlyCommenting) {
                        topic.publish("cancelForm");
                    }

                    if (forceToMap) {
                        this._sidebarHdr.setCurrentViewToListView(false);
                    }

                    if (this._sidebarHdr.currentViewIsListView) {
                        // In widescreen view or coming from items list in narrowscreen view, return to items list
                        topic.publish("showPanel", "itemsList");
                    }
                    else {
                        // Otherwise, we're coming from the map in narrowscreen view and will return to the map
                        topic.publish("showMapViewClicked");
                    }

                    //All the layer should be reverted only if user clicks on
                    //back button and not on show map view button
                    if (!forceToMap) {
                        var defExpression;
                        //Check for the object and restore the layer
                        //If layer has default expression that apply the same
                        //Or if layer has url definition expression then apply that to maintain the application state
                        if (Object.keys(this._layersDefaultDefExpr).length > 0 && this.config.showRelatedFeatures) {
                            for (var layerID in this._layersDefaultDefExpr) {
                                defExpression = this._layersDefaultDefExpr[layerID] ? this._layersDefaultDefExpr[layerID] : this._urlDefExpr[layerID];
                                //Check if layer is either polling layer or related polling layer
                                if (layerID === this._mapData.getItemLayer().id || this._isLayerRelatedToItemLayer(layerID)) {
                                    //Check if layer has some related definition expression
                                    //If yes, then replace the same with current definition expression
                                    if (this._relatedDefExpr[layerID]) {
                                        this.map._layers[layerID].setDefinitionExpression(defExpression);
                                    }
                                }
                            }
                        }
                        setTimeout(lang.hitch(this, function () {
                            //Update the item list to sync the map and list control
                            topic.publish("updateItems");
                        }), 1000);
                    }
                }));

                /**
                 * @param {object} item Item for which a comment might be submitted
                 */
                topic.subscribe("getComment", lang.hitch(this, function (item) {
                    var userInfo;

                    if (this._currentlyCommenting) {
                        topic.publish("cancelForm");
                    }
                    else {
                        userInfo = this._socialDialog.getSignedInUser();
                        this._itemDetails.showCommentForm(userInfo);
                        this._currentlyCommenting = true;
                    }
                }));

                topic.subscribe("helpSelected", lang.hitch(this, function () {
                    this._helpDialogContainer.set("displayTitle", "");
                    this._helpDialogContainer.set("displayText", this.config.displayText);
                    this._helpDialogContainer.show();
                }));
                this._sidebarHdr.updateHelp(true);
                this._sidebarHdr.updateFilter(this.config.showFilter);

                /**
                 * @param {object} item Item to find out more about
                 */
                topic.subscribe("itemSelected", lang.hitch(this, function (item) {
                    //Remove the non editable layer class from the details panel
                    //as the item layer feature is selected
                    this._getFeatureAndCreateHighlightGraphic(item, false).then(lang.hitch(this, function (updatedItem) {
                        item.attributes = updatedItem.attributes;
                        item.highlightGraphic = updatedItem.highlightGraphic;
                        domClass.remove(this._itemDetails.domNode, "nonEditableFeature");
                        this._itemsList.setSelection(item.attributes[item._layer.objectIdField]);

                        this._itemDetails.clearComments();
                        this._itemDetails.setItem(item);
                        if (this._votesField) {
                            this._mapData.refreshVoteCount(item, this._votesField).then(function (item) {
                                topic.publish("voteUpdated", item);
                            });
                        }

                        if (this._mapData.getItemLayer().hasAttachments) {
                            topic.publish("updateAttachments", item);
                        }
                        topic.publish("updateComments", item);
                        topic.publish("showPanel", "itemDetails");
                        topic.publish("highlightItem", item);

                        // If the screen is narrow, switch to the list view; if it isn't, switching to list view is
                        // a no-op because that's the normal state for wider windows
                        topic.publish("showListViewClicked");
                        //switch toggle option to map view as currently list view will be shown
                        this._sidebarHdr.setCurrentViewToListView(true);
                        //If the show related features flag is true,
                        //Fetch the related records of selected graphics
                        if (this.config.showRelatedFeatures) {
                            this._getRelatedFeatureForLayer(item);
                        }
                    }));
                }));

                topic.subscribe("highlightItem", lang.hitch(this, function (item, skipZoom) {
                    var itemExtent, mapGraphicsLayer, deferred = new Deferred();

                    // Is this item in our data layer?
                    if (item._layer.id === this._mapData.getItemLayer().id) {
                        this._currentItem = item;

                        if (!skipZoom) {
                            // Zoom to item if possible
                            if (item.geometry.getExtent) {
                                itemExtent = item.geometry.getExtent();
                            }

                            // Use setZoom as well; it is necessary to reset the layer's feature geometry precision
                            if (itemExtent) {
                                this.map.setExtent(itemExtent).then(lang.hitch(this, function () {
                                    var zoomLevel = this.map.getZoom();
                                    if (zoomLevel >= 0) {
                                        this.map.setZoom(--zoomLevel).then(lang.hitch(this, function () {
                                            deferred.resolve(true);
                                        }));
                                    }
                                    else {
                                        deferred.resolve(true);
                                    }
                                }), function () {
                                    deferred.resolve(true);
                                });
                            }
                            else {
                                this.map.centerAt(item.geometry);
                                deferred.resolve(true);
                            }
                        }
                        else {
                            deferred.resolve(true);
                        }

                        // Highlight the item *after* zoom is complete
                        deferred.then(lang.hitch(this, function () {
                            mapGraphicsLayer = this.map.graphics;
                            mapGraphicsLayer.clear();
                            //Add the highlight graphics for selected feature
                            //IF
                            //1. Show related feature flag is false (This is default behavior)
                            //2. If Show related flag is true and highlight feature flag is true
                            if (!this.config.showRelatedFeatures ||
                                (this.config.showRelatedFeatures && this.config.highlightSelectedFeature)) {
                                mapGraphicsLayer.add(item.highlightGraphic);
                            }
                        }));
                    }
                }));

                on(this.map.graphics, "click", lang.hitch(this, function (evt) {
                    evt.stopImmediatePropagation();
                    //If non editable layers feature is clicked, skip the further processing
                    if (evt.graphic && evt.graphic.isNonEditableFeature) {
                        return;
                    }
                    evt.graphic = this._currentItem;
                    this._mapData.getItemLayer().onClick(evt);
                }));

                /**
                 * @param {boolean} isSelected New state of setting
                 */
                topic.subscribe("linkToMapViewChanged", lang.hitch(this, function (isSelected) {
                    this._linkToMapView = isSelected;
                    topic.publish("updateItems");
                }));

                /**
                 * @param {string} err Error message to display
                 */
                topic.subscribe("showErrorPopup", lang.hitch(this, function (err) {
                    this._helpDialogContainer.set("displayTitle", "");
                    this._helpDialogContainer.set("displayText", err);
                    this._helpDialogContainer.show();
                }));

                /**
                 * @param {string} message Message to display
                 * @param {string?} title Title for help popup
                 */
                topic.subscribe("showMessagePopup", lang.hitch(this, function (message, title) {
                    this._helpDialogContainer.set("displayTitle", title || "");
                    this._helpDialogContainer.set("displayText", message);
                    this._helpDialogContainer.show();
                }));

                /**
                 * @param {string} name Name of sidebar content panel to switch to
                 */
                topic.subscribe("showPanel", lang.hitch(this, function (name) {
                    this._sidebarCnt.showPanel(name);

                    if (name === "itemsList") {
                        //resize the search control
                        this._resize();
                        this._itemsList.clearList();
                        topic.publish("updateItems");
                    }
                }));

                topic.subscribe("signinUpdate", lang.hitch(this, function () {
                    this._sidebarHdr.updateSignin(this._socialDialog.getSignedInUser());
                }));

                topic.subscribe("socialSelected", lang.hitch(this, function () {
                    var signedInUser = this._socialDialog.getSignedInUser();
                    if (!signedInUser) {
                        // Show the social media sign-in screen so that the user can sign in
                        this._socialDialog.show();
                    }
                    else {
                        // Simply sign out
                        this._socialDialog.signOut(signedInUser);
                    }
                }));

                /**
                 * @param {object} item Item to receive a comment
                 * @param {object} comment Comment to add to item
                 */
                topic.subscribe("submitForm", lang.hitch(this, function (item, comment) {
                    this._sidebarCnt.showBusy(true);
                    this._mapData.addComment(item, comment);
                    this._currentlyCommenting = false;
                }));

                /**
                 * @param {object} item Item whose attachments are to be refreshed
                 */
                topic.subscribe("updateAttachments", lang.hitch(this, function (item) {
                    this._sidebarCnt.showBusy(true);
                    this._mapData.queryAttachments(item);
                }));

                /**
                 * @param {object} item Item whose comments list is to be refreshed
                 */
                topic.subscribe("updateComments", lang.hitch(this, function (item) {
                    if (this._hasCommentTable) {
                        this._sidebarCnt.showBusy(true);
                        this._mapData.queryComments(item);
                    }
                }));

                /**
                 * @param {object} item Item owning attachments
                 * @param {array} attachments List of attachments for the current item
                 */
                topic.subscribe("updatedAttachments", lang.hitch(this, function (item, attachments) {
                    if (this._currentItem &&
                        this._currentItem.attributes[this._currentItem._layer.objectIdField] ===
                        item.attributes[item._layer.objectIdField]) {
                        this._itemDetails.setCurrentItemAttachments(attachments);
                    }
                    this._sidebarCnt.showBusy(false);
                }));

                /**
                 * @param {object} item Item owning comments
                 * @param {array} comments List of comments for the current item
                 */
                topic.subscribe("updatedCommentsList", lang.hitch(this, function (item, comments) {
                    if (this._currentItem &&
                        this._currentItem.attributes[this._currentItem._layer.objectIdField] ===
                        item.attributes[item._layer.objectIdField]) {
                        this._itemDetails.setComments(comments);
                    }
                    this._sidebarCnt.showBusy(false);
                }));

                /**
                 * @param {array} items List of items matching update request
                 */
                if (this._sortField) {
                    compareFunction = createCompareFunction(
                        this._sortField, this.config.ascendingSortOrder);
                }

                function createCompareFunction(compareAttributeName, ascendingOrder) {
                    /**
                     * Compares attribute compareAttributeName for two items (a, b) for the desired sort order.
                     * @param {object} itemA First item whose attributes property compareAttributeName
                     * is to be compared
                     * @param {object} itemB Second item whose attributes property compareAttributeName
                     * is to be compared
                     * @return {number} -1 if itemA.attributes[compareAttributeName] <
                     * itemB.attributes[compareAttributeName], 0 if they're equal, +1 if the first is > the
                     * second; inquality values are inverted if ascendingOrder is false; nulls/undefineds come
                     * before non-null values
                     */
                    return function (itemA, itemB) {
                        var sortOrder,
                            attrItemA = itemA.attributes[compareAttributeName],
                            attrItemB = itemB.attributes[compareAttributeName];

                        if (attrItemA === null || typeof attrItemA === "undefined") {
                            if (attrItemB === null || typeof attrItemB === "undefined") {
                                // null A == null B
                                sortOrder = 0;
                            }
                            else {
                                // null A < nonnull B
                                sortOrder = -1;
                            }

                        }
                        else if (attrItemB === null || typeof attrItemB === "undefined") {
                            // nonnull A > null B
                            sortOrder = 1;

                        }
                        else if (attrItemA == attrItemB) {
                            // nonnull A == nonnull B
                            sortOrder = 0;

                        }
                        else if (attrItemA < attrItemB) {
                            // nonnull A < nonnull B
                            sortOrder = -1;

                        }
                        else {
                            // nonnull A > nonnull B
                            sortOrder = 1;
                        }

                        return (ascendingOrder ? sortOrder : -sortOrder);
                    };
                }

                topic.subscribe("updatedItemsList", lang.hitch(this, function (items, isURL) {
                    this._itemsList.setItems(items, compareFunction);
                    this._sidebarCnt.showBusy(false);
                    //If value is passed through URL and only one feature is found
                    //select the feature and show the item details panel
                    if (isURL && items.length === 1) {
                        topic.publish("itemSelected", items[0]);
                    }
                }));

                topic.subscribe("updateItems", lang.hitch(this, function (isURL) {
                    this._sidebarCnt.showBusy(true);
                    this._mapData.queryItems(this._linkToMapView ? this.map.extent : null, isURL);
                }));

                /**
                 * @param {object} item Item whose votes count was changed
                 */
                topic.subscribe("voteUpdated", lang.hitch(this, function (item) {
                    this._itemDetails.updateItemVotes(item);
                }));

                /**
                 * @param {string} err Error message for when an item's votes count change failed
                 */
                topic.subscribe("voteUpdateFailed", lang.hitch(this, function (err) {
                    topic.publish("showErrorPopup", err);
                }));


                //----- Set up controller-published messages (other than -----
                //----- those that are forwards from subscriptions)      -----

                // Click on an item in the map
                on(this._mapData.getItemLayer(), "click", lang.hitch(this, function (evt) {
                    if (evt.graphic) {
                        this._featureSelectedFromMap(evt.graphic);
                    }
                }));

                // Support option to reset items list whenever the map is resized while the items
                // list is visible
                on(this.map, "extent-change", lang.hitch(this, function (evt) {
                    if (this._linkToMapView && this._sidebarCnt.getCurrentPanelName() === "itemsList") {
                        topic.publish("updateItems");
                    }
                }));

                // Start with items list
                topic.publish("showPanel", "itemsList");
                topic.publish("signinUpdate");

                // Show help as a splash screen if desired
                if (this.config.showDisplayTextAsSplashScreen) {
                    topic.publish("helpSelected");
                }

                // Handle the switch between list and map views for narrow screens
                contentContainer = registry.byId("contentDiv");
                needToggleCleanup = true;
                needToggleCleanupForMobile = true;
                topic.subscribe("showMapViewClicked", lang.hitch(this, function (err) {
                    // Reduce the sidebar as much as possible wihout breaking the Layout Container
                    // and show the map
                    domStyle.set("sidebarContent", "display", "none");
                    domStyle.set("filterContent", "display", "none");
                    domStyle.set("mapDiv", "display", "block");
                    contentContainer.resize();
                    needToggleCleanup = true;
                    needToggleCleanupForMobile = false;
                }));
                topic.subscribe("showListViewClicked", lang.hitch(this, function (err) {
                    // Hide the map and restore the sidebar to the display that it has for this
                    // browser width
                    domStyle.set("mapDiv", "display", "");
                    domStyle.set("sidebarContent", "display", "");
                    domStyle.set("sidebarContent", "width", "");
                    domStyle.set("filterContent", "display", "none");
                    contentContainer.resize();
                    //resize the search control
                    this._resize();
                    needToggleCleanup = true;
                    needToggleCleanupForMobile = false;
                }));

                topic.subscribe("filterSelected", lang.hitch(this, function (err) {
                    //Hide filter panel and map
                    //Show side bar content
                    if (domStyle.get("filterContent", "display") === "block") {
                        domStyle.set("filterContent", "display", "none");
                        domStyle.set("sidebarContent", "display", "block");
                        domStyle.set("mapDiv", "display", "");
                    } else {
                        domStyle.set("sidebarContent", "display", "none");
                        domStyle.set("filterContent", "display", "block");
                        domStyle.set("mapDiv", "display", "");
                    }
                    contentContainer.resize();
                    //resize the search control
                    this._resize();
                    needToggleCleanup = true;
                    needToggleCleanupForMobile = false;
                }));
                // Start with config option selected to show list or map view first
                if (window.innerWidth <= 640) {
                    this._switchToListOrMapViewForMobile();
                }
                on(window, "resize", lang.hitch(this, function (event) {
                    // If we've tinkered with the Layout Container for the narrow screen
                    // and now the screen is wider than the single-panel threshold, reset
                    // the Layout Container
                    if (needToggleCleanup && event.currentTarget.innerWidth > 640) {
                        domStyle.set("mapDiv", "display", "");
                        //If filter panel is shown, stop the further processing
                        if (domStyle.get("filterContent", "display") === "block") {
                            return;
                        } else {
                            //Hide the filter panel
                            domStyle.set("filterContent", "display", "none");
                        }
                        domStyle.set("sidebarContent", "display", "");
                        domStyle.set("sidebarContent", "width", "");
                        contentContainer.resize();
                        this._sidebarHdr.setCurrentViewToListView(true);
                        needToggleCleanup = false;
                        needToggleCleanupForMobile = true;
                    }
                    else if (event.currentTarget.innerWidth <= 640) {
                        if (needToggleCleanupForMobile) {
                            //Sets the map/list view toggle display in mobile view.
                            this._sidebarHdr.setCurrentViewToListView(this.config.showListViewFirst);
                            //If filter panel is shown, stop the further processing
                            if (domStyle.get("filterContent", "display") === "block") {
                                return;
                            }
                            this._switchToListOrMapViewForMobile();
                        }
                    }
                }));

                //----- Done -----
                console.log("app is ready");
                urlObject = urlUtils.urlToObject(document.location.href);
                urlObject.query = urlObject.query || {};
                urlObject.query = esriLang.stripTags(urlObject.query);
                // Do we have a custom URL search parameter?
                if ((this.config.customUrlLayer.id !== null && this.config.customUrlLayer.fields.length > 0 &&
                    this.config.customUrlParam !== null)) {
                    searchValue = null;
                    customUrlParamUC = this.config.customUrlParam.toUpperCase();
                    for (prop in urlObject.query) {
                        if (urlObject.query.hasOwnProperty(prop)) {
                            if (prop.toUpperCase() === customUrlParamUC) {
                                searchValue = urlObject.query[prop];
                            }
                        }
                    }

                    if (searchValue) {
                        // Attempt to go to an item specified as a URL parameter
                        searchLayer = this.map.getLayer(this.config.customUrlLayer.id);
                        if (searchLayer && this.config.customUrlLayer.fields &&
                            this.config.customUrlLayer.fields.length > 0) {
                            searchField = this.config.customUrlLayer.fields[0].fields[0];

                            require(["esri/tasks/query", "esri/tasks/QueryTask"], lang.hitch(this, function (Query, QueryTask) {
                                var query, queryTask;
                                queryTask = new QueryTask(searchLayer.url);
                                query = new Query();
                                query.where = searchField + " = '" + searchValue + "'";
                                query.returnGeometry = true;
                                query.outFields = ["*"];
                                query.outSpatialReference = _this.map.spatialReference;

                                queryTask.execute(query, lang.hitch(this, function (results) {
                                    if (results && results.features && results.features.length > 0) {
                                        var feature = results.features[0];
                                        feature._layer = searchLayer;
                                        feature._graphicsLayer = searchLayer;

                                        // If selected feature is of item layer show details panel
                                        if (this._mapData.getItemLayer().id === feature._layer.id) {
                                            // Select the item so that its details panel will be open
                                            topic.publish("itemSelected", feature);
                                        }
                                        else {
                                            // Do the app's highlighting
                                            topic.publish("highlightItem", feature, true);
                                        }
                                    }
                                }), function (error) {
                                    console.log(error);
                                });
                            }));
                        }
                    }
                }
                //Check if layer field value is passed through URL
                if (this.config.searchLayers && this.config.customUrlParam !== null &&
                    urlObject.query.hasOwnProperty(this.config.customUrlParam)) {
                    var searchLayer, layer, layerDefExpr, exprString = "";
                    //Parse the search layer string into JSON
                    searchLayer = JSON.parse(this.config.searchLayers);
                    //Loop through all the search layers
                    array.forEach(searchLayer, lang.hitch(this, function (layerDetails) {
                        //Fetch the layer to perform the further operations
                        layer = this.map.getLayer(layerDetails.id);
                        if (layer) {
                            //Get the layers default definition expression
                            layerDefExpr = layer.getDefinitionExpression();
                            //Create a dictionary which will have the
                            //details about the default and newly created definition expression
                            //this details will be needed to restore the layer to its original state
                            //Reset the expression string
                            exprString = "";
                            if (layerDetails.fields.length > 0) {
                                array.forEach(layerDetails.fields, lang.hitch(this, function (field, index) {
                                    if (layerDetails.fields.length - 1 === index) {
                                        exprString += field + " =" + "'" + urlObject.query[this.config.customUrlParam] + "'";
                                    } else {
                                        exprString += field + " = " + "'" + urlObject.query[this.config.customUrlParam] + "'" + " AND ";
                                    }
                                }));
                                //Once the expression string created apply the same to the layer as the
                                //definition expression
                                var nDefExpr = layerDefExpr ? "(" + layerDefExpr + ")" + " AND " + exprString : exprString;
                                console.log(nDefExpr);
                                this._urlDefExpr[layer.id] = exprString;
                                layer.setDefinitionExpression(nDefExpr);
                            }
                        }
                    }));
                    setTimeout(lang.hitch(this, function () {
                        //Update the item list to sync the map and list control
                        topic.publish("updateItems", true);
                    }), 1000);
                }
            }), lang.hitch(this, function (err) {
                this.reportError(err);
            }));

            return createMapPromise;
        },

        /**
        * Function checks if the layer is related to item layer
        */
        _isLayerRelatedToItemLayer: function (layerID) {
            var pollingLayer = this._mapData.getItemLayer(), relationships, relatedTableURL, isRelatedLayer = false;
            relationships = pollingLayer.relationships ? pollingLayer.relationships : [];
            //Loop through all the relationships and check for the valid related feature layer
            array.some(relationships, lang.hitch(this, function (relLayer) {
                relatedTableURL = pollingLayer.url.substr(0, pollingLayer.url.lastIndexOf('/') + 1) +
                    relLayer.relatedTableId;
                array.some(this.config.itemInfo.itemData.operationalLayers, lang.hitch(this, function (currentLayer) {
                    if (relatedTableURL) {
                        //Url should match anf layer should be a feature layer and not the table
                        if (currentLayer.url === relatedTableURL && currentLayer.layerObject.geometryType) {
                            isRelatedLayer = true;
                            return true;
                        }
                    }
                }));
                if (isRelatedLayer) {
                    return true;
                }
            }));
            return isRelatedLayer;
        },

        /**
         * Once feature is clicked on map, this function will check if it is a cluster or not.
         * If it is a cluster it will display list of features in popup and allow user to select one from the list.
         * If it is not a cluster then the information of that features is shown directly in details panel.
         */
        _featureSelectedFromMap: function (item) {
            //if selected item is cluster process it else directly select the item
            if (item.getChildGraphics && item.getChildGraphics().length > 0) {
                var popupMsgDiv = domConstruct.create("div", {
                    "class": "itemList"
                });
                var childGraphics = item.getChildGraphics();
                array.forEach(childGraphics, lang.hitch(this, function (graphic, index) {
                    //get cluster title
                    var title = this._itemDetails.getItemTitle(graphic) || "&nbsp;";
                    //create item summary div
                    var itemSummaryDiv = domConstruct.create("div", {
                        "class": "itemSummary themeItemList",
                        "style": {
                            "padding": "6px"
                        }
                    }, popupMsgDiv);
                    domStyle.set(itemSummaryDiv, "border-bottom-color", this.config.theme.body.text);
                    //handle click event of each item
                    on(itemSummaryDiv, "click", lang.hitch(this, function () {
                        topic.publish("itemSelected", childGraphics[index]);
                        this._helpDialogContainer.closeBtn.click();
                    }));
                    //add item title in summary div
                    domConstruct.create("div", {
                        "class": "itemTitle",
                        "style": {
                            "line-height": "20px",
                            "width": "100%"
                        },
                        "title": title,
                        "innerHTML": title
                    }, itemSummaryDiv);
                }));
                //show cluster features list in popup window
                this._helpDialogContainer.set("displayTitle", item.getTitle());
                this._helpDialogContainer.set("displayText", "<div class='clusterList'></div>");
                this._helpDialogContainer.show();
                //after showing popup window add list in it
                setTimeout(lang.hitch(this, function () {
                    var element = query(".clusterList", this._helpDialogContainer.domNode)[0];
                    domConstruct.place(popupMsgDiv, element);
                }), 150);
            }
            else {
                topic.publish("itemSelected", item);
            }
        },

        /**
         * checks configured value for map or list view to load first and displays view accordigly on mobile view
         */
        _switchToListOrMapViewForMobile: function () {
            //If configured option is show List view first in mobile view
            if (this.config.showListViewFirst) {
                topic.publish("showListViewClicked");
            }
            //else if configured option is show map view first in mobile view
            else {
                topic.publish("showMapViewClicked");
            }
        },

        /**
         * Sets up UI.
         * @return {object} Deferred
         */
        _setupUI: function () {
            var deferred = new Deferred(),
                popupContainer,
                styleString = "";
            setTimeout(lang.hitch(this, function () {
                var contrastToTextColor;

                if (!this.config.titleIcon) {
                    // If the app doesn't have a header icon configured, fall back to default theme
                    this.config.titleIcon = this.config.defaultTheme.titleIcon;
                }

                if (this.config.color) {
                    // If the app has color(s) configured, we'll use it/them; missing colors use older app defaults
                    contrastToTextColor = this._getContrastingWhiteOrBlack(this.config.color, 40);
                    this.config.theme = {
                        "header": {
                            "text": this.config.color,
                            "background": this.config.headerBackgroundColor || "white"
                        },
                        "body": {
                            "text": this.config.bodyTextColor || "black",
                            "background": this.config.bodyBackgroundColor || "white"
                        },
                        "button": {
                            "text": this.config.buttonTextColor || this.config.color,
                            "background": this.config.buttonBackgroundColor || "white"
                        }
                    };
                }
                else {
                    // Otherwise, default to defaults.js values
                    this.config.theme = {
                        "header": {
                            "text": this.config.defaultTheme.color,
                            "background": this.config.defaultTheme.headerBackgroundColor
                        },
                        "body": {
                            "text": this.config.defaultTheme.bodyTextColor,
                            "background": this.config.defaultTheme.bodyBackgroundColor
                        },
                        "button": {
                            "text": this.config.defaultTheme.buttonTextColor,
                            "background": this.config.defaultTheme.buttonBackgroundColor
                        }
                    };
                }

                this.config.theme.accents = {
                    "headerAlt": this._adjustLuminosity(this.config.theme.header.text, 40, 10),
                    "bodyBkgdAlt": this._adjustLuminosity(this.config.theme.body.background, 50, 6),
                    "bodyTextAlt": this._adjustLuminosity(this.config.theme.body.text, 50, 21)
                };

                // Set the theme CSS
                styleString += ".themeHeader{color:" + this.config.theme.header.text +
                    ";background-color:" + this.config.theme.header.background + "}";
                styleString += ".themeHeaderHover:hover{color:" + this.config.theme.header.background +
                    ";background-color:" + this.config.theme.header.text + "}";
                styleString += ".themeHeaderInverted{color:" + this.config.theme.header.background +
                    ";background-color:" + this.config.theme.header.text + "}";
                styleString += ".themeHeaderInvertedHover:hover{color:" + this.config.theme.header.text +
                    ";background-color:" + this.config.theme.header.background + "}";
                styleString += ".themeBackButtonOverlay{background-color:" + this.config.theme.accents.headerAlt + "}";
                styleString += ".themeHeaderAlt{color:" + this.config.theme.accents.headerAlt + "}";
                /*styleString += ".themeBackButtonOverlay{background-color:" + this.config.theme.accents.headerAlt +
                    ";opacity:0.35}";
                styleString += ".themeHeaderAlt{color:" + this.config.theme.accents.headerAlt + ";opacity:0.35}";*/

                styleString += ".themeBody{color:" + this.config.theme.body.text +
                    ";background-color:" + this.config.theme.body.background + "}";
                styleString += ".themeItemList{color:" + this.config.theme.body.text +
                    ";background-color:" + this.config.theme.accents.bodyBkgdAlt + "}";
                styleString += ".themeItemList:hover{color:" + this.config.theme.body.text +
                    ";background-color:" + this.config.theme.body.background + "}";
                styleString += ".themeItemListSelected{color:" + this.config.theme.body.text +
                    ";background-color:" + this.config.theme.body.background + "}";
                styleString += ".themeItemListVotes{color:" + this.config.theme.accents.bodyTextAlt + "}";

                styleString += ".themeComments{color:" + this.config.theme.accents.bodyTextAlt +
                    ";background-color:" + this.config.theme.accents.bodyBkgdAlt + "}";
                styleString += ".esriViewPopup .hzLine{border-top-color:" + this.config.theme.body.text + "}";
                styleString += ".esriViewPopup .mainSection .attrTable td.attrName{color:" +
                    this.config.theme.body.text + "}";

                styleString += ".themeButton{color:" + this.config.theme.button.text +
                    ";background-color:" + this.config.theme.button.background + "}";
                styleString += ".themeButtonHover:hover{color:" + this.config.theme.button.background +
                    ";background-color:" + this.config.theme.button.text + "}";
                styleString += ".themeButtonInverted{color:" + this.config.theme.button.background +
                    ";background-color:" + this.config.theme.button.text + "}";
                styleString += ".themeButtonInvertedHover:hover{color:" + this.config.theme.button.text +
                    ";background-color:" + this.config.theme.button.background + "}";

                this._injectCSS(styleString);

                // Apply the theme to the border lines
                domStyle.set("sidebarHeading", "border-bottom-color", this.config.theme.header.text);
                domStyle.set("sidebarContent", "border-left-color", this.config.theme.header.text);
                domStyle.set("filterContent", "border-left-color", this.config.theme.header.text);


                //----- Add the widgets -----

                // Social media
                this._socialDialog = new SocialMediaSignin({
                    "appConfig": this.config,
                    "showClose": true,
                    "maxima": {
                        "width": 350,
                        "height": 300
                    }
                }).placeAt(document.body);

                // Sidebar header
                this._sidebarHdr = new SidebarHeader({
                    "appConfig": this.config,
                    "showSignin": this._socialDialog.isAvailable() && this.config.commentNameField &&
                        (this.config.commentNameField.trim().length > 0),
                    "showHelp": this.config.displayText,
                    "urlDefExpr": this._urlDefExpr,
                    "staticTimeDefExp": this._staticTimeDefExp
                }).placeAt("sidebarHeading");
                this._sidebarHdr.onDefinitionExpressionUpdated = lang.hitch(this, function (updatedDefExprObj,
                    isAppliedOnItemLayer) {
                    this.isAppliedOnPollingLayer = isAppliedOnItemLayer;
                    for (var layerID in updatedDefExprObj) {
                        if (this._layersDefaultDefExpr && this._layersDefaultDefExpr.hasOwnProperty(layerID)) {
                            this._layersDefaultDefExpr[layerID] = updatedDefExprObj[layerID];
                        }
                    }
                    setTimeout(lang.hitch(this, function () {
                        //Update the item list to sync the map and list control
                        topic.publish("updateItems", false);
                    }), 1000);
                });
                popupContainer = domConstruct.create("div", {}, document.body);
                // Popup window for help, error messages, social media
                this._helpDialogContainer = new PopupWindow({
                    "appConfig": this.config,
                    "showClose": true,
                    "maxima": {
                        "width": 350,
                        "height": 300
                    }
                }).placeAt(popupContainer);

                // Sidebar content controller
                this._sidebarCnt = new SidebarContentController({
                    "appConfig": this.config
                }).placeAt("sidebarContent");

                // Items list
                this._itemsList = new ItemList({
                    "appConfig": this.config,
                    "linkToMapView": this._linkToMapView
                }).placeAt("sidebarContent");
                this._sidebarCnt.addPanel("itemsList", this._itemsList);

                //Listen for item list load event
                on(this._itemsList, "itemListLoaded", lang.hitch(this, function () {
                    //Check if comment form exist and it is open
                    //If the form is open do not update the item details panel
                    var isCommentFormOpen = false;
                    if (this._hasCommentTable) {
                        isCommentFormOpen = domClass.contains(this._itemDetails.commentButton,
                            "themeButtonInverted");
                    }
                    var selectedFeature;
                    selectedFeature = query(".themeItemListSelected", this._itemsList.domNode);
                    //Update the details panel only if user is on itemDetails screen
                    if (this._mapData.canUpdateFeatureData &&
                        this._sidebarCnt.getCurrentPanelName() === "itemDetails" && !isCommentFormOpen) {
                        if (selectedFeature && selectedFeature[0]) {
                            selectedFeature[0].click();
                        }
                        this._mapData.canUpdateFeatureData = false;
                    }
                    //If selected feature is not found, clear the graphics layer
                    //Also, since the selected feature is removed from the map, clear the related filter
                    //from related feature layers
                    if (selectedFeature && selectedFeature.length === 0) {
                        this.map.graphics.clear();
                        //Hack to clear the feature from the map once the feature is filtered from the custom filter
                        //Since we are not doing anything with the layer's selected feature in this application
                        //This logic will not impact the parts of functionality 
                        this.map._layers[this._mapData.getItemLayer().id].selectFeatures([]);
                        if (Object.keys(this._layersDefaultDefExpr).length > 0 && this.config.showRelatedFeatures) {
                            for (var layerID in this._layersDefaultDefExpr) {
                                defExpression = this._layersDefaultDefExpr[layerID] ? this._layersDefaultDefExpr[layerID] :
                                    this._urlDefExpr[layerID];
                                //Check if layer is either polling layer or related polling layer
                                if (layerID === this._mapData.getItemLayer().id || this._isLayerRelatedToItemLayer(layerID)) {
                                    //Check if layer has some related definition expression
                                    //If yes, then replace the same with current definition expression
                                    if (this._relatedDefExpr[layerID]) {
                                        this.map._layers[layerID].setDefinitionExpression(defExpression);
                                    }
                                }
                            }
                        }
                    }
                }));

                // Item details
                this._itemDetails = new ItemDetails({
                    "appConfig": this.config
                }).placeAt("sidebarContent");
                this._itemDetails.hide();
                this._sidebarCnt.addPanel("itemDetails", this._itemDetails);


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
                usePopupManager: false, // disable searching thru all layers for infoTemplates
                //ignorePopups: true,
                layerMixins: this.config.layerMixins || [],
                editable: this.config.editable,
                bingMapsKey: this.config.bingKey
            }).then(lang.hitch(this, function (response) {
                var homeButton, geoLocate;

                // Once the map is created we get access to the response which provides important info
                // such as the map, operational layers, popup info and more. This object will also contain
                // any custom options you defined for the template. In this example that is the 'theme' property.
                // Here we'll use it to update the application to match the specified color theme.
                this.map = response.map;

                if (this._sidebarHdr) {
                    this._sidebarHdr.map = this.map;
                }
                // Start up home widget
                homeButton = new HomeButton({
                    map: this.map,
                    theme: "HomeButtonLight"
                }, "HomeButton");
                domConstruct.place(homeButton.domNode,
                    query(".esriSimpleSliderIncrementButton", "mapDiv_zoom_slider")[0], "after");
                homeButton.startup();

                // Start up locate widget
                geoLocate = new LocateButton({
                    map: this.map,
                    theme: "LocateButtonLight"
                }, "LocateButton");
                geoLocate.startup();

                //Disable default symbol highlighting of infowindow
                this.map.infoWindow.set("highlight", false);

                // Keep info window invisible when one clicks upon a graphic
                on(this.map, "click", lang.hitch(this, function (evt) {
                    this.map.infoWindow.hide();
                    //Check if clicked feature does not belong to item layer
                    //If yes, show the details panel for non editable layers feature
                    if (evt.graphic) {
                        if (evt.graphic._layer.id !== this._mapData.getItemLayer().id) {
                            evt.graphic.isNonEditableFeature = true;
                            domClass.add(this._itemDetails.domNode, "nonEditableFeature");
                            this._itemDetails.setItem(evt.graphic);
                            topic.publish("showPanel", "itemDetails");
                            var mapGraphicsLayer = this.map.graphics;
                            mapGraphicsLayer.clear();
                            this._getFeatureAndCreateHighlightGraphic(evt.graphic, true).then(lang.hitch(this, function (item) {
                                evt.graphic.attributes = item.attributes;
                                mapGraphicsLayer.add(item.highlightGraphic);
                                //Zoom and set the extent of the feature as per the geometry type
                                if (evt.graphic.geometry.type === "point") {
                                    this.map.centerAt(evt.graphic.geometry);
                                }
                                else {
                                    this.map.setExtent(evt.graphic.geometry.getExtent(), true);
                                }
                                //If non-editable layer feature is selected
                                //Close the filter content and show the item details panel
                                if (dom.byId("filterContent")) {
                                    topic.publish("showListViewClicked");
                                }
                            }));
                        }
                        else {
                            //If item layer feature is selected then remove the non editable class
                            domClass.remove(this._itemDetails.domNode, "nonEditableFeature");
                        }
                    }
                }));

                // make sure map is loaded
                if (this.map.loaded) {
                    mapCreateDeferred.resolve();
                }
                else {
                    on.once(this.map, "load", lang.hitch(this, function () {
                        mapCreateDeferred.resolve();
                    }));
                }
            }), function (err) {
                mapCreateDeferred.reject(err || this.config.i18n.map.error);
            });

            // Once the map and its first layer are loaded, get the layer's data
            mapCreateDeferred.then(lang.hitch(this, function () {
                //For issue - Apply FIlters on Load is OFF, featurelist is honouring filters on load
                array.forEach(this.config.itemInfo.itemData.operationalLayers, lang.hitch(this,
                    function (layer) {
                        //Consider only feature layers while dealing with the definition expression
                        if (layer.layerType === "ArcGISFeatureLayer") {
                            //Store the static filters for time aware layer
                            if (layer.layerObject.timeInfo && !layer.definitionEditor) {
                                this._staticTimeDefExp[layer.id] = layer.layerObject.getDefinitionExpression();
                            }
                            //If enable all filter flag is set to false
                            //Remove all the filter on application load
                            if (!this.config.enableAllFilters && this.config.showFilter) {
                                layer.layerObject.setDefinitionExpression("");
                            }
                            this._layersDefaultDefExpr[layer.id] = layer.layerObject.getDefinitionExpression();
                        }
                    }));
                // At this point, this.config has been supplemented with
                // the first operational layer's layerObject
                this._mapData = new LayerAndTableMgmt(this.config);
                this._mapData.load().then(lang.hitch(this, function (hasCommentTable) {
                    var searchControl;
                    if (this._sidebarHdr) {
                        this._sidebarHdr.itemLayer = this._mapData.getItemLayer();
                    }
                    this._hasCommentTable = hasCommentTable;
                    this.config.acceptAttachments = hasCommentTable && this._mapData.getCommentTable().hasAttachments;
                    if (this._mapData.getItemLayer().itemId) {
                        this._getLayerSharingProperty(this._mapData.getItemLayer().itemId, mapDataReadyDeferred);
                    } else {
                        mapDataReadyDeferred.resolve("map data");
                    }
                    // Add search control
                    searchControl = SearchDijitHelper.createSearchDijit(
                        this.map, this.config.itemInfo.itemData.operationalLayers,
                        this.config.helperServices.geocode, this.config.itemInfo.itemData.applicationProperties,
                        "SearchButton", this.config.searchAlwaysExpanded);

                    // If the search dijit is enabled, connect the results of selecting a search result with
                    // displaying the details about the item
                    if (searchControl) {
                        this._searchControls.map = searchControl;
                        on.once(searchControl, "load", lang.hitch(this, function () {
                            this._connectSearchResult(this._searchControls.map);
                        }));
                        if (searchControl.loaded) {
                            searchControl.emit("load");
                        }

                    }
                    // Otherwise, shift zoom, home, and locate buttons up to fill the gap where the search would've been
                    else {
                        domStyle.set("mapDiv_zoom_slider", "top", "16px");
                        domStyle.set("LocateButton", "top", "131px");
                    }

                }), lang.hitch(this, function (err) {
                    mapDataReadyDeferred.reject(err || this.config.i18n.map.layerLoad);
                }));
            }), lang.hitch(this, function (err) {
                mapDataReadyDeferred.reject(err || this.config.i18n.map.layerLoad);
            }));

            return mapDataReadyDeferred.promise;
        },

        /**
         * Converts the search dijit result-selection event to the app's publish-subscribe system.
         * <p>Expects search dijit to be provided via "this".</p>
         */
        _connectSearchResult: function (searchControl) {
            var isItemListSearchCnt = false;
            //Set if search control is an itemList; otherwise it's a map
            if (this._searchControls.itemList && searchControl.id === this._searchControls.itemList.id) {
                isItemListSearchCnt = true;
            }
            on(searchControl, "select-result", lang.hitch(this, function (selectResult) {
                var feature, navigateToMapView = true;
                // Make sure that we have a feature from a feature layer,
                // then supplement the selection with the layer if it doesn't have one
                if (selectResult && selectResult.source.featureLayer &&
                    selectResult.result && selectResult.result.feature) {
                    feature = selectResult.result.feature;
                    if (!feature._layer) {
                        feature._layer = selectResult.source.featureLayer;
                    }
                    // If selected feature is of item layer show details panel
                    if (this._mapData.getItemLayer().id === feature._layer.id) {
                        // Select the item so that its details panel will be open
                        topic.publish("itemSelected", feature);
                        navigateToMapView = false;
                    }
                    else {
                        // Do the app's highlighting
                        topic.publish("highlightItem", feature, true);
                    }
                }
                //If search control is of item list &
                //result is not from feature layer navigate user to map view
                if (isItemListSearchCnt && navigateToMapView) {
                    topic.publish("toggleMenu");
                }
                //If valid select result, sync text of both the search controls
                if (selectResult) {
                    topic.publish("syncSearchText", isItemListSearchCnt);
                }
            }));
        },

        /**
         * Syncs the text between two search control on map and itemlist.
         */
        _syncSearchText: function (isItemListSearchCnt) {
            if (isItemListSearchCnt) {
                this._searchControls.map.set("value", this._searchControls.itemList.get("value"));
            }
            else {
                this._searchControls.itemList.set("value", this._searchControls.map.get("value"));
            }
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
        },

        /**
         * Creates a graphic that can be used for highlighting.
         * Fetch the updated feature that wil be used to show the feature details
         * @param {object} item Graphic to be used to create highlight graphic
         */
        _getFeatureAndCreateHighlightGraphic: function (item, isNonEditableFeature) {
            var deferred = new Deferred(),
                highlightGraphic = null,
                outlineSquareSize = 30,
                now, itemLayer, itemQuery, queryTask;
            // Get a higher-resolution version of the item's graphics
            now = Date.now();
            queryTask = new QueryTask(item._layer.url);
            itemLayer = item.getLayer();
            itemQuery = new Query();
            itemQuery.objectIds = [item.attributes[itemLayer.objectIdField]];
            itemQuery.returnGeometry = true;
            itemQuery.outSpatialReference = this.map.spatialReference;
            itemQuery.outFields = ["*"];
            itemQuery.where = now + "=" + now; // Needed to break JSAPI cache
            queryTask.execute(itemQuery, lang.hitch(this, function (results) {
                if (results && results.features && results.features.length > 0) {
                    item.attributes = results.features[0].attributes;
                    item.geometry = results.features[0].geometry;
                    // Create a highlight marker for a point
                    if (item.geometry.type === "point") {
                        // JSAPI does not want NaN coordinates
                        if (!item.geometry.x || !item.geometry.y || isNaN(item.geometry.x) || isNaN(item.geometry.y)) {
                            deferred.reject();
                            return;
                        }

                        // Try to get the item's layer's symbol
                        highlightGraphic = this._mapData.getItemLayer()._getSymbol(item);
                        if (highlightGraphic && !isNaN(highlightGraphic.width) && !isNaN(highlightGraphic.height)) {
                            outlineSquareSize = 1 + Math.max(highlightGraphic.width, highlightGraphic.height);
                        }

                        // Create an outline square using the configured line highlight color
                        highlightGraphic = new Graphic(item.geometry,
                            new SimpleMarkerSymbol(
                                SimpleMarkerSymbol.STYLE_SQUARE,
                                outlineSquareSize,
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                    this._lineHiliteColor, 2),
                                this._outlineFillColor
                            ),
                            item.attributes, item.infoTemplate);
                        //Add boolean flag in the highlight graphic to identify the non-editable layer feature
                        highlightGraphic.isNonEditableFeature = isNonEditableFeature;
                        item.highlightGraphic = highlightGraphic;
                        //deferred.resolve(highlightGraphic, itemDetail);
                    }
                    else if (item.geometry.type === "polyline") {
                        // Create a line symbol using the configured line highlight color
                        highlightGraphic = new Graphic(item.geometry,
                            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                this._lineHiliteColor, 3),
                            item.attributes, item.infoTemplate);
                        item.highlightGraphic = highlightGraphic;
                    }
                    else if (item.geometry.type) {
                        // Create a polygon symbol using the configured line & fill highlight colors
                        highlightGraphic = new esri.Graphic(item.geometry,
                            new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                                    this._lineHiliteColor, 3), this._fillHiliteColor),
                            item.attributes, item.infoTemplate);
                        item.highlightGraphic = highlightGraphic;
                    }
                    //Add boolean flag in the highlight graphic to identify the non-editable layer feature
                    item.isNonEditableFeature = isNonEditableFeature;
                    deferred.resolve(item);
                }
            }), function (error) {
                deferred.reject(error);
            });

            return deferred;
        },

        /**
         * Creates a calculated color based upon another color.
         * @param {string|array|object} baseColor Color to use as a base for the calculated color
         * @param {number} luminosityThreshold Luminosity threshold: if base color's luminosity is below this value,
         * the luminiosity adjustment is added to the base luminosity; otherwise, the luminosity adjustment is
         * subtracted
         * @param {number} luminosityAdjustment Amount by which luminosity of the base color is adjusted to create the
         * calculated color
         * @return {string} Hex form of calculated color
         */
        _adjustLuminosity: function (baseColor, luminosityThreshold, luminosityAdjustment) {
            var baseColorAsHSL, calculatedColor;

            baseColorAsHSL = (new Color(baseColor)).toHsl();
            if (baseColorAsHSL.l < luminosityThreshold) {
                calculatedColor = dojoxColor.fromHsl(baseColorAsHSL.h,
                    baseColorAsHSL.s, baseColorAsHSL.l + luminosityAdjustment);
            }
            else {
                calculatedColor = dojoxColor.fromHsl(baseColorAsHSL.h,
                    baseColorAsHSL.s, baseColorAsHSL.l - luminosityAdjustment);
            }

            return calculatedColor.toHex();
        },

        /**
         * Selects a contrasting black or white color based upon another color.
         * @param {string|array|object} baseColor Color to use as a base for the color selection
         * @param {number} luminosityThreshold Luminosity threshold: if base color's luminosity is below this value,
         * white is returned; otherwise, black is returned
         * @return {string} "#fff" or "#000"
         */
        _getContrastingWhiteOrBlack: function (baseColor, luminosityThreshold) {
            var baseColorAsHSL;

            baseColorAsHSL = (new Color(baseColor)).toHsl();
            if (baseColorAsHSL.l < luminosityThreshold) {
                return "#fff";
            }
            else {
                return "#000";
            }
        },

        /**
         * Normalizes a boolean value to true or false.
         * @param {boolean|string} boolValue A true or false
         *        value that is returned directly or a string
         *        "true" or "false" (case-insensitive) that
         *        is checked and returned; if neither a
         *        a boolean or a usable string, falls back to
         *        defaultValue
         * @param {boolean} [defaultValue] A true or false
         *        that is returned if boolValue can't be
         *        used; if not defined, true is returned
         * @return {boolean} Normalized boolean or defaultValue
         */
        _toBoolean: function (boolValue, defaultValue) {
            var lowercaseValue;

            // Shortcut true|false
            if (boolValue === true) {
                return true;
            }
            if (boolValue === false) {
                return false;
            }

            // Handle a true|false string
            if (typeof boolValue === "string") {
                lowercaseValue = boolValue.toLowerCase();
                if (lowercaseValue === "true") {
                    return true;
                }
                if (lowercaseValue === "false") {
                    return false;
                }
            }
            // Fall back to default
            if (defaultValue === undefined) {
                return true;
            }
            return defaultValue;
        },

        //============================================================================================================//

        /**
         * Tests if the browser is IE 8 or lower.
         * @return {boolean} True if the browser is IE 8 or lower
         */
        _isIE8: function () {
            return this._isIE(8, "lte");
        },

        /**
         * Detects IE and version number through injected conditional comments (no UA detect, no need for conditional
         * compilation / jscript check).
         * @param {string} [version] IE version
         * @param {string} [comparison] Operator testing multiple versions based on "version"
         * parameter, e.g., 'lte', 'gte', etc.
         * @return {boolean} Result of conditional test; note that since IE stopped supporting conditional comments with
         * IE 10, this routine only works for IE 9 and below; for IE 10 and above, it always returns "false"
         * @author Scott Jehl
         * @see The <a href="https://gist.github.com/scottjehl/357727">detect IE and version number through injected
         * conditional comments.js</a>.
         * Tests if the browser is IE < 10 or (IE 11 and not https).
         * @return {boolean} True if the browser is IE
         */
        _isIE: function (version, comparison) {
            var cc = "IE",
                b = document.createElement("B"),
                docElem = document.documentElement,
                isIE;

            if (version) {
                cc += " " + version;
                if (comparison) {
                    cc = comparison + " " + cc;
                }
            }

            b.innerHTML = "<!--[if " + cc + "]><b id='iecctest'></b><![endif]-->";
            docElem.appendChild(b);
            isIE = !!document.getElementById("iecctest");
            docElem.removeChild(b);
            return isIE;
        },

        /**
         * Injects a string of CSS into the document.
         * @example
         * <pre>
         * // For <div class="titleBox"><div class="title">Title</div></div>
         * require(["dojo/ready", "js/lgonlineBase"], function (ready) {
         *     ready(function () {
         *         var loader = new js.LGObject();
         *         loader._injectCSS(
         *             ".titleBox{width:100%;height:52px;margin:0px;padding:4px;color:white;background-color:#1e90ff;
         *                 text-align:center;overflow:hidden;}"+
         *             ".title{font-size:24px;position:relative;top:25%}"
         *         );
         *     });
         * });
         * </pre>
         * @param {string} cssStr A string of CSS text
         * @return {object} DOM style element
         */
        _injectCSS: function (cssStr) {
            var customStyles, cssText;

            // By Fredrik Johansson
            // http://www.quirksmode.org/bugreports/archives/2006/01/IE_wont_allow_documentcreateElementstyle.html#c4088
            customStyles = document.createElement("style");
            customStyles.setAttribute("type", "text/css");
            if (customStyles.styleSheet) { // IE 7 & 8
                customStyles.styleSheet.cssText = cssStr;
            }
            else { // W3C
                cssText = document.createTextNode(cssStr);
                customStyles.appendChild(cssText);
            }

            // Add the style *after* existing styles so that it'll override them
            document.body.appendChild(customStyles);

            return customStyles;
        },

        /**
        * Retrieves related features.
         * @param {object} item object to be used to fetch the related records
        */
        _getRelatedFeatureForLayer: function (item) {
            var relatedTableURL, relatedLayer, selectedLayer;
            selectedLayer = item._layer;
            // if comment field is present in config file and the layer contains related table, fetch the first related table URL
            if (selectedLayer.relationships && selectedLayer.relationships.length > 0) {
                array.forEach(selectedLayer.relationships, lang.hitch(this, function (parentRelationShip) {
                    // Construct the related table URL form operational layer URL and the related table id
                    // We are considering only first related table although the layer has many related table.
                    // Hence, we are fetching relatedTableId from relationships[0] ie:"operationalLayer.relationships[0].relatedTableId"
                    relatedTableURL = selectedLayer.url.substr(0, selectedLayer.url.lastIndexOf('/') + 1) + parentRelationShip.relatedTableId;
                    //fetch comment popup table which will be used in creating comment form
                    array.some(this.config.itemInfo.itemData.operationalLayers, lang.hitch(this, function (currentLayer) {
                        if (relatedTableURL) {
                            if (currentLayer.url === relatedTableURL && currentLayer.layerObject.geometryType) {
                                relatedLayer = currentLayer.layerObject;
                                //get the relationship object for related layer
                                array.some(relatedLayer.relationships, lang.hitch(this, function (relationship) {
                                    if (relationship.id === parentRelationShip.id) {
                                        childLayerRelationShip = relationship;
                                        return true;
                                    }
                                }));
                                this._queryComments(relatedLayer, item, selectedLayer, parentRelationShip, childLayerRelationShip);
                            }
                        }
                    }));
                }));
            }
        },

        /**
        * Retrieves the comments associated with an item.
        * @param {relatedLayer} related layer object
        * @return {item} selected feature
        * @param {selectedLayer} active layer in application
        * @return {parentRelationShip} relationship details of parent layer
        * @param {childLayerRelationShip} relationship details of related layer
        */
        _queryComments: function (relatedLayer, item, selectedLayer, parentRelationShip, childLayerRelationShip) {
            var updateQuery = new RelationshipQuery(), commentsTableDefinitionExpression;
            updateQuery.objectIds = [item.attributes[selectedLayer.objectIdField]];
            updateQuery.returnGeometry = true;
            updateQuery.outFields = ["*"];
            updateQuery.relationshipId = parentRelationShip.id;
            commentsTableDefinitionExpression = relatedLayer.getDefinitionExpression();
            //If table has definition expression set in web map then apply it
            if (commentsTableDefinitionExpression &&
                commentsTableDefinitionExpression !== null &&
                commentsTableDefinitionExpression !== "") {
                updateQuery.definitionExpression = commentsTableDefinitionExpression;
            }
                relatedLayer.getDefinitionExpression();
            selectedLayer.queryRelatedFeatures(updateQuery, lang.hitch(this, function (results) {
                var featureSet, layersDefExpr, relatedLayerDefExpr;
                featureSet = results[item.attributes[selectedLayer.objectIdField]];
                features = featureSet ? featureSet.features : [];
                if (item.attributes[parentRelationShip.keyField] === null) {
                    fieldValue = "is NULL";
                } else {
                    fieldValue = "'" + item.attributes[parentRelationShip.keyField] + "'";
                }
                //If layer has default expression consider that
                if (this._layersDefaultDefExpr[selectedLayer.id]) {
                    layersDefExpr = this._layersDefaultDefExpr[selectedLayer.id] + " AND " +
                        selectedLayer.objectIdField + " = " + item.attributes[selectedLayer.objectIdField];
                } else {
                    layersDefExpr = selectedLayer.objectIdField + " = " + item.attributes[selectedLayer.objectIdField];
                }
                //If related layer has default expression consider that
                if (this._layersDefaultDefExpr[relatedLayer.id]) {
                    relatedLayerDefExpr = this._layersDefaultDefExpr[relatedLayer.id] + " AND " +
                        childLayerRelationShip.keyField + " = " + fieldValue
                } else {
                    relatedLayerDefExpr = childLayerRelationShip.keyField + " = " + fieldValue
                }
                selectedLayer.setDefinitionExpression(layersDefExpr);
                relatedLayer.setDefinitionExpression(relatedLayerDefExpr);
                //Store the related layer def expression
                //This will be required while resetting the layers when user comes back from item details screen
                this._relatedDefExpr[selectedLayer.id] = selectedLayer.objectIdField + " = " + item.attributes[selectedLayer.objectIdField];
                this._relatedDefExpr[relatedLayer.id] = childLayerRelationShip.keyField + " = " + fieldValue;

            }), lang.hitch(this, function (err) {
            }));
        },

        /**
         * This function is used to get the sharing properties of layer which are added as item in AGOL
         */
        _getLayerSharingProperty: function (itemId, def) {
            //Get layer's sharing property
            esriRequest({
                url: this.config.sharinghost + "/sharing/rest/content/items/" + itemId,
                content: {
                    f: 'json'
                },
                handleAs: 'json',
                callbackPrams: 'callback'
            }).then(lang.hitch(this, function (itemInfo) {
                //Maintain the object to store the sharing properties of layers
                this._layerAccessInfoObj[itemId] = itemInfo.access;
                def.resolve();
            }), function () {
                def.reject();
            });
        },

        /**
         * Show message in modal dialog
         * @memberOf js/main
         */
        _showWarningMessage: function (config) {
            var warningDOM, warningMessageModal, message, logoWrapper;
            // Initialize help widget
            warningDOM = domConstruct.create("div", {
                "class": "esriCTSupportedBrowsersImage"
            });
            //show the message as per AGOL/Portal hosted app
            if (this._isAGOLHosted()) {
                message = AppUtils.parseWarningMessage(config.i18n.map.warningMessageAGOL);
            } else {
                message = AppUtils.parseWarningMessage(config.i18n.map.warningMessageEnterprise);
            }
            //Create DOM for showing text and browser icons
            textContent = domConstruct.create("div", {
                innerHTML: message
            }, warningDOM);
            //Add DOM for browser icon
            logoWrapper = domConstruct.create("div", {}, warningDOM);
            html.set(logoWrapper, AppUtils.getBrowserSupportLogoTemplate(), {
                parseContent: true
            });

            warningMessageModal = new Help({
                "appConfig": {
                    "helpDialogTitle": config.i18n.map.warningMessageTitle,
                    "helpDialogContent": warningDOM.innerHTML
                }
            });
            warningMessageModal.startup();
        },

        /**
         * This function is used to check if app is hosted on AGOL or portal
         * @memberOf js/main
         */
        _isAGOLHosted: function () {
            return window.location.hostname.indexOf('arcgis.com') > -1;
        },

        /**
         * This function is used to check if app is running in IE browser
         * @memberOf js/main
         */
        _isIE: function () {
            ua = navigator.userAgent;
            /* MSIE used to detect old browsers and Trident used to newer ones*/
            var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
            return is_ie;
        }

    });
});
