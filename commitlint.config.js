module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'references-empty': [2, 'never'],
    'subject-case': [2, 'always', 'sentence-case'],
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']],
    'body-max-line-length': [2, 'always', 100],
  },
  parserPreset: {
    parserOpts: {
      issuePrefixes: ['#']
    }
  }
};
