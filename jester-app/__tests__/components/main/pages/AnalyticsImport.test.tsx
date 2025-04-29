import Analytics from '../../../../src/renderer/src/components/main/pages/Analytics';

describe('Analytics Component Import Test', () => {
  it('should import Analytics component correctly', () => {
    expect(Analytics).toBeDefined();
    expect(typeof Analytics).toBe('function');
  });
});
