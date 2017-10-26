/*global dijit */
/* jshint -W016 */
/* "Unexpected use of '&='/'~'/'|=' */
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
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/form/NumberTextBox",
    "dijit/form/Select",
    "application/lib/ValidationTextarea",
    "dijit/form/ValidationTextBox",
    "dojo/text!./DynamicForm.html",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on",
    "dojo/query",
    "dojo/sniff",
    "dojo/topic",
    "dojox/fx/scroll",
    "dijit/form/DateTextBox",
    "dijit/form/TimeTextBox",
    "esri/lang"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    NumberTextBox,
    Select,
    ValidationTextArea,
    ValidationTextBox,
    template,
    array,
    lang,
    dom,
    domClass,
    domConstruct,
    domStyle,
    on,
    query,
    has,
    topic,
    scroller,
    DateTextBox,
    TimeTextBox,
    esriLang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,

        /**
         * Widget constructor
         * <br>
         * N.B.: Restricted to a maximum of 31 required fields because of the way that required fields
         * are tracked to control the visibility of the "submit" button.
         * @param {object} initialProps Initialization properties:
         *     appConfig: Application configuration
         * @constructor
         */
        constructor: function () {
            this._formFields = [];
            this._entryForm = [];
            this._presets = {};
            this._requiredFieldsStatus = 0;
            dijit.Tooltip.defaultPosition = ["above-centered"];
        },

        /**
         * Initializes the widget once the DOM structure is ready
         */
        postCreate: function () {
            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);
            this.hide();
        },

        /**
         * Causes the widget to become visible.
         */
        show: function () {
            this._entryForm = this.generateForm(this.dynamicForm, this._formFields);
            domStyle.set(this.domNode, "display", "block");
        },

        /**
         * Causes the widget to become hidden.
         */
        hide: function () {
            domStyle.set(this.domNode, "display", "none");
            this.clearForm();
        },

        /**
         * Sets the item associated with this form.
         * @param {object} item Item to be published along with filled-out form
         */
        setItem: function (item) {
            this._item = item;
        },

        /**
         * Sets the fields to display in the form.
         * @param {array} formFields Fields with which to generate form
         */
        setFields: function (formFields) {
            this._formFields = formFields || [];
        },

        /**
         * Adds the value of a field to the set of presets.
         * @param {string} fieldname Name of field
         * @param {any} value Value to assign to the field; a null value effectively
         * removes the field from the set of presets
         */
        presetFieldValue: function (fieldname, value) {
            if (fieldname && fieldname.length > 0) {
                this._presets[fieldname] = value;
            }
        },

        /**
         * Sets event handlers for change, keyup, cut, and paste for an input item.
         * @param {object} inputItem Input item to receive handlers
         * @param {function} handler Function to call
         */
        setInputWatchers: function (inputItem, handler) {
            this.own(
                // For cut & paste, the change doesn't get noticed until the next keyup or
                // a loss of focus, so we'll use setTimeout to give the inputItem a chance to update
                on(inputItem, "change", function () {
                    handler();
                }),
                on(inputItem, "keyup", function () {
                    handler();
                }),
                on(inputItem, "cut", function () {
                    setTimeout(handler, 100);
                }),
                on(inputItem, "paste", function () {
                    setTimeout(handler, 100);
                })
            );
        },

        /**
         * Generates a form in a div using a set of fields.
         * @param {string} formDivName Div to receive form UI
         * @param {array} fields Fields with which to generate form
         * @return {array} List of form entries, each of which is an object containing
         * "field" ({string}, name of field) and "input" ({object}, UI form item) or
         * "value ({object} invisible form item value); may also publish "showErrorPopup" with
         * the i18n dynamic_form.unsettableRequiredField message if there's an invisible
         * and uninitialized required field
         */
        generateForm: function (formDivName, fields) {
            var pThis = this,
                formDiv, form, actionsBar, dynamicFormCancel, value,
                nextReqFldStatusFlag = 1,
                i18n = this.appConfig.i18n.dynamic_form,
                isRTL = this.appConfig.i18n.direction === "rtl";


            // Clear out the existing form
            formDiv = dom.byId(formDivName);
            while (formDiv.children.length > 0) {
                formDiv.removeChild(formDiv.childNodes[0]);
            }

            // Add the action buttons
            actionsBar = domConstruct.create("div", {
                className: "dynamicFormRow"
            }, formDivName);
            domClass.add(actionsBar, "dynamicFormActions");

            // Create the action buttons; we do it here rather than in the template because
            // _TemplatedMixin hangs under IE8 with two divs nested in the dynamicFormActions div

            // Submit
            this.dynamicFormSubmit = domConstruct.create("div", {
                className: "dynamicFormAction themeButton themeButtonHover " +
                    (isRTL ? "dynamicFormActionRight" : "dynamicFormActionLeft")
            }, actionsBar);
            on(this.dynamicFormSubmit, "click", lang.hitch(this, function () {
                var submission = this.assembleFormValues(this._entryForm);
                topic.publish("submitForm", this._item, submission);
            }));
            domStyle.set(this.dynamicFormSubmit, "border-color", this.appConfig.theme.background);

            domConstruct.create("span", {
                innerHTML: this.appConfig.i18n.dynamic_form.submitButtonLabel
            }, this.dynamicFormSubmit);

            // Cancel
            dynamicFormCancel = domConstruct.create("div", {
                className: "dynamicFormAction themeButtonInverted themeButtonInvertedHover " +
                    (isRTL ? "dynamicFormActionLeft" : "dynamicFormActionRight")
            }, actionsBar);
            on(dynamicFormCancel, "click", lang.hitch(this, function () {
                topic.publish("cancelForm");
            }));

            domConstruct.create("span", {
                innerHTML: this.appConfig.i18n.dynamic_form.cancelButtonLabel
            }, dynamicFormCancel);

            // Only the Submit is themed, and it is initially not visible; visibility is controlled
            // by inner function updateRequiredFieldStatus based upon the status of required fields
            domStyle.set(this.dynamicFormSubmit, "display", "none");

            // Find the editable attributes and create a form from them
            form = [];
            array.forEach(fields, lang.hitch(this, function (field) {
                var row, inputItem, inputItemTimeSupplement, count, useTextArea, options, choices, pattern;

                /**
                 * Creates a div to hold a visual row.
                 * @return {object} Created div
                 */
                function createRow() {
                    return domConstruct.create("div", {
                        className: "dynamicFormRow",
                        innerHTML: field.alias + (field.nullable ? "" : i18n.requiredFormItemFlag)
                    }, actionsBar, "before");
                }

                /**
                 * Updates the innerHTML of "count" with the difference between the
                 * size of an input length and the number of characters that it contains.
                 */
                function updateCharactersCount() {
                    var value = inputItem.get("value");
                    if (field.length < value.length) {
                        inputItem.set("value", value.substr(0, field.length));
                        count.innerHTML = 0;
                    }
                    else {
                        count.innerHTML = field.length - value.length;
                    }
                }

                /**
                 * Updates the required-field input status with this item's status
                 */
                function updateRequiredFieldStatus() {
                    if (row.requiredFieldFlag) {
                        var value = null;

                        // The input item has an empty state value when it passes the dijit's validation checks.
                        // Other possible states are "Error" and "Incomplete"
                        if (inputItem.state.length === 0) {
                            // If the dijit reports that the value is valid
                            value = inputItem.get("value");
                            if (value !== null && (value !== value || (typeof value === "undefined"))) {
                                value = null;
                            }
                        }

                        // Update the field for this item
                        if (value !== null) {
                            // Have value, so clear spot in mask
                            pThis._requiredFieldsStatus &= ~(row.requiredFieldFlag);
                            if (inputItem.dtManualValidationFlag) {
                                domClass.remove(inputItem.domNode, "dijitTextBoxError");
                            }
                        }
                        else {
                            // No value, so set spot in mask
                            pThis._requiredFieldsStatus |= (row.requiredFieldFlag);
                            if (inputItem.dtManualValidationFlag) {
                                domClass.add(inputItem.domNode, "dijitTextBoxError");
                            }
                        }
                    }

                    // Update the visibility of the save button based on status all of
                    // the required fields taken together
                    domStyle.set(pThis.dynamicFormSubmit, "display",
                        (pThis._requiredFieldsStatus === 0 ? "table" : "none"));
                }

                // Editable fields get added to the form, even if they're not visible in the popup
                if (field.dtIsEditable) {

                    // See if we have a multiple-choice instead of free values
                    if (field.domain && field.domain.type === "codedValue") {
                        row = createRow();

                        // Default to first coded value if we don't have a valid default
                        if ((typeof field.dtDefault) !== (typeof field.domain.codedValues[0].code)) {
                            field.dtDefault = field.domain.codedValues[0].code;
                        }

                        domConstruct.create("br", {}, row);
                        choices = [];
                        array.forEach(field.domain.codedValues, function (choice, i) {
                            choices.push({
                                label: choice.name,
                                value: i,
                                selected: choice.code === field.dtDefault
                            });
                        });
                        options = {
                            required: !field.nullable,
                            options: choices,
                            style: "width: 101%"
                        };
                        if (field.dtTooltip && field.dtTooltip.length > 0) {
                            options.title = field.dtTooltip;
                        }
                        inputItem = new Select(options, domConstruct.create("div", {}, row));
                        inputItem.startup();

                    }
                    // Free text
                    else if (field.type === "esriFieldTypeString") {
                        row = createRow();

                        // Create a characters-remaining counter
                        count = domConstruct.create("span", {
                            innerHTML: field.length,
                            className: "dynamicFormCharactersRemaining",
                            title: i18n.countOfRemainingCharactersTooltip
                        }, row);

                        domConstruct.create("br", {}, row);

                        // If the popup has defined a text-entry type, we'll use it;
                        // otherwise, we'll choose based on a field length that will
                        // approximately fit into a single line versus one that will not
                        if (field.dtStringFieldOption) {
                            useTextArea = field.dtStringFieldOption === "textarea" ||
                                field.dtStringFieldOption === "richtext";
                        }
                        else {
                            useTextArea = field.length > 32;
                        }

                        options = {
                            required: !field.nullable,
                            maxlength: field.length,
                            pattern: "\\S([\\S\\s]*)?"
                        };
                        if (field.dtDefault) {
                            options.value = field.dtDefault;
                        }
                        if (field.dtTooltip && field.dtTooltip.length > 0) {
                            options.title = field.dtTooltip;
                        }
                        if (useTextArea) {
                            options.rows = 4;
                            inputItem = new ValidationTextArea(options, domConstruct.create("div", {}, row));
                            inputItem.startup();
                        }
                        else {
                            inputItem = new ValidationTextBox(options, domConstruct.create("div", {}, row));
                            inputItem.startup();
                        }

                        // Keep the content within the field's length limit
                        this.setInputWatchers(inputItem, updateCharactersCount);

                    }
                    // Free numerics or a date picker
                    else {
                        if (field.type === "esriFieldTypeSmallInteger" || field.type === "esriFieldTypeInteger" ||
                            field.type === "esriFieldTypeSingle" || field.type === "esriFieldTypeDouble") {
                            row = createRow();
                            domConstruct.create("br", {}, row);

                            switch (field.type) {
                                case "esriFieldTypeSmallInteger":
                                    pattern = "####0";
                                    break;
                                case "esriFieldTypeInteger":
                                    pattern = "#########0";
                                    break;
                                default:
                                    pattern = "########0.######";
                                    break;
                            }

                            options = {
                                constraints: {
                                    pattern: pattern
                                },
                                required: !field.nullable
                            };
                            if (field.dtDefault) {
                                options.value = field.dtDefault;
                            }
                            if (field.dtTooltip && field.dtTooltip.length > 0) {
                                options.title = field.dtTooltip;
                            }
                            if (field.domain && field.domain.type === "range") {
                                options.constraints.min = field.domain.minValue;
                                options.constraints.max = field.domain.maxValue;
                            }
                            inputItem = new NumberTextBox(options, domConstruct.create("div", {}, row));
                            inputItem.startup();

                        }
                        else if (field.type === "esriFieldTypeDate") {
                            row = createRow();
                            domConstruct.create("br", {}, row);
                            options = {};
                            if (field.dtDefault) {
                                options.value = field.dtDefault;
                            }
                            else {
                                options.value = new Date();
                            }
                            if (field.dtTooltip && field.dtTooltip.length > 0) {
                                options.title = field.dtTooltip;
                            }
                            inputItem = new DateTextBox(options, domConstruct.create("div", {}, row));
                            inputItem.startup();
                            inputItem.dtManualValidationFlag = true;

                            // If the date field is formatted in the popup to display time, add a time dijit to
                            // make it possible to enter the time value
                            if (field.dtFormat && field.dtFormat.dateFormat && field.dtFormat.dateFormat.length > 0) {
                                if (field.dtFormat.dateFormat.indexOf("Time") > 0) {
                                    if (field.dtFormat.dateFormat.indexOf("Time24") > 0) {
                                        options.constraints = {
                                            timePattern: "HH:mm:ss"
                                        };
                                    }
                                    inputItemTimeSupplement = new TimeTextBox(options, domConstruct.create("div", {}, row));
                                    inputItemTimeSupplement.startup();

                                    // Arrange the date and time dijits side by side
                                    domClass.add(inputItem.domNode, "dynamicFormSideBySide");
                                    domClass.add(inputItemTimeSupplement.domNode, "dynamicFormSideBySide");
                                }
                            }
                        }
                    }

                    if (esriLang.isDefined(inputItem)) {
                        // Set its initial value if supplied and trigger the 'change' event
                        if (this._presets[field.name]) {
                            if (inputItem.set) { // Dojo item
                                inputItem.set("value", this._presets[field.name]);
                            }
                            else { // HTML item
                                inputItem.value = this._presets[field.name];
                            }

                            on.emit(inputItem, "change", {
                                "bubbles": true,
                                "cancelable": false
                            });
                        }

                        // If required, set its status in the required-value status flag
                        if (!field.nullable) {
                            row.requiredFieldFlag = nextReqFldStatusFlag;

                            // Set up handlers to keep flag up-to-date; note that we're not tracking the supplement
                            this.setInputWatchers(inputItem, updateRequiredFieldStatus);

                            // Set up next flag
                            nextReqFldStatusFlag *= 2;
                        }
                        updateRequiredFieldStatus();

                        // Save to the form definition
                        form.push({
                            "field": field,
                            "input": inputItem,
                            "inputTimeSupplement": inputItemTimeSupplement
                        });
                    }

                }
                // Special handling for non-editable form item
                else {
                    // If the form item is pre-set, add it to the form
                    if (this._presets[field.name]) {
                        form.push({
                            "field": field,
                            "value": this._presets[field.name]
                        });
                    }

                    // If the form item has a default, use it
                    else if (esriLang.isDefined(field.dtDefault)) {
                        // If field is a coded value, convert default to the offset of the value into list of
                        // coded values; this is done to keep it parallel to the options list that would have
                        // been used had the field been editable
                        if (field.domain && field.domain.type === "codedValue") {
                            value = "0"; // default to first item if we don't have a valid default
                            array.some(field.domain.codedValues, function (cv, i) {
                                if (cv.code === field.dtDefault) {
                                    value = i.toString();
                                    return true;
                                }
                            });
                        }
                        else {
                            value = field.dtDefault;
                        }

                        form.push({
                            "field": field,
                            "value": value
                        });
                    }

                    // If the form item is non-editable, required, not an OID/GUID field, and not pre-set,
                    // then the form can't meet the condition for submission that all required fields have values
                    else if (!field.nullable &&
                        field.type !== "esriFieldTypeOID" &&
                        field.type !== "esriFieldTypeGUID" &&
                        field.type !== "esriFieldTypeGlobalID" &&
                        field.name !== this._item._layer.objectIdField) {
                        topic.publish("showErrorPopup", "[" + (field.alias || field.name) + "]<br>" +
                            this.appConfig.i18n.dynamic_form.unsettableRequiredField);
                    }
                }
            }));

            // Add the attachments section
            if (this.appConfig.acceptAttachments) {
                this.createAttachmentsSection(actionsBar);
                this.createAttachmentInputter("dynamicFormGetAttachments");
            }

            return form;
        },

        /**
         * Creates the DOM section to accept, hold, and display attachments.
         * @param {object} followingSiblingNode DOM node used for placement: attachments section goes into parent
         * of followingSiblingNode just before it
         */
        createAttachmentsSection: function (followingSiblingNode) {
            var attachmentsBar;
            this.numAttachments = 0;

            attachmentsBar = domConstruct.create("div", {
                className: "dynamicFormRow",
                innerHTML: this.appConfig.i18n.dynamic_form.attachmentsHeading +
                    "<div id='dynamicFormGetAttachments' class='dynamicFormAddAttach'>" +
                    "<button type='button' class='dynamicFormAttachmentBtn'>+</button>" +
                    "</div>" +
                    "<div id='dynamicFormShowAttachments'></div>"
            }, followingSiblingNode, "before");
        },

        /**
         * Clears the attachments in the form.
         */
        clearAttachments: function () {
            query(".esriCTFileToSubmit", "dynamicFormGetAttachments")
                .concat(query(".dynamicFormAttachmentDisplay", "dynamicFormShowAttachments"))
                .forEach(function (node) {
                    domConstruct.destroy(node);
                });
        },

        /**
         * Creates a DOM file input item.
         * @param {object} parent DOM node to contain input item
         */
        createAttachmentInputter: function (parent) {
            var attachmentInputter, fileChangeHandler;

            this.numAttachments++;
            attachmentInputter = domConstruct.create("form", {
                id: "dynamicFormAttachment" + this.numAttachments,
                className: "esriCTHideFileInputUI",
                innerHTML: "<input class='dynamicFormAttachmentBtn' type='file' accept='image/*' title='" +
                    this.appConfig.i18n.dynamic_form.addAttachmentTooltip + "' name='attachment'>"
            }, dom.byId(parent));

            // Handle change event for file control
            fileChangeHandler = on(attachmentInputter, "change", lang.hitch(this, function (evt) {
                fileChangeHandler.remove();
                this.onFileSelected(evt);
            }));
        },

        /**
         * Show selected file on geoform and create new file control so that multiple files can be selected.
         * @param {object} evt Event object which will be generated on file input change event
         */
        onFileSelected: function (evt) {
            var target, fileNameParts, filename;

            // Get the name of the attachment
            if (evt.currentTarget && evt.currentTarget.value) {
                target = evt.currentTarget;
            }
            else if (evt.target && evt.target.value) {
                target = evt.target;
            }
            if (target.value) {
                fileNameParts = target.value.split("\\");
                filename = fileNameParts[fileNameParts.length - 1];
            }
            else {
                filename = "";
            }

            // Hide the input HTML item and flag it with a class for later retrieval
            domStyle.set(target.parentNode, "display", "none");
            domClass.replace(target.parentNode, "esriCTFileToSubmit", "esriCTHideFileInputUI");

            // Add a UI item to show the name of the attachment along with a way to detach it
            this.createAttachmentDisplay(filename);

            // Create a new attachment input item
            this.createAttachmentInputter("dynamicFormGetAttachments");
        },

        /**
         * Creates a DOM display for the name of an attached file and provides handling to permit the file
         * to be detached.
         * @param {string} filename Name of file
         */
        createAttachmentDisplay: function (filename) {
            var attachmentDisplay, detachHandler,
                inputterId = "dynamicFormAttachment" + this.numAttachments,
                displayId = "dynamicFormAttachmentDisplay" + this.numAttachments;

            attachmentDisplay = domConstruct.create("div", {
                id: displayId,
                className: "dynamicFormAttachmentDisplay",
                innerHTML: "<button type='button' class='dynamicFormAttachmentBtn dynamicFormDetachmentBtn' title='" +
                    this.appConfig.i18n.dynamic_form.removeAttachmentTooltip + "'>x</button>" +
                    "<div class='dynamicFormAttachment'></div>"
            }, dom.byId("dynamicFormShowAttachments"));

            // Add filename after scrubbing it
            attachmentDisplay.childNodes[1].appendChild(document.createTextNode(filename));

            // Handle detach button click event
            detachHandler = on(attachmentDisplay, "click", lang.hitch(this, function (evt) {
                if (confirm(this.appConfig.i18n.dynamic_form.removeAttachmentTooltip)) {
                    detachHandler.remove();
                    domConstruct.destroy(attachmentDisplay);
                    domConstruct.destroy(inputterId);
                }
            }));
        },

        /**
         * Assembles an object from the form containing attributes and attachments.
         * @param {array} form List of form entries, each of which is an object containing
         * "field" ({string}, name of field) and "input" ({object}, UI form item) or
         * "value ({object} invisible form item value)
         * @return {object} Structure containing two properties: attrs--properties matching the form field names
         * each of which has a value matching its corresponding input form item's value--and attachments--an array
         * of file upload forms
         */
        assembleFormValues: function (form) {
            var attributes = {};
            var attachments = [];

            // Attributes
            if (form.length > 0) {
                // Assemble the attributes for the submission from the form
                array.forEach(form, lang.hitch(this, function (entry) {
                    var value, valueTimeSupplement;

                    value = entry.input ? entry.input.get("value") : entry.value;

                    if (esriLang.isDefined(value)) {
                        if (entry.inputTimeSupplement) {
                            valueTimeSupplement = entry.inputTimeSupplement.get("value");
                            value.setHours(valueTimeSupplement.getHours());
                            value.setMinutes(valueTimeSupplement.getMinutes());
                            value.setSeconds(valueTimeSupplement.getSeconds());
                            value.setMilliseconds(valueTimeSupplement.getMilliseconds());
                        }

                        if (entry.field.domain && entry.field.domain.type === "codedValue") {
                            // Convert list selection into the coded value
                            attributes[entry.field.name] = entry.field.domain.codedValues[parseInt(value, 10)].code;
                        }
                        else if (value.getTime) {
                            // Convert Date objects into milliseconds as required by the feature service REST endpoint
                            attributes[entry.field.name] = value.getTime();
                        }
                        else {
                            // Get the value
                            attributes[entry.field.name] = value;
                        }
                    }
                }));
            }

            // Attachments
            attachments = query(".esriCTFileToSubmit", "dynamicFormGetAttachments");

            return {
                "attributes": attributes,
                "attachments": attachments
            };
        },

        /**
         * Clears the entry form.
         */
        clearForm: function () {
            this._entryForm = [];
            this.clearAttachments();
        }

    });
});
