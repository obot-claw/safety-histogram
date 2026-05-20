(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('chart.js')) :
  typeof define === 'function' && define.amd ? define(['chart.js'], factory) :
  (global = global || self, global.safetyHistogram = factory(global.Chart));
}(this, (function (chart_js) { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys(source, true).forEach(function (key) {
          _defineProperty(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys(source).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _iterableToArrayLimit(arr, i) {
    if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
      return;
    }

    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance");
  }

  chart_js.Chart.register(chart_js.BarController, chart_js.BarElement, chart_js.CategoryScale, chart_js.LinearScale, chart_js.Tooltip, chart_js.Legend);
  var DEFAULT_SETTINGS = {
    measure_col: 'TEST',
    value_col: 'STRESN',
    id_col: 'USUBJID',
    unit_col: 'STRESU',
    normal_col_low: 'STNRLO',
    normal_col_high: 'STNRHI',
    filters: [],
    groups: [],
    details: null,
    start_value: null,
    bin_algorithm: "Scott's normal reference rule",
    normal_range: true,
    display_normal_range: false,
    annotate_bin_boundaries: false,
    test_normality: false,
    group_by: 'sh_none',
    compare_distributions: false,
    width: '100%',
    height: 460,
    page_size: 10
  };
  var ALGORITHMS = ['Square-root choice', "Sturges' formula", 'Rice Rule', "Scott's normal reference rule", "Freedman-Diaconis' choice", "Shimazaki and Shinomoto's choice", 'Custom'];

  function arrayify(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  function fieldSpec(value, fallbackLabel) {
    if (typeof value === 'string') return {
      value_col: value,
      label: fallbackLabel || value
    };
    return {
      value_col: value.value_col,
      label: value.label || value.value_col
    };
  }

  function unique(values) {
    return _toConsumableArray(new Set(values.filter(function (value) {
      return value !== undefined && value !== null && value !== '';
    })));
  }

  function quantile(values, p) {
    if (!values.length) return NaN;

    var sorted = _toConsumableArray(values).sort(function (a, b) {
      return a - b;
    });

    var idx = (sorted.length - 1) * p;
    var lo = Math.floor(idx);
    var hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  }

  function mean(values) {
    return values.reduce(function (sum, value) {
      return sum + value;
    }, 0) / values.length;
  }

  function sd(values) {
    if (values.length < 2) return 0;
    var m = mean(values);
    return Math.sqrt(values.reduce(function (sum, value) {
      return sum + Math.pow(value - m, 2);
    }, 0) / (values.length - 1));
  }

  function precision(values) {
    var decimals = values.map(function (value) {
      var text = String(value);
      return text.includes('.') ? text.split('.')[1].length : 0;
    });
    return Math.min(4, Math.max.apply(Math, [0].concat(_toConsumableArray(decimals))));
  }

  function formatNumber(value) {
    var digits = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 2;
    if (!Number.isFinite(value)) return '';
    return Number(value.toFixed(digits)).toString();
  }

  function calculateBins(values, algorithm, customQuantity, customWidth, domain) {
    var n = values.length;
    var min = domain ? domain[0] : Math.min.apply(Math, _toConsumableArray(values));
    var max = domain ? domain[1] : Math.max.apply(Math, _toConsumableArray(values));
    var range = max - min || 1;
    var quantity;
    var width;

    if (algorithm === 'Custom') {
      quantity = customQuantity ? Math.max(1, Math.round(customQuantity)) : null;
      width = customWidth ? Math.max(Number.EPSILON, Number(customWidth)) : null;
    }

    if (!quantity && !width) {
      if (algorithm === 'Square-root choice') quantity = Math.ceil(Math.sqrt(n));else if (algorithm === "Sturges' formula") quantity = Math.ceil(Math.log2(n) + 1);else if (algorithm === 'Rice Rule') quantity = Math.ceil(2 * Math.cbrt(n));else if (algorithm === "Freedman-Diaconis' choice") {
        width = 2 * (quantile(values, 0.75) - quantile(values, 0.25)) / Math.cbrt(n);
        quantity = width > 0 ? Math.ceil(range / width) : Math.ceil(Math.sqrt(n));
      } else if (algorithm === "Shimazaki and Shinomoto's choice") quantity = Math.ceil(Math.sqrt(n));else {
        width = 3.5 * sd(values) / Math.cbrt(n);
        quantity = width > 0 ? Math.ceil(range / width) : Math.ceil(Math.sqrt(n));
      }
    }

    if (!quantity && width) quantity = Math.ceil(range / width);
    quantity = Math.max(1, quantity || 1);
    width = range / quantity;
    var bins = Array.from({
      length: quantity
    }, function (_, index) {
      var lower = min + index * width;
      var upper = index === quantity - 1 ? max : min + (index + 1) * width;
      return {
        index: index,
        lower: lower,
        upper: upper,
        records: []
      };
    });
    values.forEach(function (value, idx) {
      var binIndex = Math.floor((value - min) / width);
      if (binIndex < 0) binIndex = 0;
      if (binIndex >= bins.length) binIndex = bins.length - 1;
      bins[binIndex].records.push(idx);
    });
    return {
      bins: bins,
      quantity: quantity,
      width: width,
      domain: [min, max]
    };
  }

  function syncSettings(settings) {
    var synced = _objectSpread2({}, DEFAULT_SETTINGS, {}, settings);

    synced.filters = arrayify(synced.filters).map(fieldSpec).filter(function (d) {
      return d.value_col;
    });
    var defaultGroup = {
      value_col: 'sh_none',
      label: 'None'
    };
    synced.groups = [defaultGroup].concat(_toConsumableArray(arrayify(synced.groups).map(fieldSpec).filter(function (d) {
      return d.value_col;
    })));

    if (synced.group_by && !synced.groups.some(function (group) {
      return group.value_col === synced.group_by;
    })) {
      synced.groups.push({
        value_col: synced.group_by,
        label: synced.group_by
      });
    }

    synced.group_by = synced.groups.some(function (group) {
      return group.value_col === synced.group_by;
    }) ? synced.group_by : synced.groups[0].value_col;
    synced.details = arrayify(synced.details).map(fieldSpec).filter(function (d) {
      return d.value_col;
    });

    if (!synced.details.length) {
      synced.details = [{
        value_col: synced.id_col,
        label: 'Participant ID'
      }].concat(_toConsumableArray(synced.filters), [{
        value_col: synced.value_col,
        label: 'Result'
      }, {
        value_col: synced.normal_col_low,
        label: 'Lower Limit of Normal'
      }, {
        value_col: synced.normal_col_high,
        label: 'Upper Limit of Normal'
      }, {
        value_col: synced.unit_col,
        label: 'Unit'
      }]).filter(function (d) {
        return d.value_col;
      });
    }

    if (settings.displayNormalRange !== undefined) synced.display_normal_range = settings.displayNormalRange;
    return synced;
  }

  function createElement(tag, className, text) {
    var element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function option(select, value, label, selected) {
    var opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    opt.selected = selected;
    select.appendChild(opt);
  }

  function normalRangePlugin(instance) {
    return {
      id: "normal-range-".concat(Math.random().toString(36).slice(2)),
      beforeDatasetsDraw: function beforeDatasetsDraw(chart) {
        if (!instance.state.displayNormalRange || !instance.state.normalRange) return;
        var ctx = chart.ctx,
            chartArea = chart.chartArea,
            scales = chart.scales;
        var bins = chart.$shBins || [];
        var matched = bins.map(function (bin, index) {
          return {
            bin: bin,
            index: index
          };
        }).filter(function (_ref) {
          var bin = _ref.bin;
          return bin.upper >= instance.state.normalRange.low && bin.lower <= instance.state.normalRange.high;
        });
        if (!matched.length) return;
        var start = matched[0].index - 0.5;
        var end = matched[matched.length - 1].index + 0.5;
        var left = scales.x.getPixelForValue(start);
        var right = scales.x.getPixelForValue(end);
        ctx.save();
        ctx.fillStyle = 'rgba(160, 160, 160, 0.25)';
        ctx.fillRect(Math.max(chartArea.left, left), chartArea.top, Math.min(chartArea.right, right) - Math.max(chartArea.left, left), chartArea.bottom - chartArea.top);
        ctx.restore();
      }
    };
  }

  var SafetyHistogram =
  /*#__PURE__*/
  function () {
    function SafetyHistogram() {
      var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'body';
      var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, SafetyHistogram);

      this.element = typeof element === 'string' ? document.querySelector(element) : element;
      if (!this.element) throw new Error("Safety Histogram target not found: ".concat(element));
      this.settings = syncSettings(settings);
      this.rawData = [];
      this.cleanData = [];
      this.filteredData = [];
      this.currentTableData = [];
      this.page = 1;
      this.charts = [];
      this.state = {
        measure: this.settings.start_value,
        filters: {},
        groupBy: this.settings.group_by,
        lower: null,
        upper: null,
        algorithm: this.settings.bin_algorithm,
        quantity: null,
        width: null,
        displayNormalRange: this.settings.display_normal_range,
        normalRange: null,
        annotateBoundaries: this.settings.annotate_bin_boundaries
      };
      this.renderShell();
    }

    _createClass(SafetyHistogram, [{
      key: "renderShell",
      value: function renderShell() {
        this.element.innerHTML = '';
        this.root = createElement('div', 'safety-histogram');
        this.controls = createElement('div', 'sh-controls');
        this.notes = createElement('div', 'sh-notes');
        this.chartWrap = createElement('div', 'sh-chart-wrap');
        this.canvas = createElement('canvas', 'sh-chart');
        this.footnote = createElement('div', 'sh-footnote', 'Hover over or click a bar for details.');
        this.multiplesWrap = createElement('div', 'sh-multiples');
        this.listingWrap = createElement('div', 'sh-listing');
        this.chartWrap.append(this.canvas);
        this.root.append(this.controls, this.notes, this.chartWrap, this.footnote, this.multiplesWrap, this.listingWrap);
        this.element.append(this.root);
        this.applyStyles();
      }
    }, {
      key: "applyStyles",
      value: function applyStyles() {
        if (document.getElementById('safety-histogram-nextgen-styles')) return;
        var style = document.createElement('style');
        style.id = 'safety-histogram-nextgen-styles';
        style.textContent = "\n.safety-histogram{width:100%;font-family:system-ui,-apple-system,BlinkMacSystemFont,\"Segoe UI\",sans-serif;color:#1f2933}.sh-controls{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:.75rem;margin:.75rem 0 1rem;padding:1rem;border:1px solid #d8dee4;border-radius:8px;background:#f6f8fa}.sh-control label{display:block;font-size:.8rem;font-weight:700;margin-bottom:.2rem}.sh-control select,.sh-control input{width:100%;box-sizing:border-box;padding:.35rem;border:1px solid #b8c0cc;border-radius:4px;background:white}.sh-control-inline{display:flex;align-items:center;gap:.4rem}.sh-notes{display:flex;justify-content:space-between;gap:1rem;font-size:.9rem;margin:.5rem 0}.sh-warning{color:#9a3412}.sh-chart-wrap{height:460px;position:relative;border:1px solid #d8dee4;border-radius:8px;padding:1rem;background:white}.sh-footnote{margin:.75rem 0;padding:.65rem;border-top:1px solid #d8dee4;border-bottom:1px solid #d8dee4}.sh-multiples{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem}.sh-multiple{border:1px solid #d8dee4;border-radius:8px;padding:.75rem;background:#fff}.sh-multiple h3{font-size:1rem;margin:0 0 .5rem}.sh-multiple-canvas{height:220px}.sh-listing{margin-top:1rem}.sh-listing table{width:100%;border-collapse:collapse;font-size:.9rem}.sh-listing th,.sh-listing td{border:1px solid #d8dee4;padding:.35rem;text-align:left}.sh-listing th{background:#f6f8fa;cursor:pointer}.sh-listing-actions{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin:.5rem 0}.sh-listing-actions button{padding:.35rem .6rem}.sh-hidden{display:none!important}";
        document.head.append(style);
      }
    }, {
      key: "init",
      value: function init(data) {
        this.setData(data);
        return this;
      }
    }, {
      key: "setData",
      value: function setData(data) {
        this.rawData = Array.isArray(data) ? data : [];
        this.validateAndCleanData();
        this.buildControls();
        this.render();
        return this;
      }
    }, {
      key: "setSettings",
      value: function setSettings(settings) {
        this.settings = syncSettings(_objectSpread2({}, this.settings, {}, settings));
        this.buildControls();
        this.render();
        return this;
      }
    }, {
      key: "validateAndCleanData",
      value: function validateAndCleanData() {
        var _this = this;

        var missing = [this.settings.measure_col, this.settings.value_col].filter(function (col) {
          return !_this.rawData.some(function (row) {
            return row[col] !== undefined;
          });
        });

        if (missing.length) {
          this.element.innerHTML = "<div class=\"sh-warning\">Required variable(s) missing: ".concat(missing.join(', '), "</div>");
          throw new Error("Required variable(s) missing: ".concat(missing.join(', ')));
        }

        var removed = 0;
        this.cleanData = this.rawData.map(function (row, index) {
          return _objectSpread2({}, row, {
            __sh_index: index,
            __sh_value: Number(row[_this.settings.value_col])
          });
        }).filter(function (row) {
          var keep = row[_this.settings.value_col] !== '' && Number.isFinite(row.__sh_value);
          if (!keep) removed += 1;
          return keep;
        });
        this.removedRecords = removed;
        if (removed) console.warn("".concat(removed, " missing or non-numeric results have been removed."));
        var measures = this.measures();

        if (this.state.measure && !measures.includes(this.state.measure)) {
          console.warn("The initial measure [".concat(this.state.measure, "] does not exist. Defaulting to the first measure."));
        }

        this.state.measure = measures.includes(this.state.measure) ? this.state.measure : measures[0];
      }
    }, {
      key: "measures",
      value: function measures() {
        var _this2 = this;

        return unique(this.cleanData.map(function (row) {
          return _this2.measureLabel(row);
        })).sort();
      }
    }, {
      key: "measureLabel",
      value: function measureLabel(row) {
        var measure = row[this.settings.measure_col];
        var unit = this.settings.unit_col ? row[this.settings.unit_col] : null;
        return unit ? "".concat(measure, " (").concat(unit, ")") : measure;
      }
    }, {
      key: "buildControls",
      value: function buildControls() {
        var _this3 = this;

        this.controls.innerHTML = '';

        var addControl = function addControl(label, input) {
          var wrap = createElement('div', 'sh-control');
          var lab = createElement('label', null, label);
          wrap.append(lab, input);

          _this3.controls.append(wrap);

          return input;
        };

        var measure = addControl('Measure', document.createElement('select'));
        this.measures().forEach(function (value) {
          return option(measure, value, value, value === _this3.state.measure);
        });

        measure.onchange = function () {
          _this3.state.measure = measure.value;

          _this3.resetDomain();

          _this3.render();
        };

        this.settings.filters.forEach(function (filter) {
          if (!_this3.cleanData.some(function (row) {
            return row[filter.value_col] !== undefined;
          })) {
            console.warn("The [ ".concat(filter.label, " ] filter has been removed because the variable does not exist."));
            return;
          }

          var select = addControl(filter.label, document.createElement('select'));
          option(select, '__all__', 'All', !_this3.state.filters[filter.value_col]);
          unique(_this3.cleanData.map(function (row) {
            return row[filter.value_col];
          })).sort().forEach(function (value) {
            return option(select, value, value, _this3.state.filters[filter.value_col] === value);
          });

          select.onchange = function () {
            _this3.state.filters[filter.value_col] = select.value === '__all__' ? null : select.value;

            _this3.render();
          };
        });
        var group = addControl('Group by', document.createElement('select'));
        this.settings.groups.forEach(function (spec) {
          return option(group, spec.value_col, spec.label, spec.value_col === _this3.state.groupBy);
        });

        group.onchange = function () {
          _this3.state.groupBy = group.value;

          _this3.render();
        };

        var lower = addControl('Lower', document.createElement('input'));
        lower.type = 'number';
        lower.step = 'any';
        lower.value = this.state.lower == null ? '' : this.state.lower;

        lower.onchange = function () {
          _this3.state.lower = lower.value === '' ? null : Number(lower.value);

          _this3.normalizeDomain();

          _this3.render();
        };

        var upper = addControl('Upper', document.createElement('input'));
        upper.type = 'number';
        upper.step = 'any';
        upper.value = this.state.upper == null ? '' : this.state.upper;

        upper.onchange = function () {
          _this3.state.upper = upper.value === '' ? null : Number(upper.value);

          _this3.normalizeDomain();

          _this3.render();
        };

        var algorithm = addControl('Algorithm', document.createElement('select'));
        ALGORITHMS.forEach(function (value) {
          return option(algorithm, value, value, value === _this3.state.algorithm);
        });

        algorithm.onchange = function () {
          _this3.state.algorithm = algorithm.value;

          _this3.render();
        };

        var quantity = addControl('Quantity', document.createElement('input'));
        quantity.type = 'number';
        quantity.min = '1';
        quantity.step = '1';
        quantity.value = this.state.quantity || '';

        quantity.onchange = function () {
          _this3.state.quantity = Math.max(1, Math.round(Number(quantity.value) || 1));
          _this3.state.algorithm = 'Custom';

          _this3.buildControls();

          _this3.render();
        };

        var width = addControl('Width', document.createElement('input'));
        width.type = 'number';
        width.min = '0';
        width.step = 'any';
        width.value = this.state.width || '';

        width.onchange = function () {
          _this3.state.width = Math.max(Number.EPSILON, Number(width.value) || 0);
          _this3.state.algorithm = 'Custom';

          _this3.buildControls();

          _this3.render();
        };

        if (this.settings.normal_range) {
          var nr = document.createElement('input');
          nr.type = 'checkbox';
          nr.checked = this.state.displayNormalRange;

          nr.onchange = function () {
            _this3.state.displayNormalRange = nr.checked;

            _this3.render();
          };

          var inline = createElement('div', 'sh-control-inline');
          inline.append(nr, document.createTextNode('Show'));
          addControl('Normal Range', inline);
        }

        var ticks = document.createElement('select');
        option(ticks, 'linear', 'linear', !this.state.annotateBoundaries);
        option(ticks, 'boundaries', 'bin boundaries', this.state.annotateBoundaries);

        ticks.onchange = function () {
          _this3.state.annotateBoundaries = ticks.value === 'boundaries';

          _this3.render();
        };

        addControl('X-axis Ticks', ticks);
      }
    }, {
      key: "normalizeDomain",
      value: function normalizeDomain() {
        if (Number.isFinite(this.state.lower) && Number.isFinite(this.state.upper) && this.state.lower >= this.state.upper) {
          var tmp = this.state.lower;
          this.state.lower = this.state.upper;
          this.state.upper = tmp;
        }
      }
    }, {
      key: "resetDomain",
      value: function resetDomain() {
        this.state.lower = null;
        this.state.upper = null;
      }
    }, {
      key: "currentMeasureData",
      value: function currentMeasureData() {
        var _this4 = this;

        return this.cleanData.filter(function (row) {
          return _this4.measureLabel(row) === _this4.state.measure;
        });
      }
    }, {
      key: "currentFilteredData",
      value: function currentFilteredData() {
        var _this5 = this;

        return this.currentMeasureData().filter(function (row) {
          return Object.entries(_this5.state.filters).every(function (_ref2) {
            var _ref3 = _slicedToArray(_ref2, 2),
                key = _ref3[0],
                value = _ref3[1];

            return !value || String(row[key]) === String(value);
          });
        });
      }
    }, {
      key: "render",
      value: function render() {
        this.destroyCharts();
        this.filteredData = this.currentFilteredData();

        if (!this.filteredData.length) {
          this.footnote.textContent = 'No records match the current filters.';
          return;
        }

        this.drawMainChart();
        this.drawMultiples();
        this.updateNotes();
      }
    }, {
      key: "updateNotes",
      value: function updateNotes() {
        var _this6 = this;

        var totalParticipants = unique(this.currentMeasureData().map(function (row) {
          return row[_this6.settings.id_col];
        })).length;
        var shownParticipants = unique(this.filteredData.map(function (row) {
          return row[_this6.settings.id_col];
        })).length;
        var pct = totalParticipants ? (shownParticipants / totalParticipants * 100).toFixed(1) : '0.0';
        this.notes.innerHTML = "<span>".concat(shownParticipants, " of ").concat(totalParticipants, " participants shown (").concat(pct, "%).</span><span class=\"sh-warning\">").concat(this.removedRecords || 0, " missing or non-numeric results removed.</span>");
      }
    }, {
      key: "chartInputs",
      value: function chartInputs(rows) {
        var values = rows.map(function (row) {
          return row.__sh_value;
        });
        var defaultDomain = [Math.min.apply(Math, _toConsumableArray(values)), Math.max.apply(Math, _toConsumableArray(values))];
        var domain = [this.state.lower == null ? defaultDomain[0] : this.state.lower, this.state.upper == null ? defaultDomain[1] : this.state.upper];
        var inDomainRows = rows.filter(function (row) {
          return row.__sh_value >= domain[0] && row.__sh_value <= domain[1];
        });
        var binResult = calculateBins(inDomainRows.map(function (row) {
          return row.__sh_value;
        }), this.state.algorithm, this.state.quantity, this.state.width, domain);
        var digits = precision(values);
        var bins = binResult.bins.map(function (bin) {
          return _objectSpread2({}, bin, {
            records: bin.records.map(function (idx) {
              return inDomainRows[idx];
            })
          });
        });
        return {
          bins: bins,
          domain: domain,
          digits: digits,
          quantity: binResult.quantity,
          width: binResult.width
        };
      }
    }, {
      key: "drawMainChart",
      value: function drawMainChart() {
        var _this7 = this;

        var inputs = this.chartInputs(this.filteredData);
        this.state.quantity = inputs.quantity;
        this.state.width = Number(inputs.width.toPrecision(4));
        var first = this.filteredData[0];
        this.state.normalRange = this.settings.normal_col_low && this.settings.normal_col_high ? {
          low: Number(first[this.settings.normal_col_low]),
          high: Number(first[this.settings.normal_col_high])
        } : null;
        var labels = inputs.bins.map(function (bin) {
          return _this7.state.annotateBoundaries ? "".concat(formatNumber(bin.lower, inputs.digits), "\u2013").concat(formatNumber(bin.upper, inputs.digits)) : formatNumber((bin.lower + bin.upper) / 2, inputs.digits);
        });
        var data = inputs.bins.map(function (bin) {
          return bin.records.length;
        });
        var chart = new chart_js.Chart(this.canvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: '# of Observations',
              data: data,
              backgroundColor: 'rgba(37, 99, 235, .72)',
              borderColor: 'rgba(37, 99, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  afterLabel: function afterLabel(ctx) {
                    return _this7.binText(inputs.bins[ctx.dataIndex], inputs.digits);
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  precision: 0
                }
              },
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 0
                }
              }
            },
            onHover: function onHover(event, active) {
              if (active.length) _this7.describeBin(inputs.bins[active[0].index], inputs.digits, false);
            },
            onClick: function onClick(event, active) {
              if (active.length) _this7.showListing(inputs.bins[active[0].index].records, inputs.bins[active[0].index], inputs.digits);
            }
          },
          plugins: [normalRangePlugin(this)]
        });
        chart.$shBins = inputs.bins;
        this.chart = chart;
        this.charts.push(chart);
      }
    }, {
      key: "drawMultiples",
      value: function drawMultiples() {
        var _this8 = this;

        this.multiplesWrap.innerHTML = '';
        if (!this.state.groupBy || this.state.groupBy === 'sh_none') return;
        var groups = unique(this.filteredData.map(function (row) {
          return row[_this8.state.groupBy];
        })).sort();
        groups.forEach(function (groupValue) {
          var rows = _this8.filteredData.filter(function (row) {
            return String(row[_this8.state.groupBy]) === String(groupValue);
          });

          var panel = createElement('div', 'sh-multiple');
          panel.append(createElement('h3', null, "".concat(groupValue, " (").concat(rows.length, " records)")));
          var canvasWrap = createElement('div', 'sh-multiple-canvas');
          var canvas = document.createElement('canvas');
          canvasWrap.append(canvas);
          panel.append(canvasWrap);

          _this8.multiplesWrap.append(panel);

          var inputs = _this8.chartInputs(rows);

          var chart = new chart_js.Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
              labels: inputs.bins.map(function (bin) {
                return formatNumber((bin.lower + bin.upper) / 2, inputs.digits);
              }),
              datasets: [{
                data: inputs.bins.map(function (bin) {
                  return bin.records.length;
                }),
                backgroundColor: 'rgba(5, 150, 105, .65)'
              }]
            },
            options: {
              maintainAspectRatio: false,
              responsive: true,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0
                  }
                },
                x: {
                  ticks: {
                    display: false
                  }
                }
              },
              onClick: function onClick(event, active) {
                if (active.length) _this8.showListing(inputs.bins[active[0].index].records, inputs.bins[active[0].index], inputs.digits);
              }
            }
          });

          _this8.charts.push(chart);
        });
      }
    }, {
      key: "binText",
      value: function binText(bin, digits) {
        return "".concat(bin.records.length, " records with ").concat(this.state.measure, " values >= ").concat(formatNumber(bin.lower, digits), " and <= ").concat(formatNumber(bin.upper, digits));
      }
    }, {
      key: "describeBin",
      value: function describeBin(bin, digits, clicked) {
        this.footnote.textContent = "".concat(clicked ? 'Selected' : 'Hover', ": ").concat(this.binText(bin, digits), ".");
      }
    }, {
      key: "showListing",
      value: function showListing(records, bin, digits) {
        this.currentTableData = records;
        this.page = 1;
        this.describeBin(bin, digits, true);
        this.renderListing();
      }
    }, {
      key: "renderListing",
      value: function renderListing() {
        var _this9 = this;

        var cols = this.settings.details;
        var pageSize = this.settings.page_size;
        var rows = this.currentTableData;
        var pages = Math.max(1, Math.ceil(rows.length / pageSize));
        this.page = Math.min(this.page, pages);
        var visible = rows.slice((this.page - 1) * pageSize, this.page * pageSize);
        this.listingWrap.innerHTML = '';
        var actions = createElement('div', 'sh-listing-actions');
        actions.append(createElement('strong', null, "".concat(rows.length, " records")));
        var buttons = createElement('div');
        [['<<', 1], ['<', Math.max(1, this.page - 1)], ['>', Math.min(pages, this.page + 1)], ['>>', pages]].forEach(function (_ref4) {
          var _ref5 = _slicedToArray(_ref4, 2),
              label = _ref5[0],
              page = _ref5[1];

          var button = createElement('button', null, label);

          button.onclick = function () {
            _this9.page = page;

            _this9.renderListing();
          };

          buttons.append(button);
        });
        var csv = createElement('button', null, 'Export: CSV');

        csv.onclick = function () {
          return _this9.exportCsv(rows, cols);
        };

        buttons.append(csv);
        actions.append(buttons);
        var table = document.createElement('table');
        var thead = document.createElement('thead');
        var tr = document.createElement('tr');
        cols.forEach(function (col) {
          return tr.append(createElement('th', null, col.label));
        });
        thead.append(tr);
        table.append(thead);
        var tbody = document.createElement('tbody');
        visible.forEach(function (row) {
          var tr = document.createElement('tr');
          cols.forEach(function (col) {
            return tr.append(createElement('td', null, row[col.value_col] == null ? '' : row[col.value_col]));
          });
          tbody.append(tr);
        });
        table.append(tbody);
        this.listingWrap.append(actions, table);
      }
    }, {
      key: "exportCsv",
      value: function exportCsv(rows, cols) {
        var csv = [cols.map(function (col) {
          return col.label;
        }).join(',')].concat(rows.map(function (row) {
          return cols.map(function (col) {
            return JSON.stringify(row[col.value_col] == null ? '' : row[col.value_col]);
          }).join(',');
        })).join('\n');
        var blob = new Blob([csv], {
          type: 'text/csv'
        });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'safety-histogram-listing.csv';
        link.click();
        URL.revokeObjectURL(url);
      }
    }, {
      key: "resize",
      value: function resize() {
        this.charts.forEach(function (chart) {
          return chart.resize();
        });
      }
    }, {
      key: "destroyCharts",
      value: function destroyCharts() {
        this.charts.forEach(function (chart) {
          return chart.destroy();
        });
        this.charts = [];
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this.destroyCharts();
        this.element.innerHTML = '';
      }
    }]);

    return SafetyHistogram;
  }();

  function safetyHistogram() {
    var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'body';
    var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return new SafetyHistogram(element, settings);
  }

  return safetyHistogram;

})));
