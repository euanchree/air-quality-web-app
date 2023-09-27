//Modules
var express = require('express');
var session = require('express-session');
var app = express();
const bodyParser = require('body-parser');
var http = require('http');
var MongoClient = require('mongodb').MongoClient;

//MongoDB url
var mongoUrl = 'mongodb://localhost:27017/whatyobreathin';

//Api key
var apikey = "apikey";

//Public folder holds static files
app.use(express.static('public'));

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({ secret: 'secret' }));

//Setting up ejs
app.set('view engine', 'ejs');

//Variable that stores the database of users
var db;

//this is our connection to the mongo db, ts sets the variable db as our database
MongoClient.connect(mongoUrl, function(err, database) {
  if (err) throw err;
  db = database;
  app.listen(8080);
  console.log('listening on 8080');
});

//Route for /
app.get('/', function(req, res) {
	if(!req.session.loggedin) { // if the user isnt logged in it sends them to the login page
		res.redirect('/login');
		return;
	};
    res.render('pages/map');
});

//Route for /air quality
app.get('/airquality',function(req,res) {
	params = {lon:req.query.lon, lat:req.query.lat};
	
	apiReq = http.request(`http://api.airvisual.com/v2/nearest_city?lat=${params.lat}&lon=${params.lon}&key=${apikey}`, function(apiRes) {
		apiRes.setEncoding('utf8');
		data = "";

		apiRes.on('data',function(d) {
			data+=d;
			//console.log(d);
		});

		apiRes.on('end', function()  {
			res.send(data);	
		});
	});
	apiReq.end();
});

//Route for /login
app.get('/login',function(req,res) {
	res.render('pages/login');
});

//Route for /sign u
app.get('/signup', function(req,res) {
	res.render('pages/signup');
});

//Route for /logout
app.get('/logout',function(req,res) {
	req.session.loggedin = false;
	req.session.destroy();
	res.redirect('/');
});

//Route for /profile
app.get('/profile', function(req,res) {
	if(!req.session.loggedin) {
		res.redirect('/login');
		return;
	};

	var username = req.session.username;

	db.collection('profiles').findOne({username:username}, function(err, result) {
		if (err) throw err;
			//console.log(result)
		
		
			let output = {}
			output.username = result.username
			
			output.password = result.password;
			output.markers = [];
			//console.log(output);
			if (result.markers) {
				for (let i = 0;i < result.markers.length; i++) {
					let marker = result.markers[i].split(" ");
					output.markers[i] = {lat:marker[0],lng:marker[1]}
				};
			};
			res.render('pages/profile', output);
		});
});

//Route for /dologin
app.post('/dologin',function(req,res) {
	var username = req.body.username;
	var password = req.body.password;
	req.session.username =  username;
	
	db.collection('profiles').findOne({username:username}, function(err, result) {
		if (err) throw err;

		if (!result) {
			res.redirect('/login');
			return;
		};

		if(result.password == password) { 
			req.session.loggedin = true;
			res.redirect('/');
		} else {
			res.redirect('/login');
		};
  	});
});

//Route for /dosignup
app.post('/dosignup', function(req,res) {
	var username = req.body.username;
	var password = req.body.password;
	db.collection('profiles').findOne({username:username},function (err, result) {
		if (err) throw err;
		
		if (!result) {// if a record doesnt exist with this username then we can add the user
			db.collection('profiles').insertOne({username:username,password:password},function(err2,result2) {
				if (err2) throw err2;
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/');
			})
		} else {
			res.redirect('/signup');
		};
	});
});

//Route for /dogetmarkers
app.post('/dogetmarkers', function(req,res) {
	var username = req.session.username;

	db.collection('profiles').findOne({username:username}, function(err,result) {
		if (err) throw err;

		if(!result) {
			console.log("Welp its borked");
		} else {
			res.send(result.markers);
		};
	});
});

//Route for /doupdatemarkers
app.post('/doupdatemarkers', function(req,res) {
	var markers = req.body.latlngs;
	var output = [];

	markers.forEach(element => {
		var latlng = element.split(" ");
		output.push(latlng[0] + " " + latlng[1]);
	});

	db.collection('profiles').update({username:req.session.username},{$set:{markers:output}}, function(err,res2) {
		if (err) throw err;
	});
});

//Route for /dodeleteuser
app.get('/dodeleteuser',function(req,res) {
	if(!req.session.loggedin) {
		res.redirect('/login');
		return;
	};
	db.collection('profiles').remove({username:req.session.username},function(err,result) {
		if (err) throw err;
		res.redirect('/logout');
	});
});