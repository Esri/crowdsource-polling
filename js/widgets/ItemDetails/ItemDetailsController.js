/*global define,dojo,Modernizr */
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

    "application/widgets/DynamicForm/DynamicForm",

    'dojo/text!./ItemDetailsView.html'
], function (declare, lang, arrayUtil, domConstruct, domStyle, domClass, domAttr, dojoQuery, topic, dojoOn, nld,
    SvgHelper,
    ContentPane,
    _WidgetBase, _TemplatedMixin,
    DynamicForm,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        id: 'itemDetail',
        baseClass: 'itemDetail',
        itemTitle: 'default title',
        itemVotes: 0,
        actionVisibilities: {
            "showVotes": false,
            "showComments": false,
            "showGallery": false
        },

        constructor: function () {
            this.inherited(arguments);
        },

        postCreate: function () {
            this.inherited(arguments);
            this.i18n = this.appConfig.i18n.item_details;
            this.initCommentsDiv();
            this.initContentPane();
            this.hide();
        },

        startup: function () {
            this.inherited(arguments);
            this.initTemplateIcons();
            this.addListeners();
        },

        show: function () {
            domStyle.set(this.likeButton, 'display', this.actionVisibilities.showVotes ? 'inline-block' : 'none');
            domStyle.set(this.commentButton, 'display', this.actionVisibilities.showComments ? 'inline-block' : 'none');
            domStyle.set(this.galleryButton, 'display', this.actionVisibilities.showGallery ? 'inline-block' : 'none');
            domStyle.set(this.domNode, 'display', '');
        },

        hide: function () {
            domStyle.set(this.domNode, 'display', 'none');
        },

        /**
         * Creates the icons for the Like, Comment, Gallery buttons and gives them their
         * i18n labels and tooltips.
         * <br>Needs to be run after postCreate, such as in startup, because of SVG icons; see
         * https://code.google.com/p/tatami/issues/detail?id=40
         */
        initTemplateIcons: function () {
            var gallerySurface, backIconSurface, self = this;

            arrayUtil.forEach(dojoQuery('.favIcon', this.domNode), function (iconDiv) {
                SvgHelper.changeColor(SvgHelper.createSVGItem(self.appConfig.likeIcon, iconDiv, 12, 12),
                    self.appConfig.theme.accentText);
            });
            this.likeLabel.innerHTML = this.i18n.likeButtonLabel;
            this.likeButton.title = this.i18n.likeButtonTooltip;

            backIconSurface = SvgHelper.createSVGItem(this.appConfig.backIcon, this.backIcon, 12, 20);
            if (!Modernizr.rgba) {
                SvgHelper.changeColor(backIconSurface, this.appConfig.theme.foreground);
            }

            SvgHelper.createSVGItem(this.appConfig.commentIcon, this.commentIcon, 11, 10);
            this.commentLabel.innerHTML = this.i18n.commentButtonLabel;
            this.commentButton.title = this.i18n.commentButtonTooltip;

            gallerySurface = SvgHelper.createSVGItem(this.appConfig.galleryIcon, this.galleryIcon, 14, 13);
            this.galleryLabel.innerHTML = this.i18n.galleryButtonLabel;
            this.galleryButton.title = this.i18n.galleryButtonTooltip;
            domAttr.set(gallerySurface.rawNode, 'viewBox', '300.5, 391, 11, 10');
        },

        /**
         * Sets up the i18n comments-list heading and the no-comments planceholder.
         */
        initCommentsDiv: function () {
            this.commentsHeading.innerHTML = this.i18n.commentsListHeading;
            this.noCommentsDiv.innerHTML = this.i18n.noCommentsPlaceholder;
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
         * Sets the fields that are needed to display feature information in this list (number of votes).
         * Needs to be called before first setItems to tell the widget which fields to look for.
         * @param {string} votesField Name of votes property
         * @param {array} commentFields Fields used by comment-entry form //???
         */
        setItemFields: function (votesField, commentFields) {
            this.votesField = votesField;
            this.commentFields = commentFields;
        },

        /**
         * Sets the
         */
        setActionsVisibility: function (showVotes, showComments, showGallery) {
            this.actionVisibilities = {
                 "showVotes": showVotes,
                 "showComments": showComments,
                 "showGallery": showGallery
             };
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
            this.itemTitle = this.getItemTitle(item) || "&nbsp;";
            this.itemVotes = this.getItemVotes(item);
            this.clearItemDisplay();
            this.buildItemDisplay();
        },

        showCommentForm: function (userInfo) {
            // Add comment form
            this.itemAddComment = new DynamicForm({
                "appConfig": this.appConfig
            }).placeAt(this.commentsForm); // placeAt triggers a startup call to itemAddComment

            // Set its item and its fields
            this.itemAddComment.setItem(this.item);
            this.itemAddComment.setFields(this.commentFields);

            // See if we can pre-set its user name value
            if (userInfo && userInfo.name) {
                this.itemAddComment.presetFieldValue(this.appConfig.commentNameField, userInfo.name);
            } else {
                this.itemAddComment.presetFieldValue(this.appConfig.commentNameField, null);
            }

            // Show the form
            this.itemAddComment.show();
        },

        hideCommentForm: function () {
            if (this.itemAddComment) {
                this.itemAddComment.hide();
            }
        },

        /**
         * Gets title of feature for header display
         * @param  {feature} item The feature for which to get the title
         * @return {string}      The title of the feature
         */
        getItemTitle: function (item) {
            return item.getTitle ? item.getTitle() : "";
        },

        /**
         * Gets the number of votes for an item
         * @param  {feature} item The feature for which to get the vote count
         * @return {integer}      Vote count for the item
         */
        getItemVotes: function (item) {
            return item.attributes[this.votesField] || 0;
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

        /**
         * Updates the definition and display of the current item.
         * @param {object} item Updated definition of current item
         */
        updateItem: function (item) {
            if (item === this.item) {
                this.setItem(item);
            }
        },

        /**
         * Creates a ContentPane to hold the contents of a comment.
         * @param {object} comment Comment to display; its contents come from calling
         * getContent() on it
         */
        buildCommentDiv: function (comment) {
            var commentDiv;

            commentDiv = domConstruct.create('div', {
                'class': 'comment'
            }, this.commentsList);

            new ContentPane({
                'class': 'content small-text',
                'content': comment.getContent()
            }, commentDiv).startup();
        },

        /**
         * Empties the list of comments.
         */
        clearComments: function () {
            domConstruct.empty(this.commentsList);
        }
    });
});
