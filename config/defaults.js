/*global define,location */
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
define({
    //Default configuration settings for the application. This is where you'll define things like a bing maps key,
    //default web map, default app color theme and more. These values can be overwritten by template configuration settings and url parameters.
    "appid": "",
    "webmap": "56197689ee7e4a8aa9f0d8da09ffe721",
    "oauthappid": null, //"AFTKRmv16wj14N3z",
    //Group templates must support a group url parameter. This will contain the id of the group.
    "group": "",
    //Enter the url to the proxy if needed by the application. See the 'Using the proxy page' help topic for details
    //http://developers.arcgis.com/en/javascript/jshelp/ags_proxy.html
    "proxyurl": "proxy/proxy.ashx",

    //Template-specific properties in AGOL configuration
    "title": "Crowdsource Polling",
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
    "showAllFeatures": "true",
    "showListViewFirst": "true",
    "commentNameField": "NAME",
    "allowFacebook": false,
    "facebookAppId": "",
    "allowGoogle": false,
    "googleplusClientId": "",
    "allowTwitter": true,
    "socialMediaDisclaimer": "Choose how you would like to sign in to this application. The name associated with your social media account will be added to any comments you post.",
    "showDisplayTextAsSplashScreen": false,
    // Setup the app to support a custom url parameter. Use this if you want users
    // to be able to search for a string field in a layer. For example if the web map
    // has parcel data and you'd like to be able to zoom to a feature using its parcel id
    // you could add a custom url param named parcel then users could enter
    // a value for that param in the url. index.html?parcel=3203
    "customUrlLayer": {
        "id": null, // id of the search layer as defined in the web map
        "fields": [] // Name of the string field to search
    },
    "customUrlParam": null, //Name of url param. For example parcels

    // Color can be specified using either a single color ('color') or a set of six colors;
    // we'll default to the single color for backwards compatibility. If the any of the remaining
    // five colors are specified in the application, they take precedence; otherwise (as with an older
    // application in which only 'color' is specified), they are generated from the single color.
    "defaultTheme": {
        "titleIcon": "images/banner.png",
        "color": "#206bdb", // this serves as the headerTextColor
        "headerBackgroundColor": "white",
        "bodyTextColor": "black",
        "bodyBackgroundColor": "white",
        "buttonTextColor": "#206bdb",
        "buttonBackgroundColor": "white"
    },

    "commentPeriod": "Closed",
    "commentPeriodDialogTitle": "Comment period closed",
    "commentPeriodDialogContent": "We are no longer accepting comments for this project.",

    //Other template-specific properties
    "helpIcon": "[{'shape':{'type':'path','path':'M 9.6 0C 4.4 0 0.1 4.3 0.1 9.5 0.1 14.7 4.4 19 9.6 19 14.8 19 19.1 14.7 19.1 9.5 19.1 4.3 14.8 0 9.6 0zM 11 15.5c 0 0.2-0.1 0.3-0.3 0.3H 8.6c-0.2 0-0.3-0.1-0.3-0.3v-2.1c 0-0.2 0.1-0.3 0.3-0.3h 2.1c 0.2 0 0.3 0.1 0.3 0.3v 2.1zM 13 8.4C 12.8 8.7 12.4 9 11.9 9.5l-0.5 0.4c-0.2 0.2-0.4 0.4-0.4 0.6 0 0.1-0.1 0.3-0.1 0.8 0 0.2-0.1 0.3-0.3 0.3H 8.7c-0.1 0-0.2 0-0.2-0.1C 8.4 11.4 8.4 11.4 8.4 11.3 8.4 10.4 8.5 9.9 8.7 9.5 8.8 9.1 9.2 8.7 9.8 8.3L 10.3 7.9C 10.4 7.8 10.6 7.7 10.6 7.5 10.8 7.3 10.8 7.1 10.8 6.8 10.8 6.5 10.7 6.2 10.5 6 10.4 5.8 10 5.7 9.6 5.7 9.2 5.7 8.9 5.8 8.7 6.1 8.5 6.4 8.4 6.7 8.4 7.1 8.4 7.3 8.3 7.4 8.1 7.4H 6C 5.9 7.4 5.8 7.4 5.8 7.3 5.7 7.2 5.7 7.2 5.7 7.1 5.8 5.6 6.3 4.6 7.3 3.9 7.9 3.5 8.7 3.3 9.6 3.3c 1.1 0 2.1 0.3 2.9 0.8 0.8 0.6 1.2 1.4 1.2 2.6-0.1 0.6-0.3 1.2-0.7 1.7z'},'fill':{'r':0,'g':122,'b':194,'a':1}}]",
    "likeIcon": "[{'shape': {'type': 'path', 'path': 'm 11.017346,1.9360981 c -0.3,-0.7 -0.800001,-1.30000004 -1.6000008,-1.6 -0.7,-0.3 -1.4,-0.4 -2.1,-0.2 -0.7,0.2 -1.3,0.69999996 -1.7,1.3 -0.4,-0.60000004 -1,-1.1 -1.7,-1.3 -0.7,-0.2 -1.4,-0.2 -2.1,0.2 -0.8,0.39999996 -1.30000006,0.9 -1.60000006,1.6 -0.3,0.7 -0.3,1.5 0.1,2.3 0.70000006,1.7 5.20000006,5.7000001 5.20000006,5.7999999 0,-0.1 4.4999998,-4.0999999 5.2000008,-5.7999999 0.6,-0.8 0.6,-1.6 0.3,-2.3 z'},'fill':{'r':0,'g':0,'b':0,'a':.35}}]",
    "backIcon": "[{'shape': {'type': 'polyline', 'points': [{x: 12, y: 18.3}, {x: 3.4, y: 9.9}, {x: 11.8, y: 1.7}, {x: 10.2, y: 0}, {x: 1.7, y: 8.3}, {x: 1.7, y: 8.2}, {x: 0, y: 9.9}, {x: 0, y: 9.9}, {x: 0, y: 9.9}, {x: 1.7, y: 11.6}, {x: 1.7, y: 11.6}, {x: 10.3, y: 20}]}, 'fill':{'r':255,'g':255,'b':255}}]",
    "commentIcon": "[{'shape': {'type': 'polyline', 'points': [{x: 0, y: 0}, {x: 0, y: 7}, {x: 1, y: 7}, {x: 1, y: 10}, {x: 4, y: 7}, {x: 11, y: 7}, {x: 11, y: 0}]}, 'fill':{'r':255,'g':255,'b':255}}]",
    "closeIcon": "[{'shape':{'type':'path','path':'M11.469,10l7.08-7.08c0.406-0.406,0.406-1.064,0-1.469c-0.406-0.406-1.063-0.406-1.469,0L10,8.53l-7.081-7.08c-0.406-0.406-1.064-0.406-1.469,0c-0.406,0.406-0.406,1.063,0,1.469L8.531,10L1.45,17.081c-0.406,0.406-0.406,1.064,0,1.469c0.203,0.203,0.469,0.304,0.735,0.304c0.266,0,0.531-0.101,0.735-0.304L10,11.469l7.08,7.081c0.203,0.203,0.469,0.304,0.735,0.304c0.267,0,0.532-0.101,0.735-0.304c0.406-0.406,0.406-1.064,0-1.469L11.469,10z'},'fill':'none'}]",
    "mapMarkerIcon": "[{'shape':{'type':'path','path':'m 9 5a 3 3 0 1 1-6 0 3 3 0 1 1 6 0z'},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':2,'cap':'butt','join':4}},{'shape':{'type':'path','path':'m 3 6c 3 5 3 5 3 5l 3-5'},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':2,'cap':'butt','join':4}}]",
    "galleryIcon": "[{'shape':{'type':'path','path':'M 2.2 8c 0-0.3-0.1-0.6 0-0.8 0-0.4 0.5-0.4 0.7-0.5 0.4-0.1 0.6-0.3 0.9-0.4 0.2-0.3 0.6-0.4 0.8-0.6 0.3-0.1 0.6-0.4 1-0.6 0.3-0.1 0.5-0.1 0.8-0.4 0.3-0.1 0.4-0.4 0.7-0.1 0.3 0.2 0.7 0.5 1.1 0.6l 0.1 0.1c 0.2 0 0.1 0.4 0.3 0.3 0.2 0.3 0.5-0.1 0.7-0.2 0.1-0.2 0.2-0.2 0.3-0.2 0.039 0.28-0.063 0.59 0.055 0.85 0.02 0.35 0.099 0.68 0.1 1-0.014 0.33-0.0078 0.64 0.079 0.89-0.0037 0.048-0.018 0.098-0.0022 0.15'},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':1,'cap':'butt','join':4},'fill':{'r':0,'g':0,'b':0,'a':1}},{'shape':{'type':'circle','cx':3,'cy':3,'r':1},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':1,'cap':'butt','join':4}},{'shape':{'type':'rect','x':0,'y':0,'width':10,'height':8,'r':0},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':1,'cap':'butt','join':4}}]",
    "optionsIcon": "[{'shape':{'type':'path','path':'m 2 7h 28'},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':3,'cap':'round','join':4}},{'shape':{'type':'path','path':'m 2 15h 28'},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':3,'cap':'round','join':4}},{'shape':{'type':'path','path':'m 2 23h 28'},'stroke':{'type':'stroke','color':{'r':0,'g':0,'b':0,'a':1},'style':'solid','width':3,'cap':'round','join':4}}]",

    "facebookAppScope": "public_profile",
    "twitterSigninUrl": location.protocol + "//utility.arcgis.com/tproxy/signin",
    "twitterUserUrl": location.protocol + "//utility.arcgis.com/tproxy/proxy/1.1/account/verify_credentials.json?q=&include_entities=true&skip_status=true&locale=en",
    "twitterCallbackUrl": "/oauth-callback-twitter.html",

    "searchAlwaysExpanded": false, // Whether or not search button is always expanded (always shows its type-in box; true) or is dynamically expanded (false)
    "bingKey": "", //Enter the url to your organizations bing maps key if you want to use bing basemaps
    //Defaults to arcgis.com. Set this value to your portal or organization host name.
    "sharinghost": location.protocol + "//" + "www.arcgis.com",
    "units": null,
    //If your application needs to edit feature layer fields set this value to true. When false the map will
    //be created with layers that are not set to editable which allows the FeatureLayer to load features optimally.
    "editable": false,
    "helperServices": {
        "geometry": {
            "url": null
        },
        "printTask": {
            "url": null
        },
        "elevationSync": {
            "url": null
        },
        "geocode": [{
            "url": null
        }]
    }
});
