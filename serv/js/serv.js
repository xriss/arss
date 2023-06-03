#!/usr/bin/env node
/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let argv=require('yargs').argv; global.argv=argv;
let argv_parse=function(argv)
{

	//setting     = commandline   || environment                 || default                      ;
	argv.port     = argv.port     || process.env.ARSS_PORT       || 12345                        ;

}
argv_parse(argv)




let express = require('express');
let app = express();


//express.static.mime.define({'text/plain': ['']});

//app.use( express_fileupload() );


app.use(function(req, res, next) {

 	var aa=req.path.split("/");
	var ab=aa && (aa[aa.length-1].split("."));

	if( ab && (ab.length==1) ) // no extension
	{
		res.contentType('text/html'); // set to html
	}
	
	next();
});

app.use(express.static( argv.staticdir || (__dirname+"/../static") ));

//app.use( express.json( { limit: '10MB' } ) )

app.use(function(req, res, next) {
	var aa=req.path.split("/");
	var ab=aa && aa[1] && (aa[1].split("."));

console.log(req.path)

	if( ab && (ab[0]=="rss") ) // rss output
	{
//		require("../../dstore/js/query").serv(req,res,next);
	}
	else
	{
		next();
	}
});





console.log("Starting static server at http://localhost:"+argv.port+"/");

app.listen(argv.port);

