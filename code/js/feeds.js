
const feeds=exports


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const items = require('./items.js')
const gist = require('./gist.js')
const display = require('./display.js')


feeds.add=async function(it)
{
	let old=await db.get("feeds",it.url)
	let feed={}
	if(old)
	{
		for(let n in old ){ feed[n]=old[n] }
	}
	for(let n in it ){ feed[n]=it[n] }
	it.date=new Date()
	await db.set("feeds",it.url,it)
}


feeds.add_opml=async function(data,url)
{
	if(url){data=await hoard.fetch_text(url,true)}
	if(!data){return}
	let jsn=jxml.parse_xml(data,jxml.xmap.opml)
//console.log(jsn)
	if(jsn["/opml/body/outline"] )
	{
		for(let it of jsn["/opml/body/outline"] )
		{
			let feed={}
			if( it["@xmlurl"] )
			{
				feed.url=it["@xmlurl"]
				await feeds.add(feed)
			}
		}
	}
}

feeds.build_opml=async function()
{
	let list=await db.list("feeds")
	let data="<opml></opml>"
	return data
}

feeds.load_opml=async function()
{
	let data=await gist.read("subscriptions.opml")
	await feeds.add_opml(data)
}

feeds.save_opml=async function()
{
	let data=await feeds.build_opml()
	await gist.write("subscriptions.opml",data)
}

feeds.list_length=0
feeds.list_length_count=0
feeds.fetch_all=async function()
{
	let rets=[]
	let list=await db.list("feeds")
	
	feeds.list_length=list.length
	feeds.list_length_count=0
	
	for(let feed of list )
	{
		rets.push(feeds.fetch(feed))
	}
	await Promise.all(rets)

	display.status("")
}

feeds.fetch=async function(feed)
{
	try{
		let txt=await hoard.fetch_text(feed.url)
		let jsn
		try{ jsn=jxml.parse_xml(txt,jxml.xmap.rss) }
		catch(e){}
//		console.log(jsn)
		if(jsn && jsn["/rss/channel/item"])
		{
			for(let item of jsn["/rss/channel/item"] )
			{
				items.prepare(item,feed)
				await items.add(item)
			}
		}
//		console.log(jsn)
	}catch(e){console.error(e)}

	feeds.list_length_count++
	display.status(Math.floor(100*(feeds.list_length_count/feeds.list_length))+"%")
}

