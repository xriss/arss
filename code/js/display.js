
const display=exports

const feeds = require('./feeds.js')


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

document.getElementById("arss_butt_read").onclick = function(){display.page("read")};
document.getElementById("arss_butt_feed").onclick = function(){display.page("feed")};
document.getElementById("arss_butt_opts").onclick = function(){display.page("opts")};

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

