
const hoard=exports

const db = require('./db_idb.js');

const fetch = require('fetch');

const fetch_text=async function(url)
{
	let res=await fetch(url)
	if( res.status >= 400 ) { throw new Error("Bad response from server"); }
	return res.text();
}

hoard.maxage=15*60*1000

hoard.fetch_text=async function(url,refresh)
{
	let it
	if(!refresh) { it=await db.get("hoard",url) } // try cache
	if(it)
	{
		if( Date.now() - it.date.getTime() < hoard.maxage ) // use cache
		{
			return it.text
		}
	}
	let res=await fetch(url)
	it={}
	it.status=res.status
	it.text=await res.text()
	it.date=new Date()
	await db.set("hoard",url,it)
	return it.text
}

