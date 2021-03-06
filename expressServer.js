/* Application Dependencies */
var express = require('express');
var mysql = require('mysql');
var cors = require('cors');
var bodyParser = require('body-parser');
var async = require('async');
var uuid = require('node-uuid');

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
		  + connection.escape('%'+(req.params.prvdrSrchStr).toLowerCase()+'%')
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

	connection.query('select * from providers where provider_id = '
			+ connection.escape(req.params.id), function(err, rows, fields) {
		if (err)
			console.log(err);
		results = rows;
		res.type('application/json');
		res.send(results);
	});
});

/* GET Specific Profile */
app.get('/api/profile/:id', function(req, res) {
	console.log("inside specific profile");

	var results = [];

	connection.query('select * from profile where profile_id = '
			+ connection.escape(req.params.id), function(err, row, fields) {
		if (err)
			console.log(err);
		
		var getStreams = function (profile_obj,doneCallback){
			
			  stream_qry = 'select s.id,s.stream_id,s.name,s.muxing_format,s.profile,s.audio_sample_rate,s.audio_bitrate,\
				  s.video_bitrate,s.video_width,s.keyframe_interval_sec,s.watermark,s.multipass_encoding,\
				  s.segment_length_sec,s.encrypt,s.key_rotation_period,s.video_encryption_level,s.stream_type, s.encode_width, s.h266_profile\
				  from stream s, profile_stream_map ps where s.stream_id = ps.stream_id\
				  and ps.profile_id ='+connection.escape(profile_obj.profile_id);
			  
			  console.log(stream_qry);
			  
			  connection.query(stream_qry,function(err, stream_rows, fields){
				  if(err)
					  throw err;
				  
				  // add stream property to profile object
				  profile_obj.streams = stream_rows;

				  // add profile object element to results array
				  results.push(profile_obj);
				// Nothing went wrong, so callback with a null
					// error.
					  return doneCallback(null);	
			  });
				
			};
			
			async.each(row,getStreams,function(err){
				console.log('Finished!');
				console.log(results);
				res.type('application/json');
				res.send(results);
			});
	});
});




