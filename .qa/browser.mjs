/* Temporary, dependency-free browser QA. Not part of the published site. */
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';

const root = resolve('.');
const qa = resolve('.qa');
await mkdir(qa, { recursive: true });
// Keep generated browser caches outside the source repository.
const chromeProfile = await mkdtemp(resolve(tmpdir(), 'trinetrashwari-browser-'));
const mime = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const bytes = await readFile(path);
    res.writeHead(200, {'Content-Type':mime[extname(path)] || 'application/octet-stream'});
    res.end(bytes);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(resolve => server.listen(5173, '127.0.0.1', resolve));
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',
  '--disable-background-networking','--disable-extensions','--remote-debugging-port=9227',
  `--user-data-dir=${chromeProfile}`,'about:blank'
], {windowsHide:true, stdio:'ignore'});
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let serial = 0;
const pending = new Map();
const errors = [];
const responses = [];
const embedRequests = [];

try {
  let pages;
  for(let i=0;i<60;i++) {
    try { pages = (await (await fetch('http://127.0.0.1:9227/json')).json()).filter(target=>target.type==='page'); if(pages.length) break; } catch {}
    await pause(200);
  }
  if(!pages?.length) throw new Error('Chrome debugging endpoint did not start.');
  socket = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise((resolve,reject)=> {socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if(message.id) {
      const callback = pending.get(message.id);
      pending.delete(message.id);
      if(message.error) callback?.reject(new Error(JSON.stringify(message.error)));
      else callback?.resolve(message.result);
    } else if(message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    else if(message.method === 'Network.responseReceived') responses.push({url:message.params.response.url,status:message.params.response.status});
    else if(message.method === 'Network.requestWillBeSent' && message.params.request.url.includes('youtube-nocookie.com/embed/')) embedRequests.push(message.params.request);
  });
  async function cdp(method, params={}) {
    const id = ++serial;
    return new Promise((resolve,reject) => {
      pending.set(id,{resolve,reject});
      socket.send(JSON.stringify({id,method,params}));
      setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error(`CDP timed out: ${method}`));}},25000).unref();
    });
  }
  async function evaluate(expression) {
    const result = await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});
    if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Network.enable');
  await cdp('Page.navigate',{url:'http://127.0.0.1:5173/'});
  await pause(700);
  console.log('Page ready:',await evaluate(`({url:location.href,title:document.title,ready:document.readyState})`));
  console.log('Source response:',await evaluate(`fetch('assets/trinetrashwari-cover.jpg').then(async r=>({status:r.status,type:r.headers.get('content-type'),size:(await r.arrayBuffer()).byteLength}))`));

  // JioSaavn's official PNG is used without changing its pixels or color.
  const logo = await evaluate(`(async()=>{const image=new Image();image.src='assets/icons/jiosaavn.png';await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};})()`);
  console.log('Official JioSaavn logo dimensions:',logo);

  await cdp('Page.reload',{ignoreCache:true});
  await pause(600);
  await evaluate('document.fonts.ready.then(()=>true)');
  await evaluate('Promise.all([...document.images].filter(img=>img.loading!=="lazy").map(img=>img.decode())).then(()=>true)');
  for(const width of [320,375,390,430,768,1024,1280,1440]) {
    await cdp('Emulation.setDeviceMetricsOverride',{width,height:width<600?844:1000,deviceScaleFactor:1,mobile:width<600});
    const layout = await evaluate(`(async()=>{await document.fonts.ready;const elements=[...document.querySelectorAll('a,button')].filter(e=>e.getBoundingClientRect().height);const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,title:rect(document.querySelector('h1')),titleScroll:document.querySelector('h1').scrollWidth,art:rect(document.querySelector('.cover')),columns:getComputedStyle(document.querySelector('.platform-grid')).gridTemplateColumns,video:rect(document.querySelector('.video-frame')),links:[...document.querySelectorAll('.platform-card')].map(e=>({url:e.href,target:e.target,rel:e.rel,height:e.getBoundingClientRect().height})),broken:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src),smallTargets:elements.filter(e=>e.getBoundingClientRect().height<43).map(e=>({text:e.textContent.trim(),height:e.getBoundingClientRect().height})),placeholderLinks:[...document.querySelectorAll('a[href]')].filter(a=>/example|placeholder|YOUR-DOMAIN/.test(a.href)).length,fonts:document.fonts.check('400 14px Manrope')&&document.fonts.check('400 24px Cinzel')};})()`);
    assert(layout.scrollWidth <= width,`Overflow at ${width}: ${layout.scrollWidth}`);
    assert(layout.titleScroll <= layout.title.width + 1,`Title overflow at ${width}`);
    assert.equal(layout.links.length,6);
    assert(layout.links.every(link=>link.target==='_blank'&&link.rel==='noopener noreferrer'&&link.height>=44));
    assert.equal(layout.broken.length,0,`Broken images: ${layout.broken}`);
    assert.equal(layout.smallTargets.length,0,`Small targets at ${width}: ${JSON.stringify(layout.smallTargets)}`);
    assert.equal(layout.placeholderLinks,0);
    assert(layout.fonts);
    assert(Math.abs(layout.video.width/layout.video.height-16/9)<.02,'Video must retain a 16:9 ratio');
    console.log(`Layout ${width}px: OK; columns ${layout.columns}`);
    await evaluate('document.querySelector(".header-listen").click()');
    await pause(900);
    const videoRect=await evaluate('(()=>{const r=document.querySelector("#video-player").getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:innerHeight};})()');
    assert(videoRect.top>=-1&&videoRect.bottom<=videoRect.height+1,`Video not fully visible at ${width}px: ${JSON.stringify(videoRect)}`);
    console.log(`Listen shortcut shows entire video at ${width}px: OK`);
    if([390,1440].includes(width)) {
      await evaluate('document.querySelector("#video-player").scrollIntoView({behavior:"instant"})');
      await evaluate('document.querySelector(".video-poster > img").decode().then(()=>true)');
      await evaluate('window.scrollTo({top:0,behavior:"instant"})');
      await pause(200);
      const metrics = await cdp('Page.getLayoutMetrics');
      const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:Math.ceil(metrics.cssContentSize.height),scale:1}});
      await writeFile(resolve(qa,`preview-${width}.png`),Buffer.from(shot.data,'base64'));
    }
  }

  // Exact destination checks, independent of the rendering implementation.
  const links = await evaluate('[...document.querySelectorAll(".platform-card")].map(a=>a.getAttribute("href"))');
  const expected = [
    'https://open.spotify.com/album/5cbsY7rgRlxSGR2H37nDtb?si=YsgXbgDCQOWTPPRCgk6CtA&utm_source=copy-link',
    'https://youtu.be/L5fivEQxBL4?si=XWLZzccpu0Qn4izW',
    'https://music.youtube.com/watch?v=L5fivEQxBL4&si=KdR09eJH3BARC0G0&drli=1',
    'https://music.apple.com/in/album/trinetrashwari-single/6826457405',
    'https://music.amazon.in/albums/B0HP3M34LZ?do=play&trackAsin=B0HP3JGLGV&ts=1792829870&ref=dm_sh_pxql7o7OZu6CRZOmTfdSn5Uwz&referrer=dm_sh_whatsapp',
    'https://www.jiosaavn.com/song/trinetrashwari/XT4JWjtTAQE'
  ];
  assert.deepEqual(links,expected);
  console.log('All six exact supplied destinations: OK');

  const rejected = await evaluate(`['http://localhost:5173','https://localhost:5173','https://192.168.1.12','https://127.0.0.1','https://10.0.0.2','https://172.16.2.1','https://[::1]','file:///index.html','https://YOUR-DOMAIN.example/'].every(url=>publicUrlOrNull(url)===null)`);
  assert(rejected);
  assert.equal((await evaluate('getShareDestination()')).url,expected[1]);
  console.log('Share destination validation and local fallback: OK');

  // Native share path; no actual external share sheet or messages are sent.
  await evaluate(`window.__shared=null;Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__shared=data;}});document.querySelector('#share-button').click();`);
  await pause(50);
  assert.equal((await evaluate('window.__shared')).url,expected[1]);
  assert.match(await evaluate('document.querySelector("#share-status").textContent'),/Thanks/);
  console.log('Native share flow: OK');

  await evaluate(`Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError');}});document.querySelector('#share-button').click();`);
  await pause(50);
  assert.equal(await evaluate('document.querySelector("#share-status").textContent'),'');
  assert.equal(await evaluate('document.querySelector("#share-button").disabled'),false);
  console.log('Cancelling native share is handled quietly: OK');

  await evaluate(`window.__copied=null;Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async text=>{window.__copied=text;}});document.querySelector('#share-button').click();`);
  await pause(50);
  assert.equal(await evaluate('window.__copied'),expected[1]);
  assert.match(await evaluate('document.querySelector("#share-status").textContent'),/copied/);
  console.log('Clipboard fallback flow: OK');

  await evaluate(`window.__legacyCopy=false;Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('Clipboard blocked');}});document.execCommand=command=>{window.__legacyCopy=command==='copy';return true;};document.querySelector('#share-button').click();`);
  await pause(50);
  assert.equal(await evaluate('window.__legacyCopy'),true);
  assert.match(await evaluate('document.querySelector("#share-status").textContent'),/copied/);
  console.log('Legacy clipboard fallback: OK');

  // If clipboard APIs are blocked, the selected URL remains available to copy.
  await evaluate(`Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new Error('Clipboard blocked');}});document.execCommand=()=>false;document.querySelector('#share-button').click();`);
  await pause(50);
  assert.equal(await evaluate('document.querySelector("#manual-copy").hidden'),false);
  assert.equal(await evaluate('document.querySelector("#share-url").value'),expected[1]);
  console.log('Manual copy when clipboard is denied: OK');

  // Confirm no player before interaction, then load the official embed.
  assert.equal(await evaluate('document.querySelectorAll("iframe").length'),0);
  await evaluate('document.querySelector("#load-video").click()');
  await pause(2500);
  const video = await evaluate(`(()=>{const f=document.querySelector('iframe');return {src:f.src,title:f.title,allow:f.allow};})()`);
  assert.match(video.src,/youtube-nocookie\.com\/embed\/L5fivEQxBL4/);
  assert(!video.src.includes('autoplay'));
  assert.equal(new URL(video.src).searchParams.get('origin'),'http://127.0.0.1:5173');
  assert.equal(embedRequests.at(-1).headers.Referer,'http://127.0.0.1:5173/');
  console.log('YouTube receives the actual site origin and HTTP Referer: OK');
  console.log('Thumbnail-first, no-autoplay video embed: OK',video.src);
  console.log('YouTube response:',responses.filter(r=>r.url.includes('youtube-nocookie.com/embed/')));
  await evaluate('document.querySelector("#video-player").scrollIntoView({block:"center",behavior:"instant"})');
  await pause(2000);
  const videoShot=await cdp('Page.captureScreenshot',{format:'png'});
  await writeFile(resolve(qa,'video-check.png'),Buffer.from(videoShot.data,'base64'));

  await cdp('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'),'auto');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".platform-card")).transitionDuration'),'0s');
  console.log('Reduced-motion preference: OK');
  const schema = await evaluate('JSON.parse(document.querySelector("script[type=\\"application/ld+json\\"]").textContent)');
  assert.equal(schema.duration,'PT7M47S');
  assert.equal(schema['@type'],'MusicRecording');
  assert.equal(await evaluate('document.querySelector("#band-links").hidden'),true);
  assert.equal(errors.length,0,JSON.stringify(errors));
  console.log('JSON-LD, hidden unconfigured social links, and JavaScript runtime: OK');

  // Reproduce a missing WebP file, then confirm the real JPEG is displayed.
  await cdp('Network.setBlockedURLs',{urls:['*trinetrashwari-cover*.webp','*trinetrashwari-video.webp']});
  await cdp('Page.reload',{ignoreCache:true});
  await pause(500);
  await evaluate('document.querySelector("#video-player").scrollIntoView({behavior:"instant"})');
  await pause(200);
  await evaluate('Promise.all([...document.querySelectorAll("img[data-fallback]")].map(img=>img.decode())).then(()=>true)');
  const fallbackImages=await evaluate('[...document.querySelectorAll("img[data-fallback]")].map(img=>({source:img.currentSrc,width:img.naturalWidth,fallback:img.dataset.fallbackApplied}))');
  assert(fallbackImages.every(img=>img.source.endsWith('.jpg')&&img.width>0&&img.fallback==='true'));
  console.log('Missing WebP files recover to JPEG for cover and video: OK');
  await cdp('Network.setBlockedURLs',{urls:[]});

  // Reproduce the user's direct-file preview. Never create a broken embed.
  await cdp('Page.navigate',{url:pathToFileURL(resolve('index.html')).href});
  await pause(500);
  await evaluate('document.querySelector("#video-player").scrollIntoView({behavior:"instant"})');
  await pause(200);
  await evaluate('Promise.all([...document.querySelectorAll("img[data-fallback]")].map(img=>img.decode())).then(()=>true)');
  const filePreview=await evaluate('({cover:document.querySelector(".cover").currentSrc,width:document.querySelector(".cover").naturalWidth,videoTag:document.querySelector("#load-video").tagName,videoUrl:document.querySelector("#load-video").href,iframes:document.querySelectorAll("iframe").length,thumbnail:document.querySelector(".video-poster img").naturalWidth})');
  assert(filePreview.cover.endsWith('trinetrashwari-cover.jpg'));
  assert(filePreview.width>0,'Direct-file JPEG must decode successfully');
  assert.equal(filePreview.videoTag,'A');
  assert.equal(filePreview.videoUrl,expected[1]);
  assert.equal(filePreview.iframes,0);
  assert.equal(filePreview.thumbnail,1280);
  console.log('Direct file:// preview: cover and thumbnail visible; official video link replaces unsupported iframe: OK');
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');
  await pause(200);
  const fileShot=await cdp('Page.captureScreenshot',{format:'png'});
  await writeFile(resolve(qa,'file-preview-check.png'),Buffer.from(fileShot.data,'base64'));
  assert.equal(errors.length,0,JSON.stringify(errors));
  await writeFile(resolve(qa,'results.json'),JSON.stringify({errors,responses,links,video,embedRequests,fallbackImages,filePreview},null,2));
} finally {
  if(socket?.readyState===WebSocket.OPEN) {
    socket.send(JSON.stringify({id:++serial,method:'Browser.close'}));
    await pause(300);
    socket.close();
  }
  chrome.kill();
  server.close();
}
