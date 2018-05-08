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
            error: "No es pot crear el mapa",
            layerLoad: "No es pot carregar el mapa completament",
            missingItemsFeatureLayer: "Configureu l\'aplicació perquè utilitzi una capa d\'entitats"
        },
        sidebar_header: {  // Top panel of right-side display; contains social media sign-in, help button, title
            menuButtonTooltip: "Mostra el menú",
            signInButton: "Inicia la sessió",
            signInButtonTooltip: "Inicia la sessió",
            signOutButton: "Tanca la sessió",
            signOutButtonTooltip: "Tanca la sessió",
            helpButtonLabel: "Ajuda",
            helpButtonTooltip: "Més informació",
            gotoListViewLabel: "Visualització de llista",
            gotoListViewTooltip: "Ves a la visualització de llista", // Go to List view tooltip text
            gotoMapViewLabel: "Visualització del mapa",
            gotoMapViewTooltip: "Ves a la visualització del mapa" // Tooltip for map-it icon in list header
        },
        popup_Close: {  // Close button for help and social-media-sign-in popup box
            closeButtonTooltip: "Tanca"
        },
        social_media: {  // Social media sign-in/out
            signInHeaderTitle : "Inici de sessió a les xarxes socials",
            signIntoFacebookTooltip: "Inicia la sessió amb el Facebook",
            signIntoGooglePlusTooltip: "Inicia la sessió amb el Google+",
            signIntoTwitterTooltip: "Inicia la sessió amb el Twitter",
            signOutOfFacebookTooltip: "Tanca la sessió del Facebook",
            signOutOfGooglePlusTooltip: "Tanca la sessió del Google+",
            signOutOfTwitterTooltip: "Tanca la sessió del Twitter"
        },
        dynamic_form: {  // General-purpose form; used to receive comment entry
            optionalFormItemFlag: " (opcional)",
            requiredFormItemFlag: " (obligatori)",
            unsettableRequiredField: "Un camp obligatori no està inicialitzat ni tampoc és al formulari",
            countOfRemainingCharactersTooltip: "Caràcters restants",
            attachmentsHeading: "Fitxers adjunts",
            addAttachmentTooltip: "Afegeix un fitxer adjunt",
            removeAttachmentTooltip: "Elimina el fitxer adjunt",
            cancelButtonLabel: "Cancel·la",
            submitButtonLabel: "Envia"
        },
        item_details: {  // Detailed information about an item and a list of its comments
            likeButtonTooltip: "Vota aquest element",
            likeButtonInverseTooltip: "S\'ha comptabilitzat el vot",
            commentButtonTooltip: "Afegeix un comentari",
            gotoMapViewTooltip: "Ves a la visualització del mapa",
            galleryButtonTooltip: "Visualitza els fitxers adjunts",
            commentsListHeading: "Comentaris",
            noCommentsPlaceholder: "No hi ha cap comentari",
            numberOfAttachmentsUploaded: "${0} fitxers adjunts pujats",
            numberOfAttachmentsUploadedAndFailed: "${0} fitxers adjunts pujats<br>${1} fitxers adjunts no s\'han pogut pujar"
        },
        item_list: {  // List of feature layer items
            linkToMapViewOptionLabel: "Filtra la llista per mapa",
            linkToMapViewOptionTooltip: "Enumera les entitats visibles al mapa actual",
            likesForThisItemTooltip: "Vots per a aquest element"
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
