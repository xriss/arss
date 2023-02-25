
var arss=exports


const jxml = require('./jxml.js');
const db = require('./db_idb.js');
const hoard = require('./hoard.js');

  
  
arss.setup=function(args)
{
	arss.args=args || {}		// remember args
	if( document.readyState == "loading" )
	{ document.addEventListener("DOMContentLoaded", arss.start) }
	else { arss.start() } // wait for page to load then call start
}
  
 

arss.start=async function()
{
	console.log("ARSS is here")

	await db.setup()

	let url="https://edition.cnn.com/"
	url="http://rss.cnn.com/rss/cnn_topstories.rss"
	url="./tmp/subscriptions.opml"
	
	let txt=await hoard.fetch_text(url)
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

