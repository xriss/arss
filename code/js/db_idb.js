/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let db={}
export default db


import          * as idb  from "idb/with-async-ittr"




db.name="arss"

db.setup=async function()
{
	let newdata=false
	db.handle = await idb.openDB(db.name, 2, {
		upgrade(handle) {
			newdata=true
			try{
				let it=handle.createObjectStore('keyval')
				it.createIndex("date", "date")
			}catch(e){console.error(e)}
			
			try{
				let it=handle.createObjectStore('hoard')
				it.createIndex("date", "date")
			}catch(e){console.error(e)}
			
			try{
				let it=handle.createObjectStore("feeds")
				it.createIndex("date", "date")
			}catch(e){console.error(e)}
			
			try{
				let it=handle.createObjectStore("items")
				it.createIndex("date", "date")
			}catch(e){console.error(e)}

		},
	})
	
	if(db.name=="delete") // purge all data at startup if using this database name
	{
		await db.clear("keyval")
	//	await db.clear("hoard")	// keep cache
		await db.clear("feeds")
		await db.clear("items")
	}
	else
	if(newdata) // auto add default feeds to empty database
	{
		try{
			let its=[
				{url:"https://notshi.github.io/printscreen/blog/feed.xml",tags:"#QUIET"},
				{url:"https://xixs.com/blog/feed.xml",tags:"#QUIET"},
				{url:"https://4lfa.com/comic/feed.xml",tags:"#QUIET"},
				{url:"https://mastodon.social/@xriss.rss",tags:"#QUIET"},
			]
			for(let it of its)
			{
				it.date=new Date()
				await db.handle.put("feeds", it, it.url )
			}
		}catch(e){console.error(e)}
	}
}

db.close=async function()
{
	await db.handle.close()
	db.handle=null
}

db.get=async function(table,key)
{
	table=table||"keyval"
	let ret=await db.handle.get(table, key )
	return ret
}

db.set=async function(table,key,it)
{
	table=table||"keyval"
	await db.handle.put(table, it, key )
}

db.add=async function(table,it)
{
	table=table||"keyval"
	await db.handle.add(table, it )
}

db.clear=async function(table)
{
	table=table||"keyval"
	await db.handle.clear(table)
}

db.delete=async function(table,key)
{
	table=table||"keyval"
	await db.handle.delete(table,key)
}
db.list=async function(table,filter,sort,sortdir,maxlength)
{
	table=table||"keyval"
	filter=filter || {}
	let rs=[]
	const tx = db.handle.transaction(table, 'readonly');
	const f=function(cursor)
	{
		if(maxlength)
		{
			if( rs.length >= maxlength )
			{
				return true
			}
		}
		let it = { ...cursor.value }
		let ok=true
		for(let name in filter) // check filter object
		{
			if(filter[name]!==it[name]) { ok=false } // all filters must be true
		}
		if(ok) // add filtered objects to result
		{
			rs.push(it)
		}
		return false
	}
	if(sort)
	{
		const index=tx.store.index(sort)
		for await (const cursor of index.iterate(null,sortdir))
		{
			if( f(cursor) ) { break }
		}
	}
	else
	{
		for await (const cursor of tx.store.iterate(null,sortdir))
		{
			if( f(cursor) ) { break }
		}
	}
	await tx.done;

	return rs // filtered only, sorted by date
}
