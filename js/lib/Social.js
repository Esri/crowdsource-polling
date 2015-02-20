/*global define,dojo */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true */
/*
 | Copyright 2015 Esri
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
    "dojo/domReady!"
], function (
    declare
) {

    //========================================================================================================================//

    return declare([], {
        _isIE8: null,
        _config: null,
        _loggedIn: null,
        _user: null,
        _statusCallback: null,

        /**
         * Constructor for class.
         * @param {object} config App configuration object; see subclass for required parameter(s)
         * @memberOf social#
         * @constructor
         */
        constructor: function (config) {
            this._config = config;
        },

        /**
         * Tests if the social is available.
         * @return {boolean} The service is available or not
         * @memberOf social#
         */
        isAvailable: function () {
            return this.testForIE8();
        },

        /**
         * Initializes the social and blocks the services from IE 8 and below.
         * @param {function} statusCallback Function to call call whenever the class wants to inform
         * the calling program about the status of the service and login
         * @memberOf social#
         */
        init: function (statusCallback) {
            this._statusCallback = statusCallback;

            if (this.testForIE8()) {
                statusCallback(null);
                return;
            }
            if (this._loggedIn === null) {
                this.launch();
            }
        },

        /**
         * Loads the social.
         * @memberOf social#
         * @abstract
         */
        launch: function () {
            return null;
        },

        /**
         * Signs into the service.
         * @memberOf social#
         * @abstract
         */
        signIn: function () {
            return null;
        },

        /**
         * Signs out of the service.
         * @memberOf social#
         * @abstract
         */
        signOut: function () {
            return null;
        },

        /**
         * Returns the signed-in state.
         * @param {boolean} Logged in or not
         */
        isSignedIn: function () {
            return this._loggedIn;
        },

        /**
         * Updates the information held about the signed-in user.
         * @param {object} [response] Service-specific response object
         * @memberOf social#
         * @abstract
         */
        updateUser: function (response) {
            return null;
        },

        /**
         * Returns the currently signed-in user name and service id.
         * @return {JSON} Structure containing "name" and "id" parameters if a user is
         * logged in, an empty structure if a user is not logged in, and null if the
         * service is not available due to browser incompatibility or startup failure
         * @memberOf social#
         */
        getUser: function () {
            return this._user;
        },

        //====================================================================================================================//

        /**
         * Tests if the browser is IE 8 or lower.
         * @return {boolean} True if the browser is IE 8 or lower
         * @memberOf social#
         */
        testForIE8: function () {
            if (this._isIE8 === null) {
                this._isIE8 = this.isIE(8, "lte");
            }
            return this._isIE8;
        },

        /**
         * Detects IE and version number through injected conditional comments (no UA detect, no need for conditional
         * compilation / jscript check).
         * @param {string} [version] IE version
         * @param {string} [comparison] Operator testing multiple versions based on "version"
         * parameter, e.g., 'lte', 'gte', etc.
         * @return {boolean} Result of conditional test; note that since IE stopped supporting conditional comments with
         * IE 10, this routine only works for IE 9 and below; for IE 10 and above, it always returns "false"
         * @author Scott Jehl
         * @see The <a href="https://gist.github.com/scottjehl/357727">detect IE and version number through injected
         * conditional comments.js</a>.
         */
        isIE: function (version, comparison) {
            var cc      = 'IE',
                b       = document.createElement('B'),
                docElem = document.documentElement,
                isIE;

            if (version) {
                cc += ' ' + version;
                if (comparison) { cc = comparison + ' ' + cc; }
            }

            b.innerHTML = '<!--[if ' + cc + ']><b id="iecctest"></b><![endif]-->';
            docElem.appendChild(b);
            isIE = !!document.getElementById('iecctest');
            docElem.removeChild(b);
            return isIE;
        }

    });

    //========================================================================================================================//

});
