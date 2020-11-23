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
define({
    root: ({
        map: {  // Map, feature layer, and comments table loading and checking
            error: "Unable to create map",
            licenseError: {
                message: "Your account is not licensed to use Configurable Apps that are not public. Please ask your organization administrator to assign you a user type that includes Essential Apps or an add-on Essential Apps license.",
                title: "Not Licensed"
            },
            warningMessageTitle: "Limited browser support",
            warningMessageAGOL: "You are using a browser that is deprecated. Some parts of this application may not work optimally or at all in this browser. Support for this browser will be discontinued in the future.</br></br>Please use the latest versions of <chrome-link>Google Chrome</chrome-link>, <firefox-link>Mozilla Firefox</firefox-link>, <safari-link>Apple Safari</safari-link>, or <edge-link>Microsoft Edge</edge-link>.</br></br>For more information on browser support, see our documentation. Provide your feedback through <feedback-link>GeoNet, the Esri Community</feedback-link>.",
            warningMessageEnterprise: "You are using a browser that is no longer supported. Some parts of this application may not work optimally or at all in this browser.</br></br>Please use the latest versions of <chrome-link>Google Chrome</chrome-link>, <firefox-link>Mozilla Firefox</firefox-link>, <safari-link>Apple Safari</safari-link>, or <edge-link>Microsoft Edge</edge-link>.",
            layerLoad: "Unable to fully load map",
            missingItemsFeatureLayer: "Please configure the application to use a feature layer"
        },
        sidebar_header: {  // Top panel of right-side display; contains social media sign-in, help button, title
            menuButtonTooltip: "Show menu",
            signInButton: "Sign In",
            signInButtonTooltip: "Sign in",
            signOutButton: "Sign Out",
            signOutButtonTooltip: "Sign out",
            helpButtonLabel: "Help",
            helpButtonTooltip: "Learn more",
            filterButtonLabel: "Filter",
            gotoListViewLabel: "List View",
            gotoListViewTooltip: "Go to list view", // Go to List view tooltip text
            gotoMapViewLabel: "Map View",
            gotoMapViewTooltip: "Go to map view" // Tooltip for map-it icon in list header
        },
        popup_Close: {  // Close button for help and social-media-sign-in popup box
            closeButtonTooltip: "Close"
        },
        social_media: {  // Social media sign-in/out
            signInHeaderTitle : "Social Media Sign In",
            signIntoFacebookTooltip: "Sign in with Facebook",
            signIntoGooglePlusTooltip: "Sign in with Google+",
            signIntoTwitterTooltip: "Sign in with Twitter",
            signOutOfFacebookTooltip: "Sign out of Facebook",
            signOutOfGooglePlusTooltip: "Sign out of Google+",
            signOutOfTwitterTooltip: "Sign out of Twitter"
        },
        dynamic_form: {  // General-purpose form; used to receive comment entry
            optionalFormItemFlag: " (optional)",
            requiredFormItemFlag: " (required)",
            unsettableRequiredField: "A required field is neither initialized nor in the form",
            countOfRemainingCharactersTooltip: "Characters remaining",
            attachmentsHeading: "Attachments",
            addAttachmentTooltip: "Add attachment",
            removeAttachmentTooltip: "Remove attachment",
            cancelButtonLabel: "Cancel",
            submitButtonLabel: "Submit"
        },
        item_details: {  // Detailed information about an item and a list of its comments
            likeButtonTooltip: "Vote for this item",
            likeButtonInverseTooltip: "Vote counted",
            commentButtonTooltip: "Add a comment",
            gotoMapViewTooltip: "Go to map view",
            galleryButtonTooltip: "See attached files",
            commentsListHeading: "Comments",
            noCommentsPlaceholder: "No comments",
            numberOfAttachmentsUploaded: "${0} attachment(s) uploaded",
            numberOfAttachmentsUploadedAndFailed: "${0} attachment(s) uploaded<br>${1} attachment(s) could not be uploaded"
        },
        item_list: {  // List of feature layer items
            linkToMapViewOptionLabel: "Filter list by map",
            linkToMapViewOptionTooltip: "List features that are visible in the current map",
            likesForThisItemTooltip: "Votes for this item"
        },
        filter: {
            filterPanelHeaderText: "Defined Filters",
            selectOption : "Select",
            applyButton :"Apply",
            hintLabel: "Hint : ${hintLabelText}",
            uniqueRadioBtnLabel: "unique",
            valueRadioBtnLabel : "value",
            andTextLabel: "and",
            noFilterConfiguredMessage: "No 'Ask For Values or time enable layer' filters are configured in the web map",
            singleFieldDateTimeLabel:"Event date and time",
            multiFieldStartDateTimeLabel:"Start date and time",
            multiFieldEndDateTimeLabel:"End date and time",

        }
    }),
    "ar": 1,
    "bs": 1,
    "ca": 1,
    "cs": 1,
    "da": 1,
    "de": 1,
    "el": 1,
    "es": 1,
    "et": 1,
    "fi": 1,
    "fr": 1,
    "he": 1,
    "hr": 1,
    "hu": 1,
    "id": 1,
    "it": 1,
    "ja": 1,
    "ko": 1,
    "lt": 1,
    "lv": 1,
    "nb": 1,
    "nl": 1,
    "pl": 1,
    "pt-br": 1,
    "pt-pt": 1,
    "ro": 1,
    "ru": 1,
    "sk": 1,
    "sl": 1,
    "sr": 1,
    "sv": 1,
    "th": 1,
    "tr": 1,
    "uk": 1,
    "vi": 1,
    "zh-cn": 1,
    "zh-hk": 1,
    "zh-tw": 1
});
