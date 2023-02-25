
var db=exports

let idb = require( "idb/with-async-ittr" )

db.setup=async function()
{

	db.handle = await idb.openDB("arss", 1, {
		upgrade(handle) {
			try{
				let keyval=handle.createObjectStore('keyval')
				feeds.createIndex("date", "date")
			}catch(e){console.error(e)}
			
			try{
				let hoard=handle.createObjectStore('hoard')
				feeds.createIndex("date", "date")
			}catch(e){console.error(e)}
			
			try{
				let feeds=handle.createObjectStore("feeds", {
					keyPath: "id",
					autoIncrement: true,
				})
				feeds.createIndex("date", "date")
			}catch(e){console.error(e)}
			
			try{
				let items=handle.createObjectStore("items", {
					keyPath: "id",
					autoIncrement: true,
				})
				items.createIndex("date", "date")
			}catch(e){console.error(e)}
		},
	})

}

db.get=async function(table,key)
{
	table=table||"keyval"
	let ret=await db.handle.get(table, key )
	return ret
}

db.put=async function(table,it,key)
{
	table=table||"keyval"
	await db.handle.put(table, it ,key )
}

db.add=async function(table,it)
{
	table=table||"keyval"
	await db.handle.add(table, it )
}

db.list=async function(table,filter,sort)
{
	table=table||"keyval"
	filter=filter || {}
	let rs=[]
	const tx = db.transaction(table, 'read');
	const f=function(cursor)
	{
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
	}
	if(sort)
	{
		const index=tx.store.index(sort)
		for await (const cursor of index.iterate())
		{
			f(cursor)
		}
	}
	else
	{
		for await (const cursor of tx.store)
		{
			f(cursor)
		}
	}
	await tx.done;

	return rs // filtered only, sorted by date
}
