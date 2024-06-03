/*jslint node: true */
'use strict';

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const router = express.Router();
const urlencodedParser = bodyParser.urlencoded({ extended: true });
const app = express();
const fs = require('fs');
const cookieParser = require('cookie-parser');
const connection = require('./config');
const ejs = require('ejs');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const Promise = require('promise');
const bcrypt = require('bcrypt');
var sd = require('silly-datetime');


app.use(fileUpload());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/')));


var isLogin = false;
var checkLoginStatus = function (req, res){
	isLogin = false;
	if(req.cookies.username && req.cookies.password){
		isLogin = true;
	}
};

router.get('/', function (req, res){
	if(req.session.username){
		res.render( 'index', {
			loginStatus : true
		});
	} else {
		res.render( 'index', {
			loginStatus : false
		});
	}
});

router.get('/login', function (req, res){
  checkLoginStatus(req, res);
  res.render( 'login', {
    loginStatus : isLogin
  });
});

router.post('/login', urlencodedParser, function(request, response) {
	var username = request.body.username;
	var password = request.body.pass;

	if (username && password) {
				connection.query('SELECT * FROM admin WHERE admin_username = ?', [username], function(error, results, fields) {
					bcrypt.compare(password, results[0].admin_pass, function(err, res) {
						if (res === true){
							console.log("password is true");
							response.cookie('user',escape(username),{maxAge: 1000 * 60 * 60 * 24 * 7});
							request.session.username = escape(username);
							response.render('index',{
								username: request.session.username,
								loginStatus: true
							});
						} else {
              request.session.isAuthed = false;
              return response.render('login',{
                loginStatus: isLogin
              });
							//response.send('Incorrect Username and/or Password!');
						}
						response.end();
					});
					});
				} else {
          request.session.isAuthed = false;
          return response.render('login',{
            loginStatus: isLogin
          });
					//response.send('Please enter Username and Password!');
					response.end();
				}
});

router.get('/register', function(req, res) {
	checkLoginStatus(req, res);
	res.render( 'register', {
		loginStatus : isLogin
	});
});

router.post('/register', function(req, res) {
  var password = req.body.password;
  bcrypt.hash(password, 10, function(err, encryptPass) {
    var users = {
        "admin_username": req.body.username,
				"admin_name": req.body.name,
        "admin_email": req.body.email,
        "admin_pass": encryptPass
    };

    connection.query('INSERT INTO admin SET ?', users, function (error, results, fields) {
      console.log(req.body.username);
			console.log(req.body.name);
      console.log(req.body.email);
      console.log(req.body.password);

      if (error) {
          throw error;
      } else {
          console.log("1 record inserted");
      }
    });
});
    res.redirect("/login");
});

router.get('/asset_verification', function (req, response){
	if(req.session.username){
		connection.query('SELECT *  FROM ipfshash ', function (err, data, fields) {
			var data = data;
			response.render( 'asset_verification', {
				loginStatus : true,
				data: data
			});
		});
	} else {
		res.render( 'login', {
			loginStatus : false
		});
	}
});

router.get('/asset_ver_edit', function (req, response) {
	var username = req.session.username;
	console.log(username);
	var picid = req.query.picid;
	var data = "";
	console.log(picid);
	if (req.session.username) {
		connection.query('SELECT * FROM ipfshash WHERE picid = ?',[picid], function(error, data, fields){
			if (error) {
				throw error;
			}
			var data = data;
			response.render('asset_ver_edit', {
				username: username,
				loginStatus: true,
				data: data
			});
		});
	} else {
		response.render('login', {
			loginStatus: false
		});
	}
});

router.post('/asset_ver_edit', function(req,response){
	var picid = req.body.picid;
	console.log(picid);
	var approval_time = sd.format( new Date() , 'YYYY-MM-DD HH:mm:ss');

	var verification = {
		"Verification_status": req.body.verificationstatus,
		"Hyperledger_transaction_id": req.body.transactionid,
		"approval_time": approval_time
	};

	console.log(req.body.verificationstatus);
	console.log(req.body.transactionid);
	console.log(approval_time);
	connection.query("UPDATE ipfshash SET ? WHERE picid = ?",[verification, picid], function(error, data, fields){
		var data = data;
		console.log(verification);
		if (error) {
			throw error;
		} else {
				console.log("updated");
			}
	});
	response.redirect('asset_verification');
});

