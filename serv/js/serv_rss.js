/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let serv_rss=exports

let jxml = require("../../code/js/jxml.js")

let json_stringify = require("json-stable-stringify")


serv_rss.serv=async function(used)
{
	if( used.req.query.rss ) // fetch rss
	{
		return await serv_rss.serv_rss(used)
	}
	else
	if( used.req.query.json ) // fetch json options
	{
		return await serv_rss.serv_json(used)
	}
	
	used.next()
}


serv_rss.serv_output=async function(used)
{
	if( used.output_format=="json" )
	{
		used.res.setHeader('Content-Type', 'application/json')
		used.res.end(json_stringify(used.output,{space:" "}))
	}
	else // xml
	{
		used.res.setHeader('Content-Type', 'application/xml')
		let data=jxml.build_xml( used.output.rss || used.output.atom )
		used.res.end(data)
	}
}

serv_rss.serv_rss=async function(used)
{
//	console.log(used)

	used.rss_url= used.rss_url || used.req.query.rss
	
	if( used.rss_url )
	{

// download
		let txt =await ( await fetch(used.rss_url) ).text()
// try and parse as rss or atom, whatever we find
		let feed={}
		try{ feed.rss=jxml.parse_xml(txt,jxml.xmap.rss) }
		catch(e){}
		try{ feed.atom=jxml.parse_xml(txt,jxml.xmap.atom) }
		catch(e){}
// choose one
		if(feed.rss && feed.rss["/rss/channel/item"]) { delete feed.atom } // is rss
		else
		if(feed.atom && feed.atom["/feed/entry"]) { delete feed.rss } // is atom


		used.output=feed // output
		
		await serv_rss.fix(used) // cleanup input rss

		await serv_rss.serv_output(used)
	}
}

serv_rss.serv_json=async function(used)
{
	let txt =await ( await fetch( used.req.query.json ) ).text()

	return serv_rss.serv_rss(used)
}

serv_rss.fix=async function(used)
{

// make sure urls are relative to base

	let fixurl=function(href)
	{
		if(!href) { return }
		return (new URL(href, used.rss_url )).href
	}

	let fixurl_name=function(it,name)
	{
		if(it[name])
		{
			it[name]=fixurl(it[name])
		}
	}
	
	let rss=used.output.rss
// do rss
	if(rss)
	{
		fixurl_name( rss , "/rss/channel/atom:link@href" )
		for( let item of rss["/rss/channel/item"]||{} )
		{
			fixurl_name( item , "/link" )
			for( let enc of item["/enclosure"]||{} )
			{
				fixurl_name( enc , "@url" )
			}
		}
	}
	
	
	let atom=used.output.atom
// do atom
	if(atom)
	{
	}


}
