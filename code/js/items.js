
const items=exports


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



items.test=async function()
{
	let aa=[]
	
	let list=await db.list("items",{},"date","prev")
	let count=0
	for(item of list)
	{
		count++
		if( count>100 ){ break }
		console.log(item)
		aa.push(
`
<div>
<div><a href="${item["/link"]}" target="arss_page">${item["/title"]}</a></div>
<div>${item["/description"]}</div>
</div>
<div>-</div>
`)
	}
	
	document.getElementById('arss_list').innerHTML = aa.join("");

}

