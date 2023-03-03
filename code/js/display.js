
const display=exports

const gist = require('./gist.js')
const feeds = require('./feeds.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')


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

	document.getElementById("arss_butt_read").onclick = function(){display.hash("#read")}
	document.getElementById("arss_butt_feed").onclick = function(){display.hash("#feed")}
	document.getElementById("arss_butt_opts").onclick = function(){display.hash("#opts")}

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
that you connect before clicking any other buttons which may cause loss 
of data.

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
<div class="arss_info_butt" id="arss_info_butt_empty_items">Reload all items (old items may be lost).</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_empty_feeds">Reload all feeds (old items/feeds will be lost).</div>
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

display.hash=function(hash)
{
	if( hash )
	{
		window.location.hash=hash
		if(hash=="#read") { display.page("read") } else
		if(hash=="#feed") { display.page("feed") } else
		if(hash=="#opts") { display.page("opts") } else
		display.page("read")
	}
	return window.location.hash
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

	window.location.reload()
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
		window.location.reload()
	}
}

display.gist_disconnect=async function(e)
{
	await db.set("keyval","gist_token","")
	window.location.reload()
}

display.empty_cache=async function(e)
{
	await db.clear("hoard")
	window.location.reload()
}

display.empty_items=async function(e)
{
	await db.clear("items")
	await db.clear("hoard")
	window.location.reload()
}

display.empty_feeds=async function(e)
{
	await db.clear("feeds")
	await db.clear("items")
	await db.clear("hoard")
	window.location.reload()
}

display.add_feed=async function(e)
{
	feed_url=window.prompt("URL of feed to add.","");
	if(feed_url)
	{
		let feed={}
		feed.url=feed_url
		await feeds.add(feed)
		window.location.reload()
	}
}



display.feeds=async function()
{
	let aa=[]
	
	let feeds=await db.list("feeds")
	let now=(new Date()).getTime()

	for(let feed of feeds)
	{
		let fails_style="display:none;"
		let fails=display.sanistr(feed.fails)
		if( ( (feed.fails||0)  > 0 ) || (feed.off) )
		{
			fails_style="display:block;"
		}
		const cleanlink = display.sanistr(feed.url)
		const cleantitle = display.sanistr(feed.title)
		let checked="checked"
		if(feed.off){checked=""}
		aa.push(`
<div class="arss_feed" id="${cleanlink}">
<div><input class="arss_feed_checkbox" type="checkbox" ${checked} /><a class="arss_feed_select" >${cleantitle}</a></div>
<input class="arss_feed_url" type="text" value="${cleanlink}"/>
<div class="arss_feed_fail" style="${fails_style}">Fails : ${fails} <a class='arss_feed_delete'>DELETE</a></div>
</div>
`)
	}
	
	

	document.getElementById('arss_list_feed').innerHTML = aa.join("")	

	for(let e of document.getElementsByClassName("arss_feed_checkbox") )
	{
		e.onchange=display.feeds_checkbox_changed
	}

	for(let e of document.getElementsByClassName("arss_feed_url") )
	{
		e.onchange=display.feeds_url_changed
	}

	for(let e of document.getElementsByClassName("arss_feed_delete") )
	{
		e.onclick=display.feeds_delete
	}

}
display.div_feed=function(e)
{
	while(e && !e.classList.contains("arss_feed") ){ e = e.parentElement }
	return e
}

display.feeds_delete=async function(e)
{
	let div_feed=display.div_feed(this)
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
	let div_feed=display.div_feed(this)
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required
	
	console.log(this.value)

	feed.url=this.value // set new url (which moves the feed)
	
	await db.set("feeds",feed.url,feed)
	await db.delete("feeds",url)

}

display.feeds_checkbox_changed=async function(e)
{
	let div_feed=display.div_feed(this)
	if(!div_feed){ return } // required
	
	let url=div_feed.id
	let feed=await db.get("feeds",url)
	if(!feed){ return } // required
	
	feed.off=!this.checked // set off status
	
	await db.set("feeds",url,feed)
	
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

}
