var http = require("http");
var async = require('async');

var square = function (num,doneCallback){
	console.log(num*num);
	// Nothing went wrong, so callback with a null error.
	  return doneCallback(null);	
};

//Square each number in the array [1, 2, 3, 4]. 


/* The first argument is an array of items to be iterated over.
 * The second argument is the iterator function – in this case, that's square. With async.each the iterator takes 
 * two arguments - the current item and a done callback. The iterator can do what it likes to the item 
 * so long as it calls the done callback at some point, with or without an error.
 */
async.each([1,2,3,4],square,function(err){
	console.log('Finished!');
});

http.createServer(function(request, response) {
	response.writeHead(200, {
		"Content-Type" : "text/plain"
	});
	response.write("Hello World");
	response.end();
}).listen(3000);