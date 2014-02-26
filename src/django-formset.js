var FormsetError,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

FormsetError = (function(_super) {
  __extends(FormsetError, _super);

  function FormsetError() {
    return FormsetError.__super__.constructor.apply(this, arguments);
  }

  return FormsetError;

})(Error);

(function($) {
  $.fn.djangoFormset = function(options) {
    return new $.fn.djangoFormset.Formset(this, options);
  };
  $.fn.djangoFormset.Formset = (function() {
    function Formset(base) {
      var inputName, placeholderPos;
      if (base.length === 0) {
        throw new FormsetError("Empty selector.");
      }
      this.template = base.filter(".empty-form");
      if (this.template.length === 0) {
        throw new FormsetError("Can't find template (looking for .empty-form)");
      }
      inputName = this.template.find("input,select,textarea").first().attr('name');
      if (!inputName) {
        throw new FormsetError("Can't figure out form prefix because there's no form element in the form template. Please add one.");
      }
      placeholderPos = inputName.indexOf('-__prefix__');
      if (placeholderPos === -1) {
        throw new FormsetError("Can't figure out form prefix from template because it doesn't contain '-__prefix__'.");
      }
      this.prefix = inputName.substring(0, placeholderPos);
      this.totalForms = $("#id_" + this.prefix + "-TOTAL_FORMS");
      if (this.totalForms.length === 0) {
        throw new FormsetError("Management form field 'TOTAL_FORMS' not found for prefix " + this.prefix + ".");
      }
      this.initialForms = $("#id_" + this.prefix + "-INITIAL_FORMS");
      if (this.initialForms.length === 0) {
        throw new FormsetError("Management form field 'INITIAL_FORMS' not found for prefix " + this.prefix + ".");
      }
      this.forms = base.filter(':visible').map((function(_this) {
        return function(index, element) {
          return new $.fn.djangoFormset.Form($(element), _this, index);
        };
      })(this));
      if (this.forms.length !== parseInt(this.totalForms.val())) {
        console.error("TOTAL_FORMS is " + (this.totalForms.val()) + ", but " + this.forms.length + " visible children found.");
      }
      this.insertAnchor = base.filter(':visible').last();
      if (this.insertAnchor.length === 0) {
        this.insertAnchor = this.template;
      }
      return;
    }

    Formset.prototype.addForm = function() {
      var newForm, newFormElem;
      newFormElem = this.template.clone().removeClass("empty-form");
      newForm = new $.fn.djangoFormset.Form(newFormElem, this, this.totalForms.val());
      this.totalForms.val(parseInt(this.totalForms.val()) + 1);
      newFormElem.insertAfter(this.insertAnchor);
      this.insertAnchor = newFormElem;
      this.forms.push(newForm);
      $(this).trigger("formAdded", [newForm]);
      return newForm;
    };

    Formset.prototype.deleteForm = function(index) {
      var form;
      form = this.forms[index];
      form["delete"]();
    };

    Formset.prototype.handleFormRemoved = function(index) {
      var form, i, _i, _len, _ref;
      this.totalForms.val(parseInt(this.totalForms.val()) - 1);
      this.forms.splice(index, 1);
      _ref = this.forms;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        form = _ref[i];
        form._updateFormIndex(i);
      }
      if (this.forms.length === 0) {
        this.insertAnchor = this.template;
      } else {
        this.insertAnchor = this.forms[this.forms.length - 1].elem;
      }
    };

    return Formset;

  })();
  $.fn.djangoFormset.Form = (function() {
    function Form(elem, formset, index) {
      var deleteName;
      this.elem = elem;
      this.formset = formset;
      this.index = index;
      if (this.index !== void 0) {
        this._initFormIndex(this.index);
      }
      deleteName = "" + this.formset.prefix + "-" + this.index + "-DELETE";
      this.deleteInput = this.elem.find("input[name='" + deleteName + "']");
      this._hideDeleteCheckbox();
      this._addDeleteButton();
    }

    Form.prototype.getDeleteButton = function() {
      return $('<button type="button" class="btn btn-danger"> Delete </button>');
    };

    Form.prototype.getDeleteButtonContainer = function() {
      if (this.elem.is('TR')) {
        return this.elem.children().last();
      } else if (this.elem.is('UL') || this.elem.is('OL')) {
        return this.elem.append('li').children().last();
      } else {
        return this.elem;
      }
    };

    Form.prototype["delete"] = function() {
      var isInitial;
      isInitial = this.index < parseInt(this.formset.initialForms.val());
      if (isInitial) {
        this.deleteInput.val('on');
        this.hide();
      } else {
        this.elem.remove();
        this.formset.handleFormRemoved(this.index);
      }
    };

    Form.prototype.hide = function() {
      return this.elem.hide();
    };

    Form.prototype._hideDeleteCheckbox = function() {
      var newDeleteInput;
      this.deleteInput.before("<input type='hidden' name='" + (this.deleteInput.attr('name')) + "' id='" + (this.deleteInput.attr('id')) + "' value='" + (this.deleteInput.val()) + "'/>");
      newDeleteInput = this.deleteInput.prev();
      this.elem.find("label[for='" + (this.deleteInput.attr('id')) + "']").remove();
      this.deleteInput.remove();
      return this.deleteInput = newDeleteInput;
    };

    Form.prototype._addDeleteButton = function() {
      this.deleteButton = this.getDeleteButton();
      this.getDeleteButtonContainer().append(this.deleteButton);
      return this.deleteButton.on('click', (function(_this) {
        return function(event) {
          return _this["delete"]();
        };
      })(this));
    };

    Form.prototype._replaceFormIndex = function(oldIndexPattern, index) {
      var newPrefix, prefixRegex;
      this.index = index;
      prefixRegex = new RegExp("^(id_)?" + this.formset.prefix + "-" + oldIndexPattern);
      newPrefix = "" + this.formset.prefix + "-" + index;
      this.elem.find('input,select,textarea,label').each(function() {
        var attributeName, elem, _i, _len, _ref;
        elem = $(this);
        _ref = ['for', 'id'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attributeName = _ref[_i];
          if (elem.attr(attributeName)) {
            elem.attr(attributeName, elem.attr(attributeName).replace(prefixRegex, "id_" + newPrefix));
          }
        }
        if (elem.attr('name')) {
          elem.attr('name', elem.attr('name').replace(prefixRegex, newPrefix));
        }
      });
    };

    Form.prototype._initFormIndex = function(index) {
      this._replaceFormIndex("__prefix__", index);
    };

    Form.prototype._updateFormIndex = function(index) {
      this._replaceFormIndex('\\d+', index);
    };

    return Form;

  })();
})(jQuery);

//# sourceMappingURL=django-formset.js.map
