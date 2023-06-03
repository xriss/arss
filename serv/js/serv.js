#!/usr/bin/env node
/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let argv=require('yargs').argv; global.argv=argv;
let argv_parse=function(argv)
{

	//setting = command   || environment           || default
	argv.port = argv.port || process.env.ARSS_PORT || 12345

}
argv_parse(argv)




let express = require('express');
let app = express();



app.use(express.static( argv.staticdir || (__dirname+"/../static") ))



app.use(function(req, res, next)
{
	var aa=req.path.split("/")
	var ab=aa && aa[1] && (aa[1].split("."))

console.log(req.path)

	if( ab && (ab[0]=="rss") ) // rss output
	{
		let used={
			req:req,
			res:res,
			next:next,
			output:{},
			output_format:ab[1],
		}
		return require("./serv_rss").serv(used)
	}

	next()
})





console.log("Starting static server at http://localhost:"+argv.port+"/");

app.listen(argv.port);

