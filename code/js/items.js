
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
	it.date=new Date()
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


