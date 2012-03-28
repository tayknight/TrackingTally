var fs = require('fs'),
    processId;

var sharedTemplates = [];
var sharedPartials = {};

fs.readdir("./public/templates", function (err, filenames) {
    var i;
    
    for (i = 0; i < filenames.length; i++) {
        console.log(filenames[i].substr(0, filenames[i].lastIndexOf(".")));
        var functionName = filenames[i].substr(0, filenames[i].lastIndexOf("."))
        , fileContents = fs.readFileSync("./public/templates/" + filenames[i], "utf8");
        sharedPartials[functionName] = fileContents;
    }
    console.log("Ready.");
    console.log(sharedPartials);
});