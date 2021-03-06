// Load `*.js` under current directory as properties
//  i.e., `User.js` will become `exports['User']` or `exports.User`

require('fs')
  .readdirSync(__dirname)
  .forEach((file) => {
    if (file.match(/\.js$/) !== null && file !== 'index.js') {
      const name = file.replace('.js', '');
      // eslint-disable-next-line import/no-dynamic-require
      exports[name] = require('./' + file);
    }
  });
