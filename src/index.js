import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const DEFAULT_SETTINGS = {
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

const ALGORITHMS = [
    'Square-root choice',
    "Sturges' formula",
    'Rice Rule',
    "Scott's normal reference rule",
    "Freedman-Diaconis' choice",
    "Shimazaki and Shinomoto's choice",
    'Custom'
];

function arrayify(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function fieldSpec(value, fallbackLabel) {
    if (typeof value === 'string') return { value_col: value, label: fallbackLabel || value };
    return { value_col: value.value_col, label: value.label || value.value_col };
}

function unique(values) {
    return [...new Set(values.filter(value => value !== undefined && value !== null && value !== ''))];
}

function quantile(values, p) {
    if (!values.length) return NaN;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sd(values) {
    if (values.length < 2) return 0;
    const m = mean(values);
    return Math.sqrt(values.reduce((sum, value) => sum + Math.pow(value - m, 2), 0) / (values.length - 1));
}

function precision(values) {
    const decimals = values.map(value => {
        const text = String(value);
        return text.includes('.') ? text.split('.')[1].length : 0;
    });
    return Math.min(4, Math.max(0, ...decimals));
}

function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return '';
    return Number(value.toFixed(digits)).toString();
}

function calculateBins(values, algorithm, customQuantity, customWidth, domain) {
    const n = values.length;
    const min = domain ? domain[0] : Math.min(...values);
    const max = domain ? domain[1] : Math.max(...values);
    const range = max - min || 1;
    let quantity;
    let width;

    if (algorithm === 'Custom') {
        quantity = customQuantity ? Math.max(1, Math.round(customQuantity)) : null;
        width = customWidth ? Math.max(Number.EPSILON, Number(customWidth)) : null;
    }

    if (!quantity && !width) {
        if (algorithm === 'Square-root choice') quantity = Math.ceil(Math.sqrt(n));
        else if (algorithm === "Sturges' formula") quantity = Math.ceil(Math.log2(n) + 1);
        else if (algorithm === 'Rice Rule') quantity = Math.ceil(2 * Math.cbrt(n));
        else if (algorithm === "Freedman-Diaconis' choice") {
            width = (2 * (quantile(values, 0.75) - quantile(values, 0.25))) / Math.cbrt(n);
            quantity = width > 0 ? Math.ceil(range / width) : Math.ceil(Math.sqrt(n));
        } else if (algorithm === "Shimazaki and Shinomoto's choice") quantity = Math.ceil(Math.sqrt(n));
        else {
            width = (3.5 * sd(values)) / Math.cbrt(n);
            quantity = width > 0 ? Math.ceil(range / width) : Math.ceil(Math.sqrt(n));
        }
    }

    if (!quantity && width) quantity = Math.ceil(range / width);
    quantity = Math.max(1, quantity || 1);
    width = range / quantity;

    const bins = Array.from({ length: quantity }, (_, index) => {
        const lower = min + index * width;
        const upper = index === quantity - 1 ? max : min + (index + 1) * width;
        return { index, lower, upper, records: [] };
    });

    values.forEach((value, idx) => {
        let binIndex = Math.floor((value - min) / width);
        if (binIndex < 0) binIndex = 0;
        if (binIndex >= bins.length) binIndex = bins.length - 1;
        bins[binIndex].records.push(idx);
    });

    return { bins, quantity, width, domain: [min, max] };
}

function syncSettings(settings) {
    const synced = { ...DEFAULT_SETTINGS, ...settings };
    synced.filters = arrayify(synced.filters).map(fieldSpec).filter(d => d.value_col);
    const defaultGroup = { value_col: 'sh_none', label: 'None' };
    synced.groups = [defaultGroup, ...arrayify(synced.groups).map(fieldSpec).filter(d => d.value_col)];
    if (synced.group_by && !synced.groups.some(group => group.value_col === synced.group_by)) {
        synced.groups.push({ value_col: synced.group_by, label: synced.group_by });
    }
    synced.group_by = synced.groups.some(group => group.value_col === synced.group_by)
        ? synced.group_by
        : synced.groups[0].value_col;
    synced.details = arrayify(synced.details).map(fieldSpec).filter(d => d.value_col);
    if (!synced.details.length) {
        synced.details = [
            { value_col: synced.id_col, label: 'Participant ID' },
            ...synced.filters,
            { value_col: synced.value_col, label: 'Result' },
            { value_col: synced.normal_col_low, label: 'Lower Limit of Normal' },
            { value_col: synced.normal_col_high, label: 'Upper Limit of Normal' },
            { value_col: synced.unit_col, label: 'Unit' }
        ].filter(d => d.value_col);
    }
    if (settings.displayNormalRange !== undefined) synced.display_normal_range = settings.displayNormalRange;
    return synced;
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function option(select, value, label, selected) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    opt.selected = selected;
    select.appendChild(opt);
}

function normalRangePlugin(instance) {
    return {
        id: `normal-range-${Math.random().toString(36).slice(2)}`,
        beforeDatasetsDraw(chart) {
            if (!instance.state.displayNormalRange || !instance.state.normalRange) return;
            const { ctx, chartArea, scales } = chart;
            const bins = chart.$shBins || [];
            const matched = bins
                .map((bin, index) => ({ bin, index }))
                .filter(({ bin }) => bin.upper >= instance.state.normalRange.low && bin.lower <= instance.state.normalRange.high);
            if (!matched.length) return;
            const start = matched[0].index - 0.5;
            const end = matched[matched.length - 1].index + 0.5;
            const left = scales.x.getPixelForValue(start);
            const right = scales.x.getPixelForValue(end);
            ctx.save();
            ctx.fillStyle = 'rgba(160, 160, 160, 0.25)';
            ctx.fillRect(Math.max(chartArea.left, left), chartArea.top, Math.min(chartArea.right, right) - Math.max(chartArea.left, left), chartArea.bottom - chartArea.top);
            ctx.restore();
        }
    };
}

class SafetyHistogram {
    constructor(element = 'body', settings = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.element) throw new Error(`Safety Histogram target not found: ${element}`);
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

    renderShell() {
        this.element.innerHTML = '';
        this.root = createElement('div', 'safety-histogram');
        this.controls = createElement('div', 'sh-controls');
        this.notes = createElement('div', 'sh-notes');
        this.chartWrap = createElement('div', 'sh-chart-wrap');
        this.canvas = createElement('canvas', 'sh-chart');
        this.footnote = createElement('div', 'sh-footnote', 'Hover over or click a bar for details.');
        this.groupControls = createElement('div', 'sh-group-controls');
        this.multiplesWrap = createElement('div', 'sh-multiples');
        this.listingWrap = createElement('div', 'sh-listing');
        this.chartWrap.append(this.canvas);
        this.root.append(this.controls, this.notes, this.chartWrap, this.footnote, this.groupControls, this.multiplesWrap, this.listingWrap);
        this.element.append(this.root);
        this.applyStyles();
    }

    applyStyles() {
        if (document.getElementById('safety-histogram-nextgen-styles')) return;
        const style = document.createElement('style');
        style.id = 'safety-histogram-nextgen-styles';
        style.textContent = `
.safety-histogram{width:100%;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1f2933}.sh-controls{display:flex;flex-wrap:wrap;align-items:flex-start;gap:.5rem;margin:.75rem 0 1rem;padding:.75rem;border:1px solid #d8dee4;border-radius:8px;background:#f6f8fa}.sh-control{display:inline-block;vertical-align:top;min-width:140px;margin:2px}.sh-control label{display:block;font-size:.8rem;font-weight:700;margin-bottom:.2rem}.sh-control select,.sh-control input{width:100%;box-sizing:border-box;padding:.35rem;border:1px solid #b8c0cc;border-radius:4px;background:white}.sh-control-inline{display:flex;align-items:center;gap:.4rem}.sh-control-fieldset{display:inline-flex;flex-wrap:wrap;gap:.25rem;margin:0 5px 0 0;padding:.35rem .45rem .5rem;border:1px solid #b8c0cc;border-radius:6px;background:white}.sh-control-fieldset legend{font-size:.78rem;font-weight:700;padding:0 .25rem;color:#52616f}.sh-control-fieldset .sh-control{margin:0 2px 2px}.sh-control-fieldset.sh-filters-fieldset .sh-control{min-width:150px}.sh-control-fieldset.sh-x-axis-limits-fieldset .sh-control,.sh-control-fieldset.sh-bins-fieldset .sh-control{min-width:110px}.sh-control-standalone{background:white;border:1px solid #d8dee4;border-radius:6px;padding:.35rem .45rem .5rem}.sh-group-controls{display:flex;justify-content:flex-end;margin:.5rem 0}.sh-group-controls .sh-control{min-width:180px}.sh-notes{display:flex;justify-content:space-between;gap:1rem;font-size:.9rem;margin:.5rem 0}.sh-warning{color:#9a3412}.sh-chart-wrap{height:460px;position:relative;border:1px solid #d8dee4;border-radius:8px;padding:1rem;background:white}.sh-footnote{margin:.75rem 0;padding:.65rem;border-top:1px solid #d8dee4;border-bottom:1px solid #d8dee4}.sh-multiples{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem}.sh-multiple{border:1px solid #d8dee4;border-radius:8px;padding:.75rem;background:#fff}.sh-multiple h3{font-size:1rem;margin:0 0 .5rem}.sh-multiple-canvas{height:220px}.sh-listing{margin-top:1rem}.sh-listing table{width:100%;border-collapse:collapse;font-size:.9rem}.sh-listing th,.sh-listing td{border:1px solid #d8dee4;padding:.35rem;text-align:left}.sh-listing th{background:#f6f8fa;cursor:pointer}.sh-listing-actions{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin:.5rem 0}.sh-listing-actions button{padding:.35rem .6rem}.sh-hidden{display:none!important}`;
        document.head.append(style);
    }

    init(data) {
        this.setData(data);
        return this;
    }

    setData(data) {
        this.rawData = Array.isArray(data) ? data : [];
        this.validateAndCleanData();
        this.buildControls();
        this.render();
        return this;
    }

    setSettings(settings) {
        this.settings = syncSettings({ ...this.settings, ...settings });
        this.buildControls();
        this.render();
        return this;
    }

    validateAndCleanData() {
        const missing = [this.settings.measure_col, this.settings.value_col].filter(col => !this.rawData.some(row => row[col] !== undefined));
        if (missing.length) {
            this.element.innerHTML = `<div class="sh-warning">Required variable(s) missing: ${missing.join(', ')}</div>`;
            throw new Error(`Required variable(s) missing: ${missing.join(', ')}`);
        }
        let removed = 0;
        this.cleanData = this.rawData
            .map((row, index) => ({ ...row, __sh_index: index, __sh_value: Number(row[this.settings.value_col]) }))
            .filter(row => {
                const keep = row[this.settings.value_col] !== '' && Number.isFinite(row.__sh_value);
                if (!keep) removed += 1;
                return keep;
            });
        this.removedRecords = removed;
        if (removed) console.warn(`${removed} missing or non-numeric results have been removed.`);
        const measures = this.measures();
        if (this.state.measure && !measures.includes(this.state.measure)) {
            console.warn(`The initial measure [${this.state.measure}] does not exist. Defaulting to the first measure.`);
        }
        this.state.measure = measures.includes(this.state.measure) ? this.state.measure : measures[0];
    }

    measures() {
        return unique(this.cleanData.map(row => this.measureLabel(row))).sort();
    }

    measureLabel(row) {
        const measure = row[this.settings.measure_col];
        const unit = this.settings.unit_col ? row[this.settings.unit_col] : null;
        return unit ? `${measure} (${unit})` : measure;
    }

    buildControls() {
        this.controls.innerHTML = '';
        this.groupControls.innerHTML = '';

        const addControl = (label, input, parent = this.controls, className = '') => {
            const wrap = createElement('div', `sh-control ${className}`.trim());
            const lab = createElement('label', null, label);
            wrap.append(lab, input);
            parent.append(wrap);
            return input;
        };
        const addFieldset = label => {
            const fieldset = document.createElement('fieldset');
            fieldset.className = `sh-control-fieldset ${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-fieldset`;
            fieldset.append(createElement('legend', null, label));
            this.controls.append(fieldset);
            return fieldset;
        };

        const measure = addControl('Measure', document.createElement('select'), this.controls, 'sh-control-standalone');
        this.measures().forEach(value => option(measure, value, value, value === this.state.measure));
        measure.onchange = () => { this.state.measure = measure.value; this.resetDomain(); this.render(); };

        const filterSpecs = this.settings.filters.filter(filter => {
            const exists = this.cleanData.some(row => row[filter.value_col] !== undefined);
            if (!exists) console.warn(`The [ ${filter.label} ] filter has been removed because the variable does not exist.`);
            return exists;
        });
        const filterParent = filterSpecs.length > 1 ? addFieldset('Filters') : this.controls;
        filterSpecs.forEach(filter => {
            const select = addControl(filter.label, document.createElement('select'), filterParent, filterSpecs.length > 1 ? '' : 'sh-control-standalone');
            option(select, '__all__', 'All', !this.state.filters[filter.value_col]);
            unique(this.cleanData.map(row => row[filter.value_col])).sort().forEach(value => option(select, value, value, this.state.filters[filter.value_col] === value));
            select.onchange = () => { this.state.filters[filter.value_col] = select.value === '__all__' ? null : select.value; this.render(); };
        });

        const xAxisParent = addFieldset('X-axis Limits');
        const lower = addControl('Lower', document.createElement('input'), xAxisParent);
        lower.type = 'number'; lower.step = 'any'; lower.value = this.state.lower == null ? '' : this.state.lower;
        lower.onchange = () => { this.state.lower = lower.value === '' ? null : Number(lower.value); this.normalizeDomain(); this.render(); };

        const upper = addControl('Upper', document.createElement('input'), xAxisParent);
        upper.type = 'number'; upper.step = 'any'; upper.value = this.state.upper == null ? '' : this.state.upper;
        upper.onchange = () => { this.state.upper = upper.value === '' ? null : Number(upper.value); this.normalizeDomain(); this.render(); };

        const binParent = addFieldset('Bins');
        const algorithm = addControl('Algorithm', document.createElement('select'), binParent);
        ALGORITHMS.forEach(value => option(algorithm, value, value, value === this.state.algorithm));
        algorithm.onchange = () => { this.state.algorithm = algorithm.value; this.render(); };

        const quantity = addControl('Quantity', document.createElement('input'), binParent);
        quantity.type = 'number'; quantity.min = '1'; quantity.step = '1'; quantity.value = this.state.quantity || '';
        quantity.onchange = () => { this.state.quantity = Math.max(1, Math.round(Number(quantity.value) || 1)); this.state.algorithm = 'Custom'; this.buildControls(); this.render(); };

        const width = addControl('Width', document.createElement('input'), binParent);
        width.type = 'number'; width.min = '0'; width.step = 'any'; width.value = this.state.width || '';
        width.onchange = () => { this.state.width = Math.max(Number.EPSILON, Number(width.value) || 0); this.state.algorithm = 'Custom'; this.buildControls(); this.render(); };

        if (this.settings.normal_range) {
            const nr = document.createElement('input');
            nr.type = 'checkbox'; nr.checked = this.state.displayNormalRange;
            nr.onchange = () => { this.state.displayNormalRange = nr.checked; this.render(); };
            const inline = createElement('div', 'sh-control-inline'); inline.append(nr, document.createTextNode('Show'));
            addControl('Normal Range', inline, this.controls, 'sh-control-standalone');
        }

        const ticks = document.createElement('select');
        option(ticks, 'linear', 'linear', !this.state.annotateBoundaries);
        option(ticks, 'boundaries', 'bin boundaries', this.state.annotateBoundaries);
        ticks.onchange = () => { this.state.annotateBoundaries = ticks.value === 'boundaries'; this.render(); };
        addControl('X-axis Ticks', ticks, this.controls, 'sh-control-standalone');

        const group = addControl('Group charts by', document.createElement('select'), this.groupControls, 'sh-control-standalone');
        this.settings.groups.forEach(spec => option(group, spec.value_col, spec.label, spec.value_col === this.state.groupBy));
        this.groupControls.style.display = this.settings.groups.length <= 1 ? 'none' : 'flex';
        group.onchange = () => { this.state.groupBy = group.value; this.render(); };
    }

    normalizeDomain() {
        if (Number.isFinite(this.state.lower) && Number.isFinite(this.state.upper) && this.state.lower >= this.state.upper) {
            const tmp = this.state.lower;
            this.state.lower = this.state.upper;
            this.state.upper = tmp;
        }
    }

    resetDomain() {
        this.state.lower = null;
        this.state.upper = null;
    }

    currentMeasureData() {
        return this.cleanData.filter(row => this.measureLabel(row) === this.state.measure);
    }

    currentFilteredData() {
        return this.currentMeasureData().filter(row =>
            Object.entries(this.state.filters).every(([key, value]) => !value || String(row[key]) === String(value))
        );
    }

    render() {
        this.destroyCharts();
        this.listingWrap.innerHTML = '';
        this.currentTableData = [];
        this.page = 1;
        this.footnote.textContent = 'Hover over or click a bar for details.';
        this.notes.innerHTML = '';
        this.multiplesWrap.innerHTML = '';
        this.filteredData = this.currentFilteredData();
        if (!this.filteredData.length) {
            this.footnote.textContent = 'No records match the current filters.';
            return;
        }
        this.drawMainChart();
        this.drawMultiples();
        this.updateNotes();
    }

    updateNotes() {
        const totalParticipants = unique(this.currentMeasureData().map(row => row[this.settings.id_col])).length;
        const shownParticipants = unique(this.filteredData.map(row => row[this.settings.id_col])).length;
        const pct = totalParticipants ? ((shownParticipants / totalParticipants) * 100).toFixed(1) : '0.0';
        this.notes.innerHTML = `<span>${shownParticipants} of ${totalParticipants} participants shown (${pct}%).</span><span class="sh-warning">${this.removedRecords || 0} missing or non-numeric results removed.</span>`;
    }

    chartInputs(rows) {
        const values = rows.map(row => row.__sh_value);
        const defaultDomain = [Math.min(...values), Math.max(...values)];
        const domain = [this.state.lower == null ? defaultDomain[0] : this.state.lower, this.state.upper == null ? defaultDomain[1] : this.state.upper];
        const inDomainRows = rows.filter(row => row.__sh_value >= domain[0] && row.__sh_value <= domain[1]);
        const binResult = calculateBins(
            inDomainRows.map(row => row.__sh_value),
            this.state.algorithm,
            this.state.quantity,
            this.state.width,
            domain
        );
        const digits = precision(values);
        const bins = binResult.bins.map(bin => ({ ...bin, records: bin.records.map(idx => inDomainRows[idx]) }));
        return { bins, domain, digits, quantity: binResult.quantity, width: binResult.width };
    }

    drawMainChart() {
        const inputs = this.chartInputs(this.filteredData);
        this.state.quantity = inputs.quantity;
        this.state.width = Number(inputs.width.toPrecision(4));
        const first = this.filteredData[0];
        this.state.normalRange = this.settings.normal_col_low && this.settings.normal_col_high
            ? { low: Number(first[this.settings.normal_col_low]), high: Number(first[this.settings.normal_col_high]) }
            : null;

        const labels = inputs.bins.map(bin => this.state.annotateBoundaries
            ? `${formatNumber(bin.lower, inputs.digits)}–${formatNumber(bin.upper, inputs.digits)}`
            : formatNumber((bin.lower + bin.upper) / 2, inputs.digits));
        const data = inputs.bins.map(bin => bin.records.length);
        const chart = new Chart(this.canvas.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: '# of Observations', data, backgroundColor: 'rgba(37, 99, 235, .72)', borderColor: 'rgba(37, 99, 235, 1)', borderWidth: 1 }] },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: ctx => this.binText(inputs.bins[ctx.dataIndex], inputs.digits) } } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { maxRotation: 45, minRotation: 0 } } },
                onHover: (event, active) => { if (active.length) this.describeBin(inputs.bins[active[0].index], inputs.digits, false); },
                onClick: (event, active) => { if (active.length) this.showListing(inputs.bins[active[0].index].records, inputs.bins[active[0].index], inputs.digits); }
            },
            plugins: [normalRangePlugin(this)]
        });
        chart.$shBins = inputs.bins;
        this.chart = chart;
        this.charts.push(chart);
    }

    drawMultiples() {
        this.multiplesWrap.innerHTML = '';
        if (!this.state.groupBy || this.state.groupBy === 'sh_none') return;
        const groups = unique(this.filteredData.map(row => row[this.state.groupBy])).sort();
        groups.forEach(groupValue => {
            const rows = this.filteredData.filter(row => String(row[this.state.groupBy]) === String(groupValue));
            const panel = createElement('div', 'sh-multiple');
            panel.append(createElement('h3', null, `${groupValue} (${rows.length} records)`));
            const canvasWrap = createElement('div', 'sh-multiple-canvas');
            const canvas = document.createElement('canvas');
            canvasWrap.append(canvas);
            panel.append(canvasWrap);
            this.multiplesWrap.append(panel);
            const inputs = this.chartInputs(rows);
            const chart = new Chart(canvas.getContext('2d'), {
                type: 'bar',
                data: { labels: inputs.bins.map(bin => formatNumber((bin.lower + bin.upper) / 2, inputs.digits)), datasets: [{ data: inputs.bins.map(bin => bin.records.length), backgroundColor: 'rgba(5, 150, 105, .65)' }] },
                options: { maintainAspectRatio: false, responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { ticks: { display: false } } }, onClick: (event, active) => { if (active.length) this.showListing(inputs.bins[active[0].index].records, inputs.bins[active[0].index], inputs.digits); } }
            });
            this.charts.push(chart);
        });
    }

    binText(bin, digits) {
        return `${bin.records.length} records with ${this.state.measure} values >= ${formatNumber(bin.lower, digits)} and <= ${formatNumber(bin.upper, digits)}`;
    }

    describeBin(bin, digits, clicked) {
        this.footnote.textContent = `${clicked ? 'Selected' : 'Hover'}: ${this.binText(bin, digits)}.`;
    }

    showListing(records, bin, digits) {
        this.currentTableData = records;
        this.page = 1;
        this.describeBin(bin, digits, true);
        this.renderListing();
    }

    renderListing() {
        const cols = this.settings.details;
        const pageSize = this.settings.page_size;
        const rows = this.currentTableData;
        const pages = Math.max(1, Math.ceil(rows.length / pageSize));
        this.page = Math.min(this.page, pages);
        const visible = rows.slice((this.page - 1) * pageSize, this.page * pageSize);
        this.listingWrap.innerHTML = '';
        const actions = createElement('div', 'sh-listing-actions');
        actions.append(createElement('strong', null, `${rows.length} records`));
        const buttons = createElement('div');
        [['<<', 1], ['<', Math.max(1, this.page - 1)], ['>', Math.min(pages, this.page + 1)], ['>>', pages]].forEach(([label, page]) => {
            const button = createElement('button', null, label);
            button.onclick = () => { this.page = page; this.renderListing(); };
            buttons.append(button);
        });
        const csv = createElement('button', null, 'Export: CSV');
        csv.onclick = () => this.exportCsv(rows, cols);
        buttons.append(csv);
        actions.append(buttons);
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        cols.forEach(col => tr.append(createElement('th', null, col.label)));
        thead.append(tr); table.append(thead);
        const tbody = document.createElement('tbody');
        visible.forEach(row => {
            const tr = document.createElement('tr');
            cols.forEach(col => tr.append(createElement('td', null, row[col.value_col] == null ? '' : row[col.value_col])));
            tbody.append(tr);
        });
        table.append(tbody);
        this.listingWrap.append(actions, table);
    }

    exportCsv(rows, cols) {
        const csv = [cols.map(col => col.label).join(',')].concat(rows.map(row => cols.map(col => JSON.stringify(row[col.value_col] == null ? '' : row[col.value_col])).join(','))).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = 'safety-histogram-listing.csv'; link.click();
        URL.revokeObjectURL(url);
    }

    resize() {
        this.charts.forEach(chart => chart.resize());
    }

    destroyCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
    }

    destroy() {
        this.destroyCharts();
        this.element.innerHTML = '';
    }
}

export default function safetyHistogram(element = 'body', settings = {}) {
    return new SafetyHistogram(element, settings);
}
