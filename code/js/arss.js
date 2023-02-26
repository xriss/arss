
const arss=exports


const jxml = require('./jxml.js')
const db = require('./db_idb.js')
const hoard = require('./hoard.js')
const feeds = require('./feeds.js')
const items = require('./items.js')
const gist = require('./gist.js')

  
  
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
	await gist.setup()
	
	await feeds.load_opml()
//	await feeds.save_opml()
	feeds.fetch_all()
	items.test()

/*
	await feeds.add_opml("","./tmp/subscriptions.opml")
	feeds.fetch_all()
	items.test()
*/

/*
	let url="https://edition.cnn.com/"
	url="http://rss.cnn.com/rss/cnn_topstories.rss"
	
	let txt=await hoard.fetch_text(url,true)
	let jsn=jxml.parse_xml(txt,jxml.xmap.rss)
	console.log(txt)
	console.log(jsn)
*/

}

