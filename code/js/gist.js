
const gist=exports

const { GithubGist } = require('@vighnesh153/github-gist');


const db = require('./db_idb.js')
const arss = require('./arss.js')

/*

needs CORS hacks that only works in chrome (special debug hack) to fix preflight options request

https://addons.mozilla.org/en-US/firefox/addon/cors-unblock/
https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino/
https://microsoftedge.microsoft.com/addons/detail/cors-unblock/hkjklmhkbkdhlgnnfbbcihcajofmjgbh

*/

gist.setup=async function()
{

	let gist_token=await db.get("keyval","gist_token")

	let opts={
	  personalAccessToken: gist_token,
	  appIdentifier: 'arss',
	  enableRequestCaching: true,
	  isPublic: false,
	  corsConfig: { type: 'none' },
	}
	
	if(arss.cors) // apply simple cors proxy
	{
		opts.corsConfig={ type: 'custom', customRequestConfig: function(url){ return { url : arss.cors+url } } }
	}

	gist.handle = new GithubGist(opts);

	try{
		await gist.handle.initialize();
		gist.id=gist.handle.id
		gist.url=`https://gist.github.com/${gist.id}` 
	}catch(e){
		gist.handle=null
	}
}

gist.read=async function(name)
{
	if(!gist.handle){return}

	let fp=gist.handle.getFileByName(name)
	return fp && fp.content
}

gist.write=async function(name,val)
{
	if(!gist.handle){return}
	
	let fp=gist.handle.createNewFile(name)
	fp.content=val
	
	await fp.save()
}
