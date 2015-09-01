/*global define,dojo */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
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
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/on",
    "dojo/topic",
    "application/lib/SvgHelper"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    template,
    dom,
    lang,
    domClass,
    domStyle,
    on,
    topic,
    SvgHelper
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,

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
            var i18n = this.appConfig.i18n.sidebar_header, signInBtnOnClick, helpBtnOnClick, viewToggleBtnOnClick,
                toggleOnResize, needToggleCleanup;

            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);

            // Set up the UI
            domStyle.set(this.signInBtn, "display", "none");
            if (this.showSignin) {
                signInBtnOnClick = on(this.signInBtn, "click", function () {
                    topic.publish("socialSelected");
                });
                this.own(signInBtnOnClick);
            }

            if (this.showHelp) {
                this.helpBtn.title = i18n.helpButtonTooltip;
                helpBtnOnClick = on(this.helpBtn, "click", function () {
                    topic.publish("helpSelected");
                });
                this.own(helpBtnOnClick);
            }

            this.viewToggleBtn.title = i18n.gotoMapViewTooltip;
            this.viewToggleIsGoToMapView = true;
            viewToggleBtnOnClick = on(this.viewToggleBtn, "click", lang.hitch(this, function () {
                if (this.viewToggleIsGoToMapView) {
                    topic.publish("showMapViewClicked");
                    domClass.replace(this.viewToggleBtn, "toListView", "toMapView");
                    this.viewToggleBtn.title = i18n.gotoListViewTooltip;
                    needToggleCleanup = true;
                } else {
                    topic.publish("showListViewClicked");
                    domClass.replace(this.viewToggleBtn, "toMapView", "toListView");
                    this.viewToggleBtn.title = i18n.gotoMapViewTooltip;
                    needToggleCleanup = true;
                }
                this.viewToggleIsGoToMapView = !this.viewToggleIsGoToMapView;
            }));

            needToggleCleanup = true;
            toggleOnResize = on(window, "resize", lang.hitch(this, function (event) {
                if (needToggleCleanup && event.currentTarget.innerWidth > 640) {
                    this.viewToggleIsGoToMapView = true;
                    domClass.replace(this.viewToggleBtn, "toMapView", "toListView");
                    this.viewToggleBtn.title = i18n.gotoMapViewTooltip;
                    needToggleCleanup = false;
                }
            }));

            this.own(viewToggleBtnOnClick, toggleOnResize);


            this.appTitle.innerHTML = this.appTitle.title = this.appConfig.title || "";
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
            } else {
                domStyle.set(this.helpBtn, "display", "none");
            }
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
                    this.signInBtn.innerHTML = i18n.signInButton;
                    this.signInBtn.title = i18n.signInButtonTooltip;
                    domStyle.set(this.signInBtn, "display", "block");

                } else if (signedInUser.canSignOut) {
                    this.signInBtn.innerHTML = i18n.signOutButton;
                    this.signInBtn.title = i18n.signOutButtonTooltip;
                    domStyle.set(this.signInBtn, "display", "block");

                } else {
                    domStyle.set(this.signInBtn, "display", "none");
                }
            }
        }

    });
});
