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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./SidebarHeader.html",
    "dojo/dom",
    "dijit/registry",
    "dojo/_base/lang",
    "dojo/_base/window",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on",
    "dojo/topic",
    "application/lib/SvgHelper",
    "application/widgets/Filter/Filter"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    template,
    dom,
    registry,
    lang,
    win,
    domAttr,
    domClass,
    domConstruct,
    domStyle,
    on,
    topic,
    SvgHelper,
    Filter
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        currentViewIsListView: true,
        _filterObj: null,
        isFilterAppliedOnItemLayer: false,

        /**
         * Widget constructor
         * @param {object} initialProps Initialization properties:
         *     appConfig: Application configuration,
         *     showSignin: {boolean} Indicates if sign-in button is to be available
         *     showHelp: {boolean} Indicates if help button is to be available
         * @constructor
         */

        /**
         * Initializes the widget once the DOM structure is ready.
         */
        postCreate: function () {
            var i18n = this.appConfig.i18n.sidebar_header,
                signInBtnOnClick, signInMenuBtnOnClick, optionsIconSurface,
                helpMenuItem, helpBtnOnClick, helpMenuBtnOnClick, viewToggleMenuBtnOnClick, optionsOnClick,
                filterBtnOnClick, filterMenuBtnClick;
            //set value of currentViewIsListView to configured value for showListViewFirst
            this.currentViewIsListView = this.appConfig.showListViewFirst;
            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);

            // Set up the UI
            optionsIconSurface = SvgHelper.createSVGItem(this.appConfig.optionsIcon, this.options, 32, 32);
            SvgHelper.changeColor(optionsIconSurface, this.appConfig.theme.header.text);

            domStyle.set(this.optionsDropdown, "border-color", this.appConfig.theme.header.text);

            domStyle.set(this.signInBtn, "display", "none");
            domStyle.set(this.filterBtn, "display", "none");
            if (this.showSignin) {
                this.signInMenuItem = domConstruct.create("div", {
                    className: "sideHdrOptionsMenuItem textButton themeHeaderHover"
                }, this.optionsDropdown);
                domStyle.set(this.signInMenuItem, "display", "none");

                signInBtnOnClick = on(this.signInBtn, "click", function () {
                    topic.publish("socialSelected");
                });
                signInMenuBtnOnClick = on(this.signInMenuItem, "click", function () {
                    topic.publish("socialSelected");
                });
                this.own(signInBtnOnClick, signInMenuBtnOnClick);
            }


            this.viewToggleMenuItem = domConstruct.create("div", {
                className: "sideHdrOptionsMenuItem textButton themeHeaderHover"
            }, this.optionsDropdown);
            viewToggleMenuBtnOnClick = on(this.viewToggleMenuItem, "click", lang.hitch(this, this._toggleMenu));
            this.own(viewToggleMenuBtnOnClick);
            //switch toggler button while checking current view displayed
            this.setCurrentViewToListView(this.appConfig.showListViewFirst);
            topic.subscribe("toggleMenu", lang.hitch(this, this._toggleMenu));

            if (this.appConfig.showFilter) {
                //Add title and text for filter button
                this.filterBtn.title = i18n.filterButtonLabel;

                var filterBtnSurface;

                filterBtnSurface = SvgHelper.createSVGItem(this.appConfig.filterIcon, this.filterBtn, 22, 22);
                SvgHelper.changeColor(filterBtnSurface, this.appConfig.theme.header.text);
                //Add filter button menu in mobile
                filterBtnMenuItem = domConstruct.create("div", {
                    className: "sideHdrOptionsMenuItem textButton themeHeaderHover",
                    title: i18n.filterButtonLabel,
                    innerHTML: i18n.filterButtonLabel
                }, this.optionsDropdown);

                //Listen for filter button click event in the app header
                filterBtnOnClick = on(this.filterBtn, "click", lang.hitch(this, function () {
                    if (!this._filterObj) {
                        this._createFilterObject();
                    }
                    this.onFilterButtonClicked();
                }));
                //Listen for filter menu selected event in the mobile menu
                filterMenuBtnClick = on(filterBtnMenuItem, "click", lang.hitch(this, function () {
                    if (!this._filterObj) {
                        this._createFilterObject();
                    }
                    topic.publish("filterSelected");
                }));
                this.own(filterBtnOnClick, filterMenuBtnClick);
            }

            if (this.showHelp) {
                var helpIconSurface;

                helpIconSurface = SvgHelper.createSVGItem(this.appConfig.helpIcon, this.helpBtn, 20, 20);
                SvgHelper.changeColor(helpIconSurface, this.appConfig.theme.header.text);

                this.helpBtn.title = i18n.helpButtonTooltip;
                helpMenuItem = domConstruct.create("div", {
                    className: "sideHdrOptionsMenuItem textButton themeHeaderHover",
                    title: i18n.helpButtonTooltip,
                    innerHTML: i18n.helpButtonLabel
                }, this.optionsDropdown);

                helpBtnOnClick = on(this.helpBtn, "click", function () {
                    topic.publish("helpSelected");
                });
                helpMenuBtnOnClick = on(helpMenuItem, "click", function () {
                    topic.publish("helpSelected");
                });
                this.own(helpBtnOnClick, helpMenuBtnOnClick);
            }

            this.options.title = i18n.menuButtonTooltip;
            optionsOnClick = on(this.options, "click", lang.hitch(this, function (evt) {
                if (this.optionsDropdownIsOpen) {
                    topic.publish("hideOptionsMenu");
                }
                else {
                    topic.publish("showOptionsMenu");
                }
                evt.cancelBubble = true;
            }));
            this.own(optionsOnClick);

            this.optionsDropdownIsOpen = false;
            topic.subscribe("showOptionsMenu", lang.hitch(this, function (item) {
                domStyle.set(this.optionsDropdown, "display", "block");
                this.optionsDropdownIsOpen = true;
            }));
            topic.subscribe("hideOptionsMenu", lang.hitch(this, function (item) {
                domStyle.set(this.optionsDropdown, "display", "none");
                this.optionsDropdownIsOpen = false;
            }));
            on(window, "resize", lang.hitch(this, function (event) {
                if (this.optionsDropdownIsOpen) {
                    topic.publish("hideOptionsMenu");
                }
            }));

            on(win.body(), "click", function () {
                topic.publish("hideOptionsMenu");
            });

            // Title icon and text
            this.appTitle.innerHTML = this.appTitle.title = this.appConfig.title || "";
            if (this.appConfig.titleIcon) {
                domAttr.set(this.bannerImg, "src", this.appConfig.titleIcon);
            }
        },

        _createFilterObject: function () {
            //Create filter widget
            this._filterObj = new Filter({
                appConfig: this.appConfig,
                map: this.map,
                urlDefExpr: this.urlDefExpr,
                itemLayer: this.itemLayer,
                staticTimeDefExp: this.staticTimeDefExp
            });
            //Update the expressions once the filter's are updated
            this._filterObj.onFilterUpdated = lang.hitch(this, function (isAppliedOnItemLayer) {
                this.filterWidgetExpr = this._filterObj._filterDefExpr;
                this.isFilterAppliedOnItemLayer = isAppliedOnItemLayer;
                this.onDefinitionExpressionUpdated(this.filterWidgetExpr, isAppliedOnItemLayer);
            });

            this._filterObj.onFilterBackButtonClicked = lang.hitch(this, function () {
                this.onFilterButtonClicked();
            });
            this._filterObj.placeAt(dom.byId("filterContent"));
        },

        /**
         * Toggle the filter panel based on the current state
         */
        onFilterButtonClicked: function () {
            if (domStyle.get(dom.byId("filterContent"), "display") === "block") {
                dom.byId("filterContent").style.display = "none";
                dom.byId("sidebarContent").style.display = "block";
                registry.byId("contentDiv").resize();
                //If filter is applied on polling layer, reset the panel to item list
                if (this.isFilterAppliedOnItemLayer) {
                    topic.publish("showPanel", "itemsList");
                }
            } else {
                dom.byId("sidebarContent").style.display = "none";
                dom.byId("filterContent").style.display = "block";
            }
        },

        /**
         * Toggles the item in menu list and switches to map/list view based on the current view.
         */
        _toggleMenu: function () {
            if (this.currentViewIsListView) {
                topic.publish("showMapViewClicked");
            }
            else {
                topic.publish("showListViewClicked");
            }
            this.setCurrentViewToListView(!this.currentViewIsListView);
        },

        /**
         * Performs post-DOM-placement actions.
         */
        startup: function () {
            this.inherited(arguments);
            domStyle.set(this.domNode.parentNode, "border-bottom-color", this.appConfig.theme.background);
        },

        /**
         * Sets display of help trigger.
         * @param {boolean} showIfEnabled Show help trigger if help is enabled
         */
        updateHelp: function (showIfEnabled) {
            if (showIfEnabled && this.showHelp) {
                domStyle.set(this.helpBtn, "display", "inline-block");
            }
            else {
                domStyle.set(this.helpBtn, "display", "none");
            }
        },

        /**
         * Sets display of help trigger.
         * @param {boolean} showIfEnabled Show help trigger if help is enabled
         */
        updateFilter: function (showFilter) {
            if (showFilter) {
                domStyle.set(this.filterBtn, "display", "inline-block");
            }
            else {
                domStyle.set(this.filterBtn, "display", "none");
            }
        },

        /**
         * Sets the map/list view toggle display.
         * @param {boolean} setCurrentViewToList Set the toggle for the "go to map" state (true)
         * or the "go to list" state (false)
         */
        setCurrentViewToListView: function (setCurrentViewToList) {
            if (setCurrentViewToList) {
                this.viewToggleMenuItem.innerHTML = this.appConfig.i18n.sidebar_header.gotoMapViewLabel;
                this.viewToggleMenuItem.title = this.appConfig.i18n.sidebar_header.gotoMapViewTooltip;
            }
            else {
                this.viewToggleMenuItem.innerHTML = this.appConfig.i18n.sidebar_header.gotoListViewLabel;
                this.viewToggleMenuItem.title = this.appConfig.i18n.sidebar_header.gotoListViewTooltip;
            }
            this.currentViewIsListView = setCurrentViewToList;
        },

        /**
         * Updates the signed-in display based on the signed-in state.
         * @param {object} signedInUser Description of signed-in user: "name" {string},
         * "canSignOut" {boolean}; null indicates that no one is signed in
         */
        updateSignin: function (signedInUser) {
            var i18n = this.appConfig.i18n.sidebar_header;

            if (this.showSignin) {
                if (!signedInUser) {
                    this.signInBtn.innerHTML = this.signInMenuItem.innerHTML = i18n.signInButton;
                    this.signInBtn.title = this.signInMenuItem.title = i18n.signInButtonTooltip;
                    domStyle.set(this.signInBtn, "display", "block");
                    domStyle.set(this.signInMenuItem, "display", "block");

                }
                else if (signedInUser.canSignOut) {
                    this.signInBtn.innerHTML = this.signInMenuItem.innerHTML = i18n.signOutButton;
                    this.signInBtn.title = this.signInMenuItem.title = i18n.signOutButtonTooltip;
                    domStyle.set(this.signInBtn, "display", "block");
                    domStyle.set(this.signInMenuItem, "display", "block");

                }
                else {
                    domStyle.set(this.signInBtn, "display", "none");
                    domStyle.set(this.signInMenuItem, "display", "none");
                }
            }
        }

    });
});
