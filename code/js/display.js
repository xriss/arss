/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

const display=exports

const gist = require('./gist.js')
const feeds = require('./feeds.js')
const items = require('./items.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const hoard = require('./hoard.js')

const sanihtml = require('sanitize-html');

display.element=function(html)
{
	let e = document.createElement("div")
	e.innerHTML=html
	return e.firstElementChild
}

display.sanistr=function(s)
{
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


display.all=function()
{
	display.bar()
	display.list()
	display.drag()
	display.opts()
	display.page("read")

	window.onhashchange = display.hash_change
	display.hash_change()

}

display.status=function(html)
{
	let status=document.getElementById('arss_butt_status')
	status.innerHTML=html||"."
}

display.bar=function()
{
	let parent=document.getElementById('arss_bar')
	parent.innerHTML=""

	parent.append(display.element(`
<div class="arss_butt" id="arss_butt_drag">*</div>
`))

	parent.append(display.element(`
<div class="arss_butt" id="arss_butt_read">READ</div>
`))

	parent.append(display.element(`
<div class="arss_butt" id="arss_butt_feed">FEED</div>
`))

	parent.append(display.element(`
<div class="arss_butt" id="arss_butt_opts">OPTS</div>
`))

	parent.append(display.element(`
<div class="arss_butt" id="arss_butt_status">.</div>
`))

	document.getElementById("arss_butt_read").onclick = function(){display.hash("#READ")}
	document.getElementById("arss_butt_feed").onclick = function(){display.hash("#FEED")}
	document.getElementById("arss_butt_opts").onclick = function(){display.hash("#OPTS")}

}

display.opts=function()
{
	let parent=document.getElementById('arss_list_opts')
	parent.innerHTML=""

if(gist.url)
{
	parent.append(display.element(`
<div class="arss_info_butt_info">

You are are currently connected to <a target="_blank" 
href="${gist.url}" >${gist.id}</a> If you wish to disconnect click the 
token button and enter garbage.

</div>
`))
}
else
{
	parent.append(display.element(`
<div class="arss_info_butt_warn">

You are are not currently connected to a github gist and I would advise 
that you connect before clicking any other buttons. If you do not 
connect then things will still work ( import an OPML and read away ) 
but you must be aware that any changes you make can be lost in time, 
like tears in rain.

</div>
`))
}

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_gist_token">Set token to connect to github gists for persistant storage.</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt_info">

This requires a github token with read / write access to your gists. 
You can create one at <a target="_blank" 
href="https://github.com/settings/tokens/new?scopes=gist">CREATE 
TOKEN</a>. Make sure you copy it into your clipboard then click the 
button above to input it and refresh the page. A private gist will be 
created/reconnected and then used to store all your ARSS options. This 
can also be used to "log you into your ARSS account" on a new browser.

</div>
`))
/*
	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_gist_disconnect">Disconnect from github gists.</div>
`))
*/
	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_add_feed">Add a new RSS feed.</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_empty_cache">Reload all cache.</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_empty_items">Reload all items <p>Old items will be lost.</p></div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_empty_feeds">Reload all feeds <p>Old items and feeds will be lost.</p></div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_load_opml">Import feeds from an OPML file.<input id="arss_info_butt_load_opml_file" type="file"/></div>
`))

	parent.append(display.element(`
<a class="arss_info_butt" id="arss_info_butt_save_opml">Export all feeds as an OPML file.</a>
`))

	document.getElementById("arss_info_butt_add_feed").onclick = display.add_feed

	document.getElementById("arss_info_butt_load_opml_file").onchange = display.load_opml
	document.getElementById("arss_info_butt_save_opml").onclick = display.save_opml
	
	document.getElementById("arss_info_butt_gist_token").onclick = display.gist_token
//	document.getElementById("arss_info_butt_gist_disconnect").onclick = display.gist_disconnect

	document.getElementById("arss_info_butt_empty_cache").onclick = display.empty_cache
	document.getElementById("arss_info_butt_empty_items").onclick = display.empty_items
	document.getElementById("arss_info_butt_empty_feeds").onclick = display.empty_feeds

	
	

}

display.list=function()
{
	let parent=document.getElementById('arss_list')
	parent.innerHTML=""

	parent.append(display.element(`
<div class="arss_list_read" id="arss_list_read"></div>
`))

	parent.append(display.element(`
<div class="arss_list_feed" id="arss_list_feed"></div>
`))

	parent.append(display.element(`
<div class="arss_list_opts" id="arss_list_opts"></div>
`))

}

display.drag=function()
{
	let parent=document.getElementById('arss_bar')
	let el=document.getElementById('arss_butt_drag')
	
	let width=0;

	el.onmousedown=function(e)
	{
		e.preventDefault()

		width=document.body.clientWidth
		
		let full=display.element(`
<div style=' cursor:move; background:transparent; position:absolute; left:0px; right:0px; top:0px; bottom:0px; '></div>
`)
		document.body.append(full)

		full.onmouseup = function(e)
		{
			full.onmouseup = null
			full.onmousemove = null
			full.remove()
		}

		full.onmousemove = function(e)
		{
			e.preventDefault()
			
			let f=Math.floor(100*(e.clientX+el.clientWidth)/width)
			if(f<10){f=10}
			if(f>90){f=90}
			document.getElementById("arss_bar").style.left=f+"%"
			document.getElementById("arss_list").style.left=f+"%"
			document.getElementById("arss_page").style.width=f+"%"
		}
	}
}

display.hash_change=async function(e)
{
	display.hash(window.location.hash)
	let url=window.location.hash.substring(1)
	let feed=await feeds.cache(url)
	let title=url
	if(feed && feed.title) { title=feed.title }
	window.document.title="ARSS on "+title
}

display.hash=function(hash)
{
	if( hash )
	{
		if( window.location.hash != hash ) { window.location.hash=hash }
		hash=hash.toUpperCase()
		if(hash=="#READ") { display.page("read") } else
		if(hash=="#FEED") { display.page("feed") } else
		if(hash=="#OPTS") { display.page("opts") } else
		display.page("read") // any other hash is a read filter
		display.items(0)
	}
	return window.location.hash
}

display.reload=async function()
{
	if(db.handle)
	{
		await db.close()
	}
	window.location.reload()
}

display.page=function(name)
{
	if(name=="read")
	{
		document.getElementById("arss_list_read").style.display="inline-block"
		document.getElementById("arss_list_feed").style.display="none"
		document.getElementById("arss_list_opts").style.display="none"
	}
	else
	if(name=="feed")
	{
		document.getElementById("arss_list_read").style.display="none"
		document.getElementById("arss_list_feed").style.display="inline-block"
		document.getElementById("arss_list_opts").style.display="none"
		display.feeds()
	}
	else
	if(name=="opts")
	{
		document.getElementById("arss_list_read").style.display="none"
		document.getElementById("arss_list_feed").style.display="none"
		document.getElementById("arss_list_opts").style.display="inline-block"
//		opts.display()
	}
}


display.load_opml=async function()
{
	let input=document.getElementById("arss_info_butt_load_opml_file")

	let read=function(file){
		return new Promise(
			function(resolve, reject)
			{
				let fp = new FileReader();  
				fp.onload = function()
				{
					resolve(fp.result )
				}
				fp.onerror = reject
				fp.readAsText(file)
			}
		)
	}
	let data=await read(input.files[0])

	await feeds.add_opml(data)
	
	await arss.save_gist()

	display.reload()
}

display.save_opml=async function(e)
{
	let j={
 "/opml/head/title": "ARSS Reader",
 "/opml@version": "1.0",
 "/opml/body/outline": [],
}

	let out=j["/opml/body/outline"]
	
	let feeds=await db.list("feeds")
	let now=(new Date()).getTime()
	
	for(let feed of feeds)
	{
		if(!feed.off) // disabled feeds are not exported
		{
			let it={}
			it["@type"]="rss"
			it["@xmlUrl"]=feed.url
			it["@text"]=feed.title
			it["@title"]=feed.title
			out.push(it)
		}
	}
	let x=jxml.build_xml(j)
    
	let link = document.createElement('a')
	let data = "text/xml;charset=utf-8," + encodeURIComponent(x)
	link.setAttribute("href", "data:"+data)
	link.setAttribute("download", "arss_reader.opml")
	link.click();
}



display.gist_token=async function(e)
{
	gist_token=window.prompt("Github gist token for persistent storage.","");
	if(gist_token)
	{
		await db.set("keyval","gist_token",gist_token)
		display.reload()
	}
}

display.gist_disconnect=async function(e)
{
	await db.set("keyval","gist_token","")
	display.reload()
}

display.empty_cache=async function(e)
{
	await db.clear("hoard")
	display.reload()
}

display.empty_items=async function(e)
{
	await db.clear("items")
	await db.clear("hoard")
	display.reload()
}

display.empty_feeds=async function(e)
{
	await db.clear("feeds")
	await db.clear("items")
	await db.clear("hoard")
	display.reload()
}

display.add_feed=async function(e)
{
	feed_url=window.prompt("URL of feed to add.","");
	if(feed_url)
	{
		let feed={}
		feed.url=feed_url
		await feeds.add(feed)
		display.hash("#"+feed_url)
		display.reload()
	}
}



display.feeds=async function()
{
	let aa=[]
	
	let feeds=await db.list("feeds")
	let now=(new Date()).getTime()
	
	let tags={}
	let parse_tags=function(s)
	{
		s=s||""
		let aa=s.split("#")
		for(let a of aa)
		{
			let t=a.trim()
			if(t!="")
			{
				tags[t.toUpperCase()]=true
			}
		}
	}

	for(let feed of feeds)
	{
		parse_tags(feed.tags)
		
		let fails_style="display:none;"
		let fails=display.sanistr(feed.fails)
		if( ( (feed.fails||0)  > 0 ) || (feed.off) )
		{
			fails_style="display:block;"
		}
		const cleanlink = display.sanistr(feed.url)
		const cleantags = display.sanistr(feed.tags||"")
		const cleantitle = display.sanistr(feed.title)
		let checked="checked"
		if(feed.off){checked=""}

		let js_checked="checked"
		if(!feed.js){js_checked=""}

		let date="never"
		if(feed.items_date)
		{
			try{
				date=(new Date(feed.items_date)).toISOString().split("T")
				date=date[0]+" "+date[1].substring(0,5)
			}catch(e){console.error(e)}
		}
		let count="none"
		if("number" == typeof feed.items_count)
		{
			count=feed.items_count
		}
		
		aa.push(`
<div class="arss_feed" id="${cleanlink}">
<div><input class="arss_feed_checkbox" type="checkbox" ${checked} /><a class="arss_feed_select" >${cleantitle}</a></div>
<input class="arss_feed_url" type="text" value="${cleanlink}"/>
<div class="arss_feed_tags">TAGS:<input class="arss_feed_tags_input" type="text" value="${cleantags}"/></div>
<div><input class="arss_feed_js_checkbox" type="checkbox" ${js_checked} />Enable javascript in preview.</div>
<div class="arss_feed_date">Updated on ${date}</div>
<div class="arss_deef_count">Number of items ${count}</div>
<div class="arss_feed_fail" style="${fails_style}">Fails : ${fails} <a class='arss_feed_delete'>DELETE</a></div>
</div>
`)
	}
	
	{
		let ss=[]
		for(let tag in tags)
		{
			ss.push((`
				<a href="#${tag}">${tag}</a>
			`).trim())
		}
		aa.unshift( `<div class="arss_info"> `+ss.join(" ")+" </div>" ) // stick tag list at top
	}
	
	document.getElementById('arss_list_feed').innerHTML = aa.join("")	

	for(let e of document.getElementsByClassName("arss_feed_checkbox") )
	{
		e.onchange=display.feeds_checkbox_changed
	}

	for(let e of document.getElementsByClassName("arss_feed_js_checkbox") )
	{
		e.onchange=display.feeds_js_checkbox_changed
	}

	for(let e of document.getElementsByClassName("arss_feed_url") )
	{
		e.onchange=display.feeds_url_changed
	}

	for(let e of document.getElementsByClassName("arss_feed_tags_input") )
	{
		e.onchange=display.feeds_tags_changed
	}

	for(let e of document.getElementsByClassName("arss_feed_delete") )
	{
		e.onclick=display.feeds_delete
	}
	
	for(let e of document.getElementsByClassName("arss_feed_select") )
	{
		e.onclick=display.feeds_select
	}
	

}
display.div_child=function(e,name)
{
	if(e)
	{
		for(let it of e.children)
		{
			if( it.classList.contains(name) )
			{
				return it
			}
		}
	}
}
display.div_lookup=function(e,name)
{
	while(e && !e.classList.contains(name) ){ e = e.parentElement }
	return e
}


display.feeds_select=async function(e)
{
	let div_feed=display.div_lookup(this,"arss_feed")
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required

	display.hash("#"+url) // read only this feed
}

display.feeds_delete=async function(e)
{
	let div_feed=display.div_lookup(this,"arss_feed")
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required

	await db.delete("feeds",url)

	await arss.save_gist()

	div_feed.style="display:none;"
}

display.feeds_url_changed=async function(e)
{
	let div_feed=display.div_lookup(this,"arss_feed")
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required
	
	feed.url=this.value // set new url (which moves the feed)
	
	await feeds.set(feed)
	await db.delete("feeds",url)
	await arss.save_gist()
}

display.feeds_tags_changed=async function(e)
{
	let div_feed=display.div_lookup(this,"arss_feed")
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required
	
	let tags=this.value||""
	tags=tags.trim()
	tags=tags.toUpperCase()

	feed.tags=this.value // set new tags
	
	await feeds.set(feed)
	await arss.save_gist()
}

display.feeds_checkbox_changed=async function(e)
{
	let div_feed=display.div_lookup(this,"arss_feed")
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required
	
	feed.off=!this.checked // set off status
	
	await feeds.set(feed)
	
	for(let it of div_feed.children)
	{
		if( it.classList.contains("arss_feed_fail") )
		{
			if( ( (feed.fails||0)  > 0 ) || (feed.off) )
			{
				it.style="display:block;"
			}
			else
			{
				it.style="display:none;"
			}
		}
	}
	await arss.save_gist()
}

display.feeds_js_checkbox_changed=async function(e)
{
	let div_feed=display.div_lookup(this,"arss_feed")
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required
	
	feed.js=this.checked // set java script enabled status for feed
	
	await feeds.set(feed)
	
	await arss.save_gist()
}

display.items=async function(showidx)
{
	items.add_count=0
	document.getElementById('arss_list_read').innerHTML = ""
//	display.status("")
	
	let aa=[]
	
	let hash=display.hash()
	let filter={}
	if( hash=="#READ" || hash=="#FEED" || hash=="#OPTS" || hash=="#" || hash=="" )
	{
		filter={} // no filter
	}
	else
	{
		let isfeed=await db.get("feeds",hash.substring(1))
		if(isfeed)
		{
			filter={feed:hash.substring(1)} // only this feed
		}
		else // is a tag
		{
			filter={feed_tags:hash} // only this feed
		}
	}
	
	let items_list=await db.list("items",filter,"date","prev")
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
		const cleantitle = display.sanistr(item.title||item.link)
		const cleanfeed = display.sanistr(item.feed)
		const cleanfeedtitle = display.sanistr(item.feed_title)
		const cleanhtml = sanihtml(item.html||"",allowtags)
		let date=item.date.toISOString().split("T")
		date=date[0]+" "+date[1].substring(0,5)

		aa.push(`
<div class="arss_item" id="${cleanlink}">
<div class="arss_item_link"><a href="${cleanlink}" target="_blank" ">${cleantitle}</a></div>
<div class="arss_item_date">${date}</div>
<div class="arss_item_feed" url="${cleanfeed}" >${cleanfeedtitle}</div>
<div>${cleanhtml}</div>
</div>
`)
	}
	if(aa.length==0)
	{
		aa.push(`
<div class="arss_info" >No items to display.</div>
`)
	}
	document.getElementById('arss_list_read').innerHTML = aa.join("")

	let parent=document.getElementById('arss_list_read')
	
	let display_item_time=Date.now()
	let display_item_next=null
	let display_item_safe=async function(url)
	{
		if(display_item_next) // just update the next url we are waiting to display
		{
			display_item_next=url
			return
		}
		
		let time=Date.now()
		if( (time-display_item_time)  < 1000 ) // do not spam
		{
			display_item_next=url // flag and remember
			await new Promise(resolve=>setTimeout(resolve, 1000 ))
			url=display_item_next // may have changed
			display_item_next=null // remove flag
		}
		display_item_time=time
		
		if(url)
		{
			let item=await items.cache(url)
			let feed
			if(item && item.feed){feed=await feeds.cache(item.feed)}
			
			let html=await hoard.fetch_text(url)
			if(html.length>(256*1024)) // this is some bullshit
			{
				html="FILE TOO LARGE"
			}

// maybe squirt a base tag into the head so relative urls will still work?
			if(html)
			{
				let aa=html.split("<head>")
				if(aa.length==2)
				{
					let parts = new URL(".",url)
					let baseurl=parts.origin+parts.pathname
					html=aa.join(`<head><base href="${baseurl}" target="_blank" /><meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />`)
				}
			}

			// remove + change + add so we do not create page history
			let iframe = document.getElementById('arss_page')
			let parent = iframe.parentNode
			iframe.remove()
			iframe.srcdoc=""
			if(feed&&feed.js) // enable js
			{
				iframe.sandbox="allow-popups allow-scripts"
			}
			else
			{
				iframe.sandbox="allow-popups"
			}
			iframe.srcdoc=html
			parent.append(iframe)
			
		}
	}
	let display_item_last=null
	let display_item=async function(e)
	{
		if(display_item_last==e) { return }
		if(display_item_last) { display_item_last.classList.remove("active") }
		display_item_last=e
		e.classList.add("active")
		display_item_safe(e.id)
/*
		if(!display_item_next) // if not spamming
		{
			// auto pre cache next/prev pages
			let el=e.nextSibling
			while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.nextSibling }
			if(el) { hoard.fetch_text(el.id) }
			el=e.previousSibling
			while(el && (!el.classList || !el.classList.contains("arss_item")) ){ el = el.previousSibling }
			if(el) { hoard.fetch_text(el.id) }
		}
*/
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
				display.items(0)
			}
		}
	}

	for(let e of document.getElementsByClassName("arss_item_date") )
	{
		e.onclick=display.items_feed_select
	}
	for(let e of document.getElementsByClassName("arss_item_feed") )
	{
		e.onclick=display.items_feed_select
	}


	if("number"==typeof showidx){ display_item(parent.children[showidx]) }
}

display.items_feed_select=async function(e)
{
	let div_item=display.div_lookup(this,"arss_item")
	if(!div_item){ return } // required

	let div_feed=display.div_child(div_item,"arss_item_feed")
	if(!div_feed){ return } // required
	
	console.log(div_feed)
	let url=div_feed.getAttribute("url")
	console.log(url)

	let feed=await db.get("feeds",url)
	if(!feed){ return } // required

	display.hash("#"+url) // read only this feed
}

