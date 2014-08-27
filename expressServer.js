/* Application Dependencies */
var express = require('express');
var mysql = require('mysql');
var cors = require('cors');
var bodyParser = require('body-parser');

/* New Application ENV OBJ */
var app = express();

app.use(cors());
app.use(bodyParser.json());

/* Initiate Mysql Connection */
var connection = mysql.createConnection({
	host : 'localhost',
	user : 'root',
	database : 'ooyaladb',
	password : '1234'
});

connection.connect();

/* Actions */
app.get('/', function(req, res) {
	res.send('<h1>Providers</h1>');
	res.header('Access-Control-Allow-Origin', "http://localhost:8080");
	res.header('Access-Control-Allow-Methods', 'GET');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

});

/* GET All Providers */
app.get('/api/providers/', function(req, res) {
	var results;
	connection.query('select * from providers', function(err, rows, fields) {
		if (err)
			throw err;
		results = rows;
		res.type('application/json');
		res.send(results);
	});
});

/* GET Specific Provider */
app.get('/api/providers/:id', function(req, res) {
	var results;
	connection.query('select * from providers where provider_id = '
			+ connection.escape(req.params.id), function(err, rows, fields) {
		if (err){
			console.log(err);
//			results = [{"Error":"No Record found for the given Provider ID"}];
//			res.send(results);
			}
		results = rows;
		res.type('application/json');
		res.send(results);
	});
});

/* GET Profiles for a given Provider */
app.get('/api/providers/:id/profiles', function(req, res) {
	var results;
	connection.query('select pf.profile_id,pf.name,pf.type,pf.private,pf.deinterlace_input,pf.frame_rate,pf.mezzanine_multipass_encoding \
					  from providers pv, profile pf, provider_profile_map m \
					  where pv.provider_id = m.provider_id and pf.profile_id = m.profile_id \
					  and pv.provider_id = '+ connection.escape(req.params.id), function(err, rows, fields) {
		if (err)
			throw err;
		results = rows;
		
		res.type('application/json');
		res.send(results);
	});
});

/* Add New Provider */
app.post('/api/providers/', function(req, res) {
	var qry = 'insert into providers (id,provider_id,name,email) values (NULL, uuid(),'+ connection.escape(req.body.name) + ',' + connection.escape(req.body.email) + ')';
	console.log(qry);
	connection.query(qry, function(err, result) {
				if (err)
					throw err;
				if (result)
					res.type('application/json');
				res.send([ {
					"provider added" : 1
				} ]);
			});
});

/* Update Provider */
app.put('/api/providers/:id', function(req, res) {
	connection.query('update providers set name = ' + re.body.name + ', email = ' + req.body.email
			+ ' where provider_id = ' + re.params.id, function(err, result) {
		if (err)
			throw err;
		if (result)
			res.type('application/json');
		res.send([ {
			"provider data updated" : 1
		} ]);
	});
});

/* Delete a Provider */
app.delete('/api/providers/:id', function(req, res) {
	connection.query('delete from providers where provider_id = '
			+ req.params.id, function(err, result) {
		if (err)
			throw err;
		if (result)
			res.type('application/json');
		res.send([ {
			"provider deleted" : 1
		} ]);
	});
});

app.listen(3000);