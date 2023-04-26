/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

const feeds=exports


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const items = require('./items.js')
const gist = require('./gist.js')
const display = require('./display.js')

feeds.cached={}

feeds.cache=async function(url,feed) // probably fast
{
	if(feed) { feeds.cached[url]=feed ; return feed }
	if(feeds.cached[url]) { return feeds.cached[url] }
	await feeds.get(url)
	return feeds.cached[url]
}
feeds.get=async function(url) // always slow
{
	let feed=await db.get("feeds",url)
	if(feed) { feeds.cache(feed.url,feed) }
	return feed
}
feeds.set=async function(feed)
{
	await db.set("feeds",feed.url,feed)
	if(feed) { feeds.cache(feed.url,feed) }
}

feeds.prepare=function(feed)
{
	let atom=feed.atom||{}
	let rss=feed.rss||{}
	
	if(rss["/rss/channel/title"])
	{
		feed.title=rss["/rss/channel/title"]
	}
	else
	if(atom["/feed/title"])
	{
		feed.title=atom["/feed/title"]
	}

	if(rss["/rss/channel/pubdate"])
	{
		feed.date=new Date(rss["/rss/channel/pubdate"])
	}
	else
	if(atom["/feed/updated"])
	{
		feed.date=new Date(atom["/feed/updated"])
	}

	return feed
}

feeds.add=async function(it)
{
	let old=await db.get("feeds",it.url)
	let feed={} // merge old and new here
	if(old)
	{
		for(let n in old ){ feed[n]=old[n] }
	}
	for(let n in it ){ feed[n]=it[n] }
	// maintain defaults
	feed.date=feed.date||new Date()
	feed.fails=feed.fails||0
	await db.set("feeds",feed.url,feed)
	
	feeds.cache(feed.url,feed)
}


feeds.add_opml=async function(data,url)
{
	if(url){data=await hoard.fetch_text(url,true)}
	if(!data){return}
	let jsn=jxml.parse_xml(data,jxml.xmap.opml)
//console.log(jsn)

	let check;check=async function(it)
	{
		if( it["@xmlurl"] )
		{
			let feed={}
			feed.url=it["@xmlurl"]
			await feeds.add(feed)
		}
		if(it["/outline"]) // check sub outlines
		{
			for(let it2 of it["/outline"] )
			{
				await check(it2)
			}
		}
	}

	if( jsn["/opml/body/outline"] )
	{
		for(let it of jsn["/opml/body/outline"] )
		{
			await check(it)
		}
	}
	else
	if( jsn["/rss/channel/item/title"] ) // looks like a rss
	{
		if(url) // so subscribe to this url
		{
			let feed={}
			feed.url=url
			await feeds.add(feed)
		}
	}
	else
	if( jsn["/feed/entry/title"] ) // looks like attom
	{
		if(url) // so subscribe to this url
		{
			let feed={}
			feed.url=url
			await feeds.add(feed)
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
		feeds.cache(feed.url,feed)
	}
	await Promise.all(rets)

	if(items.add_count>0)
	{
		display.status("+"+items.add_count)
		if( document.getElementById('arss_list_read').parentElement.scrollTop==0 ) // at top, so refresh
		{
			display.items(0)
		}
	}
	else
	{
		display.status("")
	}
}

feeds.fetch=async function(feed)
{
	if(!feed.off) // check if the feed is turned off
	{
	try{
		let txt=await hoard.fetch_text(feed.url)

		try{ feed.rss=jxml.parse_xml(txt,jxml.xmap.rss) }
		catch(e){}

		try{ feed.atom=jxml.parse_xml(txt,jxml.xmap.atom) }
		catch(e){}

		feeds.prepare(feed)
		
		// feed.items_date date is date of most recent item we have seen in the feed
		let check_date=function(it)
		{
			if(it.date)
			{
				if(feed.items_date)
				{
					if( feed.items_date < it.date )
					{
						feed.items_date=it.date
					}
				}
				else
				{
					feed.items_date=it.date
				}
			}
		}

		if(feed.rss && feed.rss["/rss/channel/item"])
		{
			feed.items_count=0
			for(let rss_item of feed.rss["/rss/channel/item"] )
			{
				let item={rss:rss_item}
				feed.items_count++
				items.prepare(item,feed)
				check_date(item)
				await items.add(item)
				await hoard.first_text(item.link)
			}
			feed.fails=0
		}
		else
		if(feed.atom && feed.atom["/feed/entry"])
		{
			feed.items_count=0
			for(let atom_entry of feed.atom["/feed/entry"] )
			{
				let item={atom:atom_entry}
				feed.items_count++
				items.prepare(item,feed)
				check_date(item)
				await items.add(item)
				await hoard.first_text(item.link)
			}
			feed.fails=0
		}
		else
		{
			feed.fails=(feed.fails||0)+1
		}

		await db.set("feeds",feed.url,feed) // save updated feed info
	}catch(e){console.error(e)}
	}

	feeds.list_length_count++
	display.status(Math.floor(100*(feeds.list_length_count/feeds.list_length))+"% +"+items.add_count)
}

