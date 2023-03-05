
A RSS reader.

This requires some hacks to disable browser security so it can do 
naughty things like read other websites from a web page, shock, horror.

I've setup a CORS bouncer to do this that may or may not continue to 
exist and it will auto use it when hosted at 
https://xriss.github.io/arss/ so everything should just work.

Another way is to run a special chromium with security disabled like 
so.

	chromium --disable-web-security --user-data-dir=~/.arss --allow-running-insecure-content https://xriss.github.io/arss/?cors=false

Which allows everything.

Ironically this is the most secure as otherwise you are sending all 
your tasty data to my CORS bouncer server.


If you want to force another cors proxy

	https://xriss.github.io/arss/?cors=https://cors-anywhere.herokuapp.com
	
or maybe force a github token

	https://xriss.github.io/arss/?gist=randomsupersecret

then use these query params.
