
const items=exports


const sanihtml = require('sanitize-html');


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')


items.prepare=function(it,feed)
{
	if(feed)
	{
		it.feed=feed.url
	}
	let uuid=it["/guid"] || it["/link"] || it["/title"] || it["/pubdate"] || ""
	it.uuid=it.feed+"^"+uuid
	it.date=new Date(it["/pubdate"])
}

items.add=async function(it)
{
	let old=await db.get("items",it.uuid)
	let item={}
	if(old)
	{
		for(let n in old ){ item[n]=old[n] }
	}
	for(let n in it ){ item[n]=it[n] }
	if(old)
	{
		item.date=old.date||item.date
	}
	await db.set("items",it.uuid,it)
}



let sanistr=function(s) {
	s=""+s
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#x27;',
		"/": '&#x2F;',
	};
	return s.replace(/[&<>"'/]/ig, (match)=>(map[match]));
}

items.test=async function(showidx)
{
	let aa=[]
	
	let list=await db.list("items",{},"date","prev")
	let count=0
	let now=(new Date()).getTime()
	for(let item of list)
	{
		count++
		if( count>1000 ){ break }
		if( item.date.getTime() > now ){ continue }

		const notags={allowedTags: [],allowedAttributes: {}}
		const allowtags={ allowedTags:[ "img" , "p" ] }
		const cleanlink = sanistr(item["/link"])
		const cleantitle = sanistr(item["/title"])
		const cleanhtml = sanihtml(item["/description"]||"",allowtags)
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

	items.test_display(showidx)
}

items.test_display=function(showidx)
{
	let parent=document.getElementById('arss_list_read')
	let list=parent.children
	
	let display_last=null
	let display=async function(e)
	{
		if(display_last==e) { return }
		if(display_last) { display_last.classList.remove("active") }
		display_last=e
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
		if(el){display(el)}
	}
	for(let e of list){e.onmouseover=mouseover}

	parent.onscroll = function(ev)
	{
		let el=document.elementFromPoint(lastx,lasty)
		while(el && !el.classList.contains("arss_item") ){ el = el.parentElement }
		if(el){display(el)}
	}

	if("number"==typeof showidx){ display(list[showidx]) }
}

