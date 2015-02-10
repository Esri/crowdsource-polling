/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*jslint white:true */
/*global define, console */
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
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/dom-style',
    'dojo/dom-class',
    'dojo/query',
    'dojo/topic',
    'dojo/NodeList-dom',

    'application/lib/SvgHelper',

    'esri/dijit/_EventedWidget',
    'dijit/_TemplatedMixin',

    'dojo/text!./ItemListView.html'],

function(declare, lang, arrayUtil, domConstruct, domStyle, domClass, dojoQuery, topic, nld,
    SvgHelper,
    _EventedWidget, _TemplatedMixin,
    template) {

    return declare([_EventedWidget, _TemplatedMixin], {
        templateString: template,
        id: 'itemList',
        baseClass: 'itemList',

        constructor: function() {
            this.inherited(arguments);
        },

        postCreate: function() {
            this.inherited(arguments);
        },

        startup: function() {
            this.inherited(arguments);
        },

        show: function() {
            domStyle.set(this.domNode, 'display', '');
        },

        hide: function() {
            domStyle.set(this.domNode, 'display', 'none');
        },

        setFields: function(fieldsArr) {
            this.nameField = fieldsArr[0];
            this.votesField = fieldsArr[2];
        },

        setItems: function(items) {
            this.items = items;
            this.clearList();
            this.buildList();
        },

        clearList: function() {
            domConstruct.empty(this.domNode);
        },

        buildList: function() {
            arrayUtil.forEach(this.items, lang.hitch(this, this.buildItemSummary));
        },

        buildItemSummary: function(item, idx, arr) {

            var itemTitle, itemVotes, itemSummaryDiv, favDiv, iconDiv;

            itemTitle = item.getTitle ? item.getTitle() : null;
            if (!itemTitle || itemTitle === item.getLayer().name + ':') {
                itemTitle += ' ' + (item.attributes[this.nameField] || 'Untitled item');
            }

            itemVotes = item.attributes[this.votesField] || 0;

            itemSummaryDiv = domConstruct.create('div', {
                'class': 'itemSummary',
                'click': lang.partial(this.summaryClick, this, item)
            }, this.list);

            domConstruct.create('div', {
                'class': 'itemTitle',
                'innerHTML': itemTitle
            }, itemSummaryDiv);

            favDiv = domConstruct.create('div', {
                'class': 'itemFav'
            }, itemSummaryDiv);

            domConstruct.create('div', {
                'class': 'itemVotes',
                'innerHTML': itemVotes
            }, favDiv);

            // iconDiv = domConstruct.create('img', {
            //     'src': this.appConfig.likeIcon,
            //     'alt': 'likeIcon',
            //     'class': 'fav',
            //     'height': '10px',
            //     'width': '10px'
            // }, itemSummaryDiv);
            // 
            iconDiv = domConstruct.create('div', {
                'class': 'fav',
            }, favDiv);

            SvgHelper.createSVGItem(this.appConfig.likeIcon, iconDiv, 12, 12);

        },

        summaryClick: function(self, feat, evt) {
            // 'this' = row click
            self.clearSelected();
            domClass.add(this, 'selected');
            topic.publish('itemSelected', feat);
        },

        clearSelected: function() {
            dojoQuery('.itemSummary', this.domNode).removeClass('selected');
        }

    });
});