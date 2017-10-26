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
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/sniff",
    "dojo/string",
    "dojo/topic",
    "dojo/on",
    "dojo/NodeList-dom",

    "application/lib/SvgHelper",

    "dijit/layout/ContentPane",

    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",

    "esri/urlUtils",

    "application/widgets/DynamicForm/DynamicForm",
    "application/widgets/PopupWindow/PopupWindow",

    "dojo/text!./ItemDetailsView.html"
], function (declare, lang, array, dom, domConstruct, domStyle, domClass, domAttr, query, has, string, topic, on, nld,
    SvgHelper,
    ContentPane,
    _WidgetBase, _TemplatedMixin,
    urlUtils,
    DynamicForm, PopupWindow,
    template) {

    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,

        /**
         * Constructor for class.
         * @param {object} appConfig App configuration object; see subclass for required parameter(s)
         * @memberOf social#
         * @constructor
         */
        constructor: function () {
            this.id = "itemDetail";
            this.baseClass = "itemDetail";
            this.itemTitle = "default title";
            this.itemVotes = null;
            this.actionVisibilities = {
                "showVotes": false,
                "showComments": false,
                "showGallery": false
            };
            this.votesField = null;
            this.commentFields = null;
            this.votedItemList = [];
            this._likeButtonClickHandler = null;
            this._commentButtonClickHandler = null;
        },

        /**
         * Widget post-create, called automatically in widget creation
         * life cycle, after constructor. Sets class variables.
         */
        postCreate: function () {
            this.inherited(arguments);
            this.i18n = this.appConfig.i18n.item_details;
            this.initCommentsDiv();
            this.initContentPane();
            this.hide();
        },

        /**
         * Adds icons and listener setup to custom post-DOM-creation steps.
         */
        startup: function () {
            this.inherited(arguments);
            this.initTemplateIcons();
            this.addListeners();
        },

        /**
         * Shows the widget and, if permitted and possible, the votes and comments
         * buttons and areas.
         */
        show: function () {
            // Adjust visibility of details buttons
            if (!this.actionVisibilities.showVotes || !this.votesField) {
                domStyle.set(this.likeButton, "display", "none");
                domStyle.set(this.itemVotesGroup, "display", "none");
            }
            if (!this.actionVisibilities.addComments) {
                domStyle.set(this.commentButton, "display", "none");
            }
            if (!this.actionVisibilities.showComments || !this.commentFields) {
                domStyle.set(this.commentsHeading, "display", "none");
                domStyle.set(this.noCommentsDiv, "display", "none");
                domStyle.set(this.commentsList, "display", "none");
            }
            if (this.appConfig.commentPeriod != "Open") {
                domClass.add(this.likeButton, "inactive");
                domAttr.set(this.likeButton, "title", this.appConfig.commentPeriodDialogContent);
                if (this._likeButtonClickHandler) {
                    this._likeButtonClickHandler.remove();
                    this._likeButtonClickHandler = null;
                }
                this._likeButtonClickHandler = on(this.likeButton, "click",
                    lang.hitch(this, this.showCommentPeriodClosedPopup));

                domClass.add(this.commentButton, "inactive");
                domAttr.set(this.commentButton, "title", this.appConfig.commentPeriodDialogContent);
                if (this._commentButtonClickHandler) {
                    this._commentButtonClickHandler.remove();
                    this._commentButtonClickHandler = null;
                }
                this._commentButtonClickHandler = on(this.commentButton, "click",
                    lang.hitch(this, this.showCommentPeriodClosedPopup));
            }

            // Show the details
            domStyle.set(this.domNode, "display", "");
            domStyle.set("headerMessageDiv", "display", "none");

            // Scroll to the top of the details; needed for Firefox
            this.scrollIntoView(this.descriptionDiv);
        },

        showCommentPeriodClosedPopup: function () {
            topic.publish("showMessagePopup",
                this.appConfig.commentPeriodDialogContent, this.appConfig.commentPeriodDialogTitle);
        },

        /**
         * Hides the widget with a simple display: "none"
         */
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
            this.destroyCommentForm();
        },

        /**
         * Creates the icons for the Like, Comment, Gallery buttons and gives them their
         * i18n labels and tooltips.
         * <br>Needs to be run after postCreate, such as in startup, because of SVG icons; see
         * https://code.google.com/p/tatami/issues/detail?id=40
         */
        initTemplateIcons: function () {
            var backIconSurface, votesIconSurface;

            backIconSurface = SvgHelper.createSVGItem(this.appConfig.backIcon, this.backIcon, 12, 20);
            SvgHelper.changeColor(backIconSurface, this.appConfig.theme.header.background);

            votesIconSurface = SvgHelper.createSVGItem(this.appConfig.likeIcon, this.itemVotesIcon, 12, 12);
            SvgHelper.changeColor(votesIconSurface, this.appConfig.theme.accents.headerAlt);

            this.likeIconSurface = SvgHelper.createSVGItem(this.appConfig.likeIcon, this.likeIcon, 12, 12);
            SvgHelper.changeColor(this.likeIconSurface, this.appConfig.theme.button.text);
            domAttr.set(this.likeButton, "title", this.i18n.likeButtonTooltip);

            this.commentIconSurface = SvgHelper.createSVGItem(this.appConfig.commentIcon, this.commentIcon, 12, 12);
            SvgHelper.changeColor(this.commentIconSurface, this.appConfig.theme.button.text);
            domAttr.set(this.commentButton, "title", this.i18n.commentButtonTooltip);

            this.mapIconSurface = SvgHelper.createSVGItem(this.appConfig.mapMarkerIcon, this.mapIcon, 12, 12);
            SvgHelper.changeColor(this.mapIconSurface, this.appConfig.theme.button.text);
            domAttr.set(this.mapButton, "title", this.i18n.gotoMapViewTooltip);

            this.galleryIconSurface = SvgHelper.createSVGItem(this.appConfig.galleryIcon, this.galleryIcon, 12, 12);
            SvgHelper.changeColor(this.galleryIconSurface, this.appConfig.theme.button.text);
            domAttr.set(this.galleryButton, "title", this.i18n.galleryButtonTooltip);
        },

        /**
         * Sets the invert state of a button.
         * @param {object} svgSurface The SVG surface returned by SvgHelper.createSVGItem for the button
         * @param {boolean} toInvert Whether button should be shown in inverted state (true) or not
         * @param {object} button The button to modify; the button contains the SVG icon
         * @param {object} icon The icon img in the button
         * @param {object} tooltip Whether like button's tooltip should be changed or not
         */
        invertButton: function (svgSurface, toInvert, button, icon, tooltip) {
            if (toInvert) {
                domClass.remove(button, "themeButton");
                domClass.add(button, "themeButtonInverted");
                SvgHelper.changeColor(svgSurface, this.appConfig.theme.button.background);
            }
            else {
                domClass.remove(button, "themeButtonInverted");
                domClass.add(button, "themeButton");
                SvgHelper.changeColor(svgSurface, this.appConfig.theme.button.text);
            }
            if (tooltip) {
                domAttr.set(button, "title", tooltip);
            }
        },

        /**
         * Sets up the i18n comments-list heading and the no-comments planceholder.
         */
        initCommentsDiv: function () {
            this.commentsHeading.innerHTML = this.i18n.commentsListHeading;
            this.noCommentsDiv.innerHTML = this.i18n.noCommentsPlaceholder;
        },

        /**
         * Sets up the click listeners for widget's buttons.
         */
        addListeners: function () {
            var self = this;
            this.own(
                on(this.backIcon, "click", function () {
                    topic.publish("closeMessage");
                    topic.publish("detailsCancel");
                }),
                this._commentButtonClickHandler = on(this.commentButton, "click", function () {
                    topic.publish("closeMessage");
                    topic.publish("getComment", self.item);
                }),
                on(this.mapButton, "click", function () {
                    topic.publish("closeMessage");
                    topic.publish("detailsCancel", true);
                }),
                on(this.galleryButton, "click", function () {
                    topic.publish("closeMessage");
                    topic.publish("showGallery", self.item);
                    if (domStyle.get(self.gallery, "display") === "none") {
                        self.showGallery();
                    }
                    else {
                        self.hideGallery();
                    }
                }),
                on(dom.byId("headerMessageButton"), "click", function () {
                    topic.publish("closeMessage");
                })
            );

            topic.subscribe("showMessage", function (message) {
                dom.byId("headerMessageContent").innerHTML = message;
                domStyle.set("headerMessageDiv", "display", "block");
            });
            topic.subscribe("closeMessage", function () {
                dom.byId("headerMessageContent").innerHTML = "";
                domStyle.set("headerMessageDiv", "display", "none");
            });
        },

        /**
         * Sets the fields that are needed to display feature information in this list (number of votes).
         * Needs to be called before first setItems to tell the widget which fields to look for.
         * @param {string} votesField Name of votes property
         * @param {array} commentFields Fields used by comment-entry form
         */
        setItemFields: function (votesField, commentFields) {
            this.votesField = votesField;
            this.commentFields = commentFields;
        },

        /**
         * Sets the permitted visibility of the votes, comments, and gallery buttons and the comments themselves
         * @param {boolean} showVotes Display button if the votes field is known
         * @param {boolean} addComments Display button if the comments fields are known
         * @param {boolean} showComments Display comments if the comments fields are known
         * @param {boolean} showGallery Display button if current item has attachments
         */
        setActionsVisibility: function (showVotes, addComments, showComments, showGallery) {
            this.actionVisibilities = {
                "showVotes": showVotes,
                "addComments": addComments,
                "showComments": showComments,
                "showGallery": showGallery
            };
        },

        /**
         * Creates the div to hold the current item's popup.
         */
        initContentPane: function () {
            var self = this;
            this.itemCP = new ContentPane({
                id: "itemCP"
            }, this.descriptionDiv);
            this.itemCP.startup();

            topic.subscribe("startUploadProgress", function () {
                domStyle.set("commentProgressBar", "width", "0%");
                domStyle.set("commentProgressContainer", "display", "block");
            });
            topic.subscribe("updateUploadProgress", function (percentDone) {
                domStyle.set("commentProgressBar", "width", percentDone + "%");
            });
            topic.subscribe("stopUploadProgress", function (numSucceeded, numFailed) {
                var message;

                // Report results of upload
                if (numFailed === 0) {
                    message = string.substitute(self.i18n.numberOfAttachmentsUploaded, [numSucceeded]);
                    domClass.replace("headerMessageType", "alert-info", "alert-danger");
                }
                else {
                    message = string.substitute(self.i18n.numberOfAttachmentsUploadedAndFailed, [numSucceeded, numFailed]);
                    domClass.replace("headerMessageType", "alert-danger", "alert-info");
                }
                topic.publish("showMessage", message);

                // Clear the progress bar, but not abruptly
                domStyle.set("commentProgressBar", "width", "100%");
                setTimeout(function () {
                    domStyle.set("commentProgressContainer", "display", "none");
                    domStyle.set("commentProgressBar", "width", "0%");
                }, 2000);
            });
        },

        /**
         * Clears the display, sets the current item, and creates its display.
         * @param {object} item Item to become the current display item
         * Checks if the item is already voted; if yes like button's color and tooltip is changed
         * else a vote is registered and button's color, tooltip is changed. Then the event handler is removed.
         */
        setItem: function (item) {
            this.item = item;
            this.clearGallery();

            this.itemTitle = this.getItemTitle(item) || "&nbsp;";
            this.itemVotes = this.getItemVotes(item);
            this.clearItemDisplay();
            this.buildItemDisplay();

            var objectId = item.attributes[item._layer.objectIdField];

            if (this._likeButtonClickHandler) {
                this._likeButtonClickHandler.remove();
                this._likeButtonClickHandler = null;
            }

            if (array.indexOf(this.votedItemList, objectId) > -1) {
                this.invertButton(this.likeIconSurface, true, this.likeButton, this.likeIcon, this.i18n.likeButtonInverseTooltip);

            }
            else {
                this._likeButtonClickHandler = on(this.likeButton, "click", lang.hitch(this, function () {
                    var objectId = this.item.attributes[this.item._layer.objectIdField];

                    if (array.indexOf(this.votedItemList, objectId) === -1) {
                        topic.publish("addLike", this.item);
                        this.votedItemList.push(objectId);
                        this.invertButton(this.likeIconSurface, true, this.likeButton, this.likeIcon, this.i18n.likeButtonInverseTooltip);
                        this._likeButtonClickHandler.remove();
                        this._likeButtonClickHandler = null;
                    }
                }));

                this.invertButton(this.likeIconSurface, false, this.likeButton, this.likeIcon, this.i18n.likeButtonTooltip);
            }

        },

        /**
         * Updates the votes display of the current item.
         * @param {object} item Updated definition of current item; if it does not have
         * the same object id as the current item, nothing happens
         */
        updateItemVotes: function (item) {
            if (item.attributes[item._layer.objectIdField] === this.item.attributes[this.item._layer.objectIdField]) {
                this.itemVotes = this.getItemVotes(item);
                this.redrawItemVotes();
            }
        },

        /**
         * Updates the contents of the votes display div, including applying a class to get a bit
         * more space if needed; hides votes display if votes field is not known.
         */
        redrawItemVotes: function () {
            if (this.itemVotes) {
                if (this.itemVotes.needSpace) {
                    domClass.add(this.itemTitleDiv, "itemDetailTitleOverride");
                }
                this.itemVotesDiv.innerHTML = this.itemVotes.label;
            }
            else {
                domStyle.set(this.itemVotesGroup, "display", "none");
            }
        },

        /**
         * Shows the attachments for the current item if there are any and it is permitted;
         * hides the gallery button otherwise.
         * @param {array} attachments List of attachments for item
         */
        setCurrentItemAttachments: function (attachments) {
            var showGalleryButton =
                this.actionVisibilities.showGallery && attachments && attachments.length > 0;
            if (showGalleryButton) {
                this.setAttachments(this.gallery, attachments);
                domStyle.set(this.galleryButton, "display", "inline-block");
            }
        },

        /**
         * Shows the attachments for the current item if there are any and it is permitted;
         * hides the gallery button otherwise.
         * @param {object} gallery DOM container for attachments
         * @param {array} attachments List of attachments for item
         */
        setAttachments: function (gallery, attachments) {
            if (!this.enlargedViewPopup) {
                // Popup window for enlarged image
                this.enlargedViewPopup = new PopupWindow({
                    "appConfig": this.appConfig,
                    "showClose": true
                }).placeAt(document.body); // placeAt triggers a startup call to _helpDialogContainer
            }

            this.updateGallery(gallery, attachments);
        },

        /**
         * Adds the specified attachments to the item's gallery.
         * @param {object} gallery DOM container for attachments
         * @param {array} attachments List of attachments for item
         */
        updateGallery: function (gallery, attachments) {
            // Create gallery

            array.forEach(attachments, lang.hitch(this, function (attachment) {
                var urlsplit, thumb, srcURL, attachmentUrl;

                if (attachment.contentType === "image/jpeg" || attachment.contentType === "image/png") {
                    urlsplit = attachment.url.split("?");
                    if (urlsplit.length > 1) {
                        srcURL = urlsplit[0] + "/" + attachment.name + "?" + urlsplit[1];
                    }
                    else {
                        srcURL = urlsplit[0] + "/" + attachment.name;
                    }
                    thumb = domConstruct.create("img", {
                        "class": "attachment",
                        "title": attachment.name,
                        "src": srcURL
                    }, gallery);
                    this.own(on(thumb, "click", lang.hitch(this, function (attachment) {
                        domConstruct.empty(this.enlargedViewPopup.popupContent);
                        var imgContainer = domConstruct.create("div", {
                            "class": "popupImgContent"
                        }, this.enlargedViewPopup.popupContent);
                        domConstruct.create("img", {
                            "class": "attachment",
                            "src": srcURL
                        }, imgContainer);
                        this.enlargedViewPopup.show();
                    })));

                }
                else if (attachment.contentType === "application/pdf") {
                    thumb = domConstruct.create("img", {
                        "class": "attachment",
                        "title": attachment.name,
                        "src": "images/pdficon_large.png"
                    }, gallery);
                    attachmentUrl = attachment.url;
                    this.own(on(thumb, "click", lang.hitch(this, function () {
                        window.open(attachmentUrl, "_blank");
                    })));

                }
                else if (attachment.url && attachment.url.length > 0) {
                    thumb = domConstruct.create("img", {
                        "class": "attachment",
                        "title": attachment.name,
                        "src": "images/file_wht.png"
                    }, gallery);
                    attachmentUrl = attachment.url;
                    this.own(on(thumb, "click", lang.hitch(this, function () {
                        window.open(attachmentUrl, "_blank");
                    })));
                }

            }));
        },

        /**
         * Clears the gallery.
         */
        clearGallery: function () {
            domStyle.set(this.galleryButton, "display", "none");
            this.hideGallery();
            domConstruct.empty(this.gallery);
        },

        /**
         * Makes the gallery visible.
         */
        showGallery: function () {
            domStyle.set(this.gallery, "display", "block");
            this.invertButton(this.galleryIconSurface, true, this.galleryButton, this.galleryIcon);
        },

        /**
         * Hides the gallery.
         */
        hideGallery: function () {
            domStyle.set(this.gallery, "display", "none");
            this.invertButton(this.galleryIconSurface, false, this.galleryButton, this.galleryIcon);
        },

        /**
         * Creates the comment form anew and makes it visible.
         * @param {object} [userInfo] User social-media sign-in info, of which function uses the "name" attribute
         * to pre-populate the comment name field if one is configured in the app's commentNameField attribute
         */
        showCommentForm: function (userInfo) {
            if (this.commentFields) {
                if (!this.itemAddComment) {
                    // Create comment form
                    this.itemAddComment = new DynamicForm({
                        "appConfig": this.appConfig
                    }).placeAt(this.commentsForm); // placeAt triggers a startup call to itemAddComment

                    // Set its item and its fields
                    this.itemAddComment.setItem(this.item);
                    this.itemAddComment.setFields(this.commentFields);

                    // See if we can pre-set its user name value
                    if (userInfo && userInfo.name && this.appConfig.commentNameField && this.appConfig.commentNameField.length > 0) {
                        this.itemAddComment.presetFieldValue(this.appConfig.commentNameField, userInfo.name);
                    }
                }

                // Show the form
                this.itemAddComment.show();
                this.invertButton(this.commentIconSurface, true, this.commentButton, this.commentIcon);

                // Scroll the comment form into view if needed
                this.scrollIntoView(this.itemAddComment.domNode);
            }
        },

        /**
         * Destroys the comment form.
         */
        destroyCommentForm: function () {
            if (this.itemAddComment) {
                this.itemAddComment.destroy();
                this.itemAddComment = null;
                this.invertButton(this.commentIconSurface, false, this.commentButton, this.commentIcon);

                // Scroll to the top of the details to restore context
                this.scrollIntoView(this.descriptionDiv);
            }
        },

        /**
         * Scrolls a container node to make a specified node visible.
         * @param {object} nodeToMakeVisible Node that's to be brought into view
         */
        scrollIntoView: function (nodeToMakeVisible) {
            // Firefox defaults to former scroll position if we're returning to a previously-scrolled node (which could
            // be a different item's details--they go into the same scrollable div). The scrollIntoView can't change this
            // unless it occurs a little later than the default behavior, hence the setTimeout.
            if (!has("ff")) {
                nodeToMakeVisible.scrollIntoView();
            }
            else {
                setTimeout(function () {
                    nodeToMakeVisible.scrollIntoView();
                }, 500);
            }
        },

        /**
         * Gets title of feature for header display
         * @param  {feature} item The feature for which to get the title
         * @return {string}      The title of the feature
         */
        getItemTitle: function (item) {
            return item.getTitle ? this.stripTags(item.getTitle()) : "";
        },

        /**
         * Removes HTML tags from a string
         * @param {string} str String possibly containing HTML tags
         * @return {string} Cleaned string
         * @see http://dojo-toolkit.33424.n3.nabble.com/Stripping-HTML-tags-from-a-string-tp3999505p3999576.html
         */
        stripTags: function (str) {
            return domConstruct.create("div", {
                innerHTML: str
            }).textContent;
        },

        /**
         * Gets the number of votes for an item
         * @param  {feature} item The feature for which to get the vote count
         * @return {null|object} Object containing "label" with vote count for the item in a shortened form
         * (num if <1000, floor(count/1000)+"k" if <1M, floor(count/1000000)+"M" otherwise) and "needSpace"
         * that's indicates if an extra digit of room is needed to handle numbers between 99K and 1M, exclusive;
         * returns null if the feature layer's votes field is unknown
         */
        getItemVotes: function (item) {
            var needSpace = false,
                votes;

            if (this.votesField) {
                votes = item.attributes[this.votesField] || 0;
                if (votes > 999) {
                    if (votes > 99999) {
                        needSpace = true;
                    }
                    if (votes > 999999) {
                        votes = Math.floor(votes / 1000000) + "M";
                    }
                    else {
                        votes = Math.floor(votes / 1000) + "k";
                    }
                }
                return {
                    "label": votes,
                    "needSpace": needSpace
                };
            }
            return null;
        },

        /**
         * Completely clears the display for the current item.
         */
        clearItemDisplay: function () {
            this.itemTitleDiv.innerHTML = "";
            this.itemVotesDiv.innerHTML = "";
            this.itemCP.set("content", "");
        },

        /**
         * Builds the display for the current item.
         */
        buildItemDisplay: function () {
            this.itemTitleDiv.innerHTML = this.itemTitle;
            this.redrawItemVotes();
            this.itemCP.set("content", this.item.getContent());
        },

        /**
         * Clears the comments display and builds a new one based upon the supplied list.
         * @param {array} commentsArr List of comment objects
         */
        setComments: function (commentsArr) {
            this.clearComments();
            domClass.toggle(this.noCommentsDiv, "hide", commentsArr.length);
            array.forEach(commentsArr, lang.hitch(this, this.buildCommentDiv));
        },

        /**
         * Creates a ContentPane to hold the contents of a comment.
         * @param {object} comment Comment to display; its contents come from calling
         * getContent() on it
         */
        buildCommentDiv: function (comment) {
            var commentDiv, attachmentsDiv;

            commentDiv = domConstruct.create("div", {
                "class": "comment"
            }, this.commentsList);

            new ContentPane({
                "class": "content small-text",
                "content": comment.getContent()
            }, commentDiv).startup();

            if (comment._layer.hasAttachments) {
                attachmentsDiv = domConstruct.create("div", {
                    "class": "attachmentsSection2"
                }, commentDiv);

                comment._layer.queryAttachmentInfos(comment.attributes[comment._layer.objectIdField],
                    lang.hitch(this, function (attachments) {
                        this.setAttachments(attachmentsDiv, attachments);
                    }),
                    function (error) {
                        console.log(error);
                    }
                );
            }
        },

        /**
         * Empties the list of comments.
         */
        clearComments: function () {
            domConstruct.empty(this.commentsList);
        }
    });
});
