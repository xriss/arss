#!/usr/bin/env node
/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let cmd={}
export default cmd


import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


import { promises as pfs }  from "fs"
import          * as jml    from "./jxml.js"


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
	var argv = {_:process.argv}
	global.argv=argv
	cmd.parse(argv)
	cmd.run(argv)
}
