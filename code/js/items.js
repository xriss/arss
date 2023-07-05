/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

const items=exports


const hoard = require('./hoard.js')
const db = require('./db_idb.js')
const jxml = require('./jxml.js')
const display = require('./display.js')



items.cached={}

items.cache=async function(uuid,item) // probably fast
{
	if(item) { items.cached[uuid]=item ; return item }
	if(items.cached[uuid]) { return items.cached[uuid] }
	await items.get(uuid)
	return items.cached[uuid]
}
items.get=async function(uuid) // always slow
{
	let item=await db.get("items",uuid)
	if(item) { items.cache(item.uuid,item) }
	return item
}
items.set=async function(item)
{
	await db.set("items",item.uuid,item)
	if(item) { items.cache(item.uuid,item) }
}



items.prepare=function(item,feed)
{
	let atom=item.atom||{}
	let rss=item.rss||{}
	let any=item.rss||item.atom||{}

	if(feed) // cache some basic feed values
	{
		item.feed=feed.url
		item.feed_title=feed.title
		item.feed_tags=feed.tags
	}

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
		else
		if(atom["/created"]) // wtf?
		{
			item.date=new Date(atom["/created"])
		}
		else
		if(atom["/issued"]) // wtf?
		{
			item.date=new Date(atom["/issued"])
		}
		else
		if(atom["/modified"]) // wtf?
		{
			item.date=new Date(atom["/modified"])
		}
		else
		if(any["/dc:date"]) // why you do dis?
		{
			item.date=new Date(any["/dc:date"])
		}
		else
		if(feed && feed.date) // maybe the feed had a date
		{
			item.date=feed.date
		}
	}


	if(rss["/link"])
	{
		item.link=rss["/link"]
	}
	else
	if(rss["/id"]) // sometimes the real link is the RSS id
	{
		item.link=rss["/id"]
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
	else
	if(atom["/id"]) // sometimes the real link is the RSS id
	{
		item.link=atom["/id"]
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

	// prefer link, but might be a feed url + ( id or date )
	item.uuid=item.link || ( item.feed+"#"+( ( rss["/guid"] || atom["/id"] ) || (""+item.date) ) )

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

items.mark_readed=async function(uuid,value)
{
	if( typeof value == "undefined" ) { value=0 }
	let item=await items.get(uuid)
	if( item.readed!=value ) // only update if changed
	{
		item.readed=value
		await items.set(item)
	}
}
