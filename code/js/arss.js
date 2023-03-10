/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

const arss=exports

const stringify = require('json-stable-stringify')

const jxml = require('./jxml.js')
const db = require('./db_idb.js')
const hoard = require('./hoard.js')
const feeds = require('./feeds.js')
const items = require('./items.js')
const gist = require('./gist.js')
const display = require('./display.js')

  
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

	await gist.setup()
	
	if( window.location.hash=="" || window.location.hash=="#" )
	{
		if(gist.handle)
		{
			window.location.hash="#READ"
		}
		else
		{
			window.location.hash="#OPTS"
		}
	}
	display.all()

	display.status(arss.version)

	await display.items(0)

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


// merge json settings with current datas
arss.merge=async function(jsn)
{
	if(jsn.feeds)
	{
		for(let feed of jsn.feeds )
		{
			await feeds.add(feed)
		}
	}
}

// load json settings replacing current datas
arss.load=async function(jsn)
{
	if(jsn.feeds)
	{
	}
	await arss.merge(jsn)
}

// return a json of all current settings
arss.save=async function()
{
	let jsn={}
	
	jsn.feeds=[]
	let list=await db.list("feeds")
	for(let feed of list )
	{
		let it={}
		it.url=feed.url
		it.title=feed.title
		it.tags=feed.tags
		if(feed.off){ it.off=feed.off }
		if(feed.js){ it.js=feed.js }
		jsn.feeds.push(it)
	}
	
	return jsn
}

arss.load_gist=async function()
{
	let data=await gist.read("arss.json")
	if(data)
	{
		let jsn=JSON.parse(data)
		if(jsn)
		{
			await arss.load(jsn)
		}
	}
}
arss.save_gist=async function()
{
	let jsn=await arss.save()
	let txt=stringify(jsn,{space:" "})
	await gist.write("arss.json",txt)
//	console.log(txt)
}

