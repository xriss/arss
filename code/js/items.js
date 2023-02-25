
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
	
	if(window.location.hash!="")
	{
		frameurl=window.location.hash.substring(1)
		document.getElementById('arss_page').setAttribute('src', frameurl)
	}

	let list=await db.list("items",{},"date","prev")
	let count=0
	for(item of list)
	{
		count++
		if( count>1000 ){ break }
//		console.log(item)
		if(!frameurl){
			frameurl=item["/link"]
			window.location.hash="#"+frameurl
			document.getElementById('arss_page').setAttribute('src', frameurl)
		}
		const notags={allowedTags: [],allowedAttributes: {}}
		const allowtags={ allowedTags:[ "img" , "p" ] }
		const cleanlink = sanistr(item["/link"])
		const cleantitle = sanistr(item["/title"])
		const cleanhtml = sanihtml(item["/description"]||"",allowtags)
		let date=item.date.toISOString().split("T")
		date=date[0]+" "+date[1].substring(0,5)

		aa.push(`
<div>
<div><a href="${cleanlink}" target="arss_page" onclick="window.location.hash='#${cleanlink}'">${cleantitle}</a></div>
<div>${cleanhtml}</div>
<div>${date}</div>
</div>
<div>-</div>
`)
	}
	
	document.getElementById('arss_list').innerHTML = aa.join("")


}

