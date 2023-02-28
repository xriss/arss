
const items=exports


const sanihtml = require('sanitize-html');


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const display = require('./display.js')


items.prepare=function(item,feed)
{
	if(feed)
	{
		item.feed=feed.url
	}
	let uuid=item["/guid"] || item["/id"] || item["/link"] || item["/title"] || item["/pubdate"] || ""
	item.uuid=item.feed+"^"+uuid
	if(item["/pubdate"])
	{
		item.date=new Date(item["/pubdate"])
	}
	if(item["/published"])
	{
		item.date=new Date(item["/published"])
	}
	item.link=item["/link"]
	item.title=item["/title"]
	item.html=item["/description"]||item["/content"]

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
	let aa=[]
	
	let items=await db.list("items",{},"date","prev")
	let count=0
	let now=(new Date()).getTime()
	for(let item of items)
	{
		count++
		if( count>1000 ){ break }
		if( item.date.getTime() > now ){ continue }

		const notags={allowedTags: [],allowedAttributes: {}}
		const allowtags={ allowedTags:[ "img" , "p" ] }
		const cleanlink = display.sanistr(item.link)
		const cleantitle = display.sanistr(item.title)
		const cleanhtml = sanihtml(item.html||"",allowtags)
		let date=item.date.toISOString().split("T")
		date=date[0]+" "+date[1].substring(0,5)

		aa.push(`
<div class="arss_item" id="${cleanlink}">
<div><a href="${cleanlink}" target="_blank" ">${cleantitle}</a></div>
<div class="arss_date">${date}</div>
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
		document.getElementById('arss_page').src="data:text/html,"+ encodeURIComponent(html)

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
	}

	if("number"==typeof showidx){ display_item(parent.children[showidx]) }
}

