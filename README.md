
# A RSS reader.

In a browser, less of a book marker app, more of a doom scoller.

To celebrate the ten year deathday of google reader -- "Go back into the water, live there, die there."

![Screenshot](plated/source/img/arss_shot.jpg)

We present the RSS published content in a small column whilst *auto* 
loading the full page with javascript disabled in an iframe. This works 
well with news sites that only publish teaser content then expect you 
to visit the full site to keep reading.

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


Some options if you want to force another CORS proxy

	https://xriss.github.io/arss/?cors=https://cors-anywhere.herokuapp.com
	
or maybe force a github token

	https://xriss.github.io/arss/?gist=randomsupersecret

or just read an OPML published on the web. This is a good way to use 
this app as a reader without connecting to github. I've included 
someones ( I just googled and found 
https://ruk.ca/content/heres-my-opml ) public OPML file as it makes for 
a good demonstration of how this can work.

	https://xriss.github.io/arss/?opml=https://images.ruk.ca/opml/peter_rukavina_blogroll.opml

If you use a link like this while connected to github it will pop up a 
confirm requester before merging all the feeds with your own as this 
would be hard to undo. You can also use the idb param to change the 
database name and if you choose "delete" as the database name then data 
will be auto purged on startup keeping everything clean and fresh.

What that means is this link will let you read an opml without messing 
with your personal options and adding the feeds to your view since the 
database will be cleared on startup. Note that it still keeps the data 
caching so refreshes of a page should be fast. 
https://xriss.github.io/arss/?idb=delete&opml=https://images.ruk.ca/opml/peter_rukavina_blogroll.opml

If you link directly to an atom/rss feed instead of an opml then we 
will pick it up and import just that feed so urls like 
https://xriss.github.io/arss/?idb=delete&opml=http://feeds.bbci.co.uk/news/rss.xml#READ 
can be used to auto reed a single feed in isolation.


FYI https://opml.glitch.me/ can be used to scan your twitter followings 
and find RSS feeds from peoples sites. I'd recommend prettying up the 
output opml file and manually editing it to remove the comment feeds 
before importing it.

