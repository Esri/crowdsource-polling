/*global define */
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
define(({
    map: {
        error: "Unable to create map",
        layerLoad: "Unable to fully load map",
        missingItems: "Item feature layer is missing",
        missingComments: "Comment table is missing",
        unsupportedRelationship: "Only a 1:1 relationship between the feature layer and the comment table is supported",
        missingVotesField: "Need to configure a field name for votes in 'ideaFields'"
    },
    sidebar_header: {
        signInButton: "Sign In",
        signInButtonTooltip: "Sign in to a social medium",
        signOutButton: "Sign Out",
        signOutButtonTooltip: "Disconnect this app from your social medium",
        helpButtonTooltip: "Find out more about this app"
    },
    popup_Close: {
        closeButtonTooltip: "Close"
    },
    social_media: {
        signIntoFacebook: "Sign in to Facebook",
        signIntoGooglePlus: "Sign in to Google+",
        signIntoTwitter: "Sign in to Twitter",
        signOutOfFacebook: "Sign in to Facebook",
        signOutOfGooglePlus: "Sign in to Google+",
        signOutOfTwitter: "Sign in to Twitter"
    },
    dynamic_form: {
        optional: " (optional)",
        charactersRemaining: "Characters remaining",
        cancel: "Cancel",
        submit: "Submit Comment"
    },
    item_details: {
        untitledItem: "Untitled Item",
        anonymousUser: "Anonymous"
    },
    item_list: {
        untitledItem: "Untitled Item",
        linkToMapView: "Link to map view"
    }
}));
