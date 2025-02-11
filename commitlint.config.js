module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'references-empty': [0, 'never'],  // Make issue references optional
    'subject-case': [0, 'never'],      // Allow any case in subject
    'type-enum': [2, 'always', [
      'feat',
      'fix',
      'docs',
      'style',
      'refactor',
      'perf',
      'test',
      'build',
      'ci',
      'chore',
      'revert'
    ]],
    'type-case': [2, 'always', 'lower-case'],
    'scope-case': [2, 'always', 'lower-case']
  }
};