router.get('/asset_ver_delete', function(req,response){
	var picid = req.query.picid;
	console.log(picid);

	connection.query("DELETE FROM ipfshash WHERE picid = ?", [picid], function(error, data){
		var data = data;
		console.log(data);
		if (error) {
			throw error;
		} else {
			console.log("deleted");
			response.redirect('asset_verification');
		}
	});
});

router.get('/showrecord',function(req, response){
	var username = req.session.username;
	console.log(username);
	var picid = req.query.picid;
	if(req.session.username){
		connection.query('SELECT * FROM recordhash WHERE picid = ?', [picid], function (error, data, fields) {
		var data = data;
		if (error) {
			console.log(error);
		}
		else {
			response.render('showrecord', {
				loginStatus: true,
				data: data
			});
		}
	});
	}else{
		response.render('login', {
			loginStatus: false
		});
	}
});

router.get('/profile_verification', function (req, response){
	if(req.session.username){
		connection.query('SELECT *  FROM verification ', function (err, data, fields) {
			var data = data;
			response.render( 'profile_verification', {
				username: req.session.username,
				loginStatus : true,
				data: data
			});
		});
	} else {
		response.render( 'login', {
			loginStatus : false
		});
	}
});

router.get('/profile_ver_edit', function (req, response) {
	var username = req.session.username;
	var userid = req.query.userid;
	var data = "";
	console.log(userid);
	connection.query('SELECT * FROM verification WHERE userid = ?',[userid], function(error, data, fields){
		if (error) {
			throw error;
		}
		var data = data;
		response.render('profile_ver_edit', {
			username: req.session.username,
			loginStatus: true,
			data: data
		});
	});
/*
	if (req.session.username) {
		connection.query('SELECT * FROM verification WHERE userid = ?',[userid], function(error, data, fields){
			if (error) {
				throw error;
			}
			var data = data;
			response.render('profile_ver_edit', {
				username: req.session.username,
				loginStatus: true,
				data: data
			});
		});
	} else {
		response.render('login', {
			loginStatus: false
		});
	}*/
});

router.post('/profile_ver_edit', function(req,response){
	var userid = req.body.userid;
	console.log(userid);
	var verification = {
		"verificationstatus": req.body.verificationstatus
	};
	console.log(req.body.verificationstatus);
	connection.query("UPDATE verification SET ? WHERE userid = ?",[verification, userid], function(error, data, fields){
		var data = data;
		console.log(verification);
		if (error) {
			throw error;
		} else {
				console.log("updated");
			}
	});
	response.redirect('profile_verification');
});

router.get('/transaction_authorization', function (req, response){
	if(req.session.username){
		connection.query('SELECT *  FROM reqauth ', function (err, data, fields) {
			var data = data;
			response.render( 'transaction_authorization', {
				loginStatus : true,
				data: data
			});
		});
	} else {
		response.render( 'login', {
			loginStatus : false
		});
	}
});

router.get('/transaction_auth_edit', function (req, response) {
	var username = req.session.username;
	var reqauthid = req.query.reqauthid;
	var data = "";
	console.log(reqauthid);
	if (req.session.username) {
		connection.query('SELECT * FROM reqauth WHERE reqauthid = ?',[reqauthid], function(error, data, fields){
			if (error) {
				throw error;
			}
			var data = data;
			response.render('transaction_auth_edit', {
				username: username,
				loginStatus: true,
				data: data
			});
		});
	} else {
		response.render('login', {
			loginStatus: false,

		});
	}
});

router.post('/transaction_auth_edit', function(req,response){
	var reqauthid = req.body.reqauthid;
	var approval_time = sd.format( new Date() , 'YYYY-MM-DD HH:mm:ss');

	console.log(reqauthid);
	console.log(approval_time);

	var verification = {
		"hyperledger_transaction_id": req.body.transactionid,
		"approval_time": approval_time
	};
	console.log(req.body.transactionid);
	connection.query("UPDATE reqauth SET ? WHERE reqauthid = ?",[verification, reqauthid], function(error, data, fields){
		connection.query("UPDATE getauth SET ? WHERE getauthid = ?",[verification, reqauthid], function(error, data, fields){
			var data = data;
			console.log(verification);
			if (error) {
				throw error;
			} else {
					console.log("updated");
				}
		});
	});
	response.redirect('transaction_authorization');
});

router.get('/logout', function (req, response, next) {
	if (req.session) {
		// delete session object
		req.session.destroy(function (err) {
			if (err) {
				return next(err);
			} else {
				return response.redirect('/');
			}
		});
	}
});

module.exports = router;
