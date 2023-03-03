
const items=exports


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const display = require('./display.js')



items.prepare=function(item,feed)
{
	let atom=item.atom||{}
	let rss=item.rss||{}
	
	if(feed)
	{
		item.feed=feed.url
		item.feed_title=feed.title
		item.feed_tags=feed.tags
	}
	
	let uuid=rss["/guid"] || atom["/id"] || rss["/link"] || rss["/title"] || rss["/pubdate"] || ""
	item.uuid=item.feed+"^"+uuid

	if(!item.date) // do not change date, just set it once
	{
		if(rss["/pubdate"])
		{
			item.date=new Date(rss["/pubdate"])
		}
		else
		if(atom["/published"]) // prefer published
		{
			item.date=new Date(atom["/published"])
		}
		else
		if(atom["/updated"]) // but sometimes we do not have it
		{
			item.date=new Date(atom["/updated"])
		}
	}

	if(rss["/link"])
	{
		item.link=rss["/link"]
	}
	else
	if(atom["/link"])
	{
		item.link=atom["/link"][0]["@href"]
		for(let link of atom["/link"])
		{
			if( link["@rel"]=="alternate" )
			{
				item.link=link["@href"]
			}
		}
	}

	item.title=item.title||""
	if(rss["/title"])
	{
		item.title=rss["/title"]
	}
	else
	if(atom["/title"])
	{
		item.title=atom["/title"]
	}

	item.html=item.html||""
	if(rss["/description"])
	{
		item.html=rss["/description"]
	}
	else
	if(atom["/content"])
	{
		item.html=atom["/content"]
	}

	return item
}

items.add_count=0
items.add=async function(it)
{
	let old=await db.get("items",it.uuid)
	let item={}
	if(old)
	{
		for(let n in old ){ item[n]=old[n] }
	}
	else
	{
		items.add_count++
	}
	for(let n in it ){ item[n]=it[n] }
	if(old) // old date has precedence
	{
		item.date=old.date||item.date
	}
	item.date=item.date||new Date() // make sure we have a date
	await db.set("items",item.uuid,item)
}

