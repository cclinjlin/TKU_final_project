'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const connection = require('./config');
const router = express.Router();
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();
const flash = require('connect-flash');
const passport = require('passport');
const ejs = require('ejs');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const Promise = require('promise');
const bcrypt = require('bcrypt');
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
        callback(null, './idpic/')
    },
  filename: function(req, file, cb){
    cb(null, file.fieldname + Date.now() + path.extname(file.originalname))
  }
});
var uploads = multer({
  storage: storage
}).single('file');

//var routes = require('./routes');



app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: 'sdtest', //加密sessionId用
      //name: 'sessionId',
  saveUninitialized: true,
  resave: true,
  cookie: {
    expires: 600000
  }
})
);
//app.use(multer({ dest: './idpic/'}));
app.use(fileUpload());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/')));

//app.engine('html', hbs.__express);

const index = require('./index');
//const ipfsupload = require('./ipfsupload');
app.use('/', index);




// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send(err.message);
});



http.createServer(app).listen(app.get('port'), function( req, res ){
	//建立app instance
	//服務器通過app.listen（3000）;啟動，監聽3000端口。
	console.log('Express server listening on port ' + app.get('port'));
});
