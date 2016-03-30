// Require some modules...
var express               = require('express');
var path                  = require('path');
var fs                    = require('fs');
var http                  = require('http');
var https                 = require('https');
var clientCertificateAuth = require('client-certificate-auth');

// Store the certificate details for later use
var httpsOptions = {
    key: fs.readFileSync('/etc/ssl/private/myserver.key', 'utf8'), 
    cert: fs.readFileSync('/etc/ssl/certs/www_zendu_be.crt', 'utf8'),
    ca: [   fs.readFileSync('ssl/geotrust_cross_root_ca.txt', 'utf8'), 
            fs.readFileSync('ssl/rapid_ssl_ca.txt', 'utf8'),
            fs.readFileSync('ssl/citizen_ca.txt', 'utf8'),
            fs.readFileSync('ssl/belgium_root_ca.txt', 'utf8'),
            fs.readFileSync('ssl/belgiumrootca2.crt', 'utf8'),
            fs.readFileSync('ssl/citizenca.crt', 'utf8')
        ],
    ciphers: 'ECDHE-RSA-AES128-SHA256:AES128-GCM-SHA256:RC4:HIGH:!MD5:!aNULL:!EDH',
    honorCipherOrder: true,
    requestCert: true,
    rejectUnauthorized: false
};


// Create our express application
var app = express();

//var httpsApp = express();

// Handle Authentication (and other errors)
//app.use(app.router);
app.use(function(err, req, res, next) {
    if(err){
        console.log(err);
        res.send("#FAIL : " + err);
    }
    next();
});

app.use(express.static('public'));

app.set('view engine', 'ejs');

// Define some routes
/*app.get('/', function(req, res) {
    res.send("Welcome click <a href=\"https://www.zendu.be:4443/eid\">here</a> to login with your Belgian eID.");
});*/

app.get('/form', clientCertificateAuth(validateCertificate), function(req, res) {
    //if(clientCertificateAuth(validateCertificate)){
        var clientCertificate   = req.connection.getPeerCertificate();
        var clientName           = clientCertificate.subject.SN;
        var clientFirstName      = clientCertificate.subject.GN;
        var clientNationalNumber = clientCertificate.subject.serialNumber;
        
        res.render('form', {firstname: clientFirstName, lastname: clientName, rrn: clientNationalNumber});
        
        //res.send("Welcome " + clientFirstName + " " + clientName + " (" + clientNationalNumber + ")!");
    //}else{
    //    res.send("FAIL");
    //}
});

// Validate the contents of the certificate
function validateCertificate(cert) {
    // if (cert.subject.serialNumber == in database) { return true; }
    return true;
}

// Create a http and https server for our app
var httpServer = http.createServer(app);
var httpsServer = https.createServer(httpsOptions, app);

httpServer.listen(3000);
httpsServer.listen(4443);

httpsServer.on('error', function (e) {
  // Handle your error here
  console.log(e);
});
