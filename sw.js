if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let d={};const l=e=>i(e,t),o={module:{uri:t},exports:d,require:l};s[t]=Promise.all(n.map((e=>o[e]||l(e)))).then((e=>(r(...e),d)))}}define(["./workbox-02e216a3"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-2214fd74.css",revision:null},{url:"assets/index-aedad3bd.js",revision:null},{url:"assets/vendor-5cb4013f.js",revision:null},{url:"email.html",revision:"a836b2e74bc43306c78d35f7de989bea"},{url:"index.html",revision:"70011d8bdf70d5bca2d27fbdb086a033"},{url:"registerSW.js",revision:"402b66900e731ca748771b6fc5e7a068"},{url:"manifest.webmanifest",revision:"749d1b4d456c0bc760bfcf5c3a965a79"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/\.(?:png|jpg|jpeg|svg|webp|wasm)$/,new e.CacheFirst({cacheName:"Buddycare Images",plugins:[new e.ExpirationPlugin({maxEntries:10})]}),"GET")}));
//# sourceMappingURL=sw.js.map
