
const display=exports



let element=function(html)
{
	let e = document.createElement("div")
	e.innerHTML=html
	return e.firstElementChild
}

display.all=function()
{
	display.bar()
	display.list()
	display.drag()
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

	parent.append(element(`
<div class="arss_butt" id="arss_butt_drag">*</div>
`))

	parent.append(element(`
<div class="arss_butt" id="arss_butt_read">READ</div>
`))

	parent.append(element(`
<div class="arss_butt" id="arss_butt_feed">FEED</div>
`))

	parent.append(element(`
<div class="arss_butt" id="arss_butt_status"> </div>
`))

}

display.list=function()
{
	let parent=document.getElementById('arss_list')
	parent.innerHTML=""

	parent.append(element(`
<div class="arss_list_read" id="arss_list_read"></div>
`))

	parent.append(element(`
<div class="arss_list_edit" id="arss_list_edit"></div>
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
		
		let full=element(`
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
