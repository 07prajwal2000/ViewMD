import { describe, it, expect } from 'bun:test';
import { resolveTargetPane } from './resolveTargetPane';

describe('resolveTargetPane', () => {
  it('defaults to primary pane when split view is disabled', () => {
    expect(resolveTargetPane(undefined, false, 'primary')).toBe('primary');
    expect(resolveTargetPane(undefined, false, 'secondary')).toBe('primary');
  });

  it('safely ignores synthetic click events or random objects and falls back to primary when not split', () => {
    const fakeSyntheticEvent = { nativeEvent: {}, preventDefault: () => {}, target: {} };
    expect(resolveTargetPane(fakeSyntheticEvent, false, 'primary')).toBe('primary');
    expect(resolveTargetPane(fakeSyntheticEvent, false, 'secondary')).toBe('primary');
  });

  it('uses focusedPane when targetPane is a synthetic click event in split view', () => {
    const fakeSyntheticEvent = { nativeEvent: {}, preventDefault: () => {}, target: {} };
    expect(resolveTargetPane(fakeSyntheticEvent, true, 'secondary')).toBe('secondary');
    expect(resolveTargetPane(fakeSyntheticEvent, true, 'primary')).toBe('primary');
  });

  it('honors explicitly provided valid targetPane in split view', () => {
    expect(resolveTargetPane('primary', true, 'secondary')).toBe('primary');
    expect(resolveTargetPane('secondary', true, 'primary')).toBe('secondary');
  });

  it('always falls back to primary when split view is inactive even if secondary was requested', () => {
    expect(resolveTargetPane('secondary', false, 'primary')).toBe('primary');
  });
});
