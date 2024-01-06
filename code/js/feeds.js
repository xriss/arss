/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let feeds={}
export default feeds


import      arss      from "./arss.js"
import      display   from "./display.js"
import      gist      from "./gist.js"
import      items     from "./items.js"
import      db        from "./db_idb.js"
import      jxml      from "./jxml.js"
import      hoard     from "./hoard.js"

import { configure } from 'safe-stable-stringify'
const stringify = configure({})

feeds.cached={}

feeds.precache=async function() // faster then individual cache, db is fecking slow
{
	for(let feed of await db.list("feeds"))
	{
		feeds.cache(feed.url,feed)
	}
}

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
	let old=await feeds.cache(it.url) // await db.get("feeds",it.url)

	let feed={} // merge old and new here
	if(old)
	{
		for(let n in old ){ feed[n]=old[n] }
	}
	for(let n in it ){ feed[n]=it[n] }
	// maintain defaults
	feed.date=feed.date || new Date()
	feed.fails=feed.fails || 0
	
	if( stringify(old) != stringify(feed) ) // something changed
	{
		await feeds.set(feed)
	}
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
	console.log("starting feeds fetch_all")

	let rets=[]
	let list=await db.list("feeds")
	
	let url=window.location.hash.substring(1)
	if(url && url.length>10) // only fetch this feed?
	{
		for(let feed of list )
		{
			if(feed.url==url)
			{
				list=[feed]
				break
			}
		}
	}
	
	feeds.list_length=list.length
	feeds.list_length_count=0
	
	// try and get popular feeds first
	list.sort(function(a,b){
		return ( b.items_date || 0 ) - ( a.items_date || 0 )
	})
	
	let topitem=(await db.list("items",{},"date","prev",1))[0] ; topitem=topitem && topitem.uuid

	for(let feed of list )
	{
		await feeds.cache(feed.url,feed)
		await feeds.fetch(feed)

		if(items.add_count>0)
		{
			if( document.getElementById('arss_list_read').parentElement.scrollTop==0 ) // at top, so refresh
			{
				let testitem=(await db.list("items",{},"date","prev",1))[0] ; testitem=testitem && testitem.uuid
				if( testitem != topitem )
				{
					let parent=document.getElementById('arss_list_read')
					let id=parent && parent.children && parent.children[0] && parent.children[0].id
					if(id)
					{
						await items.mark_readed(id,0) // mark top item as unread ( before refresh, so it will stay near the top )
					}

					display.items(0)
					topitem=(await db.list("items",{},"date","prev",1))[0] ; topitem=topitem && topitem.uuid
				}
			}
		}
	}

	if(items.add_count>0)
	{
		display.status("+"+items.add_count)
	}
	else
	{
		display.status("")
	}

// preload items in background
	let items_list=await db.list("items",{},"date","prev")
	for(let item of items_list )
	{
		if(item.link)
		{
			await hoard.first_text(item.link)
		}
	}

}

feeds.fetch=async function(feed)
{
	display.status(feeds.list_length_count +"/"+ feeds.list_length + " +"+items.add_count)
	if(!feed.off) // check if the feed is turned off
	{
	try{
		
		console.log("fetching feed",feed)
		let before_count=items.add_count
		
		let txt=await hoard.fetch_text(feed.url)
console.log(txt)

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
//				await hoard.first_text(item.link)
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
//				await hoard.first_text(item.link)
			}
			feed.fails=0
		}
		else
		{
			feed.fails=(feed.fails||0)+1
		}

		await db.set("feeds",feed.url,feed) // save updated feed info

		let count=items.add_count-before_count
		if(count>0)
		{
			console.log("added "+count+" new items")
		}
	}catch(e){console.error(e)}
	}

	feeds.list_length_count++
}

