/* Application Dependencies */
var express = require('express');
var mysql = require('mysql');
var cors = require('cors');

/* New Application ENV OBJ */
var app = express();

app.use(cors());

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

/* GET All Profiles */
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

/* GET Specific Profile */
app.get('/api/providers/:id', function(req, res) {
	var results;
	connection.query('select * from providers where provider_id = '
			+ req.params.id, function(err, rows, fields) {
		if (err)
			throw err;
		results = rows;
		res.type('application/json');
		res.send(results);
	});
});

/* Add New Profile */
app.post('/api/providers/', function(req, res) {
	connection.query(
			'insert into providers (id, provider_id,name,email) values (NULL,'
					+ req.body.id + ',' + req.body.name + ',' + req.body.email
					+ ')', function(err, result) {
				if (err)
					throw err;
				if (result)
					res.type('application/json');
				res.send([ {
					"provider added" : 1
				} ]);
			});
});

/* Update a profile */
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

/* Delete a profile */
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