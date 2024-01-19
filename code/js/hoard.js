/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let hoard={}
export default hoard


import      arss      from "./arss.js"
import      db        from "./db_idb.js"
import      display   from "./display.js"


hoard.msg_send=function(msg)
{
	msg=msg || {}
	msg.hoard=true
	return new Promise((res, rej) => {

		const channel = new MessageChannel()

		channel.port1.onmessage = function(e)
		{
			channel.port1.close()
			if (e.data.error)
			{
				rej(e.data.error)
			}
			else
			{
				res(e.data.result)
			}
		}

		window.postMessage( msg , "*" , [channel.port2] )
	})
}

// run a fetch in our worker
hoard.msg_fetch=async function(url,opts)
{
	if(opts)
	{
		opts=JSON.parse(JSON.stringify(opts))	// remove possible functions that cannot be shared
	}
	let datauri=await hoard.msg_send({url:url,opts:opts } ) // pass up the chain
	return await window.fetch.call(window,datauri) // create fake fetch response to a datauri
}



hoard.test_probe=async function()
{
	let testurl=location.protocol+"//google.com/"
	
	let res={}
	let txt={}


	if( chrome && chrome.runtime && chrome.runtime.sendMessage ) // we are an extension
	{
		return "msg"
	}

	try{
		if(typeof security_theater !== 'undefined') // use my extension if available.
		{
			console.log("Trying security theater")
			res.theater=await Promise.race([
				security_theater.fetch(testurl),
				new Promise((_, reject) => setTimeout(() => reject("timeout"), 2*1000)),
			])
			txt.theater=await res.theater.text()
			if(txt.theater)
			{
				console.log("found security theater")
				return "theater"
			}
		}
	}catch(e){console.error(e)}

	try{
		console.log("Trying cors extension")
		res.plain=await Promise.race([
			fetch(testurl),
			new Promise((_, reject) => setTimeout(() => reject("timeout"), 2*1000)),
		])
		txt.plain=await res.plain.text()
		if(txt.plain)
		{
			console.log("found cors extensions is enabled")
			arss.cors=""
			return "plain"
		}
	}catch(e){console.error(e)}

	try{
		if(arss.cors)
		{
			console.log("Trying cors bouncer : "+arss.cors)
			res.bounce=await Promise.race([
				fetch(arss.cors+testurl),
				new Promise((_, reject) => setTimeout(() => reject("timeout"), 2*1000)),
			])
			txt.bounce=await res.bounce.text()
			if(txt.bounce)
			{
				console.log("found cors bouncer : "+arss.cors)
				return "bounce"
			}
		}
	}catch(e){console.error(e)}

}

//const fetch = require('fetch')

// make sure we have a cache of the page available, no matter how old
hoard.first_text=async function(url)
{
	if( ! await db.get("hoard",url) ) // if not exist
	{
		return await hoard.fetch_text(url) // make exist
	}
}

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

hoard.maxsize=2*1024

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
			let res
			if(typeof security_theater !== 'undefined') // use extension if available.
			{
				if( hoard.mode == "theater" )
				{
					res=await Promise.race([
						security_theater.fetch(url),
						new Promise((_, reject) => setTimeout(() => reject("timeout"), 2*1000)),
					])
				}
				else
				if( hoard.mode == "msg" )
				{
					res=await Promise.race([
						hoard.msg_fetch(url),
						new Promise((_, reject) => setTimeout(() => reject("timeout"), 2*1000)),
					])
				}
			}
			else
			{
				res=await Promise.race([
					fetch(corsurl),
					new Promise((_, reject) => setTimeout(() => reject("timeout"), 2*1000)),
				])
			}
			it.status=res.status
			it.text=await res.text()
			
			if(it.text=="undefined") { it.text="STATUS : "+it.status }
			if(it.text.slice(0,4)=="%PDF") { it.text=`
<html>
<body>
	<object data="${url}" type="application/pdf">
		<a href="${url}">${url}</a>
	</object>
</body>
</html>
`			} // probably a pdf so no cache just link

			if(it.text=="undefined") { it.text="STATUS : "+it.status }
			if(it.text.length>hoard.maxsize*1024)
			{
				it.text=`<a href="${display.sanistr(url)}" target="_blank">This HTML page is bigger than ${hoard.maxsize}k so has been skipped, are you sure these people know how to HTML?</a>`
			}
			it.randage=Math.floor(Math.random() * hoard.maxage);
			await db.set("hoard",url,it) // always write if we get here, errors will not write
		}catch(e){console.error("failed url",url);console.error(e)}
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

