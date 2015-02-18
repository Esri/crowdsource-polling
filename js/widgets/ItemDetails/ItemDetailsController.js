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
    'dojo/dom-attr',
    'dojo/query',
    'dojo/topic',
    'dojo/on',
    'dojo/NodeList-dom',

    'application/lib/SvgHelper',

    'dijit/layout/ContentPane',

    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',

    'dojo/text!./ItemDetailsView.html'
], function (declare, lang, arrayUtil, domConstruct, domStyle, domClass, domAttr, dojoQuery, topic, dojoOn, nld,
    SvgHelper,
    ContentPane,
    _WidgetBase, _TemplatedMixin,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        id: 'itemDetail',
        baseClass: 'itemDetail',
        itemTitle: 'default title',
        itemVotes: 0,

        constructor: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this.inherited(arguments);
            this.i18n = this.appConfig.i18n.item_details;
            this.initTemplateIcons();
            this.initContentPane();
        },

        startup: function () {
            this.inherited(arguments);
            this.addListeners();
        },

        show: function () {
            domStyle.set(this.domNode, 'display', '');
        },

        hide: function () {
            domStyle.set(this.domNode, 'display', 'none');
        },

        initTemplateIcons: function () {
            var gallerySurface, self = this;
            arrayUtil.forEach(dojoQuery('.favIcon', this.domNode), function (iconDiv) {
                SvgHelper.createSVGItem(self.appConfig.likeIcon, iconDiv, 12, 12);
            });
            SvgHelper.createSVGItem(this.appConfig.backIcon, this.backIcon, 12, 20);
            SvgHelper.createSVGItem(this.appConfig.commentIcon, this.commentIcon, 11, 10);
            gallerySurface = SvgHelper.createSVGItem(this.appConfig.galleryIcon, this.galleryIcon, 14, 13);
            domAttr.set(gallerySurface.rawNode, 'viewBox', '300.5, 391, 11, 10');
        },

        addListeners: function () {
            var self = this;
            dojoOn(this.backIcon, 'click', function () {
                topic.publish('detailsCancel');
            });
            dojoOn(this.likeButton, 'click', function () {
                topic.publish('addLike', self.item);
            });
            dojoOn(this.commentButton, 'click', function () {
                topic.publish('getComment', self.item);
            });
        },


        /**
         * Sets the fields that are needed to display feature information in this list (name and number of votes).
         * Needs to be called before first setItems to tell the widget which fields to look for.
         * @param {object} fields with name and votes properties.
         */
        setItemFields: function (fields) {
            this.nameField = fields.name;
            this.votesField = fields.votes;
        },

        setCommentFields: function (fields) {
            this.commentNameField = fields.name;
        },

        initContentPane: function () {
            this.itemCP = new ContentPane({id: 'itemCP'}, this.descriptionDiv);
            this.itemCP.startup();
        },

        setItem: function (item) {
            this.item = item;
            this.itemTitle = this.getItemTitle(item);
            this.itemVotes = this.getItemVotes(item);
            this.fixNoUsername(item, this.nameField);
            this.clearItemDisplay();
            this.buildItemDisplay();
        },

        /**
         * Gets title of feature for header display
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

        fixNoUsername: function (item, field) {
            if (!item.attributes[field]) {
                item.attributes[field] = this.i18n.anonymousUser;
            }
        },

        clearItemDisplay: function () {
            this.itemTitleDiv.innerHTML = '';
            this.itemVotesDiv.innerHTML = '';
            this.itemCP.set('content', '');
        },

        buildItemDisplay: function () {
            this.itemTitleDiv.innerHTML = this.itemTitle;
            this.itemVotesDiv.innerHTML = this.itemVotes;
            this.itemCP.set('content', this.item.getContent());
        },

        setComments: function (commentsArr) {
            this.clearComments();
            domClass.toggle(this.noCommentsDiv, 'hide', commentsArr.length);
            arrayUtil.forEach(commentsArr, lang.hitch(this, this.buildCommentDiv));

        },

        updateItem: function (item) {
            if (item === this.item) {
                this.setItem(item);
            }
        },

        buildCommentDiv: function (comment) {
            var commentHeaderDiv, commentDiv;

            this.fixNoUsername(comment, this.commentNameField);

            commentDiv = domConstruct.create('div', {
                'class': 'comment'
            }, this.commentsList);

            commentHeaderDiv = domConstruct.create('div', {
                'class': 'header'
            }, commentDiv);

            domConstruct.create('div', {
                'class': 'name',
                'innerHTML': 'Heres a name'
            }, commentHeaderDiv);

            domConstruct.create('div', {
                'class': 'date',
                'innerHTML': 'heres a date'
            }, commentHeaderDiv);

            new ContentPane({
                'class': 'content small-text',
                'content': comment.getContent()
            }, commentDiv).startup();

            // domConstruct.create('div', {
            //     'class': 'content small-text',
            //     'innerHTML': 'heres the actual content. la la la. lorem ipsum somethingorother'
            // }, commentDiv);

        },

        clearComments: function () {
            domConstruct.empty(this.commentsList);
        }
    });
});
