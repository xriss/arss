function blobToBase64(e){return new Promise(((t,r)=>{const n=new FileReader;n.onloadend=()=>t(n.result),n.readAsDataURL(e)}))}chrome.runtime.onMessage.addListener((function(e,t,r){if(e.url)return async function(){try{let t=await fetch(e.url,e.opts),n=await t.blob(),o=await blobToBase64(n);r({result:o})}catch(e){r({error:e})}}(),!0})),chrome.action.onClicked.addListener((function(e){chrome.tabs.create({url:chrome.runtime.getURL("index.html")})}));