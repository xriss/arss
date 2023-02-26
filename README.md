
A RSS reader.

Requires some hacks to disable browser security so it can do naughty 
things like read other websites from a web page, shock, horror.

Easiest way is to run a special chromium with security disabled like 
so.

	chromium --disable-web-security --user-data-dir=~/.arss --allow-running-insecure-content https://xriss.github.io/arss/

It will ask you for a special github key so it can keep all its 
settings in a gist. You can create a key that can only read/write gists 
from https://github.com/settings/tokens/new?scopes=gist without this 
key, all settings will only be saved in the current browser.

