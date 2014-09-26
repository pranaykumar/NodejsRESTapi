/* Application Dependencies */
var express = require('express');
var mysql = require('mysql');
var cors = require('cors');
var bodyParser = require('body-parser');
var async = require('async');

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

/* GET Provider by matching ID or Name or Email */
app.get('/api/providersearch/:prvdrSrchStr', function(req, res) {
	var results;
	var queryStr = 'select * from providers where provider_id like '
		  + connection.escape(req.params.prvdrSrchStr)
        +' or  lower(name) like '+connection.escape('%'+(req.params.prvdrSrchStr).toLowerCase()+'%')
        +' or lower(email) like '+connection.escape('%'+(req.params.prvdrSrchStr).toLowerCase()+'%');
	
	console.log(queryStr);
	
	connection.query(queryStr, function(err, rows, fields) {
		if (err){
			console.log(err);
// results = [{"Error":"No Record found for the given Provider ID"}];
// res.send(results);
			}
		results = rows;
		res.type('application/json');
		res.send(results);
	});
});

/* GET Specific Provider */
app.get('/api/providers/:id', function(req, res) {
	var results;
	console.log(req.params.id);

	connection.query('select * from providers where provider_id = '
			+ connection.escape(req.params.id), function(err, rows, fields) {
		if (err){
			console.log(err);
// results = [{"Error":"No Record found for the given Provider ID"}];
// res.send(results);
			}
		results = rows;
		res.type('application/json');
		res.send(results);
	});
});




/* GET Profiles for a given Provider */
app.get('/api/providers/:id/profiles', function(req, res) {
	var results = [];
	connection.query('select pf.profile_id,pf.name,pf.type,pf.private,pf.deinterlace_input,pf.frame_rate,pf.mezzanine_multipass_encoding \
					  from providers pv, profile pf, provider_profile_map m \
					  where pv.provider_id = m.provider_id and pf.profile_id = m.profile_id \
					  and pv.provider_id = '+ connection.escape(req.params.id), function(err, profile_rows, fields) {
		if (err)
			throw err;
		
					  var getStreams = function (profile_obj,doneCallback){
							
						  stream_qry = 'select s.stream_id,s.name,s.muxing_format,s.profile,s.audio_sample_rate,s.audio_bitrate,\
							  s.video_bitrate,s.video_width,s.keyframe_interval_sec,s.watermark,s.multipass_encoding,\
							  s.segment_length_sec,s.encrypt,s.key_rotation_period,s.video_encryption_level\
							  from stream s, profile_stream_map ps where s.stream_id = ps.stream_id\
							  and ps.profile_id ='+connection.escape(profile_obj.profile_id);
						  
						  connection.query(stream_qry,function(err, stream_rows, fields){
							  if(err)
								  throw err;
							  
							  // add stream property to profile object
							  profile_obj.streams = stream_rows;

							  // add profile object element to results array
							  results.push(profile_obj);
							  console.log(results);
							// Nothing went wrong, so callback with a null
								// error.
								  return doneCallback(null);	
						  });
							
						};
						
						async.each(profile_rows,getStreams,function(err){
							console.log('Finished!');
							res.type('application/json');
							res.send(results);
						});

	});
});

/* Add New Provider */
app.post('/api/providers/', function(req, res) {
	var qry = 'insert into providers (id,provider_id,name,email) values (NULL, uuid(),'+ connection.escape(req.body.name) + ',' + connection.escape(req.body.email) + ')';
	connection.query(qry, function(err, result) {
				if (err)
					throw err;
				if (result)
					res.type('application/json');
				res.send([ {
					"msg" : "Provider added."
				} ]);
			});
});

/* Update Provider */
app.put('/api/providers/:id', function(req, res) {
	connection.query('update providers set name = ' + connection.escape(req.body.name) + ', email = ' + connection.escape(req.body.email)
			+ ' where provider_id = ' + connection.escape(req.params.id), function(err, result) {
		if (err)
			throw err;
		if (result)
			res.type('application/json');
		res.send([ {
			"msg" : "Provider details updated."
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
			"msg" : "Provider deleted."
		} ]);
	});
});

app.listen(3000);