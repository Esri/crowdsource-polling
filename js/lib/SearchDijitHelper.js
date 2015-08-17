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
//============================================================================================================================//
define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "esri/dijit/Search",
    "dojo/domReady!"
], function (
    declare,
    array,
    Search
) {

    //========================================================================================================================//

    return {

        /**
         * Creates the Search dijit in the map using the webmap's search configuration.
         * @param {object} map Application's map object
         * @param {array} orgGeocoders List of geocoders configured for organization
         * @param {object} appProperties Webmap's applicationProperties structure
         * @param {string|object} srcNode Reference or id of the HTML element where the widget should be rendered
         */
        createSearchDijit: function (map, orgGeocoders, appProperties, srcNode) {
            // Organization may have geocoders configured; otherwise, we'll use the default source described in
            // https://developers.arcgis.com/javascript/jsapi/search-amd.html#sources
            //   [
            //     {
            //       locator: new Locator("//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer"),
            //       singleLineFieldName: "SingleLine",
            //       outFields: ["Addr_type"],
            //       name: i18n.widgets.Search.main.esriLocatorName,
            //       localSearchOptions: {
            //         minScale: 300000,
            //         distance: 50000
            //       },
            //       placeholder: i18n.widgets.Search.main.placeholder,
            //       highlightSymbol: new PictureMarkerSymbol(this.basePath + "/images/search-pointer.png", 36, 36).setOffset(9, 18)
            //     }
            //   ]
            //
            // Webmap's application properties, if it exists, can contain search parameters. Default search is equivalent to
            //   "applicationProperties": {
            //       "viewing": {
            //           "search": {
            //               "enabled": true,
            //               "disablePlaceFinder": false,  // i.e., turn off address geocoding
            //               "hintText": "",  // replaced with internationalized "Find place or address"
            //               "layers": []  // i.e., enable searching in these layers
            //           }
            //       }
            //   }
            //
            //   Example of feature layer configuration
            //               "layers": [{
            //                   "id": "LandUseCasesVotesComments_8488",
            //                   "field": {
            //                       "name": "CASEID",
            //                       "exactMatch": false,
            //                       "type": "esriFieldTypeString"
            //                   }
            //               }]




            var searchControl = new Search({
                addLayersFromMap: true,
                enableButtonMode: true,
                enableInfoWindow: false,
                map: map
            }, srcNode);
            searchControl.startup();

        }
    };

    //========================================================================================================================//

});
