/*global define,dojo */
/*jslint browser:true,sloppy:true,nomen:true,unparam:true,plusplus:true,bitwise:true */
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
    "dojo/text!./DynamicForm.html",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/on",
    "dojo/topic",
    "dijit/form/DateTextBox",
    "esri/lang"
], function (
    declare,
    _WidgetBase,
    _TemplatedMixin,
    template,
    array,
    lang,
    dom,
    domConstruct,
    domStyle,
    on,
    topic,
    DateTextBox,
    esriLang
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        _formFields : [],
        _entryForm: [],
        _presets: {},
        _requiredFieldsStatus: 0,

        /**
         * Widget constructor
         * <br>
         * N.B.: Restricted to a maximum of 31 required fields because of the way that required fields
         * are tracked to control the visibility of the "submit" button.
         * @param {object} initialProps Initialization properties:
         *     appConfig: Application configuration
         * @constructor
         */

        /**
         * Initializes the widget once the DOM structure is ready
         */
        postCreate: function () {
            // Run any parent postCreate processes - can be done at any point
            this.inherited(arguments);
            this.hide();

            this.dynamicFormCancelText.innerHTML = this.appConfig.i18n.dynamic_form.cancel;
            on(this.dynamicFormCancel, "click", lang.hitch(this, function () {
                topic.publish("cancelForm");
            }));

            this.dynamicFormSubmitText.innerHTML = this.appConfig.i18n.dynamic_form.submit;
            on(this.dynamicFormSubmit, "click", lang.hitch(this, function () {
                var submission = this.assembleFormValues(this._entryForm);
                topic.publish("submitForm", this._item, submission);
            }));
            domStyle.set(this.dynamicFormSubmit, "color", this.appConfig.theme.foreground);
            domStyle.set(this.dynamicFormSubmit, "background-color", this.appConfig.theme.background);
            domStyle.set(this.dynamicFormSubmit, "display", "none");
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
         * "value ({object} invisible form item value); may also publish "showError" with
         * the i18n dynamic_form.unsettableRequiredField message if there's an invisible
         * and uninitialized required field
         */
        generateForm: function (formDivName, fields) {
            var pThis = this, formDiv, form, nextReqFldStatusFlag = 1, i18n = this.appConfig.i18n.dynamic_form;

            // Clear out the existing form
            formDiv = dom.byId(formDivName);
            while (formDiv.children.length > 0) {
                formDiv.removeChild(formDiv.childNodes[0]);
            }

            // Find the editable attributes and create a form from them
            form = [];
            array.forEach(fields, lang.hitch(this, function (field) {
                var row, disabledFlag, inputItem, count, useTextArea;

                /**
                 * Creates a div to hold a visual row.
                 * @return {object} Created div
                 */
                function createRow() {
                    return domConstruct.create("div", {
                        className: "dynamicFormRow",
                        innerHTML: field.alias + (field.nullable ? i18n.optional : "")
                    }, formDivName);
                }

                /**
                 * Updates the innerHTML of "count" with the difference between the
                 * size of an input length and the number of characters that it contains.
                 */
                function updateCharactersCount() {
                    if (field.length < inputItem.value.length) {
                        inputItem.value = inputItem.value.substr(0, field.length);
                    }
                    count.innerHTML = field.length - inputItem.value.length;
                }

                /**
                 * Updates the required-field input status with this item's status
                 */
                function updateRequiredFieldStatus() {
                    if (row.requiredFieldFlag) {
                        // Update the field for this item
                        if (inputItem.value.toString().length > 0) {
                            // Have value, so clear spot in mask
                            pThis._requiredFieldsStatus &= ~(row.requiredFieldFlag);
                        } else {
                            // No value, so set spot in mask
                            pThis._requiredFieldsStatus |= (row.requiredFieldFlag);
                        }

                        // Update the visibility of the save button based on status all of
                        // the required fields taken together
                        domStyle.set(pThis.dynamicFormSubmit, "display",
                            (pThis._requiredFieldsStatus === 0 ? "table-cell" : "none"));
                    }
                }

                // Visible fields get added to the form
                if (field.dtIsVisible) {
                    disabledFlag = field.dtIsEditable ? null : "disabled";

                    if (field.type === "esriFieldTypeString") {
                        row = createRow();

                        // Create a characters-remaining counter
                        count = domConstruct.create("span", {
                            innerHTML: field.length,
                            className: "dynamicFormCharactersRemaining",
                            title: i18n.charactersRemaining
                        }, row);

                        domConstruct.create("br", {}, row);

                        // If the popup has defined a text-entry type, we'll use it;
                        // otherwise, we'll choose based on a field length that will fit into
                        // a single line versus one that will not
                        if (field.dtStringFieldOption) {
                            useTextArea = field.dtStringFieldOption === "textarea" ||
                                field.dtStringFieldOption === "richtext";
                        } else {
                            useTextArea = field.length > 32;
                        }

                        if (useTextArea) {
                            inputItem = domConstruct.create("textArea", {
                                value: field.value || "",
                                className: "dynamicFormTextAreaCtl"
                            }, row);
                        } else {
                            inputItem = domConstruct.create("input", {
                                type: "text",
                                value: field.value || "",
                                className: "dynamicFormInputCtl"
                            }, row);
                        }

                        // Keep the content within the field's length limit
                        this.setInputWatchers(inputItem, updateCharactersCount);

                    } else {
                        if (field.type === "esriFieldTypeSmallInteger" || field.type === "esriFieldTypeInteger") {
                            row = createRow();
                            domConstruct.create("br", {}, row);
                            inputItem = domConstruct.create("input", {
                                type: "number",
                                className: "dynamicFormInputCtl"
                            }, row);
                        } else if (field.type === "esriFieldTypeDouble") {
                            row = createRow();
                            domConstruct.create("br", {}, row);
                            inputItem = domConstruct.create("input", {
                                type: "number",
                                className: "dynamicFormInputCtl"
                            }, row);
                        } else if (field.type === "esriFieldTypeDate") {
                            row = createRow();
                            domConstruct.create("br", {}, row);
                            inputItem = new DateTextBox({
                                disabled: disabledFlag  // needs to be done in constructor
                            }, domConstruct.create("div", {}, row));
                        }
                    }

                    if (esriLang.isDefined(inputItem)) {
                        // Disabled setting for all but DateTextBox
                        if (disabledFlag) {
                            inputItem.disabled = true;
                        }

                        // Set its initial value if supplied
                        if (this._presets[field.name]) {
                            if (inputItem.set) {  // Dojo item
                                inputItem.set("value", this._presets[field.name]);
                            } else {              // HTML item
                                inputItem.value = this._presets[field.name];
                            }
                            on.emit(inputItem, "change", {
                                "bubbles": true,
                                "cancelable": false
                            });
                        }

                        // Apply the tooltip if we have one
                        if (field.dtTooltip && field.dtTooltip.length > 0) {
                            if (inputItem.set) {  // Dojo item
                                inputItem.set("title", field.dtTooltip);
                            } else {              // HTML item
                                inputItem.title = field.dtTooltip;
                            }
                        }

                        // If required, set its status in the required-value status flag
                        if (!field.nullable) {
                            row.requiredFieldFlag = nextReqFldStatusFlag;
                            updateRequiredFieldStatus();

                            // Set up handlers to keep flag up-to-date
                            this.setInputWatchers(inputItem, updateRequiredFieldStatus);

                            // Set up next flag
                            nextReqFldStatusFlag *= 2;
                        }

                        // Save to the form definition
                        form.push({
                            "field": field,
                            "input": inputItem
                        });
                    }

                // If a form item is invisible but pre-set, add it to the form
                } else if (this._presets[field.name]) {
                    form.push({
                        "field": field,
                        "value": this._presets[field.name]
                    });

                // If a form item is invisible and required but not pre-set, then the form
                // can't meet the condition for submission that all required fields have values
                } else if (!field.nullable) {
                    topic.publish("showError", this.appConfig.i18n.dynamic_form.unsettableRequiredField);
                }
            }));

            return form;
        },

        /**
         * Assembles an attribute object from the form.
         * @param {array} form List of form entries, each of which is an object containing
         * "field" ({string}, name of field) and "input" ({object}, UI form item) or
         * "value ({object} invisible form item value)
         * @return {object} Structure containing properties matching the form field names
         * each of which has a value matching its corresponding input form item's value
         */
        assembleFormValues: function (form) {
            var attr = {};

            if (form.length > 0) {
                // Assemble the attributes for the submission from the form
                array.forEach(form, lang.hitch(this, function (entry) {
                    if (entry.input) {
                        attr[entry.field.name] = entry.input.value;
                    } else if (entry.value) {
                        attr[entry.field.name] = entry.value;
                    }
                }));
            }

            return attr;
        },

        /**
         * Clears the entry form.
         */
        clearForm: function () {
            this._entryForm = [];
        }

    });
});
