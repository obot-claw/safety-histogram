import { describe, expect, it } from 'vitest';
import rendererSettings from '../src/configuration/rendererSettings';
import controlInputs from '../src/configuration/controlInputs';
import syncSettings from '../src/configuration/syncSettings';
import webchartsSettings from '../src/configuration/webchartsSettings';

describe('reviewed safety-histogram requirements', () => {
  it('SH-FUNC-004B defaults normal range display off while keeping the control enabled', () => {
    const settings = rendererSettings();
    const controls = controlInputs();
    const normalRangeControl = controls.find(control => control.option === 'display_normal_range');

    expect(settings.normal_range).toBe(true);
    expect(settings.display_normal_range).toBe(false);
    expect(normalRangeControl).toMatchObject({ type: 'checkbox', label: 'Normal Range' });
  });

  it('SH-FUNC-010/011/012 builds detail listing context for clicked bars', () => {
    const settings = Object.assign({}, webchartsSettings(), rendererSettings(), {
      filters: [
        { value_col: 'ARM', label: 'Treatment Group' },
        { value_col: 'USUBJID', label: 'Participant ID' }
      ]
    });

    const synced = syncSettings(settings);
    const detailLabels = synced.details.map(detail => detail.label);
    const detailColumns = synced.details.map(detail => detail.value_col);

    expect(detailLabels).toEqual([
      'Participant ID',
      'Treatment Group',
      'Result',
      'Lower Limit of Normal',
      'Upper Limit of Normal'
    ]);
    expect(detailColumns).toEqual(['USUBJID', 'ARM', 'STRESN', 'STNRLO', 'STNRHI']);
  });

  it('SH-FUNC-005 exposes lower/upper domain controls and bin controls for x-axis adjustment', () => {
    const controls = controlInputs();
    const lower = controls.find(control => control.option === 'x.domain[0]');
    const upper = controls.find(control => control.option === 'x.domain[1]');
    const algorithm = controls.find(control => control.option === 'x.bin_algorithm');
    const quantity = controls.find(control => control.option === 'x.bin');
    const width = controls.find(control => control.option === 'x.bin_width');

    expect(lower).toMatchObject({ type: 'number', label: 'Lower', require: true });
    expect(upper).toMatchObject({ type: 'number', label: 'Upper', require: true });
    expect(algorithm.values).toContain('Custom');
    expect(quantity).toMatchObject({ type: 'number', label: 'Quantity' });
    expect(width).toMatchObject({ type: 'number', label: 'Width' });
  });
});
