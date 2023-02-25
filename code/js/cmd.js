#!/usr/bin/env node
// Copyright (c) 2019 International Aid Transparency Initiative (IATI)
// Licensed under the MIT license whose full text can be found at http://opensource.org/licenses/MIT

const cmd=exports;

const pfs=require("fs").promises

const jml=require("./jxml.js")


const ls=function(a) { console.log(util.inspect(a,{depth:null})); }


cmd.parse=function(argv)
{
	argv.filename_cmd=__filename

}


cmd.run=async function(argv)
{
	if( argv._[0]=="jxml" )
	{
		await require("./jxml.js").test(argv)
		return
	}

	// help text
	console.log(
`
>	arss jxml

Test jxml code.


`)
}

// if global.argv is set then we are inside another command so do nothing
if(!global.argv)
{
	var argv = require('yargs').argv
	global.argv=argv
	cmd.parse(argv)
	cmd.run(argv)
}
