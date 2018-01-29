Parse.Cloud.define("hello", function(request, response) {
    console.log("TEST LOG");
    console.warn("TEST WARN");
    console.error("TEST ERROR");
    response.success("OK");
});

console.info('Parse Cloud Code is initializing ...');
const vpx = require('./virtua-parse-extended');
vpx.init();