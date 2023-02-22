
var arss=exports



let $ = require( "jquery" )

arss.setup=function(args)
{
	window.arss=arss
	tok.args=args || {}		// remember args
	$(arss.start)			// wait for page to load then call start
}

arss.start=async function()
{

	console.log("ARSS has started")
}

