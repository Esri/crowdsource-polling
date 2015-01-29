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
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/SidebarHeader.html",
    "dojo/dom",
    "dojo/_base/lang",
    "dojo/on",
    "application/lib/SvgHelper"

/*
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/string",
    "dojo/query",
    "esri/Color",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/geometry/Polyline",
    "esri/geometry/Polygon",
    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/tasks/query",
    */
], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template,
    dom, lang, on,
/*    domConstruct, domStyle, domAttr, domClass, string, query, issueItemTemplate, issueDetailsTemplate, Color, Graphic, Point, Polyline, Polygon, FeatureLayer, GraphicsLayer, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Query, IssueComments */
    SvgHelper) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        templateString: template,

        /**
         * Widget constructor
         * @param {object} config Application configuration
         */
        constructor: function (config) {
            lang.mixin({}, this, config);
        },

        /**
         * Initializes the widget once the DOM structure is ready
         */
        postCreate: function () {
            var svgHelper, i18n = this.i18n.sidebar_header;

            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);

            // Set up the UI
            this.signInBtn.innerHTML = i18n.signInButton;
            this.signInBtn.title = i18n.signInButtonTooltip;

            svgHelper = new SvgHelper();
            svgHelper.createSVGItem(this.helpIcon, this.helpBtn, 19, 19);
            this.helpBtn.title = i18n.helpButtonTooltip;

            this.appTitle.innerHTML = this.title || "";
        }


    });
});
