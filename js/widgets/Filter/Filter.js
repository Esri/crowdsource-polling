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
  "dijit/_WidgetsInTemplateMixin",
  "dojo/text!./Filter.html",
  "dojo/_base/lang",
  "dojo/sniff",
  "dojo/_base/array",
  "dojo/dom-construct",
  "dojo/query",
  "dojo/string",
  "dojo/dom-style",
  "dojo/dom-class",
  "dojo/dom-attr",
  "dojo/on",
  "dijit/registry",
  "dojox/mobile/Switch",
  "application/lib/SvgHelper",
  "dijit/form/TextBox",
  "dijit/form/NumberTextBox",
  "dijit/form/Select",
  "dijit/form/DateTextBox",
  "dijit/form/TimeTextBox",
  "dijit/form/RadioButton",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/TimeExtent"
], function (
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  template,
  lang,
  has,
  array,
  domConstruct,
  query,
  string,
  domStyle,
  domClass,
  domAttr,
  on,
  registry,
  Switch,
  SvgHelper,
  TextBox,
  NumberTextBox,
  Select,
  DateTextBox,
  TimeTextBox,
  RadioButton,
  Query,
  QueryTask,
  TimeExtent
) {
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,
    _distinctValuesObj: {},
    _layerFilterDOM: {},
    isRTL: null,
    _parameterizedExpressions: {},
    _filterDefExpr: {},
    _toggleSwitchObj: {},
    _isClicked: false,
    _toggleFilterButtonEvent: null,
    constructor: function () {
    },

    postCreate: function () {
      //Keep the flag, this will help in changing the basic styles for RTL mode
      this.isRTL = this.appConfig.i18n.direction === "rtl";
      domAttr.set(this.filterTextLabel, "innerHTML",
        this.appConfig.i18n.filter.filterPanelHeaderText);
      domAttr.set(this.noFilterConfigured, "innerHTML",
        this.appConfig.i18n.filter.filterButtonLabel);
      domAttr.set(this.noFilterConfigured, "innerHTML",
        this.appConfig.i18n.filter.noFilterConfiguredMessage);
      if (this.isRTL) {
        domStyle.set(this.toggleFiltersBtn.domNode, "margin-left", "10px");
      }

      var backIconSurface = SvgHelper.createSVGItem(this.appConfig.backIcon, this.iconContainer, 12, 20);
      SvgHelper.changeColor(backIconSurface, this.appConfig.theme.header.background);
      on(this.backIcon, "click", lang.hitch(this, function () {
        this.onFilterBackButtonClicked();
      }));
    },

    startup: function () {
      //change the button UI and color combination as per the theme color
      this._modifyToggleFilterButton();
      //Create filter list based on the filters configured at the map level
      this._createFilterList();

      //Listen for toggle button click event, this is required to identify wether the button is clicked
      //Or the button state is being changed by other toggle buttons
      this.toggleFiltersBtn.on("click", lang.hitch(this, function () {
        //If toggle filter button is disabled
        //Don't allow user to toggle the state.
        if (!domClass.contains(this.toggleFiltersBtn.domNode, "filterButtonDisabled")) {
          this._isClicked = true;
        } else {
          this.toggleFiltersBtn.set("value", this.toggleFiltersBtn.get("value") === "off" ? "on" : "off");
        }
      }));
      //Listen for button on/off event and handle the further processing
      this._toggleFilterButtonEvent = on.pausable(this.toggleFiltersBtn, "stateChanged", lang.hitch(this, function (newState) {
        //If flag is true, it means the button is clicked by user
        //Perform all the necessary actions 
        if (this._isClicked) {
          this._isClicked = false;
          for (var layerID in this._toggleSwitchObj) {
            this._toggleSwitchObj[layerID].set("value", newState);
          }
        }
      }));
      //Honor the default settings of filters
      if (!this.appConfig.enableAllFilters) {
        this.toggleFiltersBtn.set("value", "off");
      }
    },

    /**
    * Override the toggle button
    * @memberOf widgets/filter/filter
    */
    _modifyToggleFilterButton: function () {
      this.toggleFiltersBtn.set("leftLabel", "");
      this.toggleFiltersBtn.set("rightLabel", "");
      this.toggleFiltersBtn.set("value", "on");
      this.toggleFiltersBtn.resize();
      //Add the theme color to button
      array.forEach(query(".mblSwitchBgLeft", this.itemListActionBar), function (item) {
        domClass.add(item, "themeHeaderInverted");
      });
    },

    /**
    * Builds an entire filter list
    * @memberOf widgets/filter/filter
    */
    _createFilterList: function () {
      var isFilterConfigured = false;
      //Check if filters are configured for a layer and accordingly show them in the list format
      array.forEach(this.appConfig.itemInfo.itemData.operationalLayers, lang.hitch(this,
        function (layer, index) {
          var staticDefExpr;
          //Check if layer has time info
          //If yes, then create a custom object of dates for ask for values filter
          if (layer.layerObject.timeInfo && this.appConfig.showDateFilter) {
            staticDefExpr = this._checkAndCreateTimeEnabledFilters(layer);
            var parameterizedExpForTimeLayer = this._parameterizedExpForTimeLayer(layer);
          }
          //If layer has "Ask For Values" filters store parameterized expression
          if (layer.definitionEditor) {
            isFilterConfigured = true;
            //If layer has parameterized expression
            //Check if the newly created time definition expression needs to be added/appended
            if (layer.definitionEditor.parameterizedExpression) {
              if (parameterizedExpForTimeLayer) {
                this._parameterizedExpressions[layer.id] = "(" + layer.definitionEditor.parameterizedExpression + ")" + " AND " + "(" + parameterizedExpForTimeLayer.pExpression + ")";
              } else {
                this._parameterizedExpressions[layer.id] = layer.definitionEditor.parameterizedExpression
              }
            } else {
              //If layer do not have parameterize expression, it is time enabled layer
              this._parameterizedExpressions[layer.id] = "(" + parameterizedExpForTimeLayer.pExpression + ")";
            }
            //Once expression for time aware layer is created, check if layer has static filter that needs to considered
            //This is a specific case when "no ask for values" filters are being added on layer btu a static filter is added
            if (staticDefExpr) {
              this._parameterizedExpressions[layer.id] = "(" + staticDefExpr + ")" + " AND " + this._parameterizedExpressions[layer.id];
            }
            this._distinctValuesObj[layer.id] = {};
            //Since the filters are configured, remove the no filter configure message
            domStyle.set(this.noFilterConfigured, "display", "none");
            this._addFilterItem(layer, index);
          }
        }));
      //Disabled the filter button if no "ask for values" filter is configured
      setTimeout(lang.hitch(this, function () {
        if (!isFilterConfigured) {
          domClass.add(this.toggleFiltersBtn.domNode, "filterButtonDisabled");
          this.toggleFiltersBtn.set("value", "off");
        }
      }), 500);
    },

    _checkAndCreateTimeEnabledFilters: function (layer) {
      var inputsCount = 0, timeInput, isMultiFieldEnable = false, staticDefExpr;
      isMultiFieldEnable = layer.layerObject.timeInfo.startTimeField && layer.layerObject.timeInfo.endTimeField;
      //If layer has existing ask for values filter
      //then add new object for date
      if (layer.definitionEditor && layer.definitionEditor.inputs) {
        inputsCount = layer.definitionEditor.inputs.length;
        layer.definitionEditor = layer.definitionEditor;
      } else {
        //If layer does not have ask for values filter
        //create new definition editor object
        layer["definitionEditor"] = {
          inputs: []
        };
        //Once a valid definition editor object is created then check if layer has static expression
        //and append the same to definition editor object
        if (this.staticTimeDefExp[layer.id]) {
          staticDefExpr = this.staticTimeDefExp[layer.id];
        }
      }
      //Check if layer is configured for single or multiple time field
      //Accordingly create a definition editor object
      if (layer.layerObject.timeInfo.startTimeField) {
        var startDateTimeLabel, fieldInfo, startDateHint;
        fieldInfo = layer.layerObject.getField(layer.layerObject.timeInfo.startTimeField);
        startDateHint = "Please enter value for field: " + fieldInfo.alias || fieldInfo.name;
        //Change the label based on single/multiple time fields
        if (isMultiFieldEnable) {
          startDateTimeLabel = this.appConfig.i18n.filter.multiFieldStartDateTimeLabel;
        } else {
          startDateTimeLabel = this.appConfig.i18n.filter.singleFieldDateTimeLabel;
        }
        timeInput = this._createDateTimeInputParams(startDateHint, startDateTimeLabel, layer, inputsCount, "startTime");
        layer.definitionEditor.inputs.push(timeInput);
        inputsCount++;
      }
      if (layer.layerObject.timeInfo.endTimeField) {
        var fieldInfo, endDateHint;
        fieldInfo = layer.layerObject.getField(layer.layerObject.timeInfo.endTimeField);
        endDateHint = "Please enter value for field: " + fieldInfo.alias || fieldInfo.name;
        timeInput = null;
        timeInput = this._createDateTimeInputParams(endDateHint, this.appConfig.i18n.filter.multiFieldEndDateTimeLabel, layer,
          inputsCount, "endTime");
        layer.definitionEditor.inputs.push(timeInput);
      }
      return staticDefExpr;
    },

    /**
    * Builds an individual item summary given an item
    * @memberOf widgets/filter/filter
    */
    _addFilterItem: function (layer, index) {
      var itemSummaryParent, itemSummaryDiv, itemSummaryDiv, itemSwitch, backIcon, backIconSurface,
        layerInstance, domNode = null, applyButton;
      layerInstance = this.map.getLayer(layer.id);
      this._distinctValuesObj[layer.id] = {};
      itemSummaryParent = domConstruct.create("div", {}, this.filterList);
      //Create parent DOM
      itemSummaryDiv = domConstruct.create("div", {
        "class": "itemSummary themeItemList",
        "style": "padding-right : 0px"
      }, itemSummaryParent);

      //Set border color as per the theme configuration
      domStyle.set(itemSummaryDiv, "border-bottom-color", this.appConfig.theme.body.text);

      //If layer has ask for values filter show the arrow button
      if (layer.definitionEditor && layer.definitionEditor.inputs) {
        domNode = domConstruct.create("div", { "style": "width: 100%" });
        backIcon = domConstruct.create("div", {
          "class": "filterListBackIconClosed"
        }, itemSummaryDiv);
        //If app is running in safari, override the back icon class 
        if (has("safari")) {
          domClass.add(backIcon, "filterListBackIconOverride");
        } else {
          domClass.add(backIcon, "filterListBackIcon");
        }
        //Add the svg for arrow button and set the theme's header text as the color
        backIconSurface = SvgHelper.createSVGItem(this.appConfig.backIcon, backIcon, 15, 20);
        SvgHelper.changeColor(backIconSurface, this.appConfig.theme.header.text);

        on(itemSummaryDiv, "click", lang.hitch(this, function (evt) {
          this._togglePanel(evt.currentTarget.parentElement, backIcon);
        }));
        itemTitleClass = "itemTitleSpacing"
      }

      //Create a dom fir showing layer title
      itemTitleDiv = domConstruct.create("div", {
        "class": "itemTitle",
        "title": layer.title,
        "innerHTML": layer.title,
        "style": backIcon ? "" : "margin-left: 25px"
      }, itemSummaryDiv);

      //Create a dom for toggle switch button
      itemSwitch = domConstruct.create("div", {
        "style": this.isRTL ? "float : left" : "float : right"
      }, itemSummaryDiv);
      //Create toggle switch button
      this._createToggleSwitch(layer, itemSwitch, itemSummaryDiv);
      //If ask for values filter is configured, cerate content panel
      if (layer.definitionEditor && layer.definitionEditor.inputs) {
        //create node for adding item content
        itemContent = domConstruct.create("div", {
          "class": "itemContent",
        }, itemSummaryParent);
        applyButton = this._createApplyButton(layerInstance, layer.definitionEditor);
        array.forEach(layer.definitionEditor.inputs, lang.hitch(this,
          function (definitionEditorInput, index) {
            //create ask for values filters based on the filters defined in the map
            domNode.appendChild(this._createAskForValuesFilters(definitionEditorInput, layerInstance, index, applyButton, layer));
          }));
        //If ask for values filter is configured, show it in the item content
        if (domNode) {
          itemContent.appendChild(domNode);
          domConstruct.place(domNode, itemContent, "first");
        }
        this._layerFilterDOM[layerInstance.id] = itemContent;
      }
    },

    /**
    * Update the apply button style based on data validation
    * @memberOf widgets/filter/filter
    */
    _updateApplyButtonStatus: function (domNode) {
      var widgetsArray = registry.findWidgets(domNode);
      var applyButton = query(".filterApplyButton", domNode)[0];
      var isDisplayed, isValidData;
      array.some(widgetsArray, lang.hitch(this, function (widget) {
        isDisplayed = true, isValidData = true
        //Validate the widget only if it is displayed in the item content panel
        if (widget.domNode.parentElement && domStyle.get(widget.domNode.parentElement,
          "display") === "none") {
          isDisplayed = false;
        }
        if (isDisplayed && widget.domNode && widget.isValid && !widget.isValid()) {
          isValidData = false;
          return true;
        }
      }));
      //Change the apply button styles based on valid/invalid data
      if (isValidData) {
        domClass.remove(applyButton, "filterButtonDisabled");
        domClass.add(applyButton, "themeButtonInvertedHover");
      } else {
        domClass.add(applyButton, "filterButtonDisabled");
        domClass.remove(applyButton, "themeButtonInvertedHover");
      }
      this._updateToggleSwitchButtonStatus();
    },

    /**
    * Update the toggle filter button based on valid/invalid data
    * @memberOf widgets/filter/filter
    */
    _updateToggleSwitchButtonStatus: function () {
      var layerID, applyButton, isValid = true;
      //Loop through all the apply buttons
      //If at least one apply button is disabled, disable toggle filter button
      for (layerID in this._layerFilterDOM) {
        applyButton = query(".filterApplyButton", this._layerFilterDOM[layerID])[0];
        if (applyButton && domClass.contains(applyButton, "filterButtonDisabled")) {
          isValid = false;
          break;
        }
      }
      //Update the toggle button state based on apply button state
      if (isValid) {
        domClass.remove(this.toggleFiltersBtn.domNode, "filterButtonDisabled");
        this._toggleFilterButtonEvent.resume();
      } else {
        domClass.add(this.toggleFiltersBtn.domNode, "filterButtonDisabled");
        this._toggleFilterButtonEvent.pause();
      }
    },

    /**
    * Create apply button
    * @memberOf widgets/filter/filter
    */
    _createApplyButton: function (layer, definitionEditor) {
      var applyButton;
      //Add apply button
      applyButton = domConstruct.create("div", {
        className: "filterApplyButton themeButtonInverted themeButtonInvertedHover"
      }, itemContent, "last");
      domConstruct.create("span", {
        innerHTML: this.appConfig.i18n.filter.applyButton
      }, applyButton);

      //Match the color as per the configuration
      domStyle.set(applyButton, "border-color", this.appConfig.theme.background);

      on(applyButton, "click", lang.hitch(this, function (evt) {
        var _isLayerSwitchAutoOn = false;
        //Store the falg value based on toggle buttons state
        if (this._toggleSwitchObj[layer.id].get("value") === "on") {
          _isLayerSwitchAutoOn = true;
        }
        if (!domClass.contains(applyButton, "filterButtonDisabled")) {
          //If button is already turned ON,
          //Call apply button clicked function
          if (!_isLayerSwitchAutoOn) {
            this._toggleSwitchObj[layer.id].set("value", "on");
            return;
          }
          this._applyButtonClicked(layer, definitionEditor);
        }
      }));

      return applyButton;
    },

    /**
    * On apply button click, evaluate the expression
    * @memberOf widgets/filter/filter
    */
    _applyButtonClicked: function (layer, definitionEditor) {
      var expression;
      expression = this._parameterizedExpressions[layer.id];
      this._createDefinitionExpression(expression, definitionEditor);
      this._applyParameterizedExpression(layer);
    },

    /**
    * Create the DOM for ask for values filter
    * @memberOf widgets/filter/filter
    */
    _createAskForValuesFilters: function (definitionEditorInput, layerInstance, index, applyButton, layer) {
      var askForValueField, isCodedDomain, isTypeIdField, functionInputParam = {};
      askForValueField = definitionEditorInput.parameters[0].fieldName;
      isCodedDomain = this._hasCodedDomain(askForValueField, layerInstance);
      isTypeIdField = this._hasTypeIdField(askForValueField, layerInstance);
      functionInputParam = {
        definitionEditorInput: definitionEditorInput,
        layerInstance: layerInstance,
        askForValueField: askForValueField,
        isCodedDomain: isCodedDomain,
        isTypeIdField: isTypeIdField,
        index: index,
        applyButton: applyButton
      };
      //Function to append filter options in the container
      return this._createFilterOptionBox(functionInputParam, layer);
    },

    /**
    * This function is used to check if the configured filter is of type domain
    * @memberOf widgets/filter/filter
    */
    _hasCodedDomain: function (askForValueField, layerInstance) {
      var isCodedDomain = false;
      array.forEach(layerInstance.fields, lang.hitch(this, function (currentField) {
        if (currentField.name === askForValueField && currentField.domain &&
          currentField.domain.codedValues
          && currentField.domain.codedValues.length > 0) {
          isCodedDomain = true;
        }
      }));
      return isCodedDomain;
    },

    /**
    * This function is used to check if the configured filter is of type id field
    * @memberOf widgets/filter/filter
    */
    _hasTypeIdField: function (askForValueField, layerInstance) {
      var isTypeIdField = false;
      if (layerInstance.typeIdField === askForValueField) {
        isTypeIdField = true;
      } else if (layerInstance.types && layerInstance.types.length > 0) {
        array.some(layerInstance.types, lang.hitch(this, function (type) {
          if (type.domains && type.domains[askForValueField] && type.domains[askForValueField].codedValues &&
            type.domains[askForValueField].codedValues.length > 0) {
            isTypeIdField = true;
            return isTypeIdField;
          }
        }));
      }
      return isTypeIdField;
    },

    /**
    * This function is used to create filters for the header field (only when ask for value is enabled)
    * @memberOf widgets/filter/filter
    */
    _createFilterOptionBox: function (functionInputParam, layer) {
      var baseFilterOptionDiv, textBoxDiv, selectOptionDiv, selectOption, radioButtonParentDiv, radioButtonDiv,
        radioButtonObject = {}, formGroupDiv, hintFilterContainer, dateFieldObj, radioParamObj, hintLabelText;
      baseFilterOptionDiv = domConstruct.create("div", {
        "class": "baseFilterOptionDiv"
      });
      domConstruct.create("div", {
        "innerHTML": functionInputParam.definitionEditorInput.prompt,
        "class": "filterLabelDiv"
      }, baseFilterOptionDiv);
      // Check the data type of current input value
      if (functionInputParam.definitionEditorInput.parameters[0].type !== "esriFieldTypeDate") {
        if (!functionInputParam.isCodedDomain && !functionInputParam.isTypeIdField) {
          // Create text box container
          // displays when 'value' radio button is selected (OR by default)
          textBoxDiv = domConstruct.create("div", {
            "class": "filterInputTextBoxDiv"
          }, baseFilterOptionDiv);
        }

        if (functionInputParam.definitionEditorInput && functionInputParam.definitionEditorInput.parameters &&
          functionInputParam.definitionEditorInput.parameters.length === 1) {
          //Create single text box field when length of parameters is 1
          if (!functionInputParam.isCodedDomain && !functionInputParam.isTypeIdField) {
            this._createTextBoxContainer(textBoxDiv, functionInputParam);
          }
          // Create drop down container
          // displays when 'unique' radio button is selected
          selectOptionDiv = domConstruct.create("div", {
            "class": "selectOptionDiv",
          }, baseFilterOptionDiv);

          // 'select' html tag is creating to show distinct values of the current field
          selectOption = new Select({
            "class": "filterSelectOption",
            "style": "width: 100%"
          }, domConstruct.create("div", {}, selectOptionDiv));
          selectOption.startup();

          //Store the current value once the drop down changes
          on(selectOption, "change", lang.hitch(this, function () {
            functionInputParam.definitionEditorInput.parameters[0].currentValue = selectOption.get("value");
          }));

          if (!functionInputParam.isCodedDomain && !functionInputParam.isTypeIdField) {
            // Creating Radio buttons container
            radioButtonParentDiv = domConstruct.create("div", {
              "class": "radioOptionParentDiv"
            }, baseFilterOptionDiv);
            radioButtonDiv = domConstruct.create("div", {
              "class": "filterRadioButtonDiv"
            }, radioButtonParentDiv);

            radioButtonObject = {
              "node": radioButtonDiv,
              "definitionEditorInput": functionInputParam.definitionEditorInput,
              "textBoxDiv": textBoxDiv,
              "selectOptionDiv": selectOptionDiv,
              "selectOption": selectOption,
              "askForValueField": functionInputParam.askForValueField,
              "index": functionInputParam.index,
              "isCodedDomain": functionInputParam.isCodedDomain,
              "isTypeIdField": functionInputParam.isTypeIdField,
              "layerInstance": functionInputParam.layerInstance,
              "applyButton": functionInputParam.applyButton
            };

            // Create radio buttons for text value and unique drop down value
            this._createRadioButtons(radioButtonObject);
          } else {
            domStyle.set(selectOptionDiv, "display", "block");
            functionInputParam.definitionEditorInput.parameters[0].showDropDown = true;
            radioParamObj = {
              "selectOption": selectOption,
              "index": functionInputParam.index,
              "selectOptionDiv": selectOptionDiv,
              "askForValueField": functionInputParam.askForValueField,
              "layerInstance": functionInputParam.layerInstance,
              "isCodedDomain": functionInputParam.isCodedDomain,
              "isTypeIdField": functionInputParam.isTypeIdField,
              "definitionEditorInput": functionInputParam.definitionEditorInput,
              "applyButton": functionInputParam.applyButton
            };
            // if a radio button is called first time, then query distinct values of current field
            this._checkAttributeDistinctValues(radioParamObj);
          }
        } else {
          // when parameter contains 2 parameters in case for between range
          this._createTextBoxRangeContainers(textBoxDiv, functionInputParam);
        }
      } else {
        // create date picker container div
        formGroupDiv = domConstruct.create("div", { "class": "filterDatePickerDiv form-group" }, baseFilterOptionDiv);
        // object for creating date field
        dateFieldObj = {
          "definitionEditorInput": functionInputParam.definitionEditorInput,
          "index": functionInputParam.index,
          "formGroupDiv": formGroupDiv,
          "askForValueField": functionInputParam.askForValueField,
          "layer": layer
        };
        // initializing date picker instance
        this._createDateField(formGroupDiv, dateFieldObj, functionInputParam);
      }
      hintFilterContainer = domConstruct.create("div", { "class": "filterHintContainer" }, baseFilterOptionDiv);
      hintLabelText = string.substitute(this.appConfig.i18n.filter.hintLabel, {
        hintLabelText: functionInputParam.definitionEditorInput.hint
      });
      domConstruct.create("div", { "innerHTML": hintLabelText }, hintFilterContainer);
      // check active filter nodes
      return baseFilterOptionDiv;
    },

    /**
    * Create input text box based on the configuration
    * @memberOf widgets/filter/filter
    */
    _createTextBoxContainer: function (node, functionInputParam) {
      var inputTextBox, fieldType;
      fieldType = functionInputParam.layerInstance.getField(functionInputParam.askForValueField).type;
      //Create normal text box for string and GUId type fields
      if (fieldType === "esriFieldTypeString" || fieldType === "esriFieldTypeGUID") {
        inputTextBox = this._createInputTextBox(node, functionInputParam);
      } else {
        inputTextBox = this._createNumberTextBox(node, functionInputParam, false, null);
      }
      //Set default value to text box
      if (functionInputParam.definitionEditorInput.parameters[0].defaultValue ||
        functionInputParam.definitionEditorInput.parameters[0].defaultValue === 0) {
        inputTextBox.set("value", functionInputParam.definitionEditorInput.parameters[0].defaultValue);
        functionInputParam.definitionEditorInput.parameters[0].currentValue = inputTextBox.get("value").toString();
      }
    },

    /**
    * This function will create text box
    * @param{node} contains textBoxDiv a parent node
    * @memberOf widgets/filter/filter
    */
    _createInputTextBox: function (node, functionInputParam) {
      var inputTextBox;
      inputTextBox = new TextBox({
        "class": "filterInputTextBox",
        "style": "width :100%"
      });
      inputTextBox.placeAt(node);
      on(inputTextBox, "blur", lang.hitch(this, function () {
        functionInputParam.definitionEditorInput.parameters[0].currentValue = inputTextBox.get("value");
      }));
      return inputTextBox;
    },

    /**
    * This function will create text box
    * @param{node} contains textBoxDiv a parent node
    * @memberOf widgets/filter/filter
    */
    _createNumberTextBox: function (node, functionInputParam, isRangeTextBox, index) {
      var inputTextBox, parameterIndex;
      inputTextBox = new NumberTextBox({
        "class": "filterInputTextBox",
        "style": "width :100%"
      });
      inputTextBox.placeAt(node);
      on(inputTextBox, "blur", lang.hitch(this, function () {
        //For range filters, we need to check if both input controls have a valid value
        if (isRangeTextBox && functionInputParam && functionInputParam.layerInstance) {
          this._updateApplyButtonStatus(this._layerFilterDOM[functionInputParam.layerInstance.id]);
        } else {
          //In case of invalid value, change the button color to make it look like disabled
          if (inputTextBox.isValid && inputTextBox.isValid()) {
            domClass.remove(functionInputParam.applyButton, "filterButtonDisabled");
            domClass.add(functionInputParam.applyButton, "themeButtonInvertedHover");
            this._updateToggleSwitchButtonStatus();
          } else {
            domClass.add(functionInputParam.applyButton, "filterButtonDisabled");
            domClass.remove(functionInputParam.applyButton, "themeButtonInvertedHover");
            this._updateToggleSwitchButtonStatus();
          }
        }
        //For range text boxes, store the current value as per the parameter index
        parameterIndex = isRangeTextBox ? index : 0;
        //Convert the valid number to string as 0 is treated as false value and the filter is ignored
        if (!isNaN(inputTextBox.get("value"))) {
          functionInputParam.definitionEditorInput.parameters[parameterIndex].currentValue = inputTextBox.get("value").toString();
        }
      }));
      return inputTextBox;
    },

    /**
    * This function will create radio buttons for value and unique options
    * @memberOf widgets/filter/filter
    */
    _createRadioButtons: function (radioParam) {
      var valueRadio, uniqueRadio, radioButtonParam = {};
      //Value radio button
      valueRadio = new RadioButton({
        checked: true,
        "name": radioParam.definitionEditorInput.parameters[0].fieldName + radioParam.index,
        "value": "value",
        "class": "filterRadioButton"
      });
      valueRadio.placeAt(radioParam.node);
      //Label for value radio button
      domConstruct.create('label', {
        innerHTML: this.appConfig.i18n.filter.valueRadioBtnLabel,
        for: valueRadio.id
      }, radioParam.node);

      //Unique radio button
      uniqueRadio = new RadioButton({
        checked: false,
        "name": radioParam.definitionEditorInput.parameters[0].fieldName + radioParam.index,
        "value": "unique",
        "class": "filterRadioButton"
      });
      uniqueRadio.placeAt(radioParam.node);
      //Label for unique radio button
      domConstruct.create('label', {
        innerHTML: this.appConfig.i18n.filter.uniqueRadioBtnLabel,
        for: uniqueRadio.id
      }, radioParam.node);

      radioButtonParam = {
        "valueRadio": valueRadio,
        "uniqueRadio": uniqueRadio,
        "index": radioParam.index,
        "selectOptionDiv": radioParam.selectOptionDiv,
        "textBoxDiv": radioParam.textBoxDiv,
        "selectOption": radioParam.selectOption,
        "definitionEditorInput": radioParam.definitionEditorInput,
        "askForValueField": radioParam.askForValueField,
        "layerInstance": radioParam.layerInstance,
        "index": radioParam.index
      };

      //this._openFilterParam[radioParam.index] = radioButtonParam;
      if (radioParam.definitionEditorInput.parameters[0].showTextBox) {
        domAttr.set(valueRadio, "checked", true);
        this._showTextBox(radioButtonParam);
      } else if (radioParam.definitionEditorInput.parameters[0].showDropDown) {
        domAttr.set(uniqueRadio, "checked", true);
        // boolean value 'false' tells that radio button is not clicked
        // setting radio button checked by default
        this._showDropDown(radioButtonParam);
      } else {
        domAttr.set(valueRadio, "checked", true);
        this._showTextBox(radioButtonParam);
      }

      // Attach radio buttons change event
      this._attachRadioButtonEvents(radioButtonParam);
    },

    /**
    * Create date time picker
    * @memberOf widgets/filter/filter
    */
    _createDateField: function (parentNode, obj, functionInputParam) {
      var dateInputField, fieldValue, defaultValue;
      domClass.add(parentNode, "date");
      // create input container for Date Picker
      dateInputField = domConstruct.create("div", {
        "id": functionInputParam.askForValueField + obj.index
      }, parentNode);
      // create input container for Time Picker
      dateTimeInputField = domConstruct.create("div", {
        "id": "Time" + functionInputParam.askForValueField + obj.index
      }, parentNode);
      //Date Box
      inputDateItem = new DateTextBox({
        "style": "width:100%",
        value: "",
        required: true
      }, domConstruct.create("div", {}, dateInputField));
      inputDateItem.startup();
      //Time Box
      inputTimeItem = new TimeTextBox({
        constraints: {
          timePattern: "HH:mm:ss"
        },
        value: null,
        "style": "width:100%"
      }, domConstruct.create("div", {}, dateInputField));
      inputTimeItem.startup();
      queryDateObject = {
        "node": dateInputField,
        "index": obj.index,
        "askForValueField": obj.askForValueField
      };
      //Set the attribute to each date input, this will be required while fetching the date input widget
      domAttr.set(inputDateItem.domNode, "dateType", obj.layer.id + "_" + obj.definitionEditorInput.inputType);
      inputDateItem.validator = lang.hitch(this, function (value) {
        value = lang.trim(value);
        var searchParam, searchIndex, definitionEditorInputs = obj.layer.definitionEditor.inputs;
        //Check which dates validator is being called and accordingly create the search param
        if (obj.definitionEditorInput.inputType === "startTime") {
          searchIndex = functionInputParam.index + 1;
          searchParam = obj.layer.id + "_" + "endTime";
        }
        if (obj.definitionEditorInput.inputType === "endTime") {
          searchIndex = functionInputParam.index - 1;
          searchParam = obj.layer.id + "_" + "startTime";
        }
        //Check if multiple fields are being enabled for time aware layer
        //If yes, then validate the other date field control
        //If not, always return true as user can pass the EMPTY start date and time field
        if (definitionEditorInputs[searchIndex]) {
          //If current date is EMPTY and other date field is not EMPTY
          //Validate the current date field as false and other will be true
          if (value === "" && definitionEditorInputs[searchIndex].parameters[0].currentValue !== null) {
            this._validateDateInputField(searchParam, true);
            return false;
            //If both the date fields are EMPTY
            //Validate both the date fields as true
          } else if (value === "" && definitionEditorInputs[searchIndex].parameters[0].currentValue === null) {
            this._validateDateInputField(searchParam, true);
            return true;
            //If both the date fields are not EMPTY
            //Validate both the date fields as true
          } else if (value !== "" && definitionEditorInputs[searchIndex].parameters[0].currentValue !== null) {
            dateTypeInput = query("[dateType = " + searchParam + "]", this.domNode);
            this._validateDateInputField(searchParam, true);
            return true;
            //If current date field is not EMPTY and other date field is EMPTY
            //Validate the current date field as true anf other will be false
          } else if (value !== "" && definitionEditorInputs[searchIndex].parameters[0].currentValue === null) {
            this._validateDateInputField(searchParam, false);
            return true;
          }
        } else {
          return true;
        }
      });

      this.own(on(inputDateItem, 'change', lang.hitch(this, function (value) {
        var timeValue, dateValue, datePart, timePart;
        //Convert the undefined values to null
        if (!value) {
          value = null;
        }
        //get current time tex box value based on input type
        if (obj.definitionEditorInput.inputType === "startTime") {
          timeValue = obj.definitionEditorInput.startTime
        } else {
          timeValue = obj.definitionEditorInput.endTime;
        }
        //case: 1 date is empty and time is not empty
        //case: 2 date is empty and time is empty
        if (value === null) {
          obj.definitionEditorInput.parameters[0].currentValue = null;
        } else {
          //date is not empty
          if (value !== null) {
            //case 3: date is not empty and time is not empty
            if (timeValue !== null) {
              datePart = value.toDateString();
              timePart = timeValue;
              obj.definitionEditorInput.parameters[0].currentValue = new Date(datePart + " " + timePart).toISOString();
            } else {
              //case 3: date is not empty and time is empty
              dateValue = value.toDateString();
              datePart = new Date(dateValue).toDateString();
              obj.definitionEditorInput.parameters[0].currentValue = new Date(datePart).toISOString();
            }
          }
        }
        //Update the status of apply button based on valid/invalid input controls
        this._updateApplyButtonStatus(this._layerFilterDOM[functionInputParam.layerInstance.id]);
      })));
      this.own(on(inputTimeItem, 'change', lang.hitch(this, function (value) {
        var timePart, dateValue, datePart;
        //Convert the undefined values to null
        if (!value) {
          value = null;
        }
        //fetch current time tex box value based on input type
        if (obj.definitionEditorInput.inputType === "startTime") {
          obj.definitionEditorInput.startTime = value ? value.toTimeString() : null;
        } else {
          obj.definitionEditorInput.endTime = value ? value.toTimeString() : null;
        }

        //If current value is not null then only create the update value
        if (obj.definitionEditorInput.parameters[0].currentValue !== null) {
          //If valid time is entered, create updated date time
          if (value !== null) {
            timePart = value.toTimeString();
            dateValue = obj.definitionEditorInput.parameters[0].currentValue;
            datePart = new Date(dateValue).toDateString();
            obj.definitionEditorInput.parameters[0].currentValue = new Date(datePart + " " + timePart).toISOString();
          } else {
            //Otherwise create updated date only
            dateValue = obj.definitionEditorInput.parameters[0].currentValue;
            datePart = new Date(dateValue).toDateString();
            obj.definitionEditorInput.parameters[0].currentValue = new Date(datePart).toISOString();
          }
        }
      })));
      defaultValue = obj.definitionEditorInput.parameters[0].defaultValue;
      //check date field value if exists else set the default or current date value
      if (obj.definitionEditorInput.parameters[0].currentValue) {
        fieldValue = obj.definitionEditorInput.parameters[0].currentValue;
      } else {
        fieldValue = defaultValue ? new Date(defaultValue) : " ";
      }
      if (fieldValue) {
        inputDateItem.set("value", new Date(fieldValue));
        inputTimeItem.set("value", new Date(fieldValue));
      }
    },

    /**
    * This function validates the date field input based on the other date fields value
    * @memberOf widgets/filter/filter
    */
    _validateDateInputField: function (searchParam, isValid) {
      var dateTypeInput, dateInputState;
      dateTypeInput = query("[dateType = " + searchParam + "]", this.domNode);
      if (dateTypeInput && dateTypeInput.length > 0) {
        dateFieldInput = registry.byNode(dateTypeInput[0]);
        dateInputState = isValid ? "" : "Error";
        dateFieldInput.set("state", dateInputState);
      }
    },

    /**
    * This function will create text boxes for range fields
    * @memberOf widgets/filter/filter
    */
    _createTextBoxRangeContainers: function (textBoxDiv, functionInputParam) {
      var firstInputBox, secondInputBox;
      domClass.add(textBoxDiv, "rangeTextBoxContainer");
      firstPrevValue = functionInputParam.definitionEditorInput.parameters[0].defaultValue;
      secondPrevValue = functionInputParam.definitionEditorInput.parameters[1].defaultValue;
      firstInputBox = this._createNumberTextBox(textBoxDiv, functionInputParam, true, 0);
      firstInputBox.set("value", firstPrevValue);
      functionInputParam.definitionEditorInput.parameters[0].currentValue = firstInputBox.get("value");
      domConstruct.create("div", {
        "innerHTML": this.appConfig.i18n.filter.andTextLabel,
        "class": "rangeFilterAndTextDiv"
      }, textBoxDiv);
      secondInputBox = this._createNumberTextBox(textBoxDiv, functionInputParam, true, 1);
      secondInputBox.set("value", secondPrevValue);
      functionInputParam.definitionEditorInput.parameters[1].currentValue = secondInputBox.get("value");
    },

    /**
    * Attach radio buttons change events
    * @memberOf widgets/filter/filter
    */
    _attachRadioButtonEvents: function (radioParamObj) {
      // on 'value' radio button select
      on(radioParamObj.valueRadio, "change", lang.hitch(this, function (checked) {
        if (checked) {
          this._showTextBox(radioParamObj);
        }
        this._updateApplyButtonStatus(this._layerFilterDOM[radioParamObj.layerInstance.id]);
      }));
      // on 'unique' radio button select
      on(radioParamObj.uniqueRadio, "change", lang.hitch(this, function (checked) {
        if (checked) {
          this._showDropDown(radioParamObj);
          this._updateApplyButtonStatus(this._layerFilterDOM[radioParamObj.layerInstance.id]);
        }
      }));
    },

    /**
    * Function to show text box if 'value' radio button selected
    * @memberOf widgets/filter/filter
    */
    _showTextBox: function (radioParamObj) {
      domStyle.set(radioParamObj.selectOptionDiv, "display", "none");
      domStyle.set(radioParamObj.textBoxDiv, "display", "block");
      radioParamObj.definitionEditorInput.parameters[0].showTextBox = true;
      radioParamObj.definitionEditorInput.parameters[0].showDropDown = false;
    },

    /**
    * Function to show dropdown if 'unique' radio button selected
    * @memberOf widgets/filter/filter
    */
    _showDropDown: function (radioParamObj) {
      domStyle.set(radioParamObj.selectOptionDiv, "display", "block");
      domStyle.set(radioParamObj.textBoxDiv, "display", "none");
      radioParamObj.definitionEditorInput.parameters[0].showTextBox = false;
      radioParamObj.definitionEditorInput.parameters[0].showDropDown = true;
      //Query the distinct values only if it was not queried before
      if (this._distinctValuesObj[radioParamObj.layerInstance.id] &&
        !this._distinctValuesObj[radioParamObj.layerInstance.id][radioParamObj.index]) {
        this._checkAttributeDistinctValues(radioParamObj);
      }
    },

    /**
    * Function to check attributes distinct values
    * @memberOf widgets/filter/filter
    */
    _checkAttributeDistinctValues: function (radioParamObj) {
      if (radioParamObj.isCodedDomain) {
        // for coded domain values which have selected permissible values
        this._populateWithCodedDomainValues(radioParamObj);
      } else if (radioParamObj.isTypeIdField) {
        // for coded domain values which have selected permissible values
        this._populateWithTypeIdValues(radioParamObj);
      } else { // else query layer to get all distinct values of the field and populate the dropdown
        this._queryLayerForDistinctValues(radioParamObj);
      }
    },

    /**
    * Function to populate dropdown with coded domain values
    * @memberOf widgets/filter/filter
    */
    _populateWithCodedDomainValues: function (radioParamObj) {
      var features = [], attributes;
      array.forEach(radioParamObj.layerInstance.fields, lang.hitch(this, function (field) {
        if (field.name === radioParamObj.askForValueField && field.domain
          && field.domain.codedValues.length > 0) {
          array.forEach(field.domain.codedValues, lang.hitch(this,
            function (codedValue) {//ignore jslint
              attributes = {};
              attributes[radioParamObj.askForValueField] = codedValue.code;
              features.push({ "attributes": attributes });
            }));
        }
      }));
      this._populateDropDown(features, radioParamObj);
    },

    /**
    * Function to populate dropdown with type id values (coded domain values)
    * @memberOf widgets/filter/filter
    */
    _populateWithTypeIdValues: function (radioParamObj) {
      var attributes, features;
      features = [];
      if (radioParamObj.layerInstance.types && radioParamObj.layerInstance.typeIdField === radioParamObj.askForValueField) {
        array.forEach(radioParamObj.layerInstance.types, lang.hitch(this, function (type) {
          attributes = {};
          attributes[radioParamObj.askForValueField] = type.id;
          features.push({ "attributes": attributes });
        }));
        this._populateDropDown(features, radioParamObj);
      } else if (radioParamObj.layerInstance.types && radioParamObj.layerInstance.types.length > 0) {
        array.forEach(radioParamObj.layerInstance.types, lang.hitch(this, function (type) {
          if (type.domains && type.domains[radioParamObj.askForValueField] &&
            type.domains[radioParamObj.askForValueField].codedValues &&
            type.domains[radioParamObj.askForValueField].codedValues.length > 0) {
            array.forEach(type.domains[radioParamObj.askForValueField].codedValues, lang.hitch(this,
              function (codedValue) {
                features.push(codedValue.code);
              }));
          }
        }));
        features = this._getUniqueCodes(features, radioParamObj.askForValueField);
        this._populateDropDown(features, radioParamObj);
      }
    },

    /**
    * Function to get unique coded values
    * @memberOf widgets/filter/filter
    */
    _getUniqueCodes: function (features, askForValueField) {
      var arr, newFeatures, i, attributes;
      arr = [];
      newFeatures = [];
      for (i = 0; i < features.length; i++) {
        if (!(this._hasValue(arr, features[i]))) {
          arr.push(features[i]);
          attributes = {};
          attributes[askForValueField] = arr[i];
          newFeatures.push({ "attributes": attributes });

        }
      }
      return newFeatures;
    },

    /** This function will show filter icon on the field header
    * @memberOf widgets/filter/filter
    */
    _getTypeIdField: function (radioParamObj, code, askForValueField) {
      var isNotFound = true, value = {};
      if (radioParamObj.layerInstance.types && radioParamObj.layerInstance.typeIdField === askForValueField) {
        array.forEach(radioParamObj.layerInstance.types, lang.hitch(this, function (type) {
          if (type.id === code && isNotFound) {
            value = { code: type.id, name: type.name };
            isNotFound = false;
          }
        }));
      } else if (radioParamObj.layerInstance.types && radioParamObj.layerInstance.types.length > 0) {
        array.forEach(radioParamObj.layerInstance.types, lang.hitch(this, function (type) {
          if (type.domains && type.domains[askForValueField] && type.domains[askForValueField].codedValues &&
            type.domains[askForValueField].codedValues.length > 0) {
            array.forEach(type.domains[askForValueField].codedValues, lang.hitch(this, function (codedValue) {
              if (codedValue.code === code) {
                value = codedValue;
              }
            }));
          }
        }));
      }
      return value;
    },

    /**
    * Function to check unique values in an array
    * @memberOf widgets/filter/filter
    */
    _hasValue: function (array, value) {
      var condition, i;
      condition = false;
      for (i = 0; i < array.length; i++) {
        if (array[i] === value) {
          condition = true;
          return condition;
        }
      }
      return condition;
    },

    /**
    * Get the distinct values for the particular field
    * @memberOf widgets/filter/filter
    */
    _queryLayerForDistinctValues: function (radioParamObj) {
      var queryTask, queryLayer;
      this.showLoadingIndicator();
      queryTask = new QueryTask(radioParamObj.layerInstance.url);
      queryLayer = new Query();
      queryLayer.returnGeometry = false;
      queryLayer.returnDistinctValues = true;
      queryLayer.where = "1=1";
      queryLayer.outFields = [radioParamObj.askForValueField];
      queryTask.execute(queryLayer).then(lang.hitch(this,
        function (results) {
          // function to populate combo box
          this._populateDropDown(results.features, radioParamObj);
          this.hideLoadingIndicator();
        }), lang.hitch(this, function (err) {
          this.hideLoadingIndicator();
          console.log(err.message);
        }));
    },

    /**
    * Show the obtained distinct values in drop down
    * @memberOf widgets/filter/filter
    */
    _populateDropDown: function (features, radioParamObj) {
      var codedDomainField = {}, options = [{
        "label": this.appConfig.i18n.filter.selectOption,
        "value": "",
        "selected": true
      }];
      if (features.length > 0) {
        //start pushing option to dropdown
        //If the length of features is greater than 0
        //and values are not invalid
        array.forEach(features, lang.hitch(this, function (feature, i) {
          if (feature.attributes[radioParamObj.askForValueField] === 0 ||
            (feature.attributes[radioParamObj.askForValueField] &&
              (feature.attributes[radioParamObj.askForValueField] !== "" ||
                feature.attributes[radioParamObj.askForValueField] !== null))) {
            if (radioParamObj.isCodedDomain) {
              codedDomainField = this._getCodedDomainValue(feature.attributes[radioParamObj.askForValueField], radioParamObj);
            } else if (radioParamObj.isTypeIdField) {
              codedDomainField = this._getTypeIdField(radioParamObj, feature.attributes[radioParamObj.askForValueField],
                radioParamObj.askForValueField);
            } else {
              codedDomainField.name = feature.attributes[radioParamObj.askForValueField]
              codedDomainField.code = feature.attributes[radioParamObj.askForValueField];
            }
            options.push({
              "label": codedDomainField.name.toString(),
              "value": codedDomainField.code.toString()
            });
          }
        }));
      }
      if (options.length > 0) {
        this._distinctValuesObj[radioParamObj.layerInstance.id][radioParamObj.index] = options;
      }
      radioParamObj.selectOption.set("options", options);
      //Select the default value
      if (radioParamObj.definitionEditorInput.parameters[0].defaultValue) {
        radioParamObj.selectOption.set("value", radioParamObj.definitionEditorInput.parameters[0].defaultValue);
        radioParamObj.definitionEditorInput.parameters[0].currentValue = radioParamObj.selectOption.get("value");
      }
    },

    /**
    * Toggle item content panel
    * @memberOf widgets/filter/filter
    */
    _togglePanel: function (node, backIcon) {
      var panel;
      panel = query(".itemContent", node)[0];
      domClass.toggle(panel, "itemContentActive");
      //If item is active, open the item content
      if (domClass.contains(panel, "itemContentActive")) {
        panel.style.height = panel.scrollHeight + "px";
      } else {
        panel.style.height = 0;
      }
      //Toggle the arrow image based on the open/closed state of content's
      if (domClass.contains(backIcon, "filterListBackIconClosed")) {
        domClass.replace(backIcon, "filterListBackIconOpen", "filterListBackIconClosed");
      } else {
        domClass.replace(backIcon, "filterListBackIconClosed", "filterListBackIconOpen");
      }
    },

    /**
    * Create toggle switch of each filter item
    * @memberOf widgets/filter/filter
    */
    _createToggleSwitch: function (layer, itemSwitch, itemSummaryDiv) {
      var toggleSwitch, stateChangeEvent;
      toggleSwitch = new Switch({
        dir: "ltr",
        id: layer.id,
        value: this.appConfig.enableAllFilters ? "on" : "off",
        class: "mblSwRoundShape1 linkToggleBtn",
        "leftLabel": "",
        "rightLabel": ""
      });
      toggleSwitch.placeAt(itemSwitch);
      toggleSwitch.resize();
      //Add the theme color to button
      array.forEach(query(".mblSwitchBgLeft", toggleSwitch.domNode), function (item) {
        domClass.add(item, "themeHeaderInverted");
      });
      //Push the toggle switch instance into an object
      //This will be needed when we want on/off the filters based on parent toggle switch
      this._toggleSwitchObj[layer.id] = toggleSwitch;
      //Bind the click event if layer is Time aware layer or
      //Ask for values filter is being set in the webmap
      if (this._parameterizedExpressions[layer.id]) {
        //Bind the click event for "Ask For Values" filters
        //This event checks for valid values for the current layer filter
        //Then decides wether to fire the event or not
        on(toggleSwitch, "click", lang.hitch(this, function (newState) {
          stateChangeEvent.pause();
          var isValidData = true;
          var widgetsArray = registry.findWidgets(this._layerFilterDOM[layer.id]);
          array.some(widgetsArray, lang.hitch(this, function (widget) {
            isValidData = true
            if (widget.domNode && widget.isValid && !widget.isValid()) {
              isValidData = false;
              event.stopPropagation();
              return true;
            }
          }));
          //If invalid filter is being applied stop the process and open the item content if it is closed
          if (!isValidData) {
            toggleSwitch.set("value", toggleSwitch.get("value") === "off" ? "on" : "off");
            if (domStyle.get(this._layerFilterDOM[layer.id], "height") === 0) {
              itemSummaryDiv.click();
            }
          } else {
            stateChangeEvent.resume();
          }
        }));
      }

      //Stop the event from propagating below
      stateChangeEvent = on.pausable(toggleSwitch, "stateChanged", lang.hitch(this, function (newState) {
        //Stop the event from propagating further
        event.stopPropagation();
        //If parameterized expression exist, process it as the "Ask For Values" filter
        if (this._parameterizedExpressions[layer.id]) {
          //If the button is turned on, evaluate and apply the new definition expression
          if (newState === "on") {
            var expression;
            expression = this._parameterizedExpressions[layer.id];
            this._createDefinitionExpression(expression, layer.definitionEditor);
            this._applyParameterizedExpression(layer.layerObject);
          } else {
            //If button is turned off, check if some filters applied through URL
            //If yes, then apply those filters to maintain the app state
            if (this.urlDefExpr[layer.id]) {
              layer.layerObject.setDefinitionExpression(this.urlDefExpr[layer.id]);
            } else {
              //If no url filters are applied, apply the empty definition expression to the layers
              layer.layerObject.setDefinitionExpression("");
            }
            this._filterDefExpr[layer.id] = layer.layerObject.getDefinitionExpression();
          }
          this.onFilterUpdated(layer.id === this.itemLayer.id);
          //Reset the status of parent filter button
          this._updateHeaderToggleSwitch();
        }
      }));
    },

    /**
    * Get coded domain values
    * @memberOf widgets/filter/filter
    */
    _getCodedDomainValue: function (value, obj) {
      var isNotFound = true;
      array.forEach(obj.layerInstance.fields, lang.hitch(this, function (field) {
        if (field.name === obj.askForValueField && field.domain && field.domain.codedValues.length > 0) {
          array.forEach(field.domain.codedValues, lang.hitch(this, function (codedValue) {
            if (codedValue.code === value && isNotFound) {
              value = codedValue;
              isNotFound = false;
            }
          }));
        }
      }));
      return value;
    },


    /*----------------- Apply Filter Section ------------------------*/
    /**
       * This function will set a definition expression for the layer
       * @memberOf widgets/filter/filter
       */
    _createDefinitionExpression: function (expression, definitionEditor) {
      var outerSplitterArray = [], expressionValue, outerSplitBy = "";
      // split and check if multiple filters are applied
      expression = expression.split("}'").join("}").split("'{").join("{");
      expression = expression.split("}").join("}'").split("{").join("'{");
      expression = expression.split("}'%'").join("}%'").split("'%'{").join("'%{");
      if (expression.split(") AND (").length > 1) {
        // if 'yes' then slice substring to set values accordingly
        expressionValue = expression.substring(1, (expression.length - 1));
        // split the _parameterizedExpression to set values to set current definition expression
        outerSplitterArray = expressionValue.split(") AND (");
        outerSplitBy = ") AND (";
        this._createQueryExpression(outerSplitterArray, outerSplitBy, definitionEditor);
      } else if (expression.split(") OR (").length > 1) {
        // if the expression is an 'ANY' expression
        // if 'yes' then slice substring to set values accordingly
        expressionValue = expression.substring(1, (expression.length - 1));
        // split the _parameterizedExpression to set values to set current definition expression
        outerSplitterArray = expressionValue.split(") OR (");
        outerSplitBy = ") OR (";
        this._createQueryExpression(outerSplitterArray, outerSplitBy, definitionEditor);
      } else {
        // if it is a single parameter expression
        outerSplitterArray[0] = expression;
        this._createQueryExpression(outerSplitterArray, null, definitionEditor);
      }
    },

    /**
    * This function will create a definition expression for the layer
    * @param{array} contains sub expressions
    * @param{string} contains the splitter
    * @memberOf widgets/filter/filter
    */
    _createQueryExpression: function (outerSplitterArray, outerSplitBy, definitionEditor) {
      var outerSplitterNewArray = [], innerSplitterArray = [], innerSplitBy, returnedString, x = 0;
      // check inside expression
      for (x = 0; x < outerSplitterArray.length; x++) {
        //array.forEach(outerSplitterArray, lang.hitch(this, function(item){
        if (outerSplitterArray[x].split(" OR ").length > 1) {
          innerSplitterArray = outerSplitterArray[x].split(" OR ");
          innerSplitBy = " OR ";
          returnedString = this._getSubQueryExpression(innerSplitterArray, innerSplitBy, definitionEditor);
          if (lang.trim(returnedString) !== "") {
            outerSplitterNewArray.push(returnedString);
          }
        } else if (outerSplitterArray[x].split(" AND ").length > 1) {
          innerSplitterArray = outerSplitterArray[x].split(" AND ");
          innerSplitBy = " AND ";
          returnedString = this._getSubQueryExpression(innerSplitterArray, innerSplitBy, definitionEditor);
          if (lang.trim(returnedString) !== "") {
            outerSplitterNewArray.push(returnedString);
          }
        } else {
          returnedString = this._getSubQueryExpression([outerSplitterArray[x]], null, definitionEditor);
          if (lang.trim(returnedString) !== "") {
            outerSplitterNewArray.push(returnedString);
          }
        }
      }

      if (outerSplitterNewArray.length > 1) {
        this._currentExpression = outerSplitterNewArray.join(outerSplitBy);
        this._currentExpression = "(" + this._currentExpression + ")";
      } else {
        // if expressionArray length is equal to 1 and not empty, else set the expression to '1=1'
        this._currentExpression = (outerSplitterNewArray[0] && outerSplitterNewArray[0] !== "") ? outerSplitterNewArray[0] : "1=1";
      }
    },

    /**
    * This function will set a sub part of definition expression for the layer
    * @param{array} contains sub expressions of the sub expression
    * @param{string} contains the sub expression splitter
    * @memberOf widgets/filter/filter
    */
    _getSubQueryExpression: function (innerSplitterArray, innerSplitBy, definitionEditor) {
      var innerSplitterNewArray = [], i = 0, j = 0, returningString = "", id;
      for (i = 0; i < innerSplitterArray.length; i++) {
        if (innerSplitterArray[i].split("{").length > 1) {
          if (!(innerSplitterArray[i].match(/^(\')/) || innerSplitterArray[i].match(/^(timestamp )/))) {
            for (j = 0; j < definitionEditor.inputs.length; j++) {
              if (innerSplitterArray[i].split("{").length > 1) {
                if (!(innerSplitterArray[i].match(/^(\')/) || innerSplitterArray[i].match(/^(timestamp )/))) {
                  if (innerSplitterArray[i].split("{")[1].split("}")[0] ===
                    definitionEditor.inputs[j].parameters[0].parameterId.toString() &&
                    definitionEditor.inputs[j].parameters[0].currentValue) {
                    id = definitionEditor.inputs[j].parameters[0].parameterId;
                    if (definitionEditor.inputs[j].parameters[0].type === "esriFieldTypeDate") {
                      if (definitionEditor.inputs[j].inputType === "startTime") {
                        if (innerSplitBy === " AND ") {
                          var defaultValueObj = {
                          };
                          //The end date parameter will always be incremented by 1
                          var endDateParameterId = id + 1;
                          //Exytaract start date and end date values
                          //Create the object keys same as parameter ids
                          //This will be used while replacing the values with ids 
                          defaultValueObj[id] = definitionEditor.inputs[j].parameters[0].currentValue;
                          defaultValueObj[id + 1] = definitionEditor.inputs[j + 1].parameters[0].currentValue;

                          //Split the expession with the help of parameter ids
                          innerSplitterArray[i] = innerSplitterArray[i].split("{" + id + "}").join("{" + id + "}");
                          innerSplitterArray[i + 1] = innerSplitterArray[i + 1].split("{" + (endDateParameterId) + "}").join("{" + endDateParameterId + "}");
                          //Replace the parameter ids with the actual date vlaues
                          innerSplitterNewArray.push(lang.replace(innerSplitterArray[i],
                            defaultValueObj));
                          innerSplitterNewArray.push(lang.replace(innerSplitterArray[i + 1],
                            defaultValueObj));
                        } else {
                          var defaultValueObj = {
                          };
                          defaultValueObj[id] = definitionEditor.inputs[j].parameters[0].currentValue;
                          innerSplitterArray[i] = innerSplitterArray[i].split("{" + id + "}").join("{" + id + "}");
                          innerSplitterNewArray.push(lang.replace(innerSplitterArray[i],
                            defaultValueObj));
                        }
                      }
                    } else {
                      if (definitionEditor.inputs[j].parameters.length === 1) {
                        innerSplitterArray[i] = innerSplitterArray[i].split("{" + id + "}").join("{0}");
                        innerSplitterNewArray.push(lang.replace(innerSplitterArray[i],
                          [definitionEditor.inputs[j].parameters[0].currentValue]));
                      } else {
                        if (innerSplitBy === " AND ") {
                          innerSplitterArray[i] = innerSplitterArray[i].split("{" + id + "}").join("{0}");
                          innerSplitterArray[i + 1] = innerSplitterArray[i + 1].split("{" + (id + 1) + "}").join("{0}");
                          innerSplitterNewArray.push(lang.replace(innerSplitterArray[i],
                            [definitionEditor.inputs[j].parameters[0].currentValue]));
                          innerSplitterNewArray.push(lang.replace(innerSplitterArray[i + 1],
                            [definitionEditor.inputs[j].parameters[1].currentValue]));
                        } else {
                          innerSplitterArray[i] =
                            innerSplitterArray[i].split("{" + id + "}").join("{0}").split("{" + (id + 1) + "}").join("{1}");
                          innerSplitterNewArray.push(lang.replace(innerSplitterArray[i],
                            [definitionEditor.inputs[j].parameters[0].currentValue,
                            definitionEditor.inputs[j].parameters[1].currentValue]));
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } else {
          innerSplitterNewArray.push(innerSplitterArray[i]);
        }
      }
      if (innerSplitBy) {
        returningString = innerSplitterNewArray.join(innerSplitBy);
      } else {
        if (innerSplitterNewArray.length > 0) {
          returningString = innerSplitterNewArray[0];
        } else {
          returningString = "";
        }
      }
      return returningString;
    },

    /**
    * This function is used to convert single quotes to double single quotes
    * @memberOf widgets/filter/filter
    */
    _addSingleQuotes: function (currentExpression) {
      var singleQuoteValueArr, mainSplitArr, isNotNull, isNull, isNotNullReplaceStr, isNullReplaceStr;
      isNotNull = "IS NOT NULL";
      isNotNullReplaceStr = "IS NOT NULL NULL";
      isNull = "IS NULL";
      isNullReplaceStr = "IS NULL NULL";
      currentExpression = currentExpression.replace(isNotNull, isNotNullReplaceStr);
      currentExpression = currentExpression.replace(isNull, isNullReplaceStr);
      mainSplitArr = currentExpression.split(/ OR | AND /);
      singleQuoteValueArr = currentExpression.split(/ OR | LIKE N| NOT LIKE | IS NOT NULL | IS NULL | LIKE | <> | AND | = |\)|\(/);
      singleQuoteValueArr = singleQuoteValueArr.
        filter(function (n) { return n !== " "; }).
        filter(function (n) { return n !== ""; }).
        filter(function (element, index) { //ignore jslint
          if (singleQuoteValueArr && singleQuoteValueArr.length > 1) {
            return (index % 2 !== 0);
          } else {
            return true;
          }
        }).
        map(Function.prototype.call, String.prototype.trim);

      array.forEach(singleQuoteValueArr, lang.hitch(this, function (singleQuoteValue, index) {
        var searchString, changeString, result, regex;
        regex = /'(.*)'/g;
        result = regex.exec(singleQuoteValue);
        if (result && result.length >= 2) {
          searchString = result[1];
          changeString = searchString.replace(/'/g, "''");
          currentExpression =
            currentExpression.replace(mainSplitArr[index],
              mainSplitArr[index].replace(searchString, changeString));
        } else {
          if (mainSplitArr[index] && mainSplitArr[index].includes(isNotNullReplaceStr)) {
            currentExpression =
              currentExpression.replace(mainSplitArr[index],
                mainSplitArr[index].replace(isNotNullReplaceStr, isNotNull));
          } else if (mainSplitArr[index] && mainSplitArr[index].includes(isNullReplaceStr)) {
            currentExpression =
              currentExpression.replace(mainSplitArr[index],
                mainSplitArr[index].replace(isNullReplaceStr, isNull));
          }
        }
      }));

      return currentExpression;
    },

    /**
    * This function will apply filter and refresh the layer
    * @memberOf widgets/filter/filter
    */
    _applyParameterizedExpression: function (layer) {
      var extractedDefExpr, expressionFromURL = "";
      extractedDefExpr = this._addSingleQuotes(lang.clone(this._currentExpression));
      if (this.urlDefExpr && this.urlDefExpr.hasOwnProperty(layer.id)) {
        expressionFromURL = this.urlDefExpr[layer.id];
      }
      //If url has some expression apply it with the new definition expression
      //Or apply the new definition expression
      if (expressionFromURL !== "") {
        layer.setDefinitionExpression("(" + extractedDefExpr + ")" + " AND " + expressionFromURL);
      } else {
        layer.setDefinitionExpression(extractedDefExpr);
      }
      this._filterDefExpr[layer.id] = layer.getDefinitionExpression();
      this.onFilterUpdated(layer.id === this.itemLayer.id);
    },

    /**
    * Show loading indicator inside the filter panel
    * @memberOf widgets/filter/filter
    */
    showLoadingIndicator: function () {
      domStyle.set(this.busy, "display", "block");
    },

    /**
    * Hide loading indicator inside the filter panel
    * @memberOf widgets/filter/filter
    */
    hideLoadingIndicator: function () {
      domStyle.set(this.busy, "display", "none");
    },

    /**
    * Update parent toggle button state based on other toggle switches
    * @memberOf widgets/filter/filter
    */
    _updateHeaderToggleSwitch: function () {
      var isAllFiltersEnabled = true;
      //Once a toggle button state is changed, loop though all the toggle buttons 
      //to update the status of parent toggle button
      for (var layerID in this._toggleSwitchObj) {
        //If all at least one toggle button is set to off
        //Turn off the parent toggle button
        if (this._toggleSwitchObj[layerID].get("value") !== "on") {
          isAllFiltersEnabled = false;
        }
      }
      this.toggleFiltersBtn.set("value", isAllFiltersEnabled ? "on" : "off");
    },

    /**
     * This function is used to get TimeDefination for time-aware layers
     */
    _getTimeDefinationForLayer: function (definitionEditorInput) {
      return new Date(definitionEditorInput.parameters[0].currentValue);
    },

    /**
     * This function is used to create time inputs
     */
    _createDateTimeInputParams: function (hint, prompt, layer, parameterId, inputType) {
      var inputObj = {}, timeExtent = layer.layerObject.timeInfo.timeExtent;
      inputObj["hint"] = hint;
      inputObj["prompt"] = prompt;
      inputObj["timeEnabled"] = true;
      inputObj["inputType"] = inputType;
      inputObj[inputType] = timeExtent && timeExtent.hasOwnProperty(inputType) ? timeExtent[inputType].toTimeString() : "";
      inputObj["parameters"] = [{
        type: "esriFieldTypeDate",
        fieldName: inputType === "startTime" ? layer.layerObject.timeInfo.startTimeField : layer.layerObject.timeInfo.endTimeField,
        parameterId: parameterId,
        defaultValue: timeExtent && timeExtent.hasOwnProperty(inputType) ? timeExtent[inputType] : null,
        currentValue: timeExtent && timeExtent.hasOwnProperty(inputType) ? timeExtent[inputType] : null,
      }];
      return inputObj;
    },

    /**
     * This function is used to parameterized expression of time aware layers
     */
    _parameterizedExpForTimeLayer: function (layer) {
      //Check if layer has start and end date field configured for time extent
      if ((layer.layerObject.timeInfo.hasOwnProperty("startTimeField") &&
        layer.layerObject.timeInfo.startTimeField !== ""
        && layer.layerObject.timeInfo.startTimeField !== null)
        && (layer.layerObject.timeInfo.hasOwnProperty("endTimeField") &&
          layer.layerObject.timeInfo.endTimeField !== "" &&
          layer.layerObject.timeInfo.endTimeField !== null)) {
        return this._createTimeDefinitionExpression(layer, true);
      } else {
        return this._createTimeDefinitionExpression(layer, false);
      }
    },

    /**
     * This function extracts the data and created the expression and parameterized expression
     */
    _createTimeDefinitionExpression: function (layer, isMultiFieldEnable) {
      var expression, pExpression, startFieldOperator = " >= ";
      //If only start field is enabled, the expression will always be checked for equality
      if (!isMultiFieldEnable) {
        startFieldOperator = " = ";
      }
      array.forEach(layer.definitionEditor.inputs, lang.hitch(this, function (editorInput) {
        if (editorInput.hasOwnProperty("timeEnabled")) {
          if (editorInput.hasOwnProperty("inputType") && editorInput.inputType === "startTime") {
            expression = editorInput.parameters[0].fieldName + startFieldOperator + "'" + editorInput.parameters[0].defaultValue + "'" || "";
            pExpression = editorInput.parameters[0].fieldName + startFieldOperator + "{" + editorInput.parameters[0].parameterId + "}";
          } else if (editorInput.inputType === "endTime") {
            expression += " AND " + editorInput.parameters[0].fieldName + " <= " + "'" + editorInput.parameters[0].defaultValue + "'" || "";
            pExpression += " AND " + editorInput.parameters[0].fieldName + " <= " + "{" + editorInput.parameters[0].parameterId + "}";
          }
        }
      }));
      return {
        "expression": expression,
        "pExpression": pExpression
      }
    }
  });
});
