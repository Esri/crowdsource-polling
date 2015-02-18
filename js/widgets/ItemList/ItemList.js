/*global define,dojo */
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

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',

    'dojo/text!./ItemListView.html'
], function (declare, lang, arrayUtil, domConstruct, domStyle, domClass, dojoQuery, topic, nld,
    SvgHelper,
    _WidgetBase, _TemplatedMixin,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        id: 'itemList',
        baseClass: 'itemList',

        /**
         * Widget constructor. Placeholder if future functionality is needed in the
         * widget creation life cycle.
         * @constructor
         */
        constructor: function () {
            this.inherited(arguments);
        },

        /**
         * Widget post-create, called automatically in widget creation
         * life cycle, after constructor. Sets class variables.
         */
        postCreate: function () {
            this.inherited(arguments);
            this.i18n = this.appConfig.i18n.item_list;
            this.hide();
        },

        /**
         * Widget startup. Placeholder if functionality is needed in the
         * widget creation life cycle
         *
         */
        startup: function () {
            this.inherited(arguments);
        },

        /**
         * Shows the widget with a simple display: ''
         */
        show: function () {
            domStyle.set(this.domNode, 'display', '');
        },

        /**
         * Hides the widget with a simple display: 'none'
         */
        hide: function () {
            domStyle.set(this.domNode, 'display', 'none');
        },

        /**
         * Sets the fields that are needed to display feature information in this list (name and number of votes).
         * Needs to be called before first setItems to tell the widget which fields to look for.
         * @param {object} fields with name and votes properties.
         */
        setFields: function (fields) {
            this.nameField = fields.name;
            this.votesField = fields.votes;
        },

        /**
         * Sets the items to be displayed in the items list, and then builds the list.
         * @param {array} items feature collection or array
         */
        setItems: function (items) {
            this.items = items;
            this.clearList();
            this.buildList();
        },

        /**
         * Clears the items list
         */
        clearList: function () {
            domConstruct.empty(this.domNode);
        },

        /**
         * Builds the items list
         */
        buildList: function () {
            arrayUtil.forEach(this.items, lang.hitch(this, this.buildItemSummary));
        },

        /**
         * Builds an individual item summary given an item.
         * @param  {feature} item to display in the list
         */
        buildItemSummary: function (item) {

            var itemTitle, itemVotes, itemSummaryDiv, favDiv, iconDiv;

            itemTitle = this.getItemTitle(item);

            itemVotes = this.getItemVotes(item);

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

            iconDiv = domConstruct.create('div', {
                'class': 'fav'
            }, favDiv);

            SvgHelper.createSVGItem(this.appConfig.likeIcon, iconDiv, 12, 12);
        },

        /**
         * Gets title of feature for list display
         * @param  {feature} item The feature for which to get the title
         * @return {string}      The title of the feature
         */
        getItemTitle: function (item) {

            var returnTitle = item.getTitle ? item.getTitle() : null;

            return returnTitle || this.i18n.untitledItem;

            // alternative title calculating
            /*switch (returnTitle) {
            case item.getLayer().name + ':':
                returnTitle += ' ';
                // there's no break statement here on purpose!
            case null:
                returnTitle += item.attributes[this.nameField] || this.i18n.untitledItem;
                break;
            }
            return returnTitle;*/
        },

        /**
         * Gets the number of votes for an item
         * @param  {feature} item The feature for which to get the vote count
         * @return {integer}      Vote count for the item
         */
        getItemVotes: function (item) {
            return item.attributes[this.votesField] || 0;
        },

        /**
         * Called on an item summary click
         * @param  {context} self The widget itself, since 'this' is the row that was clicked
         * @param  {feature} feat The feature that corresponds to the row that was clicked
         * @param  {mouse event} evt  The click event on the row that was clicked
         */
        summaryClick: function (self, feat, evt) {
            // 'this' = row click
            self.clearSelected();
            domClass.add(this, 'selected');
            topic.publish('itemSelected', feat);
        },

        /**
         * Clears the visual indication of any rows being selected
         */
        clearSelected: function () {
            dojoQuery('.itemSummary', this.domNode).removeClass('selected');
        }

    });
});
