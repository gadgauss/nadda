var settings = require('../nightwatch-default.json');

module.exports = {};

for (var browser in settings.test_settings) {
    if (settings.test_settings.hasOwnProperty(browser)) {
        module.exports[browser.slice(2, browser.length - 2)] = browser;
    }
}