
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


arss.setup=function(args)
{
	arss.query={}
	for (let v of window.location.search.substring(1).split('&') )
	{
		let pair = v.split('=')
		arss.query[ decodeURIComponent(pair[0]) ] = decodeURIComponent(pair[1])
	}
	console.log(arss.query)

	arss.args=args || {}		// remember args
	if( document.readyState == "loading" )
	{ document.addEventListener("DOMContentLoaded", arss.start) }
	else { arss.start() } // wait for page to load then call start
}
  
 

arss.start=async function()
{
	console.log("ARSS is here")
	
	await db.setup()

// pickup cors proxy and gist token from url/args/db
	arss.cors=await db.get("keyval","cors") || arss.args.cors || arss.query.cors
	arss.gist=await db.get("keyval","gist_token") || arss.args.gist || arss.query.gist

	await gist.setup()

	display.all()
	display.status("Loading...")

	if( window.location.hash=="" || window.location.hash=="#" )
	{
		if(gist.handle)
		{
			window.location.hash="#read"
		}
		else
		{
			window.location.hash="#opts"
		}
	}
	display.hash(window.location.hash)

	await items.display(0)

	await arss.load_gist()

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
		jsn.feeds.push(feed)
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

