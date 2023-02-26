
const arss=exports

const stringify = require('json-stable-stringify')

const jxml = require('./jxml.js')
const db = require('./db_idb.js')
const hoard = require('./hoard.js')
const feeds = require('./feeds.js')
const items = require('./items.js')
const gist = require('./gist.js')

  
  
arss.setup=function(args)
{
	arss.args=args || {}		// remember args
	if( document.readyState == "loading" )
	{ document.addEventListener("DOMContentLoaded", arss.start) }
	else { arss.start() } // wait for page to load then call start
}
  
 

arss.start=async function()
{
	console.log("ARSS is here")

	await db.setup()
	await gist.setup()

	
	await arss.load_gist()


	await items.test()


	await feeds.fetch_all()


	await arss.save_gist()
}


// merge json settings with current datas
arss.merge=async function(jsn)
{
	if(jsn.feeds)
	{
		for( feed of jsn.feeds )
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
	for( feed of list )
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
			arss.load(jsn)
		}
	}
}
arss.save_gist=async function()
{
	let jsn=await arss.save()
	let txt=stringify(jsn,{space:" "})
	await gist.write("arss.json",txt)
	console.log(txt)
}
