/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let display={}
export default display


import      arss      from "./arss.js"
import      gist      from "./gist.js"
import      feeds     from "./feeds.js"
import      items     from "./items.js"
import      db        from "./db_idb.js"
import      jxml      from "./jxml.js"
import      hoard     from "./hoard.js"

import      sanihtml  from "sanitize-html"

import      urlParser from "js-video-url-parser"

// minimal
let myencodeURIComponent=function(s)
{
	return s.replace( /[\=\&\%]/gi , encodeURIComponent )
}

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
/*
	let head=document.getElementsByTagName('head')[0]
	head.append(display.element(`
<link rel="stylesheet" href="./arss.css" />
`))
*/

	let body=document.getElementsByTagName('body')[0]
	body.innerHTML=`
<div id="arss_bar" class="arss_bar" ></div>
<div id="arss_list" class="arss_list" ></div>
<iframe name="arss_page" id="arss_page" class="arss_page" sandbox="allow-popups" > </iframe>
`

	display.bar()
	display.list()
	display.drag()
	display.opts()

	window.onhashchange = display.hash_change
	display.hash_change()

	if( ! display.hash_args.page ) // first time
	{
		display.hash({page:"read"})
	}

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
<input class="arss_butt" id="arss_butt_anim" type="checkbox" />
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

	document.getElementById("arss_butt_anim").onclick = function(){display.anim_state()}

	document.getElementById("arss_butt_read").onclick = function(){display.hash({page:"read"})}
	document.getElementById("arss_butt_feed").onclick = function(){display.hash({page:"feed"})}
	document.getElementById("arss_butt_opts").onclick = function(){display.hash({page:"opts"})}

}

display.opts=function()
{
	let parent=document.getElementById('arss_list_opts')
	parent.innerHTML=""

if(gist.url)
{

	parent.append(display.element(`
<div class="arss_info_butt_info">

A RSS ${arss.version}

</div>
`))

	let CORS_METHOD = hoard.mode + " " + ( arss.cors || "" )

	parent.append(display.element(`
<div class="arss_info_butt_info">

Your CORS bypass method is <b>${CORS_METHOD}</b>

</div>
`))


if( hoard.mode == "bounce" )
{
	parent.append(display.element(`
<div class="arss_info_butt_warn">

All data is currently routed through a CORS bouncer server. <br/> <br/>
</b>${arss.cors}</b> <br/> <br/> Please note that it is better to use a
<a href="https://chrome.google.com/webstore/search/CORS">CORS browser
extension</a> and enable it for this site. A CORS bouncer  will always
be slower and unreliable.

</div>
`))
}



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
<div class="arss_info_butt" id="arss_info_butt_mark_read">Mark all items as read.</div>
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

	document.getElementById("arss_info_butt_mark_read").onclick = display.mark_read
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



display.iframe_width="75%"
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
			display.iframe_width=f+"%"
		}
	}
}

display.hash_last=null
display.hash_change=function(e)
{
	if( display.hash_last === window.location.hash ) { return }
	display.hash_last = window.location.hash

	let hash={}
	for(let a of display.hash_last.substring(1).split("&") )
	{
		let kv=a.split("=")
		if( kv.length==2 )
		{
			hash[ decodeURIComponent(kv[0]) ] = decodeURIComponent(kv[1])
		}
	}

	display.hash( hash )

/*
	let url=window.location.hash.substring(1)
	let feed=await feeds.cache(url)
	let title=url
	if(feed && feed.title) { title=feed.title }
	window.document.title=title+" my ARSS"
*/

}

