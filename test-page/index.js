d3.csv(
    'https://raw.githubusercontent.com/RhoInc/data-library/master/data/clinical-trials/renderer-specific/adbds.csv',
    d => d
).then(data => {
    const instance = safetyHistogram('#container', {
        filters: [
            { value_col: 'SITEID', label: 'Site ID' },
            { value_col: 'SEX', label: 'Sex' },
            { value_col: 'RACE', label: 'Race' },
            { value_col: 'ARM', label: 'Treatment Group' },
            { value_col: 'USUBJID', label: 'Participant ID' }
        ],
        groups: [
            { value_col: 'SITE', label: 'Site' },
            { value_col: 'SEX', label: 'Sex' },
            { value_col: 'RACE', label: 'Race' },
            { value_col: 'ARM', label: 'Treatment Group' }
        ],
        display_normal_range: true,
        annotate_bin_boundaries: true,
        test_normality: true,
        group_by: 'ARM',
        compare_distributions: true
    });
    window.__safetyHistogramInstance = instance;
    instance.init(data);
}).catch(error => {
    console.error(error);
    document.querySelector('#container').textContent = `Failed to load demo data: ${error.message}`;
});
