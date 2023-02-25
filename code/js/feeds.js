
const feeds=exports


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const items = require('./items.js')


feeds.add=async function(it)
{
	let old=await db.get("feeds",it.url)
	let feed={}
	if(old)
	{
		for( n in old ){ feed[n]=old[n] }
	}
	for( n in it ){ feed[n]=it[n] }
	it.date=new Date()
	await db.set("feeds",it.url,it)
}


feeds.add_opml=async function(url)
{
	let txt=await hoard.fetch_text(url,true)
	let jsn=jxml.parse_xml(txt,jxml.xmap.opml)
	for( it of jsn["/opml/body/outline"] )
	{
		let feed={}
		if( it["@xmlUrl"] )
		{
			feed.url=it["@xmlUrl"]
			await feeds.add(feed)
		}
	}
}

feeds.fetch_all=async function()
{
	let list=await db.list("feeds")
	for( feed of list )
	{
		await feeds.fetch(feed)
	}
}

feeds.fetch=async function(feed)
{
	try{
		let txt=await hoard.fetch_text(feed.url)
		let jsn=jxml.parse_xml(txt,jxml.xmap.rss)
		console.log(jsn)
		if(jsn["/rss/channel/item"])
		{
			for( item of jsn["/rss/channel/item"] )
			{
				items.prepare(item,feed)
				await items.add(item)
			}
		}
//		console.log(jsn)
	}catch(e){console.error(e)}
}

