/*

(C) Kriss@XIXs.com 2023 and released under the MIT license.

See https://github.com/xriss/arss for full notice.

*/

const gist=exports

//const { GithubGist } = require('@vighnesh153/github-gist');
const { Octokit } = require("@octokit/rest");


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
	
	gist.filenameid="__ARSS_DATA_GIST__"
	gist.filewarning="This file is used by ARSS to find this data gist, please do not delete."
	gist.files={}
	gist.files[gist.filenameid]={ filename : gist.filenameid  , content : gist.filewarning }

	let opts={
	  personalAccessToken: arss.gist,
	  appIdentifier: 'arss',
	  enableRequestCaching: true,
	  isPublic: false,
	  corsConfig: { type: 'none' },
	}
	
	if(arss.cors) // apply simple cors proxy
	{
		opts.corsConfig={ type: 'custom', customRequestConfig: function(url){ return { url : arss.cors+url } } }
	}
	
	gist.octokit = new Octokit({

		userAgent: 'xriss arss',
		auth: arss.gist,

	})

	try{
		gist.user=await gist.octokit.rest.users.getAuthenticated()
		gist.user=gist.user && gist.user.data
	}catch(e){}
	// gist.user can now be used to check that gists are available
	
//	console.log("GIST USER",gist.user)
	
	if(!gist.user) { return } // failed to gist


	try{
		let per_page=100
		for(let page=1 ; ; page++) // page the data in case of more than 100 gists
		{
			let list = await gist.octokit.rest.gists.list({
				per_page:per_page,
				page:page,
			})
			list=list && list.data
//			console.log("GIST LIST",list)
			
			for(let it of list)
			{
				if(it.files[gist.filenameid])
				{
					gist.id=it.id
					break
				}
			}
			

			if(gist.id){ break }				// we found the gist we want
			if(!list){ break }					// stop paging on error
			if(list.length!=per_page){ break }	// stop paging on lack of data
		}
		
		if(gist.id) // load existing
		{
			gist.data = await gist.octokit.rest.gists.get({
				gist_id:gist.id,
			})
			gist.data=gist.data && gist.data.data
		}
		else // create new
		{
			gist.data=await gist.octokit.rest.gists.create({
				files:gist.files,
			})
			gist.data=gist.data && gist.data.data
		}

		if(gist.data) // loaded or created
		{
			gist.id=gist.data.id
			gist.files=gist.data.files
			gist.url=gist.data.html_url
		}
		
	}catch(e){console.log(e)}

//	console.log("GIST DATA",gist.data)
//	console.log("GIST FILES",gist.files)

}

gist.read=async function(filename)
{
	let file=gist.files[filename]
	if(file)
	{
		return file.content
	}
}

gist.write=async function(filename,content)
{
	if(!gist.url){return} // not loaded
	
	let file={}
	file.filename=filename
	file.content=content
	
	let files={}
	files[filename]=file // remote change

	await gist.octokit.rest.gists.update({
		gist_id:gist.id,
		files:files,
	})

	gist.files[filename]=file // update our cache
}
