/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

let jxml={}
export default jxml


import          * as sax    from "sax"


jxml.xmap={}

// technically we should keep nesting outlines
jxml.xmap.opml={
	"/opml/body/outline":true,
	"/opml/body/outline/outline":true,
	"/opml/body/outline/outline/outline":true,
	"/opml/body/outline/outline/outline/outline":true,
}

jxml.xmap.rss={
	"/rss/channel/category":true,
	"/rss/channel/item":true,
	"/rss/channel/item/category":true,
	"/rss/channel/item/enclosure":true,
	"/rss/channel/item/media:content":true,
	"/rss/channel/item/media:group":true,
	"/rss/channel/item/media:group/media:content":true,
}

jxml.xmap.atom={
	"/feed/category":true,
	"/feed/link":true,
	"/feed/entry":true,
	"/feed/entry/category":true,
	"/feed/entry/link":true,
}



jxml.sanistr=function(s)
{
	s=""+s
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
	};
	return s.replace(/[&<>"]/ig, (match)=>(map[match]));
}

/*

Create a json object from an xml string using the given xmap.

The xmap is a dictionary of xpath:true for each element that may occur 
multiple times.

Not providing an xmap will make us assume that every element can occur 
multiple times which always work but will create an ugly/inefficient 
json format.

*/
jxml.parse_xml=function(data,xmap)
{
	let json=[];
	let stack=[];
	let top={};stack.push(top);
	let ret=top
	let xpath=[""]
	let opath=[""]
	let cdata=false;

	let parser = sax.parser(true)
	
	let ismulti=function(path)
	{
		if(!xmap) { return true } // if no map then everything is multi
		if("function"===typeof xmap) { return xmap(path) }// only approved paths are multi
		if(xmap[path]) { return true } // only given paths are multi
		return false
	}

	parser.onopentag=(node)=>{
		tag="/"+node.name.toLowerCase()

		let path=xpath.join("")+tag
		let tagpath=opath.at(-1)+tag
		if( ismulti(path) )
		{
			let parent=top
			top={}
			if(! parent[tagpath] ) { parent[tagpath]=[] }
			parent[tagpath].push(top)
			for(let n in node.attributes) { top["@"+n.toLowerCase()]=node.attributes[n] }
			stack.push(top)
			xpath.push(tag)
			opath.push("")
		}
		else
		{
			for(let n in node.attributes) { top[tagpath+"@"+n.toLowerCase()]=node.attributes[n] }
			stack.push(top)
			xpath.push(tag)
			opath.push(tagpath)
		}
//		console.log("+"+node.name+" "+path)
	}

	parser.onclosetag=(name)=>{
		stack.pop()
		top=stack.at(-1)
		xpath.pop()
		opath.pop()
//		console.log("-"+name)
	}

	parser.ontext=(text)=>{
		text=text.trim()
		if(text!="") // ignore white space
		{
			let tag=opath.at(-1)
			if( top[tag] )
			{
				top[tag]=top[tag]+" "+text
			}
			else
			{
				top[tag]=text
			}
		}
	}
	parser.oncdata=parser.ontext // oncdata is same function as ontext

// maintain cdata text flag
	parser.onopencdata=()=>{ cdata=true; }
	parser.onclosecdata=()=>{ cdata=false; }

//throw any errors
	parser.onerror=(e)=>{ throw new Error(e) }

	parser.write(data);

	if(stack.length!=1)
	{
		throw new Error("premature ending in xml data")
	}

	return ret
}

// expand a json xml object so each element is forced into an array
// this guarantees the format is what you would have gotten from a parse without an xmap
jxml.expand=function(it,paths)
{
	let ret=jxml.expand_one(it)
	jxml.recurse(ret,jxml.expand,paths)
	return ret
}
// perform top level expansion only, still need to recurse
jxml.expand_one=function(it)
{
	let ret={}
	for(let path in it ) // make arrays
	{
		if( (path=="") || (path[0]=="@") ) // simple
		{
			ret[path]=it[path] // this should never be an array
		}
		else // find split and put in an array
		{
			let idx=path.indexOf("/",1) // skip first char which can be a / or @
			let idx2=path.indexOf("@",1) // skip first char which can be a / or @
			if( (idx2>0) && ( (idx2<idx) || (idx<0) ) ) { idx=idx2 } // second / or first @
			if( (idx<0) && Array.isArray(it[path]) ) // full path, no / or @ to split and already an array
			{
				ret[path]=[ ...it[path] ] // copy array
			}
			else
			{
				if( idx<0 ) // a text node
				{
					idx=path.length
				}
				let base=path.substring(0,idx)
				if( !Array.isArray(ret[base]) ) { ret[base]=[{}] } // make array with one object
				ret[base][0][ path.substring(idx) ]=it[path] // copy into first object ( we will dupe the array on next pass )
			}
		}
	}
	return ret
}

// call recursively into arrays with an array of path strings
jxml.recurse=function(it,func,paths)
{
	paths=paths||[]
	for(let path in it ) // do arrays
	{
		if(Array.isArray(it[path]))
		{
			paths.push(path)
			for(let i=0;i<it[path].length;i++)
			{
				it[path][i]=func(it[path][i],paths)
			}
			paths.pop()
		}
	}
	return it
}

jxml.build_xml=function(data)
{
	let ss=['<?xml version="1.0" encoding="UTF-8"?>\n']

	data=jxml.expand(data) // fully expand so every sub tag is an array
	
	let parse
	parse=function(it,paths)
	{
		let top=paths[paths.length-1] // this will start with a /
		let indent=(" ").repeat(Math.max(0,paths.length-1))
		let children=false
		if(top) // catch the starting empty paths
		{
			ss.push(indent+"<"+top.substring(1))
			for(let path in it )
			{
				if(path[0]=="@") // add atributes
				{
					ss.push(" "+path.substring(1)+"=\""+jxml.sanistr(it[path])+"\"")
				}
				if((path[0]=="/")||(path=="")) // children
				{
					children=true
				}
			}
			if(children)
			{
				ss.push(" >\n")
				if(it[""]){ss.push(indent+" "+jxml.sanistr(it[""])+"\n")} // push text
			}
			else
			{
				ss.push(" />\n")
			}
		}
		jxml.recurse(it,parse,paths) // add sub tags
		if(top)
		{
			if(children)
			{
				ss.push(indent+"<"+top+">\n")
			}
		}
	}
	parse(data,[])

	
	let s=ss.join("")
	return s
}

/*
jxml.test=async function(argv)
{
	import { configure } from 'safe-stable-stringify'
	const stringify = configure({})
	import { promises as pfs } from 'fs'

	argv.input=argv.input || "./plated/source/tmp/subscriptions.opml"
	let txt=await pfs.readFile(argv.input,{ encoding: "utf8" })
	let ret=jxml.parse_xml(txt,jxml.xmap.opml)

	console.log(stringify(ret,{space:" "}))

	console.log(jxml.build_xml(ret))
}
*/