display.hash_args={}
display.hash_mod=function(hash)
{
	for( let k in hash )
	{
		display.hash_args[k]=hash[k]
	}
	let aa=[]
	for( let k in display.hash_args )
	{
		aa.push( encodeURIComponent(k)+"="+myencodeURIComponent(display.hash_args[k]) )
	}
	let shash="#"+aa.join("&")
	display.hash_last=shash
	window.location.hash=shash
}
display.hash=function(hash)
{
	if( hash )
	{
		let aa=[]
		for( let k in hash )
		{
			aa.push( encodeURIComponent(k)+"="+myencodeURIComponent(hash[k]) )
		}
		let shash="#"+aa.join("&")
		display.hash_last=shash
		window.location.hash=shash
		display.hash_args=hash

		display.page(hash.page)
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
	if(name=="cors")
	{
	let parent=document.getElementsByTagName('body')[0]
	parent.innerHTML=""

	parent.append(display.element(`
<div class="arss_info_butt_info">

<p>CORS is blocking access to feeds!</p>

<p>Please enable a CORS plugin or provide a CORS bouncer.</p>

<p>You can provide a CORS bouncer such as corsanywhere by adding ?cors=BOUNCERURL to this page or search for and enable a CORS extension from your browser menu.</p>

<p>This website will "just work" if you install this chrome extension from <a href="http://github.com/xriss/security-theater
">http://github.com/xriss/security-theater
</a> to provide a CORS work around.</p>

</div>
`))

	}
	else
	if(name=="read")
	{
		document.getElementById("arss_list_read").style.display="inline-block"
		document.getElementById("arss_list_feed").style.display="none"
		document.getElementById("arss_list_opts").style.display="none"
		display.items(0)
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
	let x=feeds.build_opml()

	let link = document.createElement('a')
	let data = "text/xml;charset=utf-8," + encodeURIComponent(x)
	link.setAttribute("href", "data:"+data)
	link.setAttribute("download", "arss_reader.opml")
	link.click();
}



display.gist_token=async function(e)
{
	let gist_token=window.prompt("Github gist token for persistent storage.","");
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

display.mark_read=async function(e)
{
console.log("mark_read")
	let items_list=await db.list("items")
	let i=0
	for(let item of items_list)
	{
		i=i+1
		display.status(i+"/"+items_list.length)
		if(item.readed!=1)
		{
			await items.mark_readed(item.uuid,1)
		}
	}
	await display.empty_cache()
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
	let feed_url=window.prompt("URL of feed to add.","");
	if(feed_url)
	{
		let feed={}
		feed.url=feed_url
		await feeds.add(feed)
//		display.hash("#"+feed_url)
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

//	display.hash("#"+url) // read only this feed
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

display.item_checkbox_changed=async function(e)
{
	let div_item=display.div_lookup(this,"arss_item")
	if(!div_item){ return } // required

	let url=div_item.id

	if( this.checked )
	{
		await items.mark_readed(url,1)
	}
	else
	{
		await items.mark_readed(url,0)
	}
}

display.html_sane=function(str,baseurl)
{
	let doc=( new DOMParser() ).parseFromString(str, 'text/html');

	doc.querySelectorAll("head").forEach(function(item){
		item.prepend( display.element(`<base href="${baseurl}" target="_blank"/>` ) )
		item.prepend( display.element(`<meta name="referrer" content="no-referrer"/>` ) )
		item.prepend( display.element(`<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />` ) )
	})
	doc.querySelectorAll("script").forEach(function(item){item.remove()})
	doc.querySelectorAll("noscript").forEach(function(item){item.remove()})
	doc.querySelectorAll("iframe").forEach(function(item){item.remove()})
	doc.querySelectorAll("[crossorigin]").forEach(function(item){item.removeAttribute("crossorigin")})
	doc.querySelectorAll("[integrity]").forEach(function(item){item.removeAttribute("integrity")})

	return doc.firstElementChild.innerHTML;
}

display.items=async function(showidx)
{
	items.add_count=0
	document.getElementById('arss_list_read').innerHTML = ""
//	display.status("")

	let aa=[]

//	let hash=display.hash()
	let filter={}
//	if( hash=="#READ" || hash=="#FEED" || hash=="#OPTS" || hash=="#" || hash=="" )
//	{
//		filter={} // no filter
//	}
//	else

/*
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
*/

	let items_list=await db.list("items",filter,"date","prev",1000)
	items_list.sort(function(a,b){
		if(a.readed && !b.readed) { return 1 }
		if(!a.readed && b.readed) { return -1 }
		if(a.date>b.date) { return -1 }
		if(a.date<b.date) { return 1 }
		return 0
	})
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
		const lmgtfylink = "https://www.google.com/search?q="+encodeURIComponent(cleantitle)

		let date=item.date.toISOString().split("T")
		date=date[0]+" "+date[1].substring(0,5)
		let age=Math.floor(10 * ( ( now - item.date.getTime() )/(1000*60*60*24) ) )// 100% is 10 days
		if(age<0){age=0} ; if(age>100){age=100} // clamp to 0-100

		let checked=""

		if(item.readed)
		{
			checked="checked"
		}

		aa.push(`
<div class="arss_item" id="${cleanlink}">
<div class="arss_item_link"><input class="arss_item_checkbox" type="checkbox" ${checked} /> <a href="${cleanlink}" target="_blank" >${cleantitle}</a><a href="${lmgtfylink}" target="_blank" class="arss_super_small" >LMGTFY</a></div>
<div class="arss_item_date"><div class="arss_item_date_bar" style="width:${age}%"></div><div class="arss_item_date_text">${date}</div></div>
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

		display_item_next=url // flag we are in update cycle

		let time=Date.now()
		if( (time-display_item_time)  < 200 )// do not fast spam
		{
			await new Promise(resolve=>setTimeout(resolve, 200 ))
		}
		display_item_time=time

		url=null // force at least one loop
		while( url != display_item_next ) // repeat untill we catch up
		{
			url=display_item_next // may have changed
			if(url)
			{
				let item=await items.cache(url)
				let feed
				if(item && item.feed){feed=await feeds.cache(item.feed)}

				let html=null
				let html_url=null
				let no_sandbox=false
				// sniff mastodon
				let au=url.split("/")
				if(au.length==5)
				{
					if(au[3].slice(0,1)=="@")
					{
						if( /^\d+$/.test( au[4] ))
						{
							html=await hoard.fast_text(url+"/embed")
						}
					}
				}

				const video=urlParser.parse(url)
				if(video)
				{
					no_sandbox=true
					if(video.provider=="youtube")
					{
						html_url="http://www.youtube.com/embed/"+video.id
					}
				}

				if( !html_url && !html )
				{
					html=await hoard.fast_text(url)
				}

// maybe squirt a base tag into the head so relative urls will still work?
				if(html)
				{
					let partsurl = new URL(".",url)
					let baseurl=partsurl.origin+partsurl.pathname
					html=display.html_sane(html,baseurl)
/*
					let aa=html.split(/<head>/gi)
					if(aa.length==2)
					{
						let parts = new URL(".",url)
						let baseurl=parts.origin+parts.pathname
						html=aa.join(`<head><base href="${baseurl}" target="_blank"/><meta name="referrer" content="no-referrer"/><meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />`)
					}
					// security bullshit needs removing
					html=html.split('crossorigin="anonymous"').join('')
					html=html.split('integrity="').join('integnoty="')
*/
				}

				// remove + change + add so we do not create page history
				let iframe = document.getElementById('arss_page')
				let parent = iframe.parentNode
				iframe.remove()
				iframe=display.element(`<iframe name="arss_page" id="arss_page" class="arss_page" style="width:${display.iframe_width}"/>`)
//				iframe.srcdoc=""
				if(no_sandbox)
				{
				}
				else
				if(feed&&feed.js) // enable js
				{
					iframe.sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-scripts"
				}
				else
				{
					iframe.sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
				}

/*
				if(true)
				{
					let doc = document.implementation.createHTMLDocument('')
					doc.open()
					doc.write(html)
					doc.close()
					let article = new Readability(doc).parse();
					console.log(article)
					html=article.content
				}
*/

				if( html_url ) { iframe.src=html_url }
				if( html ) { iframe.srcdoc=html }
				parent.append(iframe)
//				display.hash_mod({url:url})
			}
		}
		display_item_next=false // finish
	}
	display.item_last=null
	let display_item_timeout=null
	display.item=async function(e)
	{
		if(display.item_last==e) { return }
		if(display.item_last) { display.item_last.classList.remove("active") }
		display.item_last=e
		e.classList.add("active")

		if(display_item_timeout)
		{
			window.clearTimeout(display_item_timeout)
		}
		display_item_timeout=window.setTimeout(async function(){
			if( display.item_last == e )
			{
				let c=e.querySelector(".arss_item_checkbox")
				if(c)
				{
					await items.mark_readed(e.id,1)
					c.checked = true
				}
			}
		}, 2*1000) // if still viewed after 2 secs then mark as read

		display_item_safe(e.id)

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
		if(el){display.item(el)}
	}
	for(let e of parent.children){e.onmouseover=mouseover}

	parent.parentElement.onscroll = function(ev)
	{
		let el=document.elementFromPoint(lastx,lasty)
		while(el && !el.classList.contains("arss_item") ){ el = el.parentElement }
		if(el){display.item(el)}
		if(parent.parentElement.scrollTop==0) // hit top, maybe refresh
		{
			if(items.add_count>0)
			{
				display.items(0)
			}
		}
	}

/*
	for(let e of document.getElementsByClassName("arss_item_date") )
	{
		e.onclick=display.items_feed_select
	}
	for(let e of document.getElementsByClassName("arss_item_feed") )
	{
		e.onclick=display.items_feed_select
	}
*/

	for(let e of document.getElementsByClassName("arss_item_checkbox") )
	{
		e.onchange=display.item_checkbox_changed
	}


	if("number"==typeof showidx){ display.item(parent.children[showidx]) }
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

//	display.hash("#"+url) // read only this feed
}

display.anim_id=false
display.anim_fps=1/4

// start or stop slow scroll animation
display.anim_state=function()
{
	if( display.anim_id )
	{
		clearTimeout(display.anim_id)
		display.anim_id=false
	}
	
	let checked=document.getElementById('arss_butt_anim').checked
	display.anim_data={}
	display.anim_id=setTimeout(display.anim_func,1000/display.anim_fps)
}
// perform a slow scroll animation
display.anim_func=function()
{
	let checked=document.getElementById('arss_butt_anim').checked
	if(!checked){return}
	display.anim_id=setTimeout(display.anim_func,1000/display.anim_fps)
	
	if(!display.anim_data) { display.anim_data={} }
	if(!display.anim_data.count) { display.anim_data.count=0 }

	let arss_page=document.getElementById('arss_page')
	let arss_list=document.getElementById('arss_list')
	
	let el=arss_page.contentWindow.document.documentElement
	
	let top=el && el.scrollTop
	if(top===undefined) { return }
	top=Math.ceil(top)
	let max=el.scrollHeight-el.clientHeight
	let step=max/( display.anim_fps*120 )
	if( step<2 ) { step=2 }
	el.scrollTop=top+step
	if( top+step>=max ) // end of scroll?
	{
//console.log(top,step,max)
		display.anim_data.count+=1
		if(display.anim_data.count>display.anim_fps*10) // wait 10 secs
		{
			display.anim_data.count=0
			if( items.add_count > 0 ) // get latest
			{
				display.items(0)
			}
			else
			{
				if(display.item_last)
				{
					let it=display.item_last.nextElementSibling
					if(it)
					{
						it.scrollIntoView(true)
						display.item(it)
					}
				}
			}
		}
	}
	else
	{
		display.anim_data.count=0
	}
}



