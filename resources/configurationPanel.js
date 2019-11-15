{
    "values": {
        "webmap": "",
        "title": "Crowdsource Polling",
        "titleIcon": "images/banner.png",
        "displayText": "<b>Welcome to the Crowdsource Polling application</b><p>Use Crowdsource Polling to provide information and collect feedback on plans and issues around your community.</p><p>Search for a location or click an item in the list to get started.</p>",
        "featureLayer": {
            "id": "LandUseCasesVotesComments_8488",
            "fields": [{
                "id": "sortField",
                "fields": ["CASENAME"]
            }, {
                "id": "itemVotesField",
                "fields": ["VOTES"]
            }]
        },
        "ascendingSortOrder": "true",
        "showListViewFirst": "true",
        "showAllFeatures": "true",
        "commentNameField": "NAME",
        "allowFacebook": false,
        "facebookAppId": "",
        "allowGoogle": false,
        "googleplusClientId": "",
        "allowTwitter": true,
        "showRelatedFeatures" : false,
        "highlightSelectedFeature" : true,
        "socialMediaDisclaimer": "Choose how you would like to sign in to this application. The name associated with your social media account will be added to any comments you post.",
        "showDisplayTextAsSplashScreen": false,
        "customUrlLayer": {
            "id": null,
            "fields": []
        },
        "customUrlParam": null,
        "color": "#206bdb",
        "headerBackgroundColor": "white",
        "bodyTextColor": "black",
        "bodyBackgroundColor": "white",
        "buttonTextColor": "#206bdb",
        "buttonBackgroundColor": "white",
        "commentPeriod": "Open",
        "commentPeriodDialogTitle": "Feedback period closed",
        "commentPeriodDialogContent": "We are no longer accepting feedbacks for this project.",
        "submitMessage": "Thank you. Your comment has been submitted."
    },
    "configurationSettings": [{
        "category": "<b>General</b>",
        "fields": [{
            "label": "Select a map",
            "fieldName": "webmap",
            "type": "webmap",
            "conditions": ["featurelayer"],
            "tooltip": "Map displayed in the application"
        }, {
            "type": "appproxies"
        }, {
            "label": "Application title",
            "fieldName": "title",
            "type": "string",
            "tooltip": "Application name (max 23 chars)"
        }, {
            "label": "Help widget text",
            "fieldName": "displayText",
            "type": "string",
            "tooltip": "Text displayed in the help window. HTML tags can be used for formatting.",
            "stringFieldOption": "richtext"
        }, {
            "label": "Display the help widget as a splash screen",
            "fieldName": "showDisplayTextAsSplashScreen",
            "type": "boolean"
        }, {
            "type": "subcategory",
            "label": "Sign in options"
        }, {
            "type": "paragraph",
            "value": "Allow your users to sign in to this application using their social media credentials. Comments submitted by authenticated users will have the commenters name automatically stored with their feedback."
        }, {
            "label": "Field to store the name of authenticated commenters.",
            "fieldName": "commentNameField",
            "type": "string",
            "tooltip": "Field in a table with a geodatabase relationship to the selected feature layer for storing the name of authenticated commenters. Table must exist in map. Field name is case-sensitive."
        }, {
            "label": "Allow users to sign in using Twitter",
            "fieldName": "allowTwitter",
            "type": "boolean",
            "tooltip": "Enable to allow users to sign in using their Twitter credentials"
        }, {
            "label": "Sign in window text",
            "fieldName": "socialMediaDisclaimer",
            "type": "string",
            "placeholder": "",
            "tooltip": "Text to display in the Sign In window",
            "stringFieldOption": "richtext"
        }]
    }, {
        "category": "<b>Theme</b>",
        "fields": [{
            "label": "Header text color",
            "tooltip": "Set header text color",
            "type": "color",
            "sharedThemeProperty": "header.text",
            "fieldName": "color"
        }, {
            "label": "Header background color",
            "tooltip": "Set header background color",
            "type": "color",
            "sharedThemeProperty": "header.background",
            "fieldName": "headerBackgroundColor"
        }, {
            "label": "Body text color",
            "tooltip": "Set body text color",
            "type": "color",
            "sharedThemeProperty": "body.text",
            "fieldName": "bodyTextColor"
        }, {
            "label": "Body background color",
            "tooltip": "Set body background color",
            "type": "color",
            "sharedThemeProperty": "body.background",
            "fieldName": "bodyBackgroundColor"
        }, {
            "label": "Button text color",
            "tooltip": "Set button text color",
            "type": "color",
            "sharedThemeProperty": "button.text",
            "fieldName": "buttonTextColor"
        }, {
            "label": "Button background color",
            "tooltip": "Set button background color",
            "type": "color",
            "sharedThemeProperty": "button.background",
            "fieldName": "buttonBackgroundColor"
        }, {
            "label": "Application logo",
            "fieldName": "titleIcon",
            "type": "string",
            "sharedThemeProperty": "logo.small",
            "tooltip": "Icon in top left corner of application. Icon should be 48px high."
        }]
    }, {
        "category": "<b>Options</b>",
        "fields": [{
            "label": "Polling feature layer",
            "fieldName": "featureLayer",
            "type": "layerAndFieldSelector",
            "tooltip": "Point, line, or polygon layer containing the features to present in the application.",
            "layerOptions": {
                "supportedTypes": ["FeatureLayer"],
                "geometryTypes": ["esriGeometryPoint", "esriGeometryLine", "esriGeometryPolyline", "esriGeometryPolygon"]
            },
            "fields": [{
                "supportedTypes": ["esriFieldTypeSmallInteger", "esriFieldTypeInteger"],
                "multipleSelection": false,
                "fieldName": "itemVotesField",
                "label": "Field storing the vote tally for each report",
                "tooltip": "Numeric field in the selected layer for tracking the votes received for each feature. Field name is case-sensitive."
            }, {
                "supportedTypes": ["esriFieldTypeSmallInteger", "esriFieldTypeInteger", "esriFieldTypeSingle",
                    "esriFieldTypeDouble", "esriFieldTypeString", "esriFieldTypeDate"],
                "multipleSelection": false,
                "fieldName": "sortField",
                "label": "Field used for sorting the list of features",
                "tooltip": "Field in the selected layer for sorting items listed in app. If omitted, items are not sorted."
            }]
        }, {
            "type": "subcategory",
            "label": "Feature List"
        }, {
            "label": "Sort order of features using values from the field defined above",
            "fieldName": "ascendingSortOrder",
            "type": "radio",
            "tooltip": "Sorts features in ascending or descending order using the values of the sorting field. This parameter is ignored when no sorting field is specified.",
            "items":[{
                "label": "Ascending",
                "value": "true",
                "checked": true
            }, {
                "label": "Descending",
                "value": "false"
            }]
        }, {
            "label": "Initial view on mobile devices",
            "fieldName": "showListViewFirst",
            "type": "radio",
            "tooltip": "Choose to initially load a map view or a list view of the features",
            "items":[{
                "label": "Show list first",
                "value": "true",
                "checked": true
            }, {
                "label": "Show map first",
                "value": "false"
            }]
        }, {
            "label": "Initial feature display",
            "fieldName": "showAllFeatures",
            "type": "radio",
            "tooltip": "Choose to initially list all features, or to list only the features that are currently visible on the map",
            "items":[{
                "label": "Show all features",
                "value": "true",
                "checked": true
            }, {
                "label": "Show features in current map extent",
                "value": "false"
            }]
        }, {
            "type": "conditional",
            "condition": false,
            "fieldName": "showRelatedFeatures",
            "label": "Show only the selected polling feature and any related features on the map",
            "tooltip": "Reference layers that are not related to the polling layer are not filtered",
            "items": [{
                "type": "boolean",
                "condition": false,
                "fieldName": "highlightSelectedFeature",
                "label": "Highlight the selected polling feature",
                "tooltip": "Highlight the selected feature"
            }]
        }, {
            "type": "subcategory",
            "label": "Submission Message"
        }, {
            "label": "Message displayed after a report is submitted successfully",
            "tooltip": "Message displayed at the top of the form acknowledging report submission",
            "type": "string",
            "fieldName": "submitMessage"
        }, {
            "type": "subcategory",
            "label": "Feedback period"
        }, {
            "type": "radio",
            "fieldName": "commentPeriod",
            "tooltip": "Feedback period status",
            "items": [{
                "label": "Feedback period open",
                "value": "Open",
                "checked": true
            }, {
                "label": "Feedback period closed",
                "value": "Closed"
            }]
        }, {
            "label": "Feedback period closed window title",
            "tooltip": "Title of window that displays when feedback period is closed",
            "type": "string",
            "fieldName": "commentPeriodDialogTitle"
        }, {
            "label": "Feedback period closed window content",
            "tooltip": "Content of window that displays when feedback period is closed",
            "type": "string",
            "fieldName": "commentPeriodDialogContent",
            "stringFieldOption": "richtext"
        }]
    }, {
        "category": "Custom URL Parameter",
        "fields": [{
            "type": "paragraph",
            "value": "A custom URL parameter can be used to open the app to a specific feature. For example, this URL will open an app configured to have a URL parameter named <i>parcelid</i> to the feature with a value of 1234 in the configured search field: .../index.html?appid=a1b2c3&parcelid=1234."
        }, {
            "type": "paragraph",
            "value": "For best results, confiure the settings to use the URL parameter to <b>either</b> select a single feature <b>or</b> to filter the layers."
        }, {
            "placeHolder": "i.e. parcels",
            "label": "URL parameter name:",
            "fieldName": "customUrlParam",
            "type": "string",
            "tooltip": "Custom URL parameter name"
        }, {
            "type": "subcategory",
            "label": "Select Feature"
        }, {
            "type": "paragraph",
            "value": "Use a URL parameter to open the application to a specific feature without changing the visibility of features in the list or the map."
        }, {
            "type": "layerAndFieldSelector",
            "fieldName": "customUrlLayer",
            "label": "Layer to search for custom URL parameter value",
            "tooltip": "URL parameter search layer",
            "fields": [{
                "multipleSelection": false,
                "fieldName": "urlField",
                "label": "URL parameter search field",
                "tooltip": "URL parameter search field"
            }],
            "layerOptions": {
                "supportedTypes": [
                    "FeatureLayer"
                ],
                "geometryTypes": [
                    "esriGeometryPoint",
                    "esriGeometryLine",
                    "esriGeometryPolyline",
                    "esriGeometryPolygon"
                ]
            }
        }, {
            "type": "subcategory",
            "label": "Filter Layers"
        }, {
            "type": "paragraph",
            "value": "Use a URL parameter to filter the map and list to show only the features that have the provided value in the selected fields."
        }, {
            "fieldName": "searchLayers",
            "type": "multilayerandfieldselector",
            "tooltip": "Select layer and fields to search",
            "layerOptions": {
                "supportedTypes": [
                    "FeatureLayer"
                ],
                "geometryTypes": [
                    "esriGeometryPoint",
                    "esriGeometryLine",
                    "esriGeometryPolyline",
                    "esriGeometryPolygon"
                ]
            },
            "fieldOptions": {
                "supportedTypes": [
                    "esriFieldTypeSmallInteger",
                    "esriFieldTypeInteger",
                    "esriFieldTypeSingle",
                    "esriFieldTypeDouble",
                    "esriFieldTypeString",
                    "esriFieldTypeDate",
                    "esriFieldTypeOID"
                ]
            }
        }]
    }]
}
