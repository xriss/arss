
const jxml=exports


jxml.xmap={}

// single level outline
jxml.xmap.opml={"/opml/body/outline":true}

jxml.xmap.rss={
	"/rss/channel/category":true,
	"/rss/channel/item":true,
	"/rss/channel/item/category":true,
	"/rss/channel/item/enclosure":true,
	"/rss/channel/item/media:content":true,
	"/rss/channel/item/media:group":true,
	"/rss/channel/item/media:group/media:content":true,
}

const sax=require('sax')

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
		if(xmap[path]) { return true } // only given paths are multi
		return false
	}

	parser.onopentag=(node)=>{
		tag="/"+node.name

		let path=xpath.join("")+tag
		let tagpath=opath.at(-1)+tag
		if( ismulti(path) )
		{
			let parent=top
			top={}
			if(! parent[tagpath] ) { parent[tagpath]=[] }
			parent[tagpath].push(top)
			for(n in node.attributes) { top["@"+n]=node.attributes[n] }
			stack.push(top)
			xpath.push(tag)
			opath.push("")
		}
		else
		{
			for(n in node.attributes) { top[tagpath+"@"+n]=node.attributes[n] }
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



jxml.test=async function(argv)
{
	let stringify = require('json-stable-stringify');
	let pfs=require("fs").promises

	argv.input=argv.input || "./plated/source/tmp/subscriptions.opml"
	let txt=await pfs.readFile(argv.input,{ encoding: "utf8" })
	let ret=jxml.parse_xml(txt,jxml.xmap.opml)

	console.log(stringify(ret,{space:" "}))
}

