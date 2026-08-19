export default {
  rules: {
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
      {
        message: 'CSS class names must use lower-kebab-case, e.g. .foo-bar',
      },
    ],
  },
};
