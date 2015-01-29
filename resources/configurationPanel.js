{
    "configurationSettings": [{
        "category": "<b>Configure Template</b>",
        "fields": [{
            "type": "webmap"
        }, {
            "label": "Title",
            "fieldName": "title",
            "type": "string",
            "placeHolder": "Title",
            "tooltip": "Text to display across top of app"
        }, {
            "label": "App color",
            "fieldName": "color",
            "type": "color",
            "tooltip": "Color theme for app"
        }, {
            "label": "Allow up-votes",
            "fieldName": "allowUpVotes",
            "type": "boolean",
            "tooltip": "Display and enable button for voting for an idea"
        }, {
            "label": "Allow Facebook sign-ins",
            "fieldName": "allowFacebook",
            "type": "boolean",
            "tooltip": "Display and enable button for a Facebook sign-in"
        }, {
            "label": "Allow Google+ sign-ins",
            "fieldName": "allowGoogle",
            "type": "boolean",
            "tooltip": "Display and enable button for a Google+ sign-in"
        }, {
            "label": "Ideas layer and 'up-votes' field",
            "fieldName": "ideasLayer",
            "type": "layerandfieldselector",
            "tooltip": "Choose the layer to hold ideas and its field to hold the count of up-votes",
            "layerOptions": {
                "supportedTypes": ["FeatureLayer"],
                "geometryTypes": ["esriGeometryPoint", "esriGeometryLine", "esriGeometryPolyline", "esriGeometryPolygon"]
            },
            "fieldOptions": {
                "supportedTypes": ["esriFieldTypeSmallInteger", "esriFieldTypeInteger"]
            }
        }]
    }],
    "values": {
        "title": "Title",
        "color": "#206bdb",
        "allowUpVotes": false,
        "allowFacebook": false,
        "allowGoogle": false,
        "ideasLayer": null,
        "commentsTable": null
    }
}
