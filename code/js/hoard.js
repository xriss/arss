/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

const hoard=exports

const db = require('./db_idb.js')
const arss = require('./arss.js')
const display = require('./display.js')

const fetch = require('fetch')

hoard.fast_text=async function(url)
{
	let it
	it=await db.get("hoard",url)
	if(it)
	{
		let randage=it.randage||0	// make updates have a random interval
		if( ( Date.now() - it.date.getTime() ) < ( hoard.maxage + randage ) ) // use cache ?
		{
			return it.text // no refresh
		}
		hoard.fetch_text(url,true) // refresh
		return it.text // but return fast
	}
	else
	{
		return await hoard.fetch_text(url)
	}
}

// cache lasts from maxage to double maxage as a random thingy
hoard.maxage=15*60*1000

hoard.maxsize=512+1024

hoard.fetch_text=async function(url,refresh)
{
	let corsurl=(arss.cors||"")+url
	let oldtext
	let it
	if(!refresh) { it=await db.get("hoard",url) } // try cache
	if(it)
	{
		let randage=it.randage||0	// make updates have a random interval
		if( ( Date.now() - it.date.getTime() ) < ( hoard.maxage + randage ) ) // use cache ?
		{
			return it.text
		}
		oldtext=it.text
	}
	let write=async function()
	{
		it={}
		it.status=0
		it.date=new Date()
		try{
			const controller = new AbortController()
			const signal = controller.signal
			setTimeout(function(){controller.abort()}, 10*1000)
			let res=await fetch(corsurl,{signal})//,{redirect: 'follow',follow: 20})
			it.status=res.status
			it.text=await res.text()
			if(it.text.length>hoard.maxsize*1024)
			{
				it.text=`<a href="${display.sanistr(url)}" target="_blank">This HTML page is bigger than ${hoard.maxsize}k so has been skipped, are you sure these people know how to HTML?</a>`
			}
			it.randage=Math.floor(Math.random() * hoard.maxage);
		}catch(e){console.error(e)}
		await db.set("hoard",url,it) // always write even if we fail
	}
/*
	if(oldtext)
	{
		write() // do not wait
		return oldtext // return old cache
	}
*/
	await write()
	return it.text
}

