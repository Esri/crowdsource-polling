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
    "dojo/text!./PopupWindow.html",
    "dojo/dom-style",
    "dojo/dom-geometry"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    template,
    domStyle,
    domGeom
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        baseClass: "popupWidget",
        showClose: false,

       /**
        * Create an attribute 'displayText' and use _setDisplayTextAttr to map to DOM Node:PopupContent to display text
        * Text to be displayed is added in the default.js.
        */
        displayText: "",
        _setDisplayTextAttr: {node: "popupContent", type: "innerHTML"},

        /**
         * Widget constructor
         * @param {object} initialProps Initialization properties:
         *     appConfig: Application configuration
         *     showClose: Indicates if close button should be shown
         * @constructor
         */

        /**
         * Initializes the widget once the DOM structure is ready
         */
        postCreate: function () {
            var i18n = this.appConfig.i18n.popup_Close;

            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);

            // Add tooltip to the UI
            this.closeBtn.title = i18n.closeButtonTooltip;

            //check the value of showClose Button
            if (this.showClose) {
                this.closeBtn.style.display = "block";
            }
        },

        /**
         * Causes the widget to become visible and positions it to the center of the page.
         */
        show: function () {
            var popupPosition, marginLeft, marginTop;

            //change display from none to block
            this.domNode.style.display = "block";

            // position the popup in the center of the page
            popupPosition = domGeom.position(this.domNode, true);

            marginLeft = -popupPosition.w / 2;
            marginTop = -popupPosition.h / 2;

            domStyle.set(this.domNode, {
                marginLeft: marginLeft + "px",
                marginTop: marginTop + "px"
            });
        },

        /**
         * Causes the widget to become hidden.
         */
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
        },

        /**
         * Handles click event for close button by hiding the widget.
         */
        onCloseClick: function () {
            this.hide();
        }
    });
});
