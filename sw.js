if(!self.define){let e,s={};const i=(i,n)=>(i=new URL(i+".js",n).href,s[i]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=i,e.onload=s,document.head.appendChild(e)}else e=i,importScripts(i),s()})).then((()=>{let e=s[i];if(!e)throw new Error(`Module ${i} didn’t register its module`);return e})));self.define=(n,r)=>{const t=e||("document"in self?document.currentScript.src:"")||location.href;if(s[t])return;let l={};const o=e=>i(e,t),c={module:{uri:t},exports:l,require:o};s[t]=Promise.all(n.map((e=>c[e]||o(e)))).then((e=>(r(...e),l)))}}define(["./workbox-02e216a3"],(function(e){"use strict";self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"assets/index-2214fd74.css",revision:null},{url:"assets/index-ba7f1bf5.js",revision:null},{url:"assets/vendor-df78beee.js",revision:null},{url:"email.html",revision:"a836b2e74bc43306c78d35f7de989bea"},{url:"index.html",revision:"71e2078e868aaa806f05cafd9b657c8a"},{url:"registerSW.js",revision:"402b66900e731ca748771b6fc5e7a068"},{url:"manifest.webmanifest",revision:"749d1b4d456c0bc760bfcf5c3a965a79"}],{}),e.cleanupOutdatedCaches(),e.registerRoute(new e.NavigationRoute(e.createHandlerBoundToURL("index.html"))),e.registerRoute(/\.(?:png|jpg|jpeg|svg|webp|wasm)$/,new e.CacheFirst({cacheName:"Buddycare Images",plugins:[new e.ExpirationPlugin({maxEntries:10})]}),"GET")}));
//# sourceMappingURL=sw.js.map
