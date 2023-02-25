
const hoard=exports

const db = require('./db_idb.js')

const fetch = require('fetch')

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
	it={}
	it.status=0
	it.date=new Date()
	try{
		const controller = new AbortController()
		const signal = controller.signal
		setTimeout(function(){controller.abort()}, 10*1000)
		let res=await fetch(url,{signal})//,{redirect: 'follow',follow: 20})
		it.status=res.status
		it.text=await res.text()
	}catch(e){console.error(e)}		
	await db.set("hoard",url,it) // always write even if we fail
	return it.text
}

