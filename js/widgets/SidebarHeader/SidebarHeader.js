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
    "dojo/dom",
    "dojo/_base/lang",
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
    on,
    topic,
    SvgHelper
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        _config: null,
        _signInBtnOnClick: null,
        _helpBtnOnClick: null,

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
            var i18n = this.appConfig.i18n.sidebar_header;

            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);

            // Set up the UI
            this.signInBtn.innerHTML = i18n.signInButton;
            this.signInBtn.title = i18n.signInButtonTooltip;

            SvgHelper.createSVGItem(this.appConfig.helpIcon, this.helpBtn, 19, 19);
            this.helpBtn.title = i18n.helpButtonTooltip;

            this.appTitle.innerHTML = this.appConfig.title || "";

            // Set up the button click handlers
            this._signInBtnOnClick = on(this.signInBtn, "click", function () {
                topic.publish("socialSelected");
            });
            this.own(this._signInBtnOnClick);

            this._helpBtnOnClick = on(this.helpBtn, "click", function () {
                topic.publish("helpSelected");
            });
            this.own(this._helpBtnOnClick);
        }

    });
});
