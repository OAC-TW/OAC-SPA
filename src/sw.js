const ACACHE_NAME = `${registration.scope}!a-${BUILD_VERSION}`;
const DCACHE_NAME = `${registration.scope}!d-${BUILD_VERSION}`;

self.addEventListener('install', function(evt) {
	console.log('[sw]installed', BUILD_VERSION);
	//self.skipWaiting();

	try {
		importScripts("sw-manifest.js");
		console.log('[sw]pre-fetch', PRECACHE);
	} catch (e) {
		// empty list
		PRECACHE = [];
	}

	const handleCache = async () => {
		const cache = await caches.open(ACACHE_NAME)
		await cache.add('./')

		for (const {url} of PRECACHE) {
			try{
				await cache.add(url)
			}catch(e){
				console.error('[sw]pre-fetch', `[${url}]`, e)
				continue
			}
		}
	}
	evt.waitUntil(handleCache())
});

self.addEventListener('fetch', async function(evt) {
	var req = evt.request;
	evt.respondWith(assetsFromCache(req));
	//evt.respondWith(fetch(req)); // bypass
});

async function assetsFromCache(req) {
	if (req.method !== 'GET') return fetch(req);
	var cache = await caches.open(ACACHE_NAME);
	var url = new URL(req.url);
	if (url.origin === location.origin && !url.pathname.match(/\/api\//) && url.search !== '') { // remove '/(yyyy)?xxxxx...'
		req = url.pathname;
	}
	var resp = await cache.match(req) || fetch(req);
	return resp;
}

self.addEventListener('activate', function(ev) {
	const cleanup = async () => {
		const scopePrefix = `${registration.scope}!`;
		const aCache = ACACHE_NAME;
//		const dCache = DCACHE_NAME;
		const cacheNames = await caches.keys();
		const cachesToDelete = cacheNames.filter( (cacheName) => {
			let inScope = cacheName.startsWith(scopePrefix);
//			return inScope && ((aCache !== cacheName) && (dCache !== cacheName));
			return inScope && (aCache !== cacheName);
		});
		console.log('[sw]cachesToDelete:', cachesToDelete);
		await Promise.all(cachesToDelete.map( (cacheName) => {
			//console.log('[sw]Deleting out of date cache:', cacheName);
			return caches.delete(cacheName);
		}));
	};
	ev.waitUntil(cleanup());
});

self.addEventListener('message', async function(ev) {
	if (ev.data === 'skipWaiting') return self.skipWaiting();
});
