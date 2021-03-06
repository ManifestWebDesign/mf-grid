// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function (config) {
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    reporters: [
      'progress'
    ],

    // testing framework to use (jasmine/mocha/qunit/...)
    frameworks: ['ng-scenario'],

    // list of files / patterns to load in the browser
    files: [
      'src/bower_components/jquery/jquery.js',
      'src/bower_components/angular/angular.js',
      'src/bower_components/angular-scenario/angular-scenario.js',
      'src/bower_components/angular-mocks/angular-mocks.js',
      'src/*.css',
      'src/*.js',
      'test/mock/**/*.js',
      'test/e2e/**/*.js'
    ],

    // list of files / patterns to exclude
    exclude: [],

    // web server port
    port: 9001,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: ['PhantomJS'],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    // Uncomment the following lines if you are using grunt's server to run the tests
    proxies: {
      '/': 'http://localhost:9000/'
    },

//     URL root prevent conflicts with the site root
    urlRoot: '/_karma_/'
  });
};
