/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let arss={}
export default arss
  

import { configure } from 'safe-stable-stringify'
const stringify = configure({})
import      jxml      from "./jxml.js"
import      db        from "./db_idb.js"
import      hoard     from "./hoard.js"
import      feeds     from "./feeds.js"
import      items     from "./items.js"
import      gist      from "./gist.js"
import      display   from "./display.js"

function getQueryVariable(variable) {
	return ret
}

arss.version="V"+__VERSION__

arss.setup=function(args)
{
	arss.query={}
	for (let v of window.location.search.substring(1).split('&') )
	{
		let pair = v.split('=')
		arss.query[ decodeURIComponent(pair[0]) ] = decodeURIComponent(pair[1])
	}

	arss.args=args || {}		// remember args
	if( document.readyState == "loading" )
	{ document.addEventListener("DOMContentLoaded", arss.start) }
	else { arss.start() } // wait for page to load then call start
}
  
 

arss.start=async function()
{
	console.log("ARSS! is here")
	
	db.name=arss.args.idb || arss.query.idb || "arss"	// force a name use "delete" for an autodeleted db
	await db.setup()

// pickup cors proxy and gist token from url/args/db
	arss.cors=await db.get("keyval","cors") || arss.args.cors || arss.query.cors
	arss.gist=await db.get("keyval","gist_token") || arss.args.gist || arss.query.gist
	
// use exact string value "false" to force an empty string and disable
	if( arss.cors=="false" ) { arss.cors="" }
	if( arss.gist=="false" ) { arss.gist="" }
	
	if( "string" != typeof arss.cors ) // auto proxy based on domain
	{
		let hostname=window.location.hostname.toLowerCase()
		if( hostname == "xriss.github.io" ) { arss.cors = "https://cors.xixs.com:4444/" }
	}

	hoard.mode=await hoard.test_probe()
	if(!hoard.mode)
	{
		display.page("cors")
//		alert("CORS is blocking access to feeds!\n\nPlease enable a CORS plugin or provide a CORS bouncer.\n\nYou can provide a CORS bouncer such as corsanywhere by adding ?cors=BOUNCERURL to this page or search for and enable a CORS extension from your browser menu.");
//		location.reload();
		return
	}
	console.log("CORS is : "+hoard.mode)



	await gist.setup()
	
	display.all()

	display.status(arss.version)
	await feeds.precache()
	await items.precache()

	await arss.load_gist()

	if( arss.query.opml ) // auto merge this opml
	{
		try{
			let ok=true
			if(gist.handle)
			{
				ok=confirm("New feeds will be added and saved to github.");
			}
			if(ok)
			{
				display.status("Loading OPML")
				await feeds.add_opml(false,arss.query.opml)
				display.status("OPML loaded")
			}
		}catch(e){console.error(e)}
	}

	// keep refreshing feeds
	let feeds_fetch;feeds_fetch=async function()
	{
		await feeds.fetch_all()
		window.setTimeout(feeds_fetch, 5*60*1000) // every 5 mins
	}
	await feeds_fetch() // first time

	await arss.save_gist()

}


arss.load_gist=async function()
{
	let data_opml=await gist.read("arss.opml")
	if(data_opml)
	{
		await feeds.add_opml(data_opml)
	}
}
arss.save_gist=async function()
{
// auto save an opml
	let data=await feeds.build_opml()
	await gist.write("arss.opml",data)
}

