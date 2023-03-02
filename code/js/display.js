
const display=exports

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

	document.getElementById("arss_butt_read").onclick = function(){display.page("read")}
	document.getElementById("arss_butt_feed").onclick = function(){display.page("feed")}
	document.getElementById("arss_butt_opts").onclick = function(){display.page("opts")}

}

display.opts=function()
{
	let parent=document.getElementById('arss_list_opts')
	parent.innerHTML=""

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_gist_token">Set token to connect to github gists for persistant storage.</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt_tail">
This requires a github token with read / write access to your gists.
You can create one at <a target="_blank" href="https://github.com/settings/tokens/new?scopes=gist">CREATE TOKEN</a>.
Make sure you copy it into your clipboard then click the button above to input it and refresh the page.
A private gist will be created/reconnected and then used to store all your ARSS options.
This can also be used to "log you into your ARSS account" on a new browser.
</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_empty_cache">Reload all cache.</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_empty_items">Reload all items (old items may be lost).</div>
`))

	parent.append(display.element(`
<div class="arss_info_butt" id="arss_info_butt_load_opml">Import feeds from an OPML file.<input id="arss_info_butt_load_opml_file" type="file"/></div>
`))

	parent.append(display.element(`
<a class="arss_info_butt" id="arss_info_butt_save_opml">Export all feeds as an OPML file.</a>
`))

	document.getElementById("arss_info_butt_load_opml_file").onchange = display.load_opml
	document.getElementById("arss_info_butt_save_opml").onclick = display.save_opml
	
	document.getElementById("arss_info_butt_gist_token").onclick = display.gist_token
	

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
		feeds.display()
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
		let it={}
		it["@type"]="rss"
		it["@xmlUrl"]=feed.url
		it["@htmlUrl"]=feed.url
		it["@text"]=feed.title
		it["@title"]=feed.title
		out.push(it)
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
	gist_token=window.prompt("Github gist token required for saving.","");
	if(gist_token)
	{
		await db.set("keyval","gist_token",gist_token)
		window.location.reload()
	}
}

