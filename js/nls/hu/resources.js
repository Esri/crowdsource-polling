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
            error: "Nem sikerült létrehozni a térképet",
            layerLoad: "Nem sikerült teljesen betölteni a térképet",
            missingItemsFeatureLayer: "Konfigurálja az alkalmazást a vektoros réteg használatára"
        },
        sidebar_header: {  // Top panel of right-side display; contains social media sign-in, help button, title
            menuButtonTooltip: "Menü megjelenítése",
            signInButton: "Bejelentkezés",
            signInButtonTooltip: "Bejelentkezés",
            signOutButton: "Kijelentkezés",
            signOutButtonTooltip: "Kijelentkezés",
            helpButtonLabel: "Súgó",
            helpButtonTooltip: "További információk",
            gotoListViewLabel: "Listanézet",
            gotoListViewTooltip: "Váltás listanézetre", // Go to List view tooltip text
            gotoMapViewLabel: "Térképnézet",
            gotoMapViewTooltip: "Váltás térképnézetre" // Tooltip for map-it icon in list header
        },
        popup_Close: {  // Close button for help and social-media-sign-in popup box
            closeButtonTooltip: "Bezárás"
        },
        social_media: {  // Social media sign-in/out
            signInHeaderTitle : "Bejelentkezés közösségi médián keresztül",
            signIntoFacebookTooltip: "Bejelentkezés Facebook-azonosítóval",
            signIntoGooglePlusTooltip: "Bejelentkezés Google+-azonosítóval",
            signIntoTwitterTooltip: "Bejelentkezés Twitter-azonosítóval",
            signOutOfFacebookTooltip: "Kijelentkezés a Facebookból",
            signOutOfGooglePlusTooltip: "Kijelentkezés a Google+-ból",
            signOutOfTwitterTooltip: "Kijelentkezés a Twitterből"
        },
        dynamic_form: {  // General-purpose form; used to receive comment entry
            optionalFormItemFlag: " (választható)",
            requiredFormItemFlag: " (kötelező)",
            unsettableRequiredField: "Egy kötelező mező nincs inicializálva vagy nincs az űrlapon",
            countOfRemainingCharactersTooltip: "Fennmaradó karakterek",
            attachmentsHeading: "Csatolmányok",
            addAttachmentTooltip: "Csatolmány hozzáadása",
            removeAttachmentTooltip: "Csatolmány eltávolítása",
            cancelButtonLabel: "Mégse",
            submitButtonLabel: "Beküldés"
        },
        item_details: {  // Detailed information about an item and a list of its comments
            likeButtonTooltip: "Szavazás az elemre",
            likeButtonInverseTooltip: "Szavazat beszámítva",
            commentButtonTooltip: "Hozzászólás hozzáadása",
            gotoMapViewTooltip: "Váltás térképnézetre",
            galleryButtonTooltip: "Csatolt fájlok megtekintése",
            commentsListHeading: "Hozzászólások",
            noCommentsPlaceholder: "Nincs hozzászólás",
            numberOfAttachmentsUploaded: "${0} csatolmány feltöltve",
            numberOfAttachmentsUploadedAndFailed: "${0} csatolmány feltöltve<br>${1} csatolmányt nem sikerült feltölteni"
        },
        item_list: {  // List of feature layer items
            linkToMapViewOptionLabel: "Lista szűrése térkép alapján",
            linkToMapViewOptionTooltip: "Az aktuális térképen látható vektoros elemek felsorolása",
            likesForThisItemTooltip: "Elem szavazatai"
        }
    }),
    "ar": 1,
    "bs": 1,
    "ca": 0,
    "cs": 1,
    "da": 1,
    "de": 1,
    "el": 1,
    "es": 1,
    "et": 1,
    "fi": 1,
    "fr": 1,
    "he": 1,
    "hi": 1,
    "hr": 1,
    "hu": 0,
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
    "sl": 1,
    "sr": 1,
    "sv": 1,
    "th": 1,
    "tr": 1,
    "vi": 1,
    "zh-cn": 1,
    "zh-hk": 1,
    "zh-tw": 1
});
