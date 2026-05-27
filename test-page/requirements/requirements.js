(function() {
  var data = [
    { USUBJID: '01-001', SITEID: '101', SEX: 'F', RACE: 'WHITE', ARM: 'Placebo', TEST: 'ALT', STRESN: 10, STRESU: 'U/L', STNRLO: 5, STNRHI: 40 },
    { USUBJID: '01-002', SITEID: '101', SEX: 'M', RACE: 'BLACK OR AFRICAN AMERICAN', ARM: 'Placebo', TEST: 'ALT', STRESN: 15, STRESU: 'U/L', STNRLO: 5, STNRHI: 40 },
    { USUBJID: '01-003', SITEID: '102', SEX: 'F', RACE: 'ASIAN', ARM: 'Drug A', TEST: 'ALT', STRESN: 25, STRESU: 'U/L', STNRLO: 7, STNRHI: 45 },
    { USUBJID: '01-004', SITEID: '102', SEX: 'M', RACE: 'WHITE', ARM: 'Drug A', TEST: 'ALT', STRESN: 35, STRESU: 'U/L', STNRLO: 7, STNRHI: 45 },
    { USUBJID: '01-005', SITEID: '103', SEX: 'F', RACE: 'WHITE', ARM: 'Drug B', TEST: 'ALT', STRESN: 50, STRESU: 'U/L', STNRLO: 5, STNRHI: 40 },
    { USUBJID: '01-006', SITEID: '103', SEX: 'M', RACE: 'ASIAN', ARM: 'Drug B', TEST: 'ALT', STRESN: 65, STRESU: 'U/L', STNRLO: 7, STNRHI: 45 }
  ];

  var instance = safetyHistogram('#container', {
    filters: [
      { value_col: 'SITEID', label: 'Site ID' },
      { value_col: 'SEX', label: 'Sex' },
      { value_col: 'RACE', label: 'Race' },
      { value_col: 'ARM', label: 'Treatment Group' },
      { value_col: 'USUBJID', label: 'Participant ID' }
    ],
    groups: [
      { value_col: 'SITEID', label: 'Site ID' },
      { value_col: 'SEX', label: 'Sex' },
      { value_col: 'ARM', label: 'Treatment Group' }
    ],
    normal_range: true,
    display_normal_range: false,
    group_by: 'ARM'
  });

  window.__sh = instance;
  window.__shData = data;
  instance.init(data);
})();
