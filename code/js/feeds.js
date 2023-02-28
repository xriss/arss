
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
	items.add_count=0
	
	for(let feed of list )
	{
		rets.push(feeds.fetch(feed))
	}
	await Promise.all(rets)

	display.status("")
}

feeds.fetch=async function(feed)
{
if(feed.fails<8) // giveup after a few attempts
{
	
	try{
		let txt=await hoard.fetch_text(feed.url)

		let rss
		try{ rss=jxml.parse_xml(txt,jxml.xmap.rss) }
		catch(e){}

		let atom
		try{ atom=jxml.parse_xml(txt,jxml.xmap.atom) }
		catch(e){}

		if(rss && rss["/rss/channel/item"])
		{
			if(rss["/rss/channel/title"])
			{
				feed.title=rss["/rss/channel/title"]
			}
			feed.items_count=0
			for(let item of rss["/rss/channel/item"] )
			{
				feed.items_count++
				items.prepare(item,feed)
				await items.add(item)
			}
			feed.fails=0
		}
		else
		if(atom && atom["/feed/entry"])
		{
			if(atom["/feed/title"])
			{
				feed.title=atom["/feed/title"]
			}
			feed.items_count=0
			for(let item of atom["/feed/entry"] )
			{
				feed.items_count++
				items.prepare(item,feed)
				await items.add(item)
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


feeds.display=async function(showidx)
{
	let aa=[]
	
	let feeds=await db.list("feeds")
	let now=(new Date()).getTime()

	let dofeed=function(feed)
	{
		let fails=""
		if( feed.fails||0  > 0 )
		{
			fails = "Fails : "+display.sanistr(feed.fails)
		}
		const cleanlink = display.sanistr(feed.url)
		const cleantitle = display.sanistr(feed.title)

		aa.push(`
<div class="arss_feed" id="${cleanlink}">
<div>${cleantitle}</div>
<input type="text"  value="${cleanlink}"/>
<div>${fails}</div>
</div>
`)
	}

	for(let feed of feeds)
	{
		if(feed.fails<8)
		{
			dofeed(feed)
		}
	}
	aa.push(`
<div>
The following feeds have failed repeatedly and have been given up on.
</div>
`)
	for(let feed of feeds)
	{
		if(feed.fails>=8)
		{
			dofeed(feed)
		}
	}
	
	document.getElementById('arss_list_feed').innerHTML = aa.join("")	

	let parent=document.getElementById('arss_list_feed')
	
/*
	let mouseover=function(ev)
	{
		lastx=ev.clientX
		lasty=ev.clientY
		
		let el=ev.target
		while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.parentElement }
		if(el){display(el)}
	}
	for(let e of list){e.onmouseover=mouseover}
*/

}