/* GET Profiles for a given Provider */
app.get('/api/providers/:id/profiles', function(req, res) {
	console.log("inside profile");
	var results = [];
	connection.query('select pf.profile_id,pf.name,pf.type,pf.private,pf.deinterlace_input,pf.frame_rate,pf.mezzanine_multipass_encoding, pf.image_interval_sec, pf.custom_image_widths \
					  from providers pv, profile pf, provider_profile_map m \
					  where pv.provider_id = m.provider_id and pf.profile_id = m.profile_id \
					  and pv.provider_id = '+ connection.escape(req.params.id) + 'order by pf.name', function(err, profile_rows, fields) {
		if (err)
			throw err;
		
					  var getStreams = function (profile_obj,doneCallback){
							
						  stream_qry = 'select s.id,s.stream_id,s.name,s.muxing_format,s.profile,s.audio_sample_rate,s.audio_bitrate,\
							  s.video_bitrate,s.video_width,s.keyframe_interval_sec,s.watermark,s.multipass_encoding,\
							  s.segment_length_sec,s.encrypt,s.key_rotation_period,s.video_encryption_level,s.stream_type, s.encode_width, s.h266_profile\
							  from stream s, profile_stream_map ps where s.stream_id = ps.stream_id\
							  and ps.profile_id ='+connection.escape(profile_obj.profile_id);
						  
						  connection.query(stream_qry,function(err, stream_rows, fields){
							  if(err)
								  throw err;
							  
							  // add stream property to profile object
							  profile_obj.streams = stream_rows;

							  // add profile object element to results array
							  results.push(profile_obj);
							// Nothing went wrong, so callback with a null
								// error.
								  return doneCallback(null);	
						  });
							
						};
						
						async.each(profile_rows,getStreams,function(err){
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

/* Add New Profile */
app.post('/api/profile/', function(req, res) {

	var seqno = 0;
	var profile_id = uuid.v1();
	console.log("profile_id generated is "+ profile_id);
	
	var qry = 'insert into profile (id, profile_id,name,type,private,deinterlace_input,frame_rate,mezzanine_multipass_encoding,custom_image_widths,image_interval_sec)\
				values (NULL, '
				+ connection.escape(profile_id)+','
			    + connection.escape(req.body.profile.name) +',"video",'
				+ connection.escape(parseInt(req.body.profile.private))+','
				+ connection.escape(parseInt(req.body.profile.deinterlace_input))+','
				+ connection.escape(parseFloat(req.body.profile.frame_rate))+','
				+ connection.escape(parseInt(req.body.profile.mezzanine_multipass_encoding))+',' 
				+ connection.escape(req.body.profile.custom_image_widths)+','
				+ connection.escape(parseInt(req.body.profile.image_interval_sec))
				+ ')';
	
	console.log(qry);
	
	var insertProfile = function (doneCallback){
	connection.query(qry, function(err, result) {
				if (err)
					throw err;
				return doneCallback(null);
			});
	};
	
	var selectMaxSeqNum = function(doneCallback) {
		connection.query('select max(seq_num) maxsn from provider_profile_map where provider_id = '+ connection.escape(req.body.provider), 
		function(err, result) {
			if (err)
				throw err;
			seqno = result[0].maxsn;
			return doneCallback(null);
		});		
	};
	
	console.log("seq no is : "+ seqno);
	
	var insertQry = 'insert into provider_profile_map(provider_id, profile_id, seq_num) values('
	 +connection.escape(req.body.provider)+','
	 +connection.escape(profile_id)+','
	 +seqno
	 +')';
	

	var insertProviderProfMap = function(doneCallback) {		
		connection.query(insertQry, 
				function(err, result) {
			if (err)
				throw err;

			return doneCallback(null);
		});		
	};
	
	// call resetDefault and newDefault in series
	async.series([insertProfile,selectMaxSeqNum,insertProviderProfMap], function(err) {
		if (err) throw err;
		res.type('application/json');
		res.send([ {
			"msg" : "Profile Added."
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

/* Update Profile */
app.put('/api/profile/:id', function(req, res) {	
// if the request body comes with profie_type param, then call is for making the
// profile_id default_video
if(req.body.profile_type !== undefined){

	var qry = 'update profile set type = null where profile_id in (select profile_id from provider_profile_map where provider_id = '+ connection.escape(req.body.provider_id)+')	and profile_id != '+connection.escape(req.params.id);
	console.log(qry);
	
	var resetDefault = function(doneCallback) {		
		connection.query(qry, 
				function(err, result) {
			if (err)
				throw err;

			return doneCallback(null);
		});
	};
		
	var newDefault = function(doneCallback) {		
		connection.query('update profile set type='+connection.escape(req.body.profile_type) 
						 + ' where profile_id = ' + connection.escape(req.params.id), 
				function(err, result) {
			if (err)
				throw err;

			return doneCallback(null);
		});		
	};
	
	// call resetDefault and newDefault in series
	async.series([resetDefault,newDefault], function(err) {
		if (err) throw err;
		res.type('application/json');
		res.send([ {
			"msg" : "Provider details updated."
		} ]);
	});
	
}else {
	connection.query('update profile set image_interval_sec = ' + connection.escape(req.body.profile.image_interval_sec) 
			+ ', custom_image_widths = ' + connection.escape(req.body.profile.custom_image_widths)
			+ ', deinterlace_input = ' + connection.escape(req.body.profile.deinterlace_input)
			+ ', override_source = ' + connection.escape(req.body.profile.override_source)
			+ ', mezzanine_multipass_encoding = ' + connection.escape(req.body.profile.mezzanine_multipass_encoding)
			+ ' where profile_id = ' + connection.escape(req.params.id), function(err, result) {
		if (err)
			throw err;
		if (result)
			res.type('application/json');
		res.send([ {
			"msg" : "Profile details updated."
		} ]);
	});
}
});

/* Delete a Provider */
app.delete('/api/providers/:id', function(req, res) {
	connection.query('delete from providers where provider_id = '
			+ connection.escape(req.params.id), function(err, result) {
		if (err)
			throw err;
		if (result)
			res.type('application/json');
		res.send([ {
			"msg" : "Provider deleted."
		} ]);
	});
});

/* Delete a Profile */
app.delete('/api/profile/:id', function(req, res) {
	console.log("Trying to delete profile ID "+req.params.id);
	
	connection.query('delete from provider_profile_map where profile_id = '
			+ connection.escape(req.params.id), function(err, result) {
		if (err)
			throw err;
		res.type('application/json');
		res.send([ {
			"msg" : "Profile deleted."
		} ]);
	});
});

/* Delete multiple Profile */
app.delete('/api/profile', function(req, res) {
	var profiles4Deletion = '';
	
	async.each(req.body.profiles, function(profile_obj,doneCallback) {
		profiles4Deletion = profiles4Deletion +','+connection.escape(profile_obj.profile_id);
		
		return doneCallback(null);	
	}, function(err) {
		if (err)
			throw err;
		console.log(profiles4Deletion.substring(1,profiles4Deletion.length));
	});
	
	 connection.query('delete from provider_profile_map where profile_id in (' +
			 profiles4Deletion.substring(1,profiles4Deletion.length)+')', 
			 function(err, result) { 
		 		if (err) throw err; 
		 		if (result) 
		 			res.type('application/json'); 
		 		res.send([ 
		 		           { "msg" : "Profiles deleted." } 
		 		         ]); 
		 		});
	 
});

app.listen(3000);