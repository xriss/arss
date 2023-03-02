
A RSS reader.

This requires some hacks to disable browser security so it can do 
naughty things like read other websites from a web page, shock, horror.

I've setup a CORS bouncer to do this that may or may not continue to 
exist and you can use it like so.


	https://xriss.github.io/arss/?cors=https://cors.xixs.com:4444/
	

Another way is to run a special chromium with security disabled like 
so.

	chromium --disable-web-security --user-data-dir=~/.arss --allow-running-insecure-content https://xriss.github.io/arss/

Which allows everything.

Ironically this is the most secure as otherwise you are sending all 
your tasty data to my CORS bouncer server.

