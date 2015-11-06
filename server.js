var express = require('express'),
    mime = require('mime'),
    path = require('path');

var app = express();

app.use(express.static(__dirname + '/public'));

// app.get('shake', function(req, res) {
//   var file = 'src/shake.txt';
//   var filename = path.basename(file);
//   var mimetype = mime.lookup(file);
//   res.setHeader('Content-disposition', 'attachment; filename=' + filename);
//   res.setHeader('Content-type', mimetype);
//   res.send(file);
// })

var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('https://%s:%s', host, port);
})
