
const items=exports


const sanihtml = require('sanitize-html');


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const display = require('./display.js')


items.prepare=function(item,feed)
{
	let atom=item.atom||{}
	let rss=item.rss||{}
	
	if(feed)
	{
		item.feed=feed.url
		item.feed_title=feed.title
	}
	
	let uuid=rss["/guid"] || atom["/id"] || rss["/link"] || rss["/title"] || rss["/pubdate"] || ""
	item.uuid=item.feed+"^"+uuid

	if(!item.date) // do not change date, just set it once
	{
		if(rss["/pubdate"])
		{
			item.date=new Date(rss["/pubdate"])
		}
		else
		if(atom["/published"]) // prefer published
		{
			item.date=new Date(atom["/published"])
		}
		else
		if(atom["/updated"]) // but sometimes we do not have it
		{
			item.date=new Date(atom["/updated"])
		}
	}
	item.date=item.date||new Date() // make sure we have a date

	if(rss["/link"])
	{
		item.link=rss["/link"]
	}
	else
	if(atom["/link"])
	{
		item.link=atom["/link"][0]["@href"]
		for(let link of atom["/link"])
		{
			if( link["@rel"]=="alternate" )
			{
				item.link=link["@href"]
			}
		}
	}

	item.title=item.title||""
	if(rss["/title"])
	{
		item.title=rss["/title"]
	}
	else
	if(atom["/title"])
	{
		item.title=atom["/title"]
	}

	item.html=item.html||""
	if(rss["/description"])
	{
		item.html=rss["/description"]
	}
	else
	if(atom["/content"])
	{
		item.html=atom["/content"]
	}

	return item
}

items.add_count=0
items.add=async function(it)
{
	let old=await db.get("items",it.uuid)
	let item={}
	if(old)
	{
		for(let n in old ){ item[n]=old[n] }
	}
	else
	{
		items.add_count++
	}
	for(let n in it ){ item[n]=it[n] }
	if(old)
	{
		item.date=old.date||item.date
	}
	await db.set("items",it.uuid,it)
}



items.display=async function(showidx)
{
	items.add_count=0
	document.getElementById('arss_list_read').innerHTML = ""
	display.status("")
	
	let aa=[]
	
	let items_list=await db.list("items",{},"date","prev")
	let count=0
	let now=(new Date()).getTime()
	for(let item of items_list)
	{
		count++
		if( count>1000 ){ break }
		if( item.date.getTime() > now+(10*60*1000) ){ continue } // ignore far future dates

		const notags={allowedTags: [],allowedAttributes: {}}
		const allowtags={ allowedTags:[ "img" , "p" ] }
		const cleanlink = display.sanistr(item.link)
		const cleantitle = display.sanistr(item.title)
		const cleanfeed = display.sanistr(item.feed_title)
		const cleanhtml = sanihtml(item.html||"",allowtags)
		let date=item.date.toISOString().split("T")
		date=date[0]+" "+date[1].substring(0,5)

		aa.push(`
<div class="arss_item" id="${cleanlink}">
<div><a href="${cleanlink}" target="_blank" ">${cleantitle}</a></div>
<div class="arss_date">${date}</div>
<div class="arss_item_feed">${cleanfeed}</div>
<div>${cleanhtml}</div>
</div>
`)
	}
	
	document.getElementById('arss_list_read').innerHTML = aa.join("")	

	let parent=document.getElementById('arss_list_read')
	
	let display_item_last=null
	let display_item=async function(e)
	{
		if(display_item_last==e) { return }
		if(display_item_last) { display_item_last.classList.remove("active") }
		display_item_last=e
		e.classList.add("active")

		let html=await hoard.fetch_text(e.id)
// maybe squirt a base tag into the head so relative urls will still work?
		document.getElementById('arss_page').srcdoc=html



		// auto cache next/prev pages
		let el=e.nextSibling
		while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.nextSibling }
		if(el) { hoard.fetch_text(el.id) }
		el=e.previousSibling
		while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.previousSibling }
		if(el) { hoard.fetch_text(el.id) }
	}

	let top=function(e)
	{
		if(!e){return 0}
		var rect = e.getBoundingClientRect()
		var win = e.ownerDocument.defaultView
		return rect.top + win.pageYOffset
	}
	
	let lastx=0
	let lasty=0
	let mouseover=function(ev)
	{
		lastx=ev.clientX
		lasty=ev.clientY
		
		let el=ev.target
		while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.parentElement }
		if(el){display_item(el)}
	}
	for(let e of parent.children){e.onmouseover=mouseover}

	parent.parentElement.onscroll = function(ev)
	{
		let el=document.elementFromPoint(lastx,lasty)
		while(el && !el.classList.contains("arss_item") ){ el = el.parentElement }
		if(el){display_item(el)}
		if(parent.parentElement.scrollTop==0) // hit top, maybe refresh
		{
			if(items.add_count>0)
			{
				items.display()
			}
		}
	}

	if("number"==typeof showidx){ display_item(parent.children[showidx]) }
}

