// This is a custom Jest transformer for CSS modules
module.exports = {
    process() {
      return {
        code: 'module.exports = {};',
      };
    },
    getCacheKey() {
      // The output is always the same
      return 'cssTransform';
    },
  };