/*global define,document,alert,dojo,navigator */
/*jslint sloppy:true */
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
define(function () {
    return {
        /**
        * Returns the image logo template for limited browser support modal
        * @memberOf utils/utils
        */
        getBrowserSupportLogoTemplate: function () {
            return '<ul id="browser-logo-list">' +
                '<li class="browser-logo"><a href="https://www.google.com/chrome/"><img alt="Chrome" src="./images/chrome.png"></a></li>' +
                '<li class="browser-logo"><a href="https://www.mozilla.org/firefox/"><img alt="Firefox" src="./images/firefox.png"></a></li>' +
                '<li class="browser-logo"><a href="https://www.apple.com/safari/"><img alt="Safari" src="./images/safari.png"></a></li>' +
                '<li class="browser-logo"><a href="https://www.microsoft.com/edge"><img alt="Edge" src="./images/edge.png"></a></li>' +
                '</ul>';
        },

        /**
        * Parse the warning message for limited browser support
        * @memberOf utils/utils
        */
        parseWarningMessage: function (message) {
            if (!message) {
                return;
            }
            return message
                .replace(/\<chrome\-link\>(.+)\<\/chrome\-link\>/, '<a class="browser-message-link" href="https://www.google.com/chrome/">$1</a>')
                .replace(/\<firefox\-link\>(.+)\<\/firefox\-link\>/, '<a class="browser-message-link" href="https://www.mozilla.org/firefox/">$1</a>')
                .replace(/\<safari\-link\>(.+)\<\/safari\-link\>/, '<a class="browser-message-link" href="https://www.apple.com/safari/">$1</a>')
                .replace(/\<edge\-link\>(.+)\<\/edge\-link\>/, '<a class="browser-message-link" href="https://www.microsoft.com/edge/">$1</a>')
                .replace(/\<feedback\-link\>(.+)\<\/feedback\-link\>/, '<a class="browser-message-link" href="https://community.esri.com/community/gis/web-gis/arcgisonline">$1</a>');
        },
    };
});