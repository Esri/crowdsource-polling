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
    "dojo/text!./templates/SidebarHeader.html",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/on",
    "application/lib/SvgHelper"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    template,
    lang,
    dom,
    on,
    SvgHelper
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        signInBtnOnClick: null,
        helpBtnOnClick: null,

        /**
         * Widget constructor
         * @param {object} initialProps Initialization properties:
         *     appConfig: Application configuration
         * @constructor
         */

        /**
         * Initializes the widget once the DOM structure is ready
         */
        postCreate: function () {
            var svgHelper, i18n = this.appConfig.i18n.sidebar_header;

            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);

            // Set up the UI
            this.signInBtn.innerHTML = i18n.signInButton;
            this.signInBtn.title = i18n.signInButtonTooltip;

            svgHelper = new SvgHelper();
            svgHelper.createSVGItem(this.appConfig.helpIcon, this.helpBtn, 19, 19);
            this.helpBtn.title = i18n.helpButtonTooltip;

            this.appTitle.innerHTML = this.appConfig.title || "";
        },

        /**
         * Sets the onClick handler for the sign-in button.
         * @param {function} clickHandler Function to be called when the sign-in button is clicked;
         * callback function will receive this widget as 'this'
         * @example
         * var widget = new SidebarHeader(this.config);
         * widget.placeAt("sidebarHeading");
         * widget.startup();
         * widget.set("signInBtnOnClick", function () {
         *     console.log("Clicked sign-in button");
         * });
         */
        _setSignInBtnOnClickAttr: function (clickHandler) {
            if (this.signInBtnOnClick) {
                this.signInBtnOnClick.remove();
            }
            this.signInBtnOnClick = on(this.signInBtn, "click", lang.hitch(this, clickHandler));
            this.own(this.signInBtnOnClick);
        },

        /**
         * Sets the onClick handler for the help button.
         * @param {function} clickHandler Function to be called when the help button is clicked;
         * callback function will receive this widget as 'this'
         * @example
         * var widget = new SidebarHeader(this.config);
         * widget.placeAt("sidebarHeading");
         * widget.startup();
         * widget.set("helpBtnOnClick", function () {
         *     console.log("Clicked help button");
         * });
         */
        _setHelpBtnOnClickAttr: function (clickHandler) {
            if (this.helpBtnOnClick) {
                this.helpBtnOnClick.remove();
            }
            this.helpBtnOnClick = on(this.helpBtn, "click", lang.hitch(this, clickHandler));
            this.own(this.helpBtnOnClick);
        }

    });
});
