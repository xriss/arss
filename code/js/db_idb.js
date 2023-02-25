
const db=exports

const idb = require( "idb/with-async-ittr" )

db.setup=async function()
{
	db.handle = await idb.openDB("arss", 2, {
		upgrade(handle) {
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

db.list=async function(table,filter,sort)
{
	table=table||"keyval"
	filter=filter || {}
	let rs=[]
	const tx = db.handle.transaction(table, 'readonly');
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
