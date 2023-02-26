
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
		for( n in old ){ item[n]=old[n] }
	}
	for( n in it ){ item[n]=it[n] }
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

items.test=async function()
{
	let aa=[]
	
	let frameurl=undefined
	
/*
	if(window.location.hash!="")
	{
		frameurl=window.location.hash.substring(1)
		document.getElementById('arss_page').setAttribute('src', frameurl)
	}
*/

	let list=await db.list("items",{},"date","prev")
	let count=0
	for(item of list)
	{
		count++
		if( count>1000 ){ break }
//		console.log(item)
/*
		if(!frameurl){
			frameurl=item["/link"]
			window.location.hash="#"+frameurl
			document.getElementById('arss_page').setAttribute('src', frameurl)
		}
*/
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
	
	document.getElementById('arss_list').innerHTML = aa.join("")
	
	await items.test_display()
}
items.test_display=async function()
{
//	const maxframes=5	// used for caching content
	
	let parent=document.getElementById('arss_list')
	let list=parent.children
	
/*

	let frames=[]
	frames[0]=document.getElementById('arss_page')
	let frame_last=frames[0]
	let frame_show=function(frame)
	{
		if(frame_last==frame) { return }
//		if(frame_last) { frame_last.style.display="none" }
		frame_last=frame
		frame.style.display="block"		
		frame.parentElement.append(frame)
	}
	let frame_count=0
	let frame_new=function(url)
	{
console.log("NEW",url)
		if(frames.length>maxframes) // maximum cache
		{
			let frame=frames.pop()
			frame.remove()
		}
		frame_count=frame_count+1
		let clone = frames[0].cloneNode();
		clone.style.display="block"
		clone.id="arss_page"+frame_count
		clone.name="arss_page"+frame_count
		clone.src=url
		frames[0].parentElement.prepend(clone)
		frames.unshift(clone)
		return clone
	}
	let frame_find=function(url)
	{
		for(let idx=0;idx<frames.length;idx++)
		{
			let frame=frames[idx]
			if(frame.src==url)
			{
				return frame
			}
		}
	}
	let frame_bump=function(url)
	{
		for(let idx=0;idx<frames.length;idx++)
		{
			let frame=frames[idx]
			if(frame.src==url)
			{
				frames.splice(idx,1) // remove
				frames.unshift(frame) // place at front
				return frame
			}
		}
	}
	let frame_url=function(url)
	{
		let frame=frame_bump(url) || frame_new(url)
		frame_show(frame)
	}
*/
	
	let display_last=null
	let display=async function(e)
	{
		if(display_last==e) { return }
		if(display_last) { display_last.classList.remove("active") }
		display_last=e
		e.classList.add("active")
//		frame_url(e.id)

//		document.getElementById('arss_page').src=e.id
		let html=await hoard.fetch_text(e.id)
		document.getElementById('arss_page').src="data:text/html,"+ encodeURIComponent(html)


		// auto cache next/prev pages

		let el=e.nextSibling
		while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.nextSibling }
		if(el) { if(!frame_find(el.id)) { hoard.fetch_text(el.id) } }
		el=e.previousSibling
		while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.previousSibling }
		if(el) { if(!frame_find(el.id)) { hoard.fetch_text(el.id)} }
		

		
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
	for(e of list){e.onmouseover=mouseover}

	parent.onscroll = function(ev)
	{
		let el=document.elementFromPoint(lastx,lasty)
		while(el && !el.classList.contains("arss_item") ){ el = el.parentElement }
		if(el){display(el)}
	}


	display(list[0])
}