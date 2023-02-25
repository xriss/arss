
var arss=exports

//let $ = require( "jquery" )
const fetch = require('cross-fetch');
const fetch_text=async function(url)
{
	let res=await fetch(url)
	if( res.status >= 400 ) { throw new Error("Bad response from server"); }
	return res.text();
}


//let Parser = require('rss-parser');
//let parser = new Parser();


const jxml = require('./jxml.js');
const db = require('./db_idb.js');

  
  
arss.setup=function(args)
{
	const browserfs=require("browserfs")
	browserfs.install(window);
	browserfs.configure({
		fs: "LocalStorage"
	}, function(e) {
		if (e) {
		  // An error happened!
		  throw e;
		}
		window.arss=arss
		arss.args=args || {}		// remember args
		if( document.readyState == "loading" )
		{ document.addEventListener("DOMContentLoaded", arss.start) }
		else { arss.start() } // wait for page to load then call start
	});
}
  
 

arss.start=async function()
{
	console.log("ARSS is here")

	db.setup()

	let url="https://edition.cnn.com/"
	url="http://rss.cnn.com/rss/cnn_topstories.rss"
	url="./tmp/subscriptions.opml"
	
	let txt=await fetch_text(url)
	let jsn=jxml.parse_xml(txt,jxml.xmap.opml)
	console.log(txt)
	console.log(jsn)

//  let feed = await parser.parseURL(url);
//  console.log(feed);
/*
	$.get( url, function( data ) {
	  console.log( url );
	  console.log( data );
	  $( "body" ).html( ""+data );
	});
*/

}

