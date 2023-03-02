
const gist=exports

const { GithubGist } = require('@vighnesh153/github-gist');


const db = require('./db_idb.js')

/*

needs CORS hacks that only works in chrome (special debug hack) to fix preflight options request

https://addons.mozilla.org/en-US/firefox/addon/cors-unblock/
https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino/
https://microsoftedge.microsoft.com/addons/detail/cors-unblock/hkjklmhkbkdhlgnnfbbcihcajofmjgbh

*/

gist.setup=async function()
{
	let gist_token=await db.get("keyval","gist_token")
/*
	if(!gist_token)
	{
		gist_token=window.prompt("Github gist token required for saving.","");
		await db.set("keyval","gist_token",gist_token)
	}
*/

	gist.handle = new GithubGist({
	  personalAccessToken: gist_token,
	  appIdentifier: 'arss',
	  enableRequestCaching: true,
	  isPublic: false,
	  corsConfig: { type: 'none' },
	});

	try{
		await gist.handle.initialize();
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
