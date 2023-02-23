
var arss=exports

let $ = require( "jquery" )


let Parser = require('rss-parser');
let parser = new Parser();

  
  
arss.setup=function(args)
{
	window.arss=arss
	arss.args=args || {}		// remember args
	$(arss.start)			// wait for page to load then call start
}

arss.start=async function()
{

	console.log("ARSS has started")

	let url="https://edition.cnn.com/"
	url="http://rss.cnn.com/rss/cnn_topstories.rss"
	
  let feed = await parser.parseURL(url);
  console.log(feed);
/*
	$.get( url, function( data ) {
	  console.log( url );
	  console.log( data );
	  $( "body" ).html( ""+data );
	});
*/

}

