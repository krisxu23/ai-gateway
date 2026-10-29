var Ce=(e,t,n)=>(r,s)=>{let o=-1;return i(0);async function i(a){if(a<=o)throw new Error("next() called multiple times");o=a;let l,c=!1,d;if(e[a]?(d=e[a][0][0],r.req.routeIndex=a):d=a===e.length&&s||void 0,d)try{l=await d(r,()=>i(a+1))}catch(u){if(u instanceof Error&&t)r.error=u,l=await t(u,r),c=!0;else throw u}else r.finalized===!1&&n&&(l=await n(r));return l&&(r.finalized===!1||c)&&(r.res=l),r}};var lt=Symbol();var ct=async(e,t=Object.create(null))=>{let{all:n=!1,dot:r=!1}=t,o=(e instanceof ye?e.raw.headers:e.headers).get("Content-Type");return o?.startsWith("multipart/form-data")||o?.startsWith("application/x-www-form-urlencoded")?ir(e,{all:n,dot:r}):{}};async function ir(e,t){let n=await e.formData();return n?lr(n,t):{}}function lr(e,t){let n=Object.create(null);return e.forEach((r,s)=>{t.all||s.endsWith("[]")?cr(n,s,r):n[s]=r}),t.dot&&Object.entries(n).forEach(([r,s])=>{r.includes(".")&&(dr(n,r,s),delete n[r])}),n}var cr=(e,t,n)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(n):e[t]=[e[t],n]:t.endsWith("[]")?e[t]=[n]:e[t]=n},dr=(e,t,n)=>{if(/(?:^|\.)__proto__\./.test(t))return;let r=e,s=t.split(".");s.forEach((o,i)=>{i===s.length-1?r[o]=n:((!r[o]||typeof r[o]!="object"||Array.isArray(r[o])||r[o]instanceof File)&&(r[o]=Object.create(null)),r=r[o])})};var ne=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,n=>{try{return t(n)}catch{return n}})}},ur=e=>ne(e,decodeURI),Oe=e=>{let t=e.url,n=t.indexOf("/",t.indexOf(":")+4),r=n;for(;r<t.length;r++){let s=t.charCodeAt(r);if(s===37){let o=t.indexOf("?",r),i=t.indexOf("#",r),a=o===-1?i===-1?void 0:i:i===-1?o:Math.min(o,i),l=t.slice(n,a);return ur(l.includes("%25")?l.replace(/%25/g,"%2525"):l)}else if(s===63||s===35)break}return t.slice(n,r)};var dt=e=>{let t=Oe(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},X=(e,t,...n)=>(n.length&&(t=X(t,...n)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`);var Ie=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?ne(e,ce):e):e,ut=(e,t,n)=>{let r;if(!n&&t&&!/[%+]/.test(t)){let i=e.indexOf("?",8);if(i===-1)return;for(e.startsWith(t,i+1)||(i=e.indexOf(`&${t}`,i+1));i!==-1;){let a=e.charCodeAt(i+t.length+1);if(a===61){let l=i+t.length+2,c=e.indexOf("&",l);return Ie(e.slice(l,c===-1?void 0:c))}else if(a==38||isNaN(a))return"";i=e.indexOf(`&${t}`,i+1)}if(r=/[%+]/.test(e),!r)return}let s={};r??=/[%+]/.test(e);let o=e.indexOf("?",8);for(;o!==-1;){let i=e.indexOf("&",o+1),a=e.indexOf("=",o);a>i&&i!==-1&&(a=-1);let l=e.slice(o+1,a===-1?i===-1?void 0:i:a);if(r&&(l=Ie(l)),o=i,l==="")continue;let c;a===-1?c="":(c=e.slice(a+1,i===-1?void 0:i),r&&(c=Ie(c))),n?(s[l]&&Array.isArray(s[l])||(s[l]=[]),s[l].push(c)):s[l]??=c}return t?s[t]:s},pt=ut,ft=(e,t)=>ut(e,t,!0),ce=decodeURIComponent;var mt=e=>ne(e,ce),ye=class{raw;#t;#r;routeIndex=0;path;bodyCache={};constructor(e,t="/",n=[[]]){this.raw=e,this.path=t,this.#r=n,this.#t={}}param(e){return e?this.#n(e):this.#o()}#n(e){let t=this.#r[0][this.routeIndex][1][e],n=this.#s(t);return n&&/\%/.test(n)?mt(n):n}#o(){let e={},t=Object.keys(this.#r[0][this.routeIndex][1]);for(let n of t){let r=this.#s(this.#r[0][this.routeIndex][1][n]);r!==void 0&&(e[n]=/\%/.test(r)?mt(r):r)}return e}#s(e){return this.#r[1]?this.#r[1][e]:e}query(e){return pt(this.url,e)}queries(e){return ft(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((n,r)=>{t[r]=n}),t}async parseBody(e){return ct(this,e)}#e=e=>{let{bodyCache:t,raw:n}=this,r=t[e];if(r)return r;let s=Object.keys(t)[0];return s?t[s].then(o=>(s==="json"&&(o=JSON.stringify(o)),new Response(o)[e]())):t[e]=n[e]()};json(){return this.#e("text").then(e=>JSON.parse(e))}text(){return this.#e("text")}arrayBuffer(){return this.#e("arrayBuffer")}bytes(){return this.#e("arrayBuffer").then(e=>new Uint8Array(e))}blob(){return this.#e("blob")}formData(){return this.#e("formData")}addValidatedData(e,t){this.#t[e]=t}valid(e){return this.#t[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[lt](){return this.#r}get matchedRoutes(){return this.#r[0].map(([[,e]])=>e)}get routePath(){return this.#r[0].map(([[,e]])=>e)[this.routeIndex].path}};var ht={Stringify:1,BeforeStream:2,Stream:3},pr=(e,t)=>{let n=new String(e);return n.isEscaped=!0,n.callbacks=t,n};var $e=async(e,t,n,r,s)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let o=e.callbacks;if(!o?.length)return Promise.resolve(e);s?s[0]+=e:s=[e];let i=Promise.all(o.map(a=>a({phase:t,buffer:s,context:r}))).then(a=>Promise.all(a.filter(Boolean).map(l=>$e(l,t,!1,r,s))).then(()=>s[0]));return n?pr(await i,o):i};var fr="text/plain; charset=UTF-8",Me=(e,t)=>({"Content-Type":e,...t}),de=(e,t)=>new Response(e,t),gt=class{#t;#r;env={};#n;finalized=!1;error;#o;#s;#e;#d;#l;#c;#i;#u;#p;constructor(e,t){this.#t=e,t&&(this.#s=t.executionCtx,this.env=t.env,this.#c=t.notFoundHandler,this.#p=t.path,this.#u=t.matchResult)}get req(){return this.#r??=new ye(this.#t,this.#p,this.#u),this.#r}get event(){if(this.#s&&"respondWith"in this.#s)return this.#s;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#s)return this.#s;throw Error("This context has no ExecutionContext")}get res(){return this.#e||=de(null,{headers:this.#i??=new Headers})}set res(e){if(this.#e&&e){e=de(e.body,e);for(let[t,n]of this.#e.headers.entries())if(t!=="content-type")if(t==="set-cookie"){let r=this.#e.headers.getSetCookie();e.headers.delete("set-cookie");for(let s of r)e.headers.append("set-cookie",s)}else e.headers.set(t,n)}this.#e=e,this.finalized=!0}render=(...e)=>(this.#l??=t=>this.html(t),this.#l(...e));setLayout=e=>this.#d=e;getLayout=()=>this.#d;setRenderer=e=>{this.#l=e};header=(e,t,n)=>{this.finalized&&(this.#e=de(this.#e.body,this.#e));let r=this.#e?this.#e.headers:this.#i??=new Headers;t===void 0?r.delete(e):n?.append?r.append(e,t):r.set(e,t)};status=e=>{this.#o=e};set=(e,t)=>{this.#n??=new Map,this.#n.set(e,t)};get=e=>this.#n?this.#n.get(e):void 0;get var(){return this.#n?Object.fromEntries(this.#n):{}}#a(e,t,n){let r=this.#e?new Headers(this.#e.headers):this.#i??new Headers;if(typeof t=="object"&&"headers"in t){let o=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[i,a]of o)i.toLowerCase()==="set-cookie"?r.append(i,a):r.set(i,a)}if(n)for(let[o,i]of Object.entries(n))if(typeof i=="string")r.set(o,i);else{r.delete(o);for(let a of i)r.append(o,a)}let s=typeof t=="number"?t:t?.status??this.#o;return de(e,{status:s,headers:r})}newResponse=(...e)=>this.#a(...e);body=(e,t,n)=>this.#a(e,t,n);text=(e,t,n)=>!this.#i&&!this.#o&&!t&&!n&&!this.finalized?new Response(e):this.#a(e,t,Me(fr,n));json=(e,t,n)=>this.#a(JSON.stringify(e),t,Me("application/json",n));html=(e,t,n)=>{let r=s=>this.#a(s,t,Me("text/html; charset=UTF-8",n));return typeof e=="object"?$e(e,ht.Stringify,!1,{}).then(r):r(e)};redirect=(e,t)=>{let n=String(e);return this.header("Location",/[^\x00-\xFF]/.test(n)?encodeURI(n):n),this.newResponse(null,t??302)};notFound=()=>(this.#c??=()=>de(),this.#c(this))};var ue="ALL",yt="all",bt=["get","post","put","delete","options","patch"];var vt=class extends Error{};var wt="__COMPOSED_HANDLER";var mr=e=>e.text("404 Not Found",404),xt=(e,t)=>{if("getResponse"in e){let n=e.getResponse();return t.newResponse(n.body,n)}return console.error(e),t.text("Internal Server Error",500)},kt=class _t{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath="/";#t="/";routes=[];constructor(t={}){[...bt,yt].forEach(o=>{this[o]=(i,...a)=>(typeof i=="string"?this.#t=i:this.#o(o,this.#t,i),a.forEach(l=>{this.#o(o,this.#t,l)}),this)}),this.on=(o,i,...a)=>{for(let l of[i].flat()){this.#t=l;for(let c of[o].flat())a.map(d=>{this.#o(c.toUpperCase(),this.#t,d)})}return this},this.use=(o,...i)=>(typeof o=="string"?this.#t=o:(this.#t="*",i.unshift(o)),i.forEach(a=>{this.#o(ue,this.#t,a)}),this);let{strict:r,...s}=t;Object.assign(this,s),this.getPath=r??!0?t.getPath??Oe:dt}#r(){let t=new _t({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,t.#n=this.#n,t.routes=this.routes,t}#n=mr;errorHandler=xt;route(t,n){let r=this.basePath(t);return n.routes.map(s=>{let o;n.errorHandler===xt?o=s.handler:(o=async(i,a)=>(await Ce([],n.errorHandler)(i,()=>s.handler(i,a))).res,o[wt]=s.handler),r.#o(s.method,s.path,o,s.basePath)}),this}basePath(t){let n=this.#r();return n._basePath=X(this._basePath,t),n}onError=t=>(this.errorHandler=t,this);notFound=t=>(this.#n=t,this);mount(t,n,r){let s,o;r&&(typeof r=="function"?o=r:(o=r.optionHandler,r.replaceRequest===!1?s=l=>l:s=r.replaceRequest));let i=o?l=>{let c=o(l);return Array.isArray(c)?c:[c]}:l=>{let c;try{c=l.executionCtx}catch{}return[l.env,c]};s||=(()=>{let l=X(this._basePath,t),c=l==="/"?0:l.length;return d=>{let u=new URL(d.url);return u.pathname=this.getPath(d).slice(c)||"/",new Request(u,d)}})();let a=async(l,c)=>{let d=await n(s(l.req.raw),...i(l));if(d)return d;await c()};return this.#o(ue,X(t,"*"),a),this}#o(t,n,r,s){t=t.toUpperCase(),n=X(this._basePath,n);let o={basePath:s!==void 0?X(this._basePath,s):this._basePath,path:n,method:t,handler:r};this.router.add(t,n,[r,o]),this.routes.push(o)}#s(t,n){if(t instanceof Error)return this.errorHandler(t,n);throw t}#e(t,n,r,s){if(s==="HEAD")return(async()=>new Response(null,await this.#e(t,n,r,"GET")))();let o=this.getPath(t,{env:r}),i=this.router.match(s,o),a=new gt(t,{path:o,matchResult:i,env:r,executionCtx:n,notFoundHandler:this.#n});if(i[0].length===1){let c;try{c=i[0][0][0][0](a,async()=>{a.res=await this.#n(a)})}catch(d){return this.#s(d,a)}return c instanceof Promise?c.then(d=>d||(a.finalized?a.res:this.#n(a))).catch(d=>this.#s(d,a)):c??this.#n(a)}let l=Ce(i[0],this.errorHandler,this.#n);return(async()=>{try{let c=await l(a);if(!c.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return c.res}catch(c){return this.#s(c,a)}})()}fetch=(t,...n)=>this.#e(t,n[1],n[0],t.method);request=(t,n,r,s)=>t instanceof Request?this.fetch(n?new Request(t,n):t,r,s):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${X("/",t)}`,n),r,s));fire=()=>{addEventListener("fetch",t=>{t.respondWith(this.#e(t.request,t,void 0,t.request.method))})}};var hr=Object.create(null),De=class{name="PatternRouter";#t=[];add(e,t,n){let r=t.at(-1)==="*";r&&(t=t.slice(0,-2)),t.at(-1)==="?"&&(t=t.slice(0,-1),this.add(e,t.replace(/\/[^/]+$/,""),n));let s=(t.match(/\/?(:\w+(?:{(?:(?:{[\d,]+})|[^}])+})?)|\/?[^\/\?]+/g)||[]).map(o=>{let i=o.match(/^\/:([^{]+)(?:{(.*)})?/);return i?`/(?<${i[1]}>${i[2]||"[^/]+"})`:o==="/*"?"/[^/]+":o.replace(/[.\\+*[^\]$()]/g,"\\$&")});try{this.#t.push([new RegExp(`^${s.join("")}${r?"":"/?$"}`),e,n])}catch{throw new vt}}match(e,t){let n=[];for(let r=0,s=this.#t.length;r<s;r++){let[o,i,a]=this.#t[r];if(i===e||i===ue){let l=o.exec(t);l&&n.push([a,l.groups||hr])}}return[n]}};var At=class extends kt{constructor(e={}){super(e),this.router=new De}};var Et=e=>{let t={origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[],...e},n=(s=>typeof s=="string"?s==="*"?()=>s:o=>s===o?o:null:typeof s=="function"?s:o=>s.includes(o)?o:null)(t.origin),r=(s=>typeof s=="function"?s:Array.isArray(s)?()=>s:()=>[])(t.allowMethods);return async function(o,i){function a(c,d){o.res.headers.set(c,d)}let l=await n(o.req.header("origin")||"",o);if(l&&a("Access-Control-Allow-Origin",l),t.credentials&&a("Access-Control-Allow-Credentials","true"),t.exposeHeaders?.length&&a("Access-Control-Expose-Headers",t.exposeHeaders.join(",")),o.req.method==="OPTIONS"){t.origin!=="*"&&a("Vary","Origin"),t.maxAge!=null&&a("Access-Control-Max-Age",t.maxAge.toString());let c=await r(o.req.header("origin")||"",o);c.length&&a("Access-Control-Allow-Methods",c.join(","));let d=t.allowHeaders;if(!d?.length){let u=o.req.header("Access-Control-Request-Headers");u&&(d=u.split(/\s*,\s*/))}return d?.length&&(a("Access-Control-Allow-Headers",d.join(",")),o.res.headers.append("Vary","Access-Control-Request-Headers")),o.res.headers.delete("Content-Length"),o.res.headers.delete("Content-Type"),new Response(null,{headers:o.res.headers,status:204,statusText:"No Content"})}await i(),t.origin!=="*"&&o.header("Vary","Origin",{append:!0})}};var Tt=/^[\w!#$%&'*.^`|~+-]+$/,gr=/^[ !#-:<-[\]-~]*$/,St=e=>{let t=0,n=e.length;for(;t<n;){let r=e.charCodeAt(t);if(r!==32&&r!==9)break;t++}for(;n>t;){let r=e.charCodeAt(n-1);if(r!==32&&r!==9)break;n--}return t===0&&n===e.length?e:e.slice(t,n)},je=(e,t)=>{if(t&&e.indexOf(t)===-1)return{};let n=e.split(";"),r=Object.create(null);for(let s of n){let o=s.indexOf("=");if(o===-1)continue;let i=St(s.substring(0,o));if(t&&t!==i||!Tt.test(i)||i in r)continue;let a=St(s.substring(o+1));if(a.startsWith('"')&&a.endsWith('"')&&(a=a.slice(1,-1)),gr.test(a)&&(r[i]=a.indexOf("%")!==-1?ne(a,ce):a,t))break}return r};var yr=(e,t,n={})=>{if(!Tt.test(e))throw new Error("Invalid cookie name");let r=`${e}=${t}`;if(e.startsWith("__Secure-")&&!n.secure)throw new Error("__Secure- Cookie must have Secure attributes");if(e.startsWith("__Host-")){if(!n.secure)throw new Error("__Host- Cookie must have Secure attributes");if(n.path!=="/")throw new Error('__Host- Cookie must have Path attributes with "/"');if(n.domain)throw new Error("__Host- Cookie must not have Domain attributes")}for(let s of["domain","path","sameSite","priority"])if(n[s]&&/[;\r\n]/.test(n[s]))throw new Error(`${s} must not contain ";", "\\r", or "\\n"`);if(n&&typeof n.maxAge=="number"&&n.maxAge>=0){if(n.maxAge>3456e4)throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");r+=`; Max-Age=${n.maxAge|0}`}if(n.domain&&n.prefix!=="host"&&(r+=`; Domain=${n.domain}`),n.path&&(r+=`; Path=${n.path}`),n.expires){if(n.expires.getTime()-Date.now()>3456e7)throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");r+=`; Expires=${n.expires.toUTCString()}`}if(n.httpOnly&&(r+="; HttpOnly"),n.secure&&(r+="; Secure"),n.sameSite&&(r+=`; SameSite=${n.sameSite.charAt(0).toUpperCase()+n.sameSite.slice(1)}`),n.priority&&(r+=`; Priority=${n.priority.charAt(0).toUpperCase()+n.priority.slice(1)}`),n.partitioned){if(!n.secure)throw new Error("Partitioned Cookie must have Secure attributes");r+="; Partitioned"}return r},be=(e,t,n)=>(t=encodeURIComponent(t),yr(e,t,n));var re=(e,t,n)=>{let r=e.req.raw.headers.get("Cookie");if(typeof t=="string"){if(!r)return;let o=t;return n==="secure"?o="__Secure-"+t:n==="host"&&(o="__Host-"+t),je(r,o)[o]}return r?je(r):{}};var br=(e,t,n)=>{let r;return n?.prefix==="secure"?r=be("__Secure-"+e,t,{path:"/",...n,secure:!0}):n?.prefix==="host"?r=be("__Host-"+e,t,{...n,path:"/",secure:!0,domain:void 0}):r=be(e,t,{path:"/",...n}),r},Ke=(e,t,n,r)=>{let s=br(t,n,r);e.header("Set-Cookie",s,{append:!0})};var Ne=(e,t,n)=>{let r=re(e,t,n?.prefix);return Ke(e,t,"",{...n,maxAge:0}),r};function vr(e){let t=2166136261;for(let n=0;n<e.length;n++)t^=e.charCodeAt(n),t=Math.imul(t,16777619);return(t>>>0).toString(36)+"-"+e.length.toString(36)}var Ue=`
/* 中文说明：统一首页、登录页和管理页的设计语言（现代简约工程师工作台风格）。 */
:root {
  --color-paper: oklch(98.5% 0.004 250);
  --color-paper-a: oklch(98.5% 0.004 250 / .94);
  --color-paper-2: oklch(96.7% 0.006 250);
  --color-paper-3: oklch(94.8% 0.008 250);
  --color-ink: oklch(22% 0.020 258);
  --color-ink-2: oklch(34% 0.018 257);
  --color-muted: oklch(49% 0.016 255);
  --color-rule: oklch(89% 0.010 252);
  --color-rule-2: oklch(82% 0.014 252);
  --color-accent: oklch(52% 0.205 256);
  --color-accent-hover: oklch(46% 0.195 256);
  --color-accent-soft: oklch(94% 0.030 256);
  --color-accent-ink: oklch(99% 0.003 250);
  --color-focus: oklch(44% 0.180 256);
  --color-success: oklch(45% 0.120 158);
  --color-success-soft: oklch(95% 0.025 158);
  --color-success-ink: oklch(34% 0.092 158);
  --color-danger: oklch(50% 0.185 25);
  --color-danger-soft: oklch(96% 0.022 25);
  --color-danger-ink: oklch(38% 0.145 25);
  --color-graphite: oklch(22% 0.016 260);
  --color-graphite-rule: oklch(38% 0.020 258);
  --color-graphite-ink: oklch(92% 0.010 250);
  --color-overlay: oklch(18% 0.020 258 / .48);
  --shadow-panel: 0 18px 48px oklch(20% 0.020 258 / .10);
  --shadow-float: 0 8px 24px oklch(20% 0.020 258 / .12);

  --font-display: 'Space Grotesk', 'SF Pro Display', sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;

  --space-3xs: .25rem;
  --space-2xs: .5rem;
  --space-xs: .75rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;
  --space-2xl: 4rem;
  --space-3xl: 6rem;

  --text-xs: .75rem;
  --text-sm: .875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.75rem;
  --text-2xl: clamp(2.25rem, 5vw, 4.5rem);

  --radius-control: .375rem;
  --radius-panel: .625rem;
  --radius-round: 999px;
  --control-h: 2.75rem;
  --control-h-sm: 2rem;
  --shell: 74rem;
  --ease-out: cubic-bezier(.16, 1, .3, 1);
  --dur-fast: 160ms;
  --dur-panel: 260ms;

}

*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; min-width: 0; overflow-x: clip; scroll-behavior: smooth; }
body {
  min-height: 100dvh;
  background: var(--color-paper-2);
  color: var(--color-ink-2);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.6;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
button, input, textarea, select { font: inherit; }
button, a, input, select, textarea { -webkit-tap-highlight-color: transparent; }
a { color: inherit; }
h1, h2, h3, p, figure, dl, dd { margin: 0; }
h1, h2, h3 { color: var(--color-ink); font-family: var(--font-display); font-style: normal; font-weight: 600; letter-spacing: -.025em; line-height: 1.12; overflow-wrap: anywhere; min-width: 0; }
code, pre { font-family: var(--font-mono); }
fieldset { min-width: 0; }
html:focus-within { scroll-behavior: smooth; }
:target { scroll-margin-top: var(--space-lg); }
:focus { outline: 0; }
:focus-visible { outline: .125rem solid var(--color-focus); outline-offset: .125rem; }
::selection { background: var(--color-accent-soft); color: var(--color-ink); }

.shell { width: min(100% - calc(var(--space-sm) * 2), var(--shell)); margin-inline: auto; }
.site-page { display: flex; min-height: 100dvh; flex-direction: column; }
.site-page > main { flex: 1; }
.hd { display: none !important; }
.sr-only { position: absolute; width: .0625rem; height: .0625rem; padding: 0; margin: -.0625rem; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

/* shared navigation */
.topbar { position: sticky; inset-block-start: 0; z-index: 100; min-height: 4rem; border-block-end: .0625rem solid var(--color-rule); background: var(--color-paper-a); color: var(--color-ink); backdrop-filter: blur(.75rem); }
.topbar__inner { min-height: 4rem; display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); }
.brand { min-width: 0; display: inline-flex; align-items: center; gap: var(--space-2xs); color: var(--color-ink); text-decoration: none; white-space: nowrap; }
.brand__mark { width: 2rem; height: 2rem; flex: 0 0 auto; display: grid; place-items: center; border: .0625rem solid var(--color-rule-2); border-radius: var(--radius-control); background: var(--color-paper); color: var(--color-accent); }
.brand__name, .brand strong { font-family: var(--font-display); font-size: var(--text-md); font-weight: 600; letter-spacing: -.02em; }
.brand__descriptor, .brand small { color: var(--color-muted); font-family: var(--font-mono); font-size: .625rem; font-weight: 500; letter-spacing: .08em; }
.topbar__actions { display: flex; align-items: center; gap: var(--space-2xs); }

/* buttons and controls */
.btn, .icon-btn, .model-token, .password-toggle, .admin-nav__link, .ps {
  border: .0625rem solid transparent;
  border-radius: var(--radius-control);
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--dur-fast) ease, border-color var(--dur-fast) ease, color var(--dur-fast) ease, transform var(--dur-fast) ease;
}
.btn { min-height: var(--control-h-sm); padding-inline: var(--space-sm); display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2xs); font-size: var(--text-sm); font-weight: 600; line-height: 1; }
.btn-p { border-color: var(--color-accent); background: var(--color-accent); color: var(--color-accent-ink); }
.btn-s { border-color: var(--color-rule-2); background: var(--color-paper); color: var(--color-ink-2); }
.btn-gh { border-color: transparent; background: transparent; color: var(--color-muted); }
.btn-d { border-color: var(--color-danger-soft); background: var(--color-danger-soft); color: var(--color-danger-ink); }
.icon-btn, .password-toggle { width: var(--control-h-sm); height: var(--control-h-sm); flex: 0 0 var(--control-h-sm); display: inline-grid; place-items: center; border-color: transparent; background: transparent; color: var(--color-muted); }
.icon-btn span { font-family: var(--font-body); font-size: var(--text-xs); }
.copy-control[data-state='success'] { border-color: var(--color-success); color: var(--color-success-ink); }
.copy-control[data-state='error'] { border-color: var(--color-danger); color: var(--color-danger-ink); }
.btn:active, .icon-btn:active, .model-token:active, .password-toggle:active, .ps:active { transform: translateY(.0625rem); }
.btn:disabled, .btn[aria-disabled='true'], .icon-btn:disabled, input:disabled, select:disabled { opacity: .55; cursor: not-allowed; }
.btn[data-state='loading'] .button-label { display: none; }
.btn:not([data-state='loading']) .button-loading { display: none; }
.btn[data-state='success'] { border-color: var(--color-success); background: var(--color-success); color: var(--color-paper); }
.button-loading { display: inline-flex; align-items: center; gap: var(--space-2xs); }

/* form controls */
input, textarea, select {
  width: 100%; height: var(--control-h); padding-inline: var(--space-xs); border: .0625rem solid var(--color-rule-2); border-radius: var(--radius-control); outline: .125rem solid transparent; outline-offset: .0625rem; background: var(--color-paper); color: var(--color-ink); transition: background-color var(--dur-fast) ease, border-color var(--dur-fast) ease;
}
input::placeholder, textarea::placeholder { color: var(--color-muted); opacity: .82; }
input:focus-visible, textarea:focus-visible, select:focus-visible { border-color: var(--color-ink-2); outline: .125rem solid var(--color-focus); outline-offset: .0625rem; }
input[aria-invalid='true'], textarea[aria-invalid='true'], select[aria-invalid='true'] { border-color: var(--color-danger); background: var(--color-danger-soft); }
textarea { min-height: 6rem; padding-block: var(--space-xs); resize: vertical; }
label, legend { color: var(--color-ink-2); font-size: var(--text-xs); font-weight: 600; }
.fg { min-width: 0; margin-block-end: var(--space-sm); }
.fg > label { display: block; margin-block-end: var(--space-2xs); }
.form-helper { min-height: 1lh; margin-block-start: var(--space-3xs); color: var(--color-muted); font-size: var(--text-xs); }
.input-wrap { position: relative; }
.input-wrap > i { position: absolute; inset-inline-start: var(--space-xs); inset-block-start: 50%; z-index: 1; color: var(--color-muted); transform: translateY(-50%); }
.input-wrap input { padding-inline-start: var(--space-xl); padding-inline-end: var(--space-xl); }
.password-toggle { position: absolute; inset-inline-end: 0; inset-block-start: 0; }
.select-sm { height: var(--control-h); }
.fr { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 var(--space-sm); }
.form-group { margin: 0 0 var(--space-md); padding: var(--space-sm); border: .0625rem solid var(--color-rule); border-radius: var(--radius-control); }
.form-group legend { padding-inline: var(--space-2xs); }
.field-row { min-width: 0; flex-wrap: nowrap; }
.field-row input { min-width: 0; }
/* 纯图标按钮相邻时收紧间距（负外边距抵消 .fc 的 gap） */
.fc > .icon-btn + .icon-btn { margin-inline-start: calc(var(--space-3xs) - var(--space-2xs)); }

/* switch */
.tg { position: relative; display: inline-block; width: 2.5rem; height: var(--control-h); flex: 0 0 2.5rem; margin: 0; }
.tg input { position: absolute; opacity: 0; width: .0625rem; height: .0625rem; }
.tg .sl { position: absolute; inset-inline: 0; inset-block-start: .8125rem; height: 1.125rem; border-radius: var(--radius-round); background: var(--color-rule-2); cursor: pointer; transition: background-color var(--dur-fast) ease; }
.tg .sl::before { content: ''; position: absolute; width: .75rem; height: .75rem; inset-inline-start: .1875rem; inset-block-start: .1875rem; border-radius: 50%; background: var(--color-paper); box-shadow: 0 .0625rem .125rem var(--color-overlay); transition: transform var(--dur-fast) var(--ease-out); }
.tg input:checked + .sl { background: var(--color-accent); }
.tg input:checked + .sl::before { transform: translateX(1.375rem); }
.tg input:focus-visible + .sl { outline: .125rem solid var(--color-focus); outline-offset: .125rem; }
.tg input:disabled + .sl { opacity: .55; cursor: not-allowed; }

/* home workbench */
.home-page { background: var(--color-paper); }
.home-hero { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-xl); padding-block: var(--space-2xl); }
.home-hero__copy { align-self: center; min-width: 0; }
.eyebrow { margin-block-end: var(--space-sm); display: flex; align-items: center; gap: var(--space-2xs); color: var(--color-muted); font-family: var(--font-mono); font-size: .6875rem; font-weight: 600; letter-spacing: .08em; }
.eyebrow > span { width: .75rem; height: .125rem; background: var(--color-accent); }
.home-hero h1 { max-width: 12ch; font-size: var(--text-2xl); }
.home-hero__lede { max-width: 60ch; margin-block-start: var(--space-md); color: var(--color-muted); font-size: var(--text-md); }
.endpoint-box { max-width: 40rem; margin-block-start: var(--space-lg); display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; border: .0625rem solid var(--color-rule-2); border-radius: var(--radius-control); background: var(--color-paper-2); }
.endpoint-box__label { grid-column: 1 / -1; padding: var(--space-2xs) var(--space-xs) 0; color: var(--color-muted); font-family: var(--font-mono); font-size: .625rem; font-weight: 600; letter-spacing: .08em; }
.endpoint-box code { min-width: 0; padding: var(--space-2xs) var(--space-xs) var(--space-xs); overflow: hidden; color: var(--color-ink); font-size: var(--text-xs); text-overflow: ellipsis; white-space: nowrap; }
.endpoint-box .icon-btn { width: auto; padding-inline: var(--space-sm); display: flex; gap: var(--space-2xs); border-inline-start-color: var(--color-rule); border-radius: 0; }
.request-panel { min-width: 0; overflow: clip; border: .0625rem solid var(--color-graphite-rule); border-radius: var(--radius-panel); background: var(--color-graphite); color: var(--color-graphite-ink); box-shadow: var(--shadow-panel); }
.request-panel figcaption, .request-panel__foot { min-height: 3rem; padding-inline: var(--space-sm); display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); border-block-end: .0625rem solid var(--color-graphite-rule); color: var(--color-graphite-ink); font-family: var(--font-mono); font-size: .625rem; letter-spacing: .04em; }
.protocol-state { display: inline-flex; align-items: center; gap: var(--space-2xs); color: var(--color-graphite-ink); white-space: nowrap; }
.protocol-state i { width: .4375rem; height: .4375rem; border-radius: 50%; background: var(--color-success); }
.request-panel pre { margin: 0; min-height: 18rem; padding: var(--space-md); overflow: auto; background: var(--color-graphite); color: var(--color-graphite-ink); font-size: clamp(.6875rem, 2vw, .8125rem); line-height: 1.8; }
.request-panel pre code { white-space: pre; }
.syntax-command, .syntax-key { color: oklch(75% 0.130 256); }
.syntax-string { color: oklch(83% 0.060 154); }
.request-panel__foot { border-block-start: .0625rem solid var(--color-graphite-rule); border-block-end: 0; color: oklch(72% 0.012 250); }
.request-panel__foot code { color: var(--color-graphite-ink); }
.metrics-strip { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border-block: .0625rem solid var(--color-rule); }
.metric { min-width: 0; padding-block: var(--space-md); display: flex; flex-direction: column; gap: var(--space-3xs); border-inline-end: .0625rem solid var(--color-rule); }
.metric:nth-child(even) { border-inline-end: 0; }
.metric:nth-child(n+3) { border-block-start: .0625rem solid var(--color-rule); }
.metric__value { color: var(--color-ink); font-family: var(--font-display); font-size: var(--text-xl); font-weight: 600; line-height: 1; }
.metric__label { color: var(--color-muted); font-size: var(--text-xs); }
.directory { padding-block: var(--space-2xl) var(--space-3xl); }
.section-heading { margin-block-end: var(--space-lg); display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-sm); align-items: end; }
.section-heading h2 { font-size: var(--text-xl); }
.section-heading p { max-width: 65ch; margin-block-start: var(--space-2xs); color: var(--color-muted); }
.search-field { position: relative; width: 100%; }
.search-field > i { position: absolute; inset-inline-start: var(--space-xs); inset-block-start: 50%; color: var(--color-muted); transform: translateY(-50%); }
.search-field input { padding-inline-start: var(--space-lg); }
.provider-index { border-block-start: .0625rem solid var(--color-rule-2); }
.provider-row { min-width: 0; padding-block: var(--space-md); display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-md); align-items: start; border-block-end: .0625rem solid var(--color-rule); }
.provider-row__identity { min-width: 0; display: flex; align-items: center; gap: var(--space-xs); }
.provider-row__mark, .provider-avatar { width: 2.5rem; height: 2.5rem; flex: 0 0 auto; display: grid; place-items: center; border: .0625rem solid var(--color-rule-2); border-radius: var(--radius-control); background: var(--color-paper-2); color: var(--color-ink); font-family: var(--font-display); font-weight: 600; }
.provider-row h3 { font-size: var(--text-md); }
.provider-row__identity p { margin-block-start: var(--space-3xs); display: flex; flex-wrap: wrap; gap: var(--space-2xs); color: var(--color-muted); font-size: var(--text-xs); }
.provider-row__identity code { color: var(--color-ink-2); }
.provider-row__models { min-width: 0; display: flex; flex-wrap: wrap; gap: var(--space-2xs); }
.model-token { max-width: 100%; min-height: var(--control-h-sm); padding-inline: var(--space-xs); display: inline-flex; align-items: center; gap: var(--space-2xs); border-color: var(--color-rule); background: var(--color-paper-2); color: var(--color-ink-2); }
.model-token code { overflow: hidden; font-size: var(--text-xs); text-overflow: ellipsis; white-space: nowrap; }
.model-token i { color: var(--color-muted); }
.status-badge, .bd, .protocol-chip, .status-dot { display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2xs); width: max-content; min-height: 1.75rem; padding-inline: var(--space-xs); border-radius: var(--radius-round); font-size: var(--text-xs); font-weight: 600; white-space: nowrap; }
.status-badge i, .status-dot i { width: .4375rem; height: .4375rem; border-radius: 50%; background: currentColor; }
.status-badge--on, .bd-on, .status-dot--online { background: var(--color-success-soft); color: var(--color-success-ink); }
.bd-off { background: var(--color-paper-3); color: var(--color-muted); }
.protocol-chip { background: var(--color-accent-soft); color: var(--color-focus); }
/* 删除类徽标按钮：形状同 .bd 胶囊，颜色保持危险态 */
.bd-del { border: .0625rem solid transparent; background: var(--color-danger-soft); color: var(--color-danger-ink); font-family: inherit; cursor: pointer; transition: background-color var(--dur-fast) ease, color var(--dur-fast) ease; }
.bd-del:hover { background: var(--color-danger); color: var(--color-paper); }
.empty-inline { color: var(--color-muted); font-size: var(--text-xs); }
.empty-state { padding: var(--space-xl) var(--space-sm); display: flex; flex-direction: column; align-items: center; gap: var(--space-xs); border: .0625rem dashed var(--color-rule-2); border-radius: var(--radius-panel); background: var(--color-paper-2); color: var(--color-muted); text-align: center; }
.empty-state > i { font-size: var(--text-lg); color: var(--color-muted); }
.empty-state h3 { font-size: var(--text-md); }
.empty-state p { max-width: 55ch; }
.site-footer { border-block-start: .0625rem solid var(--color-rule); background: var(--color-paper-2); color: var(--color-muted); }
.admin-main > .site-footer { margin-block-start: auto; }
.site-footer__inner { padding-block: var(--space-md); display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-2xs); font-size: var(--text-xs); }
.site-footer a { text-underline-offset: .125rem; }
.site-footer__link { color: inherit; text-decoration: none; }

/* authentication split */
.auth-page { background: var(--color-paper); }
.auth-shell { width: min(100%, var(--shell)); min-height: calc(100dvh - 4rem); margin-inline: auto; display: grid; grid-template-columns: minmax(0, 1fr); }
.auth-context, .auth-form-wrap { min-width: 0; padding: var(--space-xl) var(--space-sm); }
.auth-context { display: flex; flex-direction: column; justify-content: center; border-block-end: .0625rem solid var(--color-rule); background: var(--color-paper-2); color: var(--color-ink-2); }
.auth-context h1 { max-width: 11ch; font-size: clamp(2.25rem, 6vw, 4rem); }
.auth-context > p:not(.eyebrow) { max-width: 58ch; margin-block-start: var(--space-md); color: var(--color-muted); font-size: var(--text-md); }
.auth-form-wrap { display: grid; place-items: center; background: var(--color-paper); color: var(--color-ink-2); }
.auth-form { width: min(100%, 27rem); }
.auth-form__heading { margin-block-end: var(--space-lg); display: flex; align-items: center; gap: var(--space-sm); }
.auth-form__icon, .panel-heading__mark { width: 2.75rem; height: 2.75rem; flex: 0 0 auto; display: grid; place-items: center; border: .0625rem solid var(--color-rule-2); border-radius: var(--radius-control); background: var(--color-paper-2); color: var(--color-accent); }
.auth-form h2 { font-size: var(--text-xl); }
.auth-form__heading p { margin-block-start: var(--space-3xs); color: var(--color-muted); }
.auth-form .al { margin-block-end: var(--space-sm); }
.btn-submit { width: 100%; margin-block-start: var(--space-sm); }

/* admin control plane */
.admin-page { background: var(--color-paper-2); }
.admin-shell { min-height: 100dvh; }
.admin-rail { display: none; }
.admin-main { min-width: 0; min-height: 100dvh; display: flex; flex-direction: column; }
.admin-topbar { position: sticky; inset-block-start: 0; z-index: 90; min-height: 4rem; padding-inline: var(--space-sm); display: flex; align-items: center; justify-content: space-between; gap: var(--space-2xs); border-block-end: .0625rem solid var(--color-rule); background: var(--color-paper-a); backdrop-filter: blur(.75rem); }
.admin-topbar nav { min-width: 0; display: flex; align-items: center; gap: var(--space-3xs); overflow-x: auto; }
.admin-topbar nav a { min-height: var(--control-h); padding-inline: var(--space-xs); display: inline-flex; align-items: center; color: var(--color-muted); font-size: var(--text-xs); font-weight: 600; text-decoration: none; white-space: nowrap; }
.admin-content { width: 100%; max-width: 82rem; margin-inline: auto; padding: var(--space-lg) var(--space-sm) var(--space-3xl); }
.admin-overview { margin-block-end: var(--space-xl); }
.admin-heading { margin-block-end: var(--space-lg); display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-md); align-items: end; }
.admin-heading h1 { font-size: clamp(2rem, 5vw, 3rem); }
.admin-heading > div > p:not(.eyebrow) { max-width: 65ch; margin-block-start: var(--space-2xs); color: var(--color-muted); }
.admin-heading__actions { display: flex; flex-wrap: wrap; gap: var(--space-2xs); }
.admin-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: .0625rem solid var(--color-rule); border-radius: var(--radius-panel); background: var(--color-paper); }
.admin-metrics > div { min-width: 0; padding: var(--space-sm); border-inline-end: .0625rem solid var(--color-rule); border-block-end: .0625rem solid var(--color-rule); }
.admin-metrics > div:nth-child(even) { border-inline-end: 0; }
.admin-metrics > div:nth-child(n+3) { border-block-end: 0; }
.admin-metrics > div > span:not(.status-dot) { color: var(--color-ink); font-family: var(--font-display); font-size: var(--text-xl); font-weight: 600; line-height: 1; }
.admin-metrics p { margin-block-start: var(--space-xs); color: var(--color-ink); font-weight: 600; }
.admin-metrics small { color: var(--color-muted); font-size: var(--text-xs); }
.workspace-section { margin-block-start: var(--space-xl); }
.section-heading--admin { padding-block-end: var(--space-md); border-block-end: .0625rem solid var(--color-rule); }
.section-heading--admin code { font-size: var(--text-xs); }
.af-w { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-sm); margin-block-end: var(--space-md); }
.add-form-panel, .mdl-list-panel { min-width: 0; padding: var(--space-md); border: .0625rem solid var(--color-rule-2); border-radius: var(--radius-panel); background: var(--color-paper-2); }
.panel-heading { margin-block-end: var(--space-md); display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-sm); }
.panel-heading > div { min-width: 0; display: flex; align-items: center; gap: var(--space-xs); }
.panel-heading h3 { font-size: var(--text-md); }
.panel-heading p { color: var(--color-muted); font-size: var(--text-xs); }
.mdl-list-panel { max-height: 36rem; overflow-y: auto; margin-bottom: 20px;}
.panel-actions, .detail-actions { display: flex; flex-direction: column; align-items: stretch; gap: var(--space-sm); }
.panel-actions > div, .detail-actions > div { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--space-2xs); }
.switch-label { min-height: var(--control-h); display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); }
.gp, .provider-list, .key-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-xs); }
.pi, .ki { min-width: 0; border: .0625rem solid var(--color-rule); border-radius: var(--radius-control); background: var(--color-paper); }
.ps { min-height: 4.75rem; padding: var(--space-xs); display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); cursor: pointer; }
.ps .l { min-width: 0; display: flex; align-items: center; gap: var(--space-xs); }
.ps .l > div { min-width: 0; }
.ps h3 { font-size: var(--text-md); }
.provider-chevron { width: 1rem; flex: 0 0 auto; color: var(--color-muted); transition: transform var(--dur-fast) var(--ease-out); }
.pu { margin-block-start: var(--space-3xs); display: flex; flex-wrap: wrap; gap: var(--space-2xs); color: var(--color-muted); font-size: var(--text-xs); }
.pu > *:not(:last-child)::after { content: '·'; margin-inline-start: var(--space-2xs); color: var(--color-rule-2); }
.pd { display: none; padding: var(--space-md); border-block-start: .0625rem solid var(--color-rule); background: var(--color-paper-2); }
.pd.open { display: block; }
.detail-heading { margin-block-end: var(--space-md); display: flex; align-items: center; justify-content: space-between; gap: var(--space-sm); }
.detail-heading h3 { font-size: var(--text-lg); }
.detail-heading p { margin-block-start: var(--space-3xs); color: var(--color-muted); font-size: var(--text-xs); }
.detail-actions { padding-block-start: var(--space-sm); border-block-start: .0625rem solid var(--color-rule); }
.detail-actions > div:first-child { flex: 1; justify-content: flex-start; }
.ki { padding: var(--space-sm); display: flex; flex-direction: column; gap: var(--space-sm); }
.key-main { min-width: 0; display: flex; align-items: flex-start; gap: var(--space-xs); }
.key-main > div { min-width: 0; }
.key-icon { width: 2.5rem; height: 2.5rem; flex: 0 0 auto; display: grid; place-items: center; border: .0625rem solid var(--color-rule); border-radius: var(--radius-control); background: var(--color-paper-2); color: var(--color-accent); }
.kv { min-width: 0; display: flex; align-items: center; gap: var(--space-3xs); color: var(--color-ink-2); font-family: var(--font-mono); font-size: var(--text-xs); }
.kv > span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kv .icon-btn { width: var(--control-h-sm); }
.key-main h3 { margin-block-start: var(--space-3xs); font-size: var(--text-sm); }
.key-main p { color: var(--color-muted); font-size: var(--text-xs); }
/* Key 名称与创建时间一行显示 */
.key-meta { min-width: 0; display: flex; align-items: baseline; gap: var(--space-2xs); }
.key-meta h3 { margin-block-start: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.key-meta p { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.key-meta__sep { color: var(--color-muted); flex: 0 0 auto; }
.key-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-2xs); }

/* feedback, model list and modal */
.al { min-height: var(--control-h); padding: var(--space-xs); display: flex; align-items: center; gap: var(--space-2xs); border: .0625rem solid transparent; border-radius: var(--radius-control); font-size: var(--text-xs); margin-top: 1.25rem; }
.al-s { border-color: var(--color-success); background: var(--color-success-soft); color: var(--color-success-ink); }
/* toast 里的 .al 已定位在右上角，再叠 20px 上边距会把它推离视口边缘 */
.toast .al { margin-top: 0; }
.al-e { border-color: var(--color-danger); background: var(--color-danger-soft); color: var(--color-danger-ink); }
.al-i { border-color: var(--color-accent); background: var(--color-accent-soft); color: var(--color-focus); }
.toast { position: fixed; inset-block-start: var(--space-sm); inset-inline-end: var(--space-sm); z-index: 9998; width: min(calc(100% - calc(var(--space-sm) * 2)), 24rem); box-shadow: var(--shadow-float); }
.modal-o { position: fixed; inset: 0; z-index: 9999; padding: var(--space-sm); display: grid; place-items: center; background: var(--color-overlay); color: var(--color-ink-2); }
.modal { width: min(100%, 27rem); max-height: min(80dvh, 40rem); overflow-y: auto; padding: var(--space-md); border: .0625rem solid var(--color-rule-2); border-radius: var(--radius-panel); background: var(--color-paper); color: var(--color-ink-2); box-shadow: var(--shadow-panel); animation: modal-in var(--dur-panel) var(--ease-out); }
.modal h3 { margin-block-end: var(--space-xs); font-size: var(--text-lg); }
.modal p { margin-block-end: var(--space-sm); color: var(--color-muted); }
.modal .fa { margin-block-start: var(--space-sm); display: flex; justify-content: flex-end; gap: var(--space-2xs); }
.mk { margin-block: var(--space-xs); padding: var(--space-sm); border: .0625rem solid var(--color-rule); border-radius: var(--radius-control); background: var(--color-paper-2); color: var(--color-ink); font-family: var(--font-mono); font-size: var(--text-xs); overflow-wrap: anywhere; user-select: all; }
.mdl-item { min-width: 0; min-height: var(--control-h-sm); padding-inline: var(--space-2xs); display: flex; align-items: center; gap: var(--space-2xs); border: .0625rem solid var(--color-rule); border-radius: var(--radius-control); background: var(--color-paper); color: var(--color-ink-2); font-size: var(--text-xs); }
.mdl-item .fx1 { min-width: 0; white-space: normal; overflow-wrap: anywhere; }
.mdl-item i:first-child { color: var(--color-muted); }
.mdl-add-btn { flex-shrink: 0; width: var(--control-h-sm); min-height: 0; font-size: var(--text-md); line-height: 2; }
.grid-2-gap6 { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--space-2xs); }
@keyframes modal-in { from { opacity: 0; transform: translateY(var(--space-xs)); } to { opacity: 1; transform: none; } }

/* compatibility utilities used by existing interaction code */
.fc { display: flex; align-items: center; gap: var(--space-2xs); }
.fx1 { flex: 1; min-width: 0; }
.fx-s0 { flex-shrink: 0; }
.mt-1 { margin-block-start: var(--space-3xs); }
.mb-3, .mb-4 { margin-block-end: var(--space-3xs); }
.c-p { color: var(--color-accent); }
.mu { color: var(--color-muted); }
.c-s { color: var(--color-success); }

/* 复制成功态需压过 .model-token i / .mdl-item i:first-child 的 muted 色（0,2,0 > 0,1,1） */
.model-token i.c-s, .mdl-item i.c-s, .mdl-item i:first-child.c-s { color: var(--color-success); }
.mu { font-size: var(--text-xs); }
.tc { text-align: center; }
.ov { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp { cursor: pointer; user-select: none; }

@media (hover: hover) and (pointer: fine) {
  .btn-p:hover { border-color: var(--color-accent-hover); background: var(--color-accent-hover); }
  .btn-s:hover, .btn-gh:hover, .icon-btn:hover, .password-toggle:hover { border-color: var(--color-rule-2); background: var(--color-paper-2); color: var(--color-ink); }
  .btn-d:hover { border-color: var(--color-danger); background: var(--color-danger); color: var(--color-paper); }
  input:hover, textarea:hover, select:hover { background: var(--color-paper-2); }
  .model-token:hover { border-color: var(--color-accent); color: var(--color-focus); }
  .provider-row:hover, .pi:hover, .ki:hover { border-color: var(--color-rule-2); }
  .ps:hover { background: var(--color-paper-2); }
  .admin-nav__link:hover { background: var(--color-paper-2); color: var(--color-ink); }
}

@media (min-width: 40rem) {
  .shell { width: min(100% - calc(var(--space-lg) * 2), var(--shell)); }
  .home-hero { padding-block: var(--space-3xl); }
  .metrics-strip { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .metric { padding-inline: var(--space-md); }
  .metric:first-child { padding-inline-start: 0; }
  .metric:last-child { border-inline-end: 0; }
  .metric:nth-child(even) { border-inline-end: .0625rem solid var(--color-rule); }
  .metric:nth-child(n+3) { border-block-start: 0; }
  .section-heading { grid-template-columns: minmax(0, 1fr) minmax(16rem, .45fr); }
  .provider-row { grid-template-columns: minmax(13rem, .7fr) minmax(0, 1.5fr) auto; align-items: center; }
  .site-footer__inner { flex-direction: row; align-items: center; justify-content: space-between; }
  .auth-context, .auth-form-wrap { padding: var(--space-2xl); }
  .fr { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .admin-content { padding-inline: var(--space-lg); }
  .admin-heading, .section-heading--admin { grid-template-columns: minmax(0, 1fr) auto; }
  .admin-heading__actions { justify-content: flex-end; }
  .admin-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .admin-metrics > div { border-block-end: 0; }
  .admin-metrics > div:nth-child(even) { border-inline-end: .0625rem solid var(--color-rule); }
  .admin-metrics > div:last-child { border-inline-end: 0; }
  .panel-actions, .detail-actions { flex-direction: row; align-items: center; justify-content: space-between; }
  .ki { flex-direction: row; align-items: center; justify-content: space-between; }
  .grid-2-gap6 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 60rem) {
  .home-hero { grid-template-columns: minmax(0, .9fr) minmax(28rem, 1.1fr); align-items: center; gap: var(--space-2xl); }
  .auth-shell { grid-template-columns: minmax(0, 1.05fr) minmax(25rem, .95fr); }
  .auth-context { border-block-end: 0; border-inline-end: .0625rem solid var(--color-rule); }
  .admin-shell { display: grid; grid-template-columns: 15rem minmax(0, 1fr); }
  .admin-rail { position: sticky; inset-block-start: 0; height: 100dvh; padding: var(--space-md) var(--space-sm); display: flex; flex-direction: column; border-inline-end: .0625rem solid var(--color-rule); background: var(--color-paper); color: var(--color-ink-2); }
  .admin-rail__brand { padding-inline: var(--space-xs); }
  .admin-rail__brand > span:last-child { display: flex; flex-direction: column; line-height: 1.2; }
  .admin-nav { margin-block-start: var(--space-xl); display: grid; gap: var(--space-3xs); }
  .admin-nav__link { min-height: var(--control-h); padding-inline: var(--space-xs); display: grid; grid-template-columns: 1.25rem minmax(0, 1fr) auto; align-items: center; gap: var(--space-2xs); color: var(--color-muted); font-weight: 600; }
  .admin-nav__link b { min-width: 1.5rem; padding-inline: var(--space-3xs); border-radius: var(--radius-round); background: var(--color-paper-3); color: var(--color-muted); font-family: var(--font-mono); font-size: .625rem; text-align: center; }
  .admin-nav__link.is-active { background: var(--color-accent-soft); color: var(--color-focus); }
  .admin-rail__foot { margin-block-start: auto; display: grid; gap: var(--space-3xs); }
  .admin-topbar { display: none; }
  .admin-content { padding-block-start: var(--space-xl); }
  .grid-2-gap6 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .pd { padding: var(--space-lg); }
}

@media (min-width: 80rem) {
  .admin-content { padding-inline: var(--space-xl); }
}

@media (max-width: 24rem) {
  .brand__descriptor { display: none; }
  .topbar__actions .btn-gh { display: none; }
  .topbar__actions .btn, .topbar--auth .btn { padding-inline: var(--space-xs); }
  .request-panel figcaption { align-items: flex-start; flex-direction: column; justify-content: center; gap: 0; }
  .protocol-state { font-size: .5625rem; }
  .workspace-section { padding: 0; }
  .provider-avatar { display: none; }
  .ps { align-items: flex-start; }
  .ps > .fc { flex-direction: column; align-items: flex-end; }
  .field-row { flex-wrap: wrap; }
  .field-row input { flex-basis: calc(100% - 3.5rem); }
  .field-row .btn { flex: 1; }
  .admin-topbar .brand__name { display: none; }
  .admin-heading__actions .btn { flex: 1; }
}

@media (pointer: coarse) {
  .btn, .model-token, .password-toggle, input, select { min-height: var(--control-h); }
  .icon-btn, .password-toggle { width: var(--control-h); height: var(--control-h); flex-basis: var(--control-h); }
}

@media (prefers-reduced-motion: reduce) {
  html, body { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
  .modal { transform: none; }
}
`,Rt=`/assets/app.css?v=${vr(Ue)}`;var W={title:"AI Gateway",subtitle:"统一的 AI 管理平台",author:"QingYun",authorUrl:"https://github.com/yutian81/ai-gateway",blogUrl:"https://blog.notett.com",description:"AI 提供商 API 代理网关 — 统一 /v1 接口转发",favicon:"https://pan.811520.xyz/icon/ai.webp",faCdn:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"},Le=10080*60,ve="sk_cf_",we="https://opencode.ai/inference/v1";function N(e){return e.replace(/\/zen\/v1\/?$/,"/inference/v1")}var Pt=300*1e3,Be=5,D={PROVIDERS:"providers",PROXY_KEYS:"proxy:keys",SESSION_PREFIX:"admin:session:",KEY_HEALTH_PREFIX:"key:health:",OPENCODE_MIGRATION:"migration:opencode-default:v1"},Ct={"30d":720*60*60,"90d":2160*60*60,"180d":4320*60*60,"1y":365*24*60*60,forever:null},It=[{id:"opencode",name:"OpenCode",baseUrl:"https://opencode.ai/inference/v1",apiType:"openai",apiKeys:[],models:[{id:"big-pickle",enabled:!0},{id:"mimo-v2.6-flash-free",enabled:!0},{id:"nemotron-3.5-lightning-free",enabled:!0},{id:"deepseek-v4.1-flash-free",enabled:!0},{id:"cat-jam-free",enabled:!0},{id:"space-bunny-free",enabled:!0},{id:"muse-spark-1.3-contributor-free",enabled:!0}],enabled:!0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];var wr=60*1e3,He=new Map;function xr(e){let t=He.get(e);if(t){if(Date.now()>=t.expiresAt){He.delete(e);return}return t.value}}function jt(e,t,n=wr){He.set(e,{value:t,expiresAt:Date.now()+n})}var Kt={[D.PROXY_KEYS]:5*1e3},Nt=e=>typeof e=="object"&&e!==null&&!Array.isArray(e),Ot=e=>({...e,enabled:e.enabled===!0}),$t=(e,t)=>e.map(n=>typeof n=="string"?{[t]:n,enabled:!0}:n).filter(Nt),kr=/^[A-Za-z0-9._-]+$/;function Ut(e,t){let n=t.filter(Nt);if(e===D.PROVIDERS){let r=[];for(let s of n){let o=Mt(s.id,"providers");o&&r.push({...s,id:o,name:String(s.name??""),baseUrl:typeof s.baseUrl=="string"?s.baseUrl:"",enabled:s.enabled===!0,models:Array.isArray(s.models)?$t(s.models,"id").map(Ot):[],apiKeys:Array.isArray(s.apiKeys)?$t(s.apiKeys,"key").map(i=>({...i,enabled:i.enabled===!0&&typeof i.key=="string"&&i.key.trim()!==""})):[]})}return r}if(e===D.PROXY_KEYS){let r=[];for(let s of n){let o=Mt(s.id,"转发 Key");o&&r.push(Ot({...s,id:o,key:String(s.key??""),name:String(s.name??"")}))}return r}return n}function Mt(e,t){if(typeof e!="string"&&typeof e!="number")return console.warn(`[storage] ${t} 条目缺少可用 id，已丢弃（无法寻址）`),null;let n=String(e).trim();if(!n)return console.warn(`[storage] ${t} 条目 id 为空，已丢弃（无法寻址）`),null;if(kr.test(n))return n;let r=n.replace(/[^A-Za-z0-9._-]/g,"-");return console.warn(`[storage] ${t} 条目 id "${n}" 含非法字符，已归一为 "${r}"`),r}async function Lt(e,t){let n=xr(t);if(n)return n;let r=await e.KV.get(t),s=[];if(r)try{let o=JSON.parse(r);Array.isArray(o)?s=Ut(t,o):console.warn(`[storage] KV 数据不是数组，已按空列表处理: ${t}`)}catch{console.warn(`[storage] KV 数据解析失败，已按空列表处理: ${t}`)}return jt(t,s,Kt[t]),s}async function Bt(e,t,n){let r=Ut(t,n);await e.KV.put(t,JSON.stringify(r)),jt(t,r,Kt[t])}var Dt=new Map;function Z(e,t){let n=(Dt.get(e)??Promise.resolve()).then(t,t);return Dt.set(e,n.catch(()=>{})),n}async function F(e){return(await Lt(e,D.PROVIDERS)).map(n=>{if(n.id==="opencode"&&n.baseUrl){let r=N(n.baseUrl);return r===n.baseUrl?n:{...n,baseUrl:r}}return n})}async function se(e,t){return(await F(e)).find(r=>r.id===t)??null}async function xe(e,t){await Bt(e,D.PROVIDERS,t)}function Ht(e,t){return Z(D.PROVIDERS,async()=>{let n=await F(e);return n.some(r=>r.id===t.id)?!1:(await xe(e,[...n,t]),!0)})}function qe(e,t,n){return Z(D.PROVIDERS,async()=>{let r=await F(e),s=r.findIndex(i=>i.id===t);if(s===-1)return null;let o={...r[s],...n,updatedAt:new Date().toISOString()};return await xe(e,r.map((i,a)=>a===s?o:i)),o})}function qt(e,t){return Z(D.PROVIDERS,async()=>{let n=await F(e),r=n.filter(s=>s.id!==t);return r.length===n.length?!1:(await xe(e,r),!0)})}async function Ft(e,t,n){let r=crypto.randomUUID(),s={username:t,expiresAt:Date.now()+n*1e3};return await e.KV.put(D.SESSION_PREFIX+r,JSON.stringify(s),{expirationTtl:n}),r}async function ke(e,t){let n=await e.KV.get(D.SESSION_PREFIX+t);if(!n)return null;let r=null;try{let s=JSON.parse(n);s&&typeof s=="object"&&(r=s)}catch{}return!r||typeof r.expiresAt!="number"||r.expiresAt<Date.now()?(await Fe(e,t),null):r}async function Fe(e,t){await e.KV.delete(D.SESSION_PREFIX+t)}async function J(e){return Lt(e,D.PROXY_KEYS)}async function ze(e,t){await Bt(e,D.PROXY_KEYS,t)}function We(e,t){return Z(D.PROXY_KEYS,async()=>{let n=await J(e);await ze(e,[...n,t])})}function zt(e,t){return Z(D.PROXY_KEYS,async()=>{let n=await J(e),r=n.filter(s=>s.id!==t);return r.length===n.length?!1:(await ze(e,r),!0)})}function Wt(e,t,n){return Z(D.PROXY_KEYS,async()=>{let r=await J(e),s=r.findIndex(i=>i.id===t);if(s===-1)return null;let o={...r[s],...n};return await ze(e,r.map((i,a)=>a===s?o:i)),o})}async function Jt(e,t){if(!t)return!1;let n=await J(e),r=Date.now();return n.some(s=>s.key!==t||!s.enabled?!1:s.expiresAt==null?!0:typeof s.expiresAt=="string"&&r<new Date(s.expiresAt).getTime())}async function Vt(e){let t=await F(e),n=t.find(o=>o.id==="opencode");if(n&&n.baseUrl&&n.baseUrl.includes("/zen/v1")&&await qe(e,"opencode",{baseUrl:N(n.baseUrl)}),n)return;let r=await e.KV.get(D.OPENCODE_MIGRATION),s=It.find(o=>o.id==="opencode");r||(s&&!t.some(o=>o.id===s.id)&&await Z(D.PROVIDERS,()=>xe(e,[...t,{...s,apiKeys:s.apiKeys.map(o=>({...o})),models:s.models.map(o=>({...o}))}])),await e.KV.put(D.OPENCODE_MIGRATION,"1")),t.length===0&&!r&&(await J(e)).length===0&&await We(e,{id:crypto.randomUUID(),key:`${ve}${crypto.randomUUID().replace(/-/g,"").substring(0,16)}`,name:"测试 Key",enabled:!0,createdAt:new Date().toISOString()})}async function _e(e){let n=new TextEncoder().encode(e),r=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(r)).map(o=>o.toString(16).padStart(2,"0")).join("")}function Yt(e,t){if(e.byteLength!==t.byteLength)return!1;let n=crypto.subtle;if(typeof n.timingSafeEqual=="function")return n.timingSafeEqual(e,t);let r=0;for(let s=0;s<e.byteLength;s++)r|=e[s]^t[s];return r===0}var _r=5,Ar=900*1e3,Er=400,Sr=Er;var V=new Map;function Tr(e,t){let n=V.get(e);return!!n&&n.until>t&&n.count>=_r}function Gt(e,t){let n=V.get(e),r=n&&n.until>t?n.count+1:1;if(V.set(e,{count:r,until:t+Ar}),V.size>1e3){for(let[s,o]of V)o.until<=t&&V.delete(s);for(let s of V.keys()){if(V.size<=1e3)break;V.delete(s)}}}async function Qt(e,t){let n=re(e,"session_id"),r=e.req.path;return n?await ke(e.env,n)?t():(Ne(e,"session_id",{path:"/"}),r.startsWith("/admin/api/")?e.json({success:!1,message:"Session 已过期"},401):e.redirect("/admin/login")):r==="/admin/login"?t():r.startsWith("/admin/api/")?e.json({success:!1,message:"未登录"},401):e.redirect("/admin/login")}var Xt=256,Rr=8*1024;async function Zt(e){let t=await e.req.text();if(t.length>Rr)return e.json({success:!1,message:"请求体过大"},413);let n=null;try{n=JSON.parse(t)}catch{return e.json({success:!1,message:"请求体必须是合法的 JSON"},400)}let r=n&&typeof n=="object"?n:null,s=typeof r?.username=="string"?r.username:"",o=typeof r?.password=="string"?r.password:"",{ADMIN_USERNAME:i,ADMIN_PASSWORD:a}=e.env;if(!i||!a)return e.json({success:!1,message:"未配置管理员账号，请在 Cloudflare 环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD"},503);let l=e.req.header("CF-Connecting-IP")||"unknown",c=Date.now();if(Tr(l,c))return e.json({success:!1,message:"登录失败次数过多，请 15 分钟后再试"},429);if(!s||!o)return e.json({success:!1,message:"请输入用户名和密码"},400);if(s.length>Xt||o.length>Xt)return Gt(l,c),e.json({success:!1,message:"用户名或密码错误"},401);let d=new TextEncoder,[u,g,v,S]=await Promise.all([_e(String(s)),_e(String(i)),_e(String(o)),_e(String(a))]),y=Yt(d.encode(u),d.encode(g)),A=Yt(d.encode(v),d.encode(S));if(!y||!A)return Gt(l,c),await new Promise(T=>setTimeout(T,Sr)),e.json({success:!1,message:"用户名或密码错误"},401);V.delete(l);let b=await Ft(e.env,s,Le);return Ke(e,"session_id",b,{httpOnly:!0,secure:!0,sameSite:"Strict",path:"/",maxAge:Le}),e.json({success:!0,message:"登录成功"})}async function en(e){let t=re(e,"session_id");return t&&(await Fe(e.env,t),Ne(e,"session_id",{path:"/"})),e.redirect("/")}async function tn(e,t){let n=e.req.header("Authorization"),r=n&&/^bearer\s+(.+)$/i.exec(n)?.[1];return r?await Jt(e.env,r)?t():e.json({error:{message:"API Key 无效或已禁用",type:"authentication_error"}},401):e.json({error:{message:"缺少或无效的 Authorization 头，格式: Bearer sk_cf_*",type:"authentication_error"}},401)}async function Je(e,t){let n=e.body?.getReader();if(!n)return new Uint8Array;let r=[],s=0;try{for(;;){let{done:a,value:l}=await n.read();if(a)break;if(s+=l.byteLength,s>t)return await n.cancel().catch(()=>{}),null;r.push(l)}}catch{}let o=new Uint8Array(s),i=0;for(let a of r)o.set(a,i),i+=a.byteLength;return o}async function nn(e,t){let n=await Je(e,t);return n===null?null:new TextDecoder().decode(n)}var Pr=`You are an AI agent running in OpenCode, a coding agent harness. Help the user accomplish their goals using the tools you have available.

# Harness
- Responses are rendered as GitHub-flavored Markdown.
- \`<system-reminder>\` blocks are harness instructions, not user-authored content. Read and follow them.
- Prefer parallelizing independent tool calls.
- Prefer dedicated tools over shell commands; fall back to the shell when a tool cannot do what you need.
- Do not chain shell commands with separators like \`echo "====";\` or \`printf '---'\`; the output becomes noisy in a way that makes the user's side of the conversation worse.
- Use the write tool to create files or completely replace their content. Prefer using the edit tool for targeted changes.
- Use the edit tool for targeted changes to existing text files. It replaces the exact text in \`oldString\` with \`newString\`, and the values must differ. By default, \`oldString\` must occur exactly once. If it occurs multiple times, include more surrounding context to make it unique or set \`replaceAll\` to true to replace every occurrence.

# Communication
- Use clear file paths when referring to files.
- Keep responses clear and concise, and avoid unnecessary technical jargon.

# Working in codebases
- Keep changes consistent with the structure, naming, style, and patterns of the surrounding code.
- Treat unfamiliar files or changes as potential user work and investigate before deleting or overwriting them.

# Your Model
- Name: {{MODEL_NAME}}
- Provider ID: opencode
- Model ID: {{MODEL_ID}}
# Code Mode

Use the \`execute\` tool to call the tools listed below. They cannot be called directly. They only work inside code you pass to \`execute\`.

The catalog is complete. Do not guess tool names.

## Available tools

- opencode (8 tools) // Tools for managing OpenCode itself, such as working with sessions and worktrees, searching the available models, and reading MCP resources.
  - tools.opencode.list_mcp_resources({
  /** MCP server name as configured. Omit to list every server. */
  server?: string,
}): Promise<{
  resources: Array<{
      server: string,
      name: string,
      uri: string,
      description?: string,
      mimeType?: string,
    }>,
  templates: Array<{
      server: string,
      name: string,
      uriTemplate: string,
      description?: string,
      mimeType?: string,
    }>,
}> // List documents, records, and other data exposed by MCP servers. Use this when the user refers to something that is no...
  - tools.opencode.models({
  /** Text to search for in model names and IDs. */
  query?: string,
  /** Provider ID or name to filter by. Try your own provider first. */
  provider?: string,
  /** Include older versions of each model family. By default only the newest version is listed. */
  all?: boolean,
  /** Maximum number of models to return. Defaults to 20. @integer @minimum 1 @maximum 100 */
  limit?: number,
  /** Number of models to skip, for paging through results. @integer @minimum 0 */
  offset?: number,
}): Promise<{
  /** Matching models grouped by provider. Your own provider comes first. */
  providers: Array<{
      id: string,
      name: string,
      /** Newest first. */
      models: Array<{
          /** providerID/modelID */
          id: string,
          name: string,
          /** Release date as a Unix timestamp in milliseconds, or 0 when unknown. */
          released: number,
          variants: Array<string>,
          /** Pricing in USD per million tokens. */
          cost: Array<{
              tier?: {
                type: "context",
                /** @integer */
                size: number,
              },
              input: number,
              output: number,
              cache: {
                read: number,
                write: number,
              },
            }>,
          status: "alpha" | "beta" | "deprecated" | "active",
        }>,
    }>,
  /** Number of matching models across all pages. @integer */
  total: number,
  /** Offset of the next page, or null on the last page. */
  next: number | null,
}> // Search the models available to use. Use this to turn a model name the user mentions into an exact reference before ru...
  - tools.opencode.read_mcp_resource({
  /** The server field of the discovered resource. */
  server: string,
  /** Exact resource URI from discovery, an expanded uriTemplate, or the user. */
  uri: string,
}): Promise<{
  server: string,
  uri: string,
  contents: Array<{
        type: "text",
        uri: string,
        text: string,
        mimeType?: string,
      } | {
        type: "blob",
        uri: string,
        blob: string,
        mimeType?: string,
      }>,
}> // Read one MCP resource by server and URI. Not for local files. Always return the full contents rather than slicing or ...
  - tools.opencode.session_move({
  /** Omit to move the current session. @pattern ^ses */
  sessionID?: string,
  /** Destination directory, relative to the target session's directory or absolute. Supports ~. @minLength 1 */
  directory: string,
}): Promise<{
  /** @pattern ^ses */
  sessionID: string,
  directory: string,
}> // Move a session to another directory, or omit sessionID to move the current session. The current session moves at the ...
  - tools.opencode.session_rename({
  /** Omit to rename the current session. @pattern ^ses */
  sessionID?: string,
  /** New session title. @minLength 1 */
  title: string,
}): Promise<{
  /** @pattern ^ses */
  sessionID: string,
  title: string,
}> // Rename a session, or omit sessionID to rename the current session. Use a short, specific title that summarizes the wo...
  - tools.opencode.worktree_create({
  name: string,
}): Promise<{
  directory: string,
}> // Create a named worktree. Returns its directory.
  - tools.opencode.worktree_list(): Promise<{
  worktrees: Array<{
      directory: string,
      strategy?: string,
    }>,
}> // List a repository's worktrees.
  - tools.opencode.worktree_remove({
  /** Absolute path of the worktree to remove. @minLength 1 */
  directory: string,
  /** Discard modified and untracked files. Only set this when the user has confirmed forced removal. */
  force?: boolean,
}): Promise<{
  directory: string,
  removed: boolean,
}> // Remove a worktree. The repository location selects configuration; directory identifies the worktree to remove.

Skills provide specialized instructions and workflows for specific tasks.
Use the skill tool to load a skill when a task matches its description.
The user may also invoke a skill directly. When that happens, its instructions appear in the conversation as a <skill_content> block, the same shape the skill tool returns. A skill that is already present this way does not need to be invoked again.

Today's date: {{DATE}}

Here is some useful information about the environment you are running in:
{{ENV}}
When you create a worktree outside the current working directory and intend to use it as your primary working directory, consider using \`execute\` to call \`tools.opencode.session_move\` and make the worktree the session's working directory.`,ae=["edit","glob","grep","question","read","shell","skill","subagent","webfetch","websearch","write","execute"],Cr={edit:{description:"Edit the contents of a file by finding and replacing exact text. When editing text from Read output, preserve the exact indentation (tabs or spaces) and omit the line-number prefix, such as `1: `. Never include the prefix in oldString or newString. Write line breaks as \\n; the file's existing CRLF or LF line endings are matched and preserved. To change line endings themselves, make oldString and newString differ only in \\r; that edit applies to the exact bytes. If there is no exact match, the edit retries while ignoring typographic quote, dash, and space variants, then trailing whitespace on each line. The edit fails if oldString is not found. By default, oldString must identify a UNIQUE location. Multiple matches FAIL unless replaceAll is true. Add more surrounding context to disambiguate, or set replaceAll to true to replace every occurrence. Use replaceAll when the change should apply to every occurrence, such as renaming a variable.",parameters:{type:"object",properties:{path:{type:"string",description:"File to edit"},oldString:{type:"string",description:"Exact text to find and replace"},newString:{type:"string",description:"Text to replace oldString with (must differ from oldString)"},replaceAll:{type:"boolean",description:"Whether to replace every occurrence of oldString. When false, oldString must match exactly once. Defaults to false."}},required:["path","oldString","newString"],additionalProperties:!1}},glob:{description:'Search file paths using a glob pattern (examples: "**/*.ts", "src/**/*.tsx").',parameters:{type:"object",properties:{pattern:{type:"string",description:"Glob pattern to match files against"},path:{type:"string",description:"Directory to search. Defaults to the current working directory."},hidden:{type:"boolean",description:"Include hidden files and directories (default: false)."},limit:{type:"integer",exclusiveMinimum:0,description:"Maximum number of matching files to return (default: 100)"}},required:["pattern"],additionalProperties:!1}},grep:{description:"Search file contents using ripgrep's regular expression syntax or literal text matching. Use it to locate specific code, symbols, or text patterns, and narrow searches with `path` or `include`. Returns matching file paths, line numbers, and line previews.",parameters:{type:"object",properties:{pattern:{type:"string",minLength:1,description:"Regular expression or literal text to match in file contents."},path:{type:"string",description:"File or directory to search. Defaults to the current working directory."},include:{type:"string",description:'Glob pattern to filter files (for example, "*.js" or "*.{ts,tsx}")'},literal:{type:"boolean",description:"Treat `pattern` as exact text instead of a regular expression (default: false)."},caseSensitive:{type:"boolean",description:"Use case-sensitive matching (default: true)."},limit:{type:"integer",exclusiveMinimum:0,description:"Maximum number of matching lines to return (default: 100)"}},required:["pattern"],additionalProperties:!1}},question:{description:`Use this tool when you need to ask the user questions during execution. This allows you to:
1. Gather user preferences or requirements
2. Clarify ambiguous instructions
3. Get decisions on implementation choices as you work
4. Offer choices to the user about what direction to take.

Usage notes:
- A "Type your own answer" option is added automatically; don't include a separate option for free form answers
- Set \`multiple: true\` to allow selecting more than one option
- If you recommend a specific option, make that the first option in the list and add "(Recommended)" at the end of the label`,parameters:{type:"object",properties:{questions:{type:"array",items:{type:"object",properties:{question:{type:"string",description:"Complete question"},header:{type:"string",description:"Very short label (max 30 chars)"},options:{type:"array",items:{type:"object",properties:{label:{type:"string",description:"Display text (1-5 words, concise)"},description:{type:"string",description:"Explanation of choice"}},required:["label","description"],additionalProperties:!1},description:"Available choices"},multiple:{type:"boolean"}},required:["question","header","options"],additionalProperties:!1},minItems:1,description:"Questions to ask"}},required:["questions"],additionalProperties:!1}},read:{description:"Read the contents of a file or directory. Supports text files, images, and PDFs. Images and PDFs are presented directly to the model. Each text line is prefixed by its 1-based line number as <line>: <content>. The prefix is for reference and is not part of the file content. Directory entries are returned one per line. Use offset and limit to read large files or directories in sections. Prefer one larger read over many small slices, and use grep to find specific content in large files.",parameters:{type:"object",properties:{path:{type:"string",description:"File or directory to read"},offset:{type:"integer",minimum:0,description:"The line or directory entry to start reading from (1-based)"},limit:{type:"integer",minimum:0,description:"The maximum number of lines or directory entries to read (defaults to and capped at 2000)"}},required:["path"],additionalProperties:!1}},shell:{description:"Execute a shell command and return its output. Commands run on Linux using bash. Quote file paths containing spaces or special characters. Prefer dedicated tools over shell commands when possible. When output is large, the full result is saved to a file and a truncated preview is returned. Rely on automatic truncation unless filtering the output is more useful. Commands accept an optional timeout, background commands have no timeout by default. Background commands return immediately, and you will be notified when they complete.",parameters:{type:"object",properties:{command:{type:"string",description:"Shell command string to execute"},workdir:{type:"string",description:"Working directory to execute the command in. Defaults to the current working directory. When possible, avoid changing directories in the command and set the working directory here instead."},timeout:{type:"integer",minimum:0,description:"Timeout in milliseconds. Set to 0 to disable the timeout. Defaults to 120000 for foreground commands. Background commands have no timeout by default."},background:{type:"boolean",description:"Run the command in the background and return immediately (useful for dev servers and long-running builds). You do not need to use '&' at the end of the command when using this parameter. You will be notified when it completes. DO NOT poll for completion."}},required:["command"],additionalProperties:!1}},skill:{description:`Load a specialized skill's instructions and resources into the current conversation when the task at hand matches its description.

The skill ID must match an available skill or a skill explicitly referenced by the user.`,parameters:{type:"object",properties:{id:{type:"string",description:"The ID of an available skill or a skill explicitly referenced by the user"}},required:["id"],additionalProperties:!1}},subagent:{description:`Spawns an agent in a child session to work on the specified task.
The output includes a sessionID you can pass back later to continue that specific conversation with the subagent.
New child sessions start with fresh context, so include all relevant context and instructions when you don't pass a sessionID.
Foreground (default) runs the subagent to completion and returns its final response.
Background mode (background=true) launches it asynchronously and returns immediately; you are notified when it finishes.
Use background only for independent work that can run while you continue elsewhere.

Available subagents:
- explore: Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase (eg. "how do API endpoints work?"). When calling this agent, specify the desired thoroughness level: "quick" for basic searches, "medium" for moderate exploration, or "very thorough" for comprehensive analysis across multiple locations and naming conventions.
- general: General-purpose agent for researching complex questions and executing multi-step tasks. Use this agent to execute multiple units of work in parallel.`,parameters:{type:"object",properties:{agent:{type:"string",description:"The type of specialized agent to use for this task. If the user asks for a subagent by a name that is not one of the available subagents, they most likely mean a model: pick a suitable agent and pass the name through the model parameter instead."},description:{type:"string",description:"A short 3-5 word label for the task, displayed to the user"},prompt:{type:"string",description:"The task for the subagent to perform"},model:{type:"string",description:'NEVER set this unless the user explicitly asks for a particular model or variant. The value is written as "providerID/modelID", or "providerID/modelID#variant" to include a variant. Do not guess the ID: look the model up with the models tool, filtering to your own provider first.'},sessionID:{type:"string",pattern:"^ses",description:"Continue a specific previous subagent conversation by passing its sessionID. Calls without a sessionID start a new conversation."},background:{type:"boolean",description:"Run the subagent in the background and return immediately. You will be notified when it completes. DO NOT sleep, poll, or proactively check on its progress."}},required:["agent","description","prompt"],additionalProperties:!1}},webfetch:{description:`Fetch content from an HTTP or HTTPS URL and return it as text, markdown, or HTML. Markdown is the default.

Use a more targeted tool when one is available. This tool is read-only. Large text results may be replaced with a preview while the complete output is retained in managed storage.`,parameters:{type:"object",properties:{url:{type:"string",description:"The HTTP or HTTPS URL to fetch content from"},format:{type:"string",enum:["text","markdown","html"],description:"The format to return the content in. Defaults to markdown."},timeout:{type:"number",exclusiveMinimum:0,maximum:120,description:"Optional timeout in seconds (maximum: 120)"}},required:["url"],additionalProperties:!1}},websearch:{description:`Search the web using the user's selected search integration. Use this for current information beyond knowledge cutoff.

The current year is 2026. Use this year when searching for recent information or current events.`,parameters:{type:"object",properties:{query:{type:"string",description:"Websearch query"}},required:["query"],additionalProperties:!1}},write:{description:`Writes a file to the local filesystem, overwriting if one exists.

Missing parent directories are created automatically.

Use this tool to create new files or overwrite existing files. For partial changes, use the edit tool instead.`,parameters:{type:"object",properties:{path:{type:"string",description:"Path to the file to write to"},content:{type:"string",description:"Content to write to the file"}},required:["path","content"],additionalProperties:!1}},execute:{description:'Run JavaScript in a confined Code Mode runtime to script tool calls and HTTP requests and compose their results.\n`fetch` is available for HTTP requests. Imports, direct filesystem access, and timers are unavailable; all other external access goes through `tools`.\nWithin `{ code }`, the only callable tools are those explicitly listed in the Code Mode catalog instructions or returned by the `search` function. Inside `{ code }`, ignore tools shown outside the Code Mode catalog. They are not available in the Code Mode runtime.\nCall tools through `tools` using only exact paths and signatures from the catalog. Do not infer or normalize tool names; preserve bracket notation such as `tools.<namespace>["tool-name"](input)`.\nPrefer an explicit `return`; if omitted, the final top-level expression becomes the result.\nAwait every call whose completion matters; pending calls are interrupted when execution ends. Run independent calls concurrently with `Promise.allSettled`.',parameters:{type:"object",properties:{code:{type:"string"}},required:["code"],additionalProperties:!1}}},Ir="2.2.0",sn=`opencode/latest/${Ir}/desktop`,Or=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],$r=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function j(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}var Mr=["<env>","  Working directory: /workspace","  Workspace root folder: /workspace","  Is directory a git repo: yes","  Platform: linux","  Prefer /tmp/opencode over generic system temporary directories such as /tmp; it is pre-created and approved for external access.","</env>"].join(`
`);function Dr(e,t=new Date){let n=typeof e=="string"?e.trim():"",r=(n.startsWith("opencode/")?n.slice(9).trim():n)||"unknown",s=r.split("-").map(i=>i&&i[0].toUpperCase()+i.slice(1)).join(" "),o=`${Or[t.getUTCDay()]} ${$r[t.getUTCMonth()]} ${String(t.getUTCDate()).padStart(2,"0")} ${t.getUTCFullYear()}`;return Pr.replaceAll("{{MODEL_NAME}}",s).replaceAll("{{MODEL_ID}}",r).replaceAll("{{DATE}}",o).replaceAll("{{ENV}}",Mr)}var jr="You are opencode, an interactive CLI tool",Kr="You are an AI agent running in OpenCode";function pe(e){if(typeof e=="string")return e?[e]:[];if(Array.isArray(e))return e.flatMap(t=>pe(t));if(j(e)){if(typeof e.text=="string")return pe(e.text);if(e.content!==void 0)return pe(e.content)}return[]}function on(e){return pe(e).some(t=>t.includes(jr)||t.includes(Kr))}var oe="clint_",rn=64;function an(e,t,n=new Date){let r=[];for(let i of Array.isArray(e?.tools)?e.tools:[]){if(!j(i))continue;let a=j(i.function)?i.function:void 0,l=a?a.name:i.name;typeof l=="string"&&l.startsWith(oe)&&r.push(l)}let o=["<system-reminder>","Code Mode is not active in this session: this host is not OpenCode, and the built-in tools described above - `execute` and every entry of the catalog - are not implemented here. A call to one is answered with an unknown-tool error and nothing else.",`${r.length?`The tools you can call are the host's own, under their ${oe} names: ${r.join(", ")}.`:"This host implements no tools at all; answer without tool calls."} Every other entry in the tools array is an OpenCode built-in nothing here runs: read that array as the host's own list, not as OpenCode's.`,"</system-reminder>"].join(`
`);return`${Dr(t,n)}

${o}`}function ln(e,t,n=new Date){let r=e.messages;if(!Array.isArray(r))return!1;let s=[],o=[];for(let l of r){if(!j(l)||l.role!=="system"&&l.role!=="developer"){s.push(l);continue}if(on(l.content))return!1;for(let c of pe(l.content)){let d=c.trim();d&&o.push(d)}}let i=an(e,t,n),a=o.length?`${i}

${o.join(`
`)}`:i;return e.messages=[{role:"system",content:a},...s],!0}function cn(e,t,n=new Date){let r=an(e,t,n),s=e.instructions;if(s!=null){if(on(s))return!1;if(typeof s=="string")return e.instructions=s.trim()===""?r:`${r}

${s}`,!0}return e.instructions=r,!0}function dn(e){return typeof e=="string"&&ae.includes(e.toLowerCase())}function Nr(e){return ae.map(t=>{let n=Cr[t];return e==="chat"?{type:"function",function:{name:t,description:n.description,parameters:n.parameters,strict:!1}}:{type:"function",name:t,description:n.description,parameters:n.parameters}})}function Ur(e){return String(e??"").replace(/[^A-Za-z0-9_-]+/g,"_").replace(/^[-_]+|[-_]+$/g,"")}function Lr(e,t=new Set){let n=rn-oe.length,r=Ur(e)||"tool";r.length>n&&(r=r.slice(0,n));let s=oe+r;if(!t.has(s))return t.add(s),s;for(let o=2;;o+=1){let i=`_${o}`,a=Math.min(s.length,rn-i.length),l=s.slice(0,a)+i;if(!t.has(l))return t.add(l),l}}var Ve=class{clientToWire=new Map;wireToClient=new Map;get size(){return this.clientToWire.size}add(t,n){typeof t!="string"||!t||typeof n!="string"||!n||n===t||this.clientToWire.has(t)||this.wireToClient.has(n)||(this.clientToWire.set(t,n),this.wireToClient.set(n,t))}wire(t){return typeof t=="string"?this.clientToWire.get(t):void 0}restore(t){if(typeof t!="string"||!t)return t;let n=this.wireToClient.get(t);if(n!==void 0)return n;if(t.startsWith(oe)){let r=t.slice(oe.length);if(r)return r}return t}toBack(){let t=Object.create(null);for(let[n,r]of this.wireToClient)t[n]=r;return t}};function Br(e,t){if(!j(t))return;if(e==="chat"){let s=j(t.function)?t.function:void 0,o=(s?s.name:void 0)??t.name;return typeof o=="string"&&o?o:void 0}if(t.type!==void 0&&t.type!=="function"&&t.type!=="custom")return;let n=j(t.function)?t.function:void 0,r=t.name??(n?n.name:void 0);return typeof r=="string"&&r?r:void 0}function Hr(e,t,n){if(e==="chat"){j(t.function)?t.function.name=n:t.name=n;return}t.name!==void 0||!j(t.function)?t.name=n:t.function.name=n}function Q(e,t){if(!j(e))return;let n=t.wire(e.name);n!==void 0&&(e.name=n)}function qr(e,t,n){if(n.size===0)return;if(t==="chat"){let o=e.tool_choice;j(o)&&(j(o.function)?Q(o.function,n):Q(o,n)),j(e.function_call)&&Q(e.function_call,n);let i=e.messages;if(Array.isArray(i))for(let a of i){if(!j(a))continue;j(a.function_call)&&Q(a.function_call,n);let l=a.tool_calls;if(Array.isArray(l))for(let c of l)j(c)&&j(c.function)&&Q(c.function,n)}return}let r=e.tool_choice;if(j(r)&&(Q(r,n),Array.isArray(r.allowed_tools)))for(let o of r.allowed_tools)Q(o,n);let s=e.input;if(Array.isArray(s))for(let o of s)j(o)&&(o.type==="function_call"||o.type==="custom_tool_call")&&Q(o,n)}function Ye(e,t){let n=new Ve,r=new Set,s=Array.isArray(e.tools)?e.tools:[],o=[];for(let i of s){let a=Br(t,i);if(a===void 0){o.push(i);continue}let l=n.wire(a);l===void 0&&(l=Lr(a,r),n.add(a,l)),j(i)&&l!==a&&(Hr(t,i,l),t==="chat"&&j(i.function)&&i.function.strict===void 0&&(i.function.strict=!1)),o.push(i)}return o.push(...Nr(t)),e.tools=o,qr(e,t,n),{renames:n,back:n.toBack(),hadClientTools:s.length>0}}var Fr=32e3;function un(e){return Object.prototype.hasOwnProperty.call(e,"max_completion_tokens")||Object.prototype.hasOwnProperty.call(e,"max_tokens")?!1:(e.max_completion_tokens=Fr,!0)}var zr=["model","messages","tools","stream","stream_options","max_completion_tokens"];function pn(e){let t={};for(let n of zr)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n]);for(let n of Object.keys(e).sort())Object.prototype.hasOwnProperty.call(t,n)||(t[n]=e[n]);return JSON.stringify(t)}function fn(e){return/^muse-[A-Za-z0-9.-]*-free$/.test(e)}function $(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)?e:null}function Wr(e){if(typeof e=="string")return e;if(Array.isArray(e)){let t="";for(let n of e){let r=$(n);r&&(typeof r.text=="string"?t+=r.text:typeof r.content=="string"&&(t+=r.content))}return t}return""}var Jr=["minimal","low","medium","high","xhigh"],Ge="(The model asked for a tool this session doesn't have.)",Vr=8*1024*1024;function Yr(e){let t=typeof e=="string"?e.trim().toLowerCase():"";return Jr.includes(t)?t:"low"}function mn(e){let t={};typeof e.model=="string"&&e.model&&(t.model=e.model),e.stream===!0&&(t.stream=!0),e.temperature!==void 0&&(t.temperature=e.temperature),e.top_p!==void 0&&(t.top_p=e.top_p);for(let o of["max_tokens","max_completion_tokens"])if(e[o]!==void 0){let i=Math.floor(Number(e[o]));Number.isFinite(i)&&i>0&&(t.max_output_tokens=Math.max(i,16));break}let n=Array.isArray(e.messages)?e.messages:[],r=[],s="";for(let o of n){let i=$(o);if(!i)continue;let a=typeof i.role=="string"?i.role:"",l=Wr(i.content);switch(a){case"system":case"developer":s=s?`${s}

${l}`:l;break;case"user":r.push({role:"user",content:l});break;case"assistant":{if(l&&r.push({role:"assistant",content:l}),Array.isArray(i.tool_calls)){let c=i.tool_calls;for(let d of c){let u=$(d);if(!u)continue;let g=$(u.function),v=typeof g?.name=="string"?String(g.name):"";r.push({type:"function_call",call_id:u.id??"",name:v,arguments:typeof g?.arguments=="string"?g.arguments:""})}}break}case"tool":r.push({type:"function_call_output",call_id:i.tool_call_id??"",output:l});break}}if(t.input=r,s&&(t.instructions=s),Array.isArray(e.tools)&&(t.tools=e.tools.map(o=>{let i=$(o);if(!i)return o;let a=$(i.function);return a?{type:"function",name:a.name??"",description:a.description,parameters:a.parameters}:i})),$(e.tool_choice)){let o=$(e.tool_choice),i=$(o.function);i&&(t.tool_choice={type:"function",name:i.name??""})}else typeof e.tool_choice=="string"&&(t.tool_choice=e.tool_choice);return t.reasoning={effort:Yr(e.reasoning_effort??e.reasoningEffort)},t}function hn(e,t){let n=typeof e=="string"?e:"",r=t[n.toLowerCase()]??t[n];return typeof r=="string"&&r?{name:r,swallow:!1}:{name:n,swallow:dn(n)}}function gn(e,t={}){let n=typeof e.model=="string"?e.model:"",r="",s=[],o=!1;if(Array.isArray(e.output))for(let u of e.output){let g=$(u);if(g){if(g.type==="message"&&Array.isArray(g.content))for(let v of g.content){let S=$(v);S&&S.type==="output_text"&&typeof S.text=="string"&&(r+=S.text)}else if(g.type==="function_call"){let{name:v,swallow:S}=hn(g.name,t);if(S){o=!0;continue}s.push({id:g.call_id??g.id??"",type:"function",function:{name:v,arguments:typeof g.arguments=="string"?g.arguments:""}})}}}let i="stop",a=$(e.incomplete_details);a&&a.reason==="max_output_tokens"&&(i="length"),s.length>0&&(i="tool_calls"),o&&s.length===0&&!r&&(i="stop");let l={role:"assistant"};s.length>0?(l.tool_calls=s,r&&(l.content=r)):o&&!r?l.content=Ge:l.content=r;let c={id:e.id??"",object:"chat.completion",created:e.created_at??0,model:n,choices:[{index:0,message:l,finish_reason:i}]},d=$(e.usage);return d&&(c.usage={prompt_tokens:d.input_tokens??0,completion_tokens:d.output_tokens??0,total_tokens:d.total_tokens??0}),c}function Y(e,t,n,r,s){let o={index:0,delta:n};r&&(o.finish_reason=r);let i={id:t,object:"chat.completion.chunk",model:e,choices:[o]};return s&&(i.usage=s),`data: ${JSON.stringify(i)}

`}function yn(e,t,n={},r=new Set){let s=new TextEncoder,o=new TextDecoder,i="",a=`chatcmpl-${Date.now().toString(16)}-${Math.random().toString(16).slice(2,8)}`,l=Object.create(null),c=new Set,d=0,u=!1,g=!1,v="",S="",y=Object.create(null),A=Object.create(null),b=new Set,T=f=>{if(!f)return!1;try{return JSON.parse(f),!0}catch{return!1}},w=()=>d>0&&Object.keys(l).every(f=>b.has(f)||T(y[f])),P=(f,p,x)=>{f.enqueue(s.encode(Y(e,a,{tool_calls:[{index:p,function:{arguments:x}}]})))},C=f=>f||"{}",I=(f,p)=>{let x=y[f]??"";return p===x?"":p.startsWith(x)?p.slice(x.length):p},K=f=>{let{name:p,swallow:x}=hn(f,n),m=f.toLowerCase();return n[m]||n[f]?{name:n[m]||n[f],isStub:!1}:{name:p,isStub:x}},h=(f,p,x,m,k)=>{if(c.has(p)||typeof x!="string"||x==="")return null;let{name:U,isStub:H}=K(typeof x=="string"?x:"");if(H)return null;let L=l[p];L===void 0&&(L=d++,l[p]=L,f.enqueue(s.encode(Y(e,a,{tool_calls:[{index:L,id:k,type:"function",function:{name:U,arguments:""}}]}))));let B=C(typeof m=="string"?m:""),q=I(p,B);return y[p]=B,T(B)&&b.add(p),q&&P(f,L,q),L},R=(f,p)=>{let x=typeof p.type=="string"?p.type:"";switch(x){case"response.output_text.delta":{let m=typeof p.delta=="string"?p.delta:"";if(m&&S&&v===S)break;m&&(g=!0,v+=m,f.enqueue(s.encode(Y(e,a,{content:m}))));break}case"response.output_text.done":{let m=typeof p.text=="string"?p.text:"";if(!m||!m.startsWith(v))break;S=m;let k=m.slice(v.length);if(!k)break;g=!0,v=m,f.enqueue(s.encode(Y(e,a,{content:k})));break}case"response.output_item.added":{let m=$(p.item);if(m&&m.type==="function_call"){let k=typeof m.id=="string"&&m.id?m.id:typeof m.call_id=="string"?m.call_id:"";if(!k||k in l)break;let{name:U,isStub:H}=K(typeof m.name=="string"?m.name:"");if(H){c.add(k),typeof m.call_id=="string"&&m.call_id&&c.add(m.call_id),delete A[k];break}let L=d++;l[k]=L,f.enqueue(s.encode(Y(e,a,{tool_calls:[{index:L,id:m.call_id??k,type:"function",function:{name:U,arguments:""}}]})));let B=A[k];if(B!==void 0){delete A[k];let q=C(B.args),z=I(k,q);y[k]=q,T(q)&&b.add(k),z&&P(f,L,z)}}break}case"response.function_call_arguments.delta":{let m=typeof p.item_id=="string"?p.item_id:"";if(c.has(m)||b.has(m))break;let k=l[m];if(k===void 0)break;typeof p.delta=="string"&&p.delta&&(y[m]=(y[m]??"")+p.delta,f.enqueue(s.encode(Y(e,a,{tool_calls:[{index:k,function:{arguments:p.delta}}]}))));break}case"response.output_item.done":case"response.function_call_arguments.done":{let m=$(p.item);if(m?.type==="message"&&!g&&Array.isArray(m.content)){for(let z of m.content){let M=$(z);M&&M.type==="output_text"&&typeof M.text=="string"&&M.text&&(g=!0,f.enqueue(s.encode(Y(e,a,{content:M.text}))))}break}let k=typeof p.item_id=="string"&&p.item_id?p.item_id:typeof m?.id=="string"&&m.id?m.id:"",U=typeof p.arguments=="string"?p.arguments:typeof m?.arguments=="string"?m.arguments:"",H=typeof m?.name=="string"?m.name:"";if(k&&c.has(k))break;let L=k?l[k]:void 0;if(L===void 0){k&&(U||H)&&(A[k]={name:H,args:U});break}let B=U?C(U):y[k]||"{}",q=I(k,B);y[k]=B,q&&P(f,L,q),T(B)&&b.add(k);break}case"response.completed":case"response.incomplete":{let m=$(p.response),k=$(m?.usage),U=x==="response.incomplete",H=$(m?.incomplete_details)?.reason==="max_output_tokens";if(Array.isArray(m?.output))for(let z of m.output){let M=$(z);if(M){if(M.type==="function_call"){let ie=typeof M.id=="string"&&M.id?M.id:typeof M.call_id=="string"?M.call_id:"";if(!ie)continue;h(f,ie,M.name,M.arguments,typeof M.call_id=="string"&&M.call_id?M.call_id:ie)}else if(M.type==="message"&&!g&&Array.isArray(M.content))for(let ie of M.content){let le=$(ie);le&&le.type==="output_text"&&typeof le.text=="string"&&le.text&&(g=!0,f.enqueue(s.encode(Y(e,a,{content:le.text}))))}}}for(let[z,M]of Object.entries(A))z in l||h(f,z,M.name,M.args,z);let L=d===0&&c.size>0&&!g,B=d>0?w()?"tool_calls":"length":L?"stop":U||H?"length":"stop",q=k?{prompt_tokens:k.input_tokens??0,completion_tokens:k.output_tokens??0,total_tokens:k.total_tokens??0}:void 0;f.enqueue(s.encode(Y(e,a,{},B,q))),f.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}case"response.failed":case"error":{let m=$(p.error)||$($(p.response)?.error)||$(p.response)||{},k=m.message??m.code??"",U=typeof k=="string"&&k?k:"上游推理失败";f.enqueue(s.encode(`data: ${JSON.stringify({error:{message:U,type:"upstream_error",code:"upstream_error"}})}

`)),f.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}}},_=(f,p)=>{if(u)return;if(f.startsWith(":")){p.enqueue(s.encode(f+`

`));return}if(!f.startsWith("data: ")&&!f.startsWith("data:"))return;let x=f.startsWith("data: ")?f.slice(6).trim():f.slice(5).trim();if(!(!x||x==="[DONE]"))try{R(p,JSON.parse(x))}catch{}};return new TransformStream({transform(f,p){if(u)return;i+=o.decode(f,{stream:!0});let x;for(;(x=i.indexOf(`
`))>=0;){let m=i.slice(0,x).replace(/\r$/,"");if(i=i.slice(x+1),_(m,p),u)return}i.length>Vr&&p.error(new Error("上游 SSE 行超出缓冲上限"))},flush(f){if(!u&&((i.startsWith("data: ")||i.startsWith("data:"))&&_(i.replace(/\r$/,""),f),!u)){let p=d>0?w()?"tool_calls":"length":g?"length":"stop";f.enqueue(s.encode(Y(e,a,{},p))),f.enqueue(s.encode(`data: [DONE]

`))}}})}var Gr="opencode";function Xr(e="chat"){return sn}var bn=3e4;function G(e){return e===Gr}function Qr(e){return e.filter(t=>typeof t.id=="string"&&/^[A-Za-z0-9._:/-]+$/.test(t.id)&&(t.id==="big-pickle"||t.id.endsWith("-free")))}function ee(e){let n=(e.OPENCODE_MIRRORS_URL||"").split(/[\s,;]+/).map(r=>r.trim()).filter(Boolean);return[...new Set(n)]}function Zr(e,t){if(e.length===0)return[];let n=Math.floor(t()*e.length);return[...e.slice(n),...e.slice(0,n)]}function vn(e,t,n=""){let r=e.replace(/\/+$/,"");if(!r.endsWith("/inference/v1"))return`${r}/${t.replace(/^\/+/,"")}${n}`;let s=r.slice(0,-3);if(t.includes("messages")){let o=`${s}/anthropic/v1/${t.replace(/^\/+/,"")}`;return n?`${o}${n}&beta=true`:`${o}?beta=true`}return t.includes("chat/completions")||t.includes("responses")?`${`${s}/openai/v1/${t.replace(/^\/+/,"")}`}${n}`:`${r}/${t.replace(/^\/+/,"")}${n}`}var es="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";function Pn(e){let t=new Uint8Array(e);return crypto.getRandomValues(t),t}function ts(e){return Array.from(Pn(e),t=>es[t%62]).join("")}function Xe(){let e=Pn(20),t="";for(let n=0;n<e.length;n++)t+=e[n].toString(16).padStart(2,"0");return t}var wn=0,Qe=0;function Ae(e,t=Date.now()){let n=1;e==="ses"&&(t===wn?Qe+=1:(wn=t,Qe=1),n=Qe);let r=BigInt(t)*0x1000n+BigInt(n),s=e==="ses"?~r:r,o=Array.from({length:6},(i,a)=>Number(s>>BigInt(40-8*a)&0xffn).toString(16).padStart(2,"0")).join("");return`${e}_${o}${ts(14)}`}function ns(e,t,n,r,s="chat"){let o=new Headers({"Content-Type":"application/json",Accept:"*/*","User-Agent":Xr(s),"x-opencode-client":"desktop","x-opencode-project":r,"x-opencode-session":n,"x-opencode-session-id":n});return o.set("Authorization",`Bearer ${e}`),o}function rs(e){let t=e.stream===!0,n={...e,stream:!0},r=0,s=Array.isArray(n.functions)?n.functions:[];if(s.length>0){let c=[...Array.isArray(n.tools)?n.tools:[]],d=new Set(c.map(u=>{let v=u?.function;return typeof v?.name=="string"?v.name:typeof u?.name=="string"?u.name:void 0}));for(let u of s){let g=u!==null&&typeof u=="object"?u:null,v=g?.name;typeof v!="string"||d.has(v)||(d.add(v),r+=1,c.push({type:"function",function:{name:v,description:g?.description,parameters:g?.parameters}}))}n.tools=c,delete n.functions}let o=Ye(n,"chat"),i=o.hadClientTools||r>0,a=n.stream_options;return n.stream_options={...a&&typeof a=="object"&&!Array.isArray(a)?a:{},include_usage:!0},{body:n,clientWantsStream:t,hadClientTools:i,back:o.back,injectedStubs:new Set}}function Cn(e){let t=e.indexOf(`

`),n=e.indexOf(`\r
\r
`);return t===-1&&n===-1?null:t!==-1&&(n===-1||t<n)?{index:t,length:2}:{index:n,length:4}}function ss(e,t){let n=-1,r=-1;for(let s=t;s<e.length&&(n===-1&&e[s]===10&&e[s+1]===10&&(n=s),r===-1&&e[s]===13&&e[s+1]===10&&e[s+2]===13&&e[s+3]===10&&(r=s),!(n!==-1&&r!==-1));s++);return n===-1&&r===-1?null:n!==-1&&(r===-1||n<r)?{index:n,length:2}:{index:r,length:4}}var os=new TextDecoder,xn=new Uint8Array(0);function as(e,t){let n=new Uint8Array(e.length+t.length);return n.set(e,0),n.set(t,e.length),n}function kn(e,t){let n=0;for(;;){let r=ss(e,n);if(!r)break;let s=n+r.index;if(r.index>fe)return{rest:e.subarray(n),overflow:!0};if(is(os.decode(e.subarray(n,s)),t),n=s+r.length,t.done)return{rest:xn,overflow:!1}}return n===e.length?{rest:xn,overflow:!1}:{rest:e.slice(n),overflow:!1}}function is(e,t){for(let n of e.split(`
`)){let r=n.replace(/\r$/,"").trim();if(!r.startsWith("data:"))continue;let s=r.slice(5).trim();if(s==="[DONE]"){t.done=!0;return}let o;try{o=JSON.parse(s)}catch{continue}let i=o.error,a=o.response;if(i!==void 0||o.type==="error"||o.type==="response.failed"||a?.status==="failed"){let c=i??a?.error??a,d=typeof c=="object"&&c!==null?c:{},u=d.message??d.code??c,g=d.type,v=d.code;t.upstreamError={message:typeof u=="string"&&u?u:"上游推理失败",type:typeof g=="string"&&g?g:"upstream_error",code:typeof v=="string"&&v?v:"upstream_error"},t.done=!0;return}let l=o.choices?.[0];if(l){let c=l.delta;if(c){typeof c.content=="string"&&(t.content+=c.content);let d=c.tool_calls;if(Array.isArray(d))for(let u of d){let g=u.index,v=typeof g=="number"?g:NaN,S;if(Number.isInteger(v)&&v>=0&&v<An)S=v;else{let b=typeof g=="string"?`s:${g}`:`n:${String(v)}`,T=t.overflowSlot.get(b);S=T===void 0?An+t.overflowSlot.size:T,t.overflowSlot.set(b,S)}t.toolCalls[S]||(t.toolCalls[S]={id:`call_${S}`,type:"function",function:{name:"",arguments:""}},t.argBufs[S]=""),typeof u.id=="string"&&u.id&&(t.toolCalls[S].id=u.id);let y=u.function??{},A=t.toolCalls[S].function;typeof y.name=="string"&&y.name&&(A.name=y.name),typeof y.arguments=="string"&&(t.argBufs[S]+=y.arguments)}}typeof l.finish_reason=="string"&&l.finish_reason&&(t.finishReason=l.finish_reason,t.sawFinishReason=!0)}o.usage&&typeof o.usage=="object"&&(t.usage=o.usage)}}async function In(e,t,n=!1,r={},s=new Set){let o={content:"",finishReason:"stop",usage:void 0,toolCalls:[],argBufs:[],overflowSlot:new Map,done:!1,upstreamError:void 0,sawFinishReason:!1},i=e.body?.getReader();if(i){let w=new Uint8Array(0);try{for(;;){let{done:P,value:C}=await i.read();if(P)break;let{rest:I,overflow:K}=kn(w.length===0?C:as(w,C),o);if(w=I,o.done){await i.cancel().catch(()=>{});break}if(K||w.length>fe)return await i.cancel().catch(()=>{}),new Response(JSON.stringify({error:{message:`上游流式响应过大(单事件 >${fe} 字符), 已拒绝`}}),{status:413,headers:{"Content-Type":"application/json"}})}}catch{}if(!o.done&&w.length>0){let P=new Uint8Array(w.length+2);P.set(w,0),P[w.length]=10,P[w.length+1]=10,kn(P,o)}}if(o.upstreamError)return new Response(JSON.stringify({error:o.upstreamError}),{status:502,headers:{"Content-Type":"application/json"}});if(!o.done&&!o.sawFinishReason)return new Response(JSON.stringify({error:{message:"上游流中断：缺少完成标记（[DONE]/finish_reason），响应可能不完整",type:"upstream_incomplete",code:"upstream_incomplete"}}),{status:502,headers:{"Content-Type":"application/json"}});let{toolCalls:a,argBufs:l,content:c,usage:d}=o,u=o.finishReason;for(let w=0;w<a.length;w++){let P=a[w];if(!P)continue;let C=P.function,I=typeof C.name=="string"?C.name:"",K=I.toLowerCase();I&&(r[K]||r[I])&&(C.name=r[K]||r[I]),C.arguments=l[w]??""}let g=w=>{let P=w.toLowerCase();return r[P]||r[w]?!1:typeof w=="string"&&ae.includes(w.toLowerCase())},v=!0,S=a.filter(w=>!!w),y=v?S.filter(w=>{let P=w.function??{},C=typeof P.name=="string"?P.name:"";return!g(C)}):S;(u==="tool_calls"||u==="stop")&&y.some(P=>{let C=P.function.arguments;return typeof C=="string"&&C!==""&&!cs(C)})&&(u="length");let A=v&&S.length>y.length;A&&y.length===0&&u==="tool_calls"&&(u="stop");let b={role:"assistant",content:c===""?null:c};y.length>0?b.tool_calls=y:A&&c===""&&(b.content=Ge,u="stop");let T={id:`chatcmpl-${Date.now().toString(36)}`,object:"chat.completion",created:Math.floor(Date.now()/1e3),model:t,choices:[{index:0,message:b,finish_reason:u}]};return d!==void 0&&(T.usage=d),new Response(JSON.stringify(T),{status:e.status,headers:{"Content-Type":"application/json"}})}function ls(e={},t=new Set,n=!1){let r=new TextEncoder,s=new TextDecoder,o="",i=new Set,a=new Set,l=new Map,c=new Set,d=!1,u=(y,A)=>{let b;try{b=JSON.parse(y)}catch{return null}let T=b.choices?.[0];if(T){let w=T.delta;if(w&&typeof w=="object"){let C=w.tool_calls;if(Array.isArray(C)){let I=[];for(let K of C){let h=typeof K.index=="number"?K.index:-1,R=K.function??{},_=typeof R.name=="string"?R.name:"",f=_.toLowerCase(),p=typeof _=="string"&&ae.includes(_.toLowerCase());if(h>=0){if(a.add(h),p?e[f]||e[_]?R.name=e[f]||e[_]:i.add(h):(e[f]||e[_])&&(R.name=e[f]||e[_]),i.has(h)){l.delete(h);continue}if(!_&&!c.has(h)){let m=l.get(h);m?m.push(K):l.set(h,[K]);continue}c.add(h);let x=l.get(h);x&&(l.delete(h),I.push(...x))}else if(p)if(e[f]||e[_])R.name=e[f]||e[_];else continue;h<0&&(d=!0),I.push(K)}I.length>0?w.tool_calls=I:delete w.tool_calls}}if(T.finish_reason==="tool_calls"&&!d&&a.size>0&&[...a].every(C=>i.has(C))&&(T.finish_reason="stop"),T.finish_reason&&S(A),(w&&typeof w=="object"?Object.keys(w):[]).length===0&&!T.finish_reason&&b.usage===void 0)return null}return JSON.stringify(b)},g=(y,A)=>{let b=A.trim();if(!b)return;if(!b.startsWith("data:")){y.enqueue(r.encode(`${b}
`));return}let T=b.slice(5).trim();if(T==="[DONE]"){y.enqueue(r.encode(`data: [DONE]

`));return}if(!T)return;let w=u(T,y);w!==null&&y.enqueue(r.encode(`data: ${w}

`))},v=(y,A)=>{let b=A.replace(/\r/g,"");if(!b.split(`
`).some(T=>T.trim().startsWith("data:"))){b.trim()&&y.enqueue(r.encode(`${b}

`));return}for(let T of b.split(`
`))g(y,T)},S=y=>{if(l.size===0)return;if(!n){l.clear();return}let A=[];for(let b of l.values())A.push(...b);l.clear(),y.enqueue(r.encode(`data: ${JSON.stringify({id:"chatcmpl-opencode-pending",object:"chat.completion.chunk",choices:[{index:0,delta:{tool_calls:A}}]})}

`))};return new TransformStream({transform(y,A){o+=s.decode(y,{stream:!0});let b;for(;(b=Cn(o))!==null;){let T=o.slice(0,b.index);o=o.slice(b.index+b.length),v(A,T)}o.length>fe&&A.error(new Error("上游 SSE 事件超出缓冲上限"))},flush(y){let A=o;o="",v(y,A),S(y)}})}var _n=256*1024,fe=8*1024*1024,An=256;function cs(e){try{return JSON.parse(e),!0}catch{return!1}}async function ds(e){let t=new Headers(e.headers);t.delete("content-encoding"),t.delete("content-length"),t.delete("transfer-encoding"),t.delete("connection");let n=await Je(e,_n);return n===null?(t.set("content-type","application/json; charset=utf-8"),{status:e.status,statusText:e.statusText,headers:t,body:new TextEncoder().encode(JSON.stringify({error:{message:`上游错误响应体过大(>${_n} 字节), 已省略`}}))}):{status:e.status,statusText:e.statusText,headers:t,body:n}}function En(e){return new Response(e.body,{status:e.status,statusText:e.statusText,headers:e.headers})}function us(e){let t=e instanceof Error&&e.message?e.message:"OpenCode 上游请求失败";return new Response(JSON.stringify({error:{message:t,type:"proxy_error"}}),{status:502,headers:{"Content-Type":"application/json; charset=utf-8"}})}async function ps(e,t,n,r,s,o,i){let a=new AbortController,l=()=>a.abort(r.clientSignal?.reason);r.clientSignal?.aborted?a.abort(r.clientSignal.reason):r.clientSignal?.addEventListener("abort",l);let c=setTimeout(()=>a.abort(new Error(`OpenCode 上游 ${bn/1e3}s 内未返回响应头`)),bn),d;try{let u=r.subPath.endsWith("responses"),v=/\/messages$/.test(r.subPath)?"anthropic":u?"responses":"chat",S=ns(n,s,o,i,v);r.modelHeader&&S.set("x-opencode-model",r.modelHeader),d=await e(t,{method:r.method,headers:S,body:r.method==="GET"||r.method==="HEAD"?void 0:r.body,signal:a.signal})}finally{clearTimeout(c),r.clientSignal?.removeEventListener("abort",l)}if(d.ok&&d.body&&(d.headers.get("content-type")||"").includes("text/event-stream")){let g=new Headers(d.headers);return g.delete("content-encoding"),g.delete("content-length"),new Response(d.body.pipeThrough(ms()),{status:d.status,statusText:d.statusText,headers:g})}return d}var fs=15e3;function ms(){let e=new TextEncoder,t=new TextDecoder,n="",r=null,s=o=>{r=setTimeout(()=>{try{o.enqueue(e.encode(`: keep-alive

`)),s(o)}catch{r=null}},fs)};return new TransformStream({start(o){s(o)},transform(o,i){n+=t.decode(o,{stream:!0});let a;for(;(a=Cn(n))!==null;){let l=n.slice(0,a.index+a.length);n=n.slice(a.index+a.length),i.enqueue(e.encode(l))}n.length>fe&&(i.enqueue(e.encode(n)),n="")},flush(o){r&&clearTimeout(r);let i=t.decode();n&&o.enqueue(e.encode(n)),i&&o.enqueue(e.encode(i))},cancel(){r&&(clearTimeout(r),r=null)}})}async function Ee(e){let t=N(e.baseUrl),n=t===e.baseUrl?e:{...e,baseUrl:t};if(n.method==="POST"&&/(?:^|\/)chat\/completions$/.test(n.subPath)&&n.body)try{let r=JSON.parse(n.body),s=typeof r.model=="string"?r.model:"";if(s&&fn(s))return await gs(n,r,s)}catch{}return On(n)}var hs="x-ai-gateway-tool-choice-downgraded";async function Ze(e,t){let n=new Headers(e.headers);if(n.set(hs,`${typeof t=="string"?t:"object"}->auto`),!(e.headers.get("content-type")||"").includes("application/json"))return new Response(e.body,{status:e.status,statusText:e.statusText,headers:n});let s=await e.text(),o=s;try{let i=JSON.parse(s);i!==null&&typeof i=="object"&&!Array.isArray(i)&&(i.tool_choice_downgraded={from:t,to:"auto"},o=JSON.stringify(i))}catch{}return new Response(o,{status:e.status,statusText:e.statusText,headers:n})}async function gs(e,t,n){let r=JSON.parse(JSON.stringify(t)),s=Ye(r,"responses"),o=s.back,i=mn(r);cn(i,typeof r.model=="string"?r.model:n),i.stream=!0;let a=i.tool_choice,l=a!==void 0&&a!=="auto";i.tool_choice!==void 0&&i.tool_choice!=="auto"&&(i.tool_choice="auto");let c=s.hadClientTools,d=t.stream===!0,u=await On({...e,baseUrl:N(e.baseUrl),subPath:e.subPath.replace(/chat\/completions$/,"responses"),body:JSON.stringify(i),modelHeader:n});if(!u.ok)return u;if((u.headers.get("content-type")||"").includes("text/event-stream")&&u.body){let A=new Headers(u.headers);A.delete("content-encoding"),A.delete("content-length");let b=new Response(u.body.pipeThrough(yn(n,d&&!c,o,new Set)),{status:u.status,statusText:u.statusText,headers:A});if(d)return l?Ze(b,a):b;let T=await In(b,n,!c,o,new Set);return l?Ze(T,a):T}let v=await u.text(),S;try{S=JSON.stringify(gn(JSON.parse(v),o))}catch{return new Response(v,{status:u.status,statusText:u.statusText,headers:{"Content-Type":u.headers.get("content-type")||"text/plain; charset=utf-8"}})}let y=new Response(S,{status:u.status,statusText:u.statusText,headers:{"Content-Type":"application/json"}});return l?Ze(y,a):y}var Sn=2,ys=1200,Tn=5e3,bs=12e4,vs=[/abusive traffic/i,/abuse traffic/i,/abuse of traffic/i],ws=/free models aren['’]t available/i,xs=/from your current network/i;function ks(e){return vs.some(t=>t.test(e))||ws.test(e)&&xs.test(e)}function _s(e,t=Date.now()){if(e===null)return;let n=e.trim();if(n==="")return;if(/^\d+$/.test(n))return Number(n)*1e3;if(!/^[A-Za-z]{3},/.test(n))return;let r=Date.parse(n);if(Number.isFinite(r))return Math.max(0,r-t)}function Rn(e,t){return t?.aborted?Promise.resolve(!1):e<=0?Promise.resolve(!0):new Promise(n=>{let r=!1,s=a=>{r||(r=!0,clearTimeout(i),t?.removeEventListener("abort",o),n(a))},o=()=>s(!1),i=setTimeout(()=>s(!0),e);t?.addEventListener("abort",o)})}async function On(e){let t=e.fetcher??fetch,n=e.random??Math.random,r=null;if(e.method==="POST"&&typeof e.body=="string")try{let h=JSON.parse(e.body);h&&typeof h=="object"&&!Array.isArray(h)&&(r=h)}catch{}let s=Ae("msg"),o=Ae("ses"),i=Xe(),a=o,l=i,c=null,d=null,u=null,g=e,v=!0,S="opencode",y=!1,A={},b=new Set;if(r&&Array.isArray(r.messages)){let h=rs(r);ln(h.body,typeof h.body.model=="string"?h.body.model:r.model),un(h.body);let R=pn(h.body);g={...e,body:R},v=h.clientWantsStream,y=h.hadClientTools,A=h.back,b=h.injectedStubs,typeof r.model=="string"&&r.model&&(S=r.model)}let T=h=>{let _=(h.headers.get("content-type")||"").includes("text/event-stream")&&!!h.body;if(!v&&_)return In(h,S,!y,A,new Set);if(v&&(Object.keys(A).length>0||!y)&&_){let f=new Headers(h.headers);return f.delete("content-encoding"),f.delete("content-length"),new Response(h.body.pipeThrough(ls(A,b,y)),{status:h.status,statusText:h.statusText,headers:f})}return h},w=e.apiKeys.filter(h=>h.enabled&&h.key),P=N(e.baseUrl),C=vn(P,e.subPath,e.search),I=async(h,R)=>{let _=ys;for(let f=0;;f+=1){let p;try{p=await ps(t,h,R,g,s,a,l)}catch(B){if(e.clientSignal?.aborted||B?.name==="AbortError")return{kind:"transport",error:B};if(f>=Sn)return{kind:"transport",error:B};a=Ae("ses"),l=Xe();let q=await Rn(e.retryWaitMsOverride??_,e.clientSignal);if(_=Math.min(_*2,Tn),!q)return{kind:"transport",error:B};continue}if(p.ok)return{kind:"ok",response:p};let x=await ds(p),m=new TextDecoder().decode(x.body);if(!(x.status===429&&!ks(m))||f>=Sn)return{kind:"failure",failure:x};let U=_,H=_s(x.headers.get("retry-after"));H!==void 0&&(U=Math.min(H,bs)),a=Ae("ses"),l=Xe();let L=await Rn(e.retryWaitMsOverride??U,e.clientSignal);if(_=Math.min(_*2,Tn),!L)return{kind:"failure",failure:x}}};for(let h of w){let R=await I(C,h.key);if(R.kind==="ok")return T(R.response);if(R.kind==="transport"){u=R.error;break}if(c=R.failure,R.failure.status<500&&R.failure.status!==401&&R.failure.status!==403&&R.failure.status!==429)break}for(let h of Zr(e.mirrorUrls,n)){let R=await I(vn(h,e.subPath,e.search),"public");if(R.kind==="ok")return T(R.response);if(R.kind==="transport"){u=R.error;continue}d=R.failure}if(w.length===0||(c?.status===401||c?.status===403)&&!d){let h=await I(C,"public");if(h.kind==="ok")return T(h.response);h.kind==="transport"?u=h.error:c=h.failure}return c?En(c):d?En(d):us(u)}async function et(e,t,n,r,s){let o=await Ee({baseUrl:N(e),apiKeys:t,mirrorUrls:r,method:"POST",subPath:"chat/completions",body:JSON.stringify({model:n,messages:[{role:"user",content:"hi"}],max_tokens:64}),fetcher:s});if(o.ok)return{success:!0,message:"连接成功",statusCode:o.status};let i=await o.text();return{success:!1,message:`HTTP ${o.status}: ${i.substring(0,200)}`,statusCode:o.status}}async function $n(e,t,n,r){let s=await Ee({baseUrl:N(e),apiKeys:t,mirrorUrls:n,method:"GET",subPath:"models",fetcher:r});if(!s.ok)return{success:!1,message:`HTTP ${s.status}: ${(await s.text()).substring(0,200)}`,statusCode:s.status};let o=await s.json();return{success:!0,message:"连接成功",statusCode:s.status,data:{...o,data:Array.isArray(o.data)?Qr(o.data):[]}}}var Se=e=>D.KEY_HEALTH_PREFIX+e,As=60*1e3,Es=5e3,nt=new Map;function Ss(e){let t=nt.get(e);if(t){if(Date.now()>=t.expiresAt){nt.delete(e);return}return t.value}}function rt(e,t,n=As){nt.set(e,{value:t,expiresAt:Date.now()+n})}var Ts=3e4;async function Rs(e,t,n,r=Ts){let s=new AbortController,o=setTimeout(()=>s.abort(new Error(`上游在 ${r/1e3}s 内未返回响应头`)),r),i=()=>s.abort(n?.reason);n?.aborted?s.abort(n.reason):n?.addEventListener("abort",i);try{return await fetch(e,{...t,signal:s.signal})}finally{clearTimeout(o),n?.removeEventListener("abort",i)}}function st(e){let t=Object.create(null);for(let[n,r]of Object.entries(e))t[n]={...r};return t}async function Ps(e,t){let n=Se(t),r=Ss(n);if(r)return st(r);let s=null;try{s=await e.KV.get(n)}catch(i){return console.warn(`[proxy] key 健康状态读取失败，按全健康处理: ${i.message}`),rt(n,{},Es),{}}let o={};if(s)try{let i=JSON.parse(s);i&&typeof i=="object"&&(o=i)}catch{console.warn(`[proxy] key 健康数据损坏，已重置: ${n}`)}return rt(n,o),st(o)}async function Cs(e,t,n){let r=Object.create(null);for(let[s,o]of Object.entries(n))o.failures>0&&(r[s]=o);rt(Se(t),st(r)),Object.keys(r).length>0?await e.KV.put(Se(t),JSON.stringify(r)):await e.KV.delete(Se(t)).catch(()=>{})}async function Mn(e,t,n){try{await Cs(e,t,n)}catch(r){console.warn(`[proxy] key 健康状态写入失败: ${r.message}`)}}var tt=e=>e>=400&&e<=599?e:502,Dn=64*1024;async function ot(e){let t=await nn(e,Dn);if(t===null)return{raw:`上游错误响应体过大（>${Dn/1024}KB），已忽略`,json:null};try{let n=JSON.parse(t);if(n&&typeof n=="object"&&!Array.isArray(n))return{raw:t,json:n}}catch{}return{raw:t,json:null}}function Is(e){let t=e.indexOf("/");return t===-1?null:{providerId:e.substring(0,t),modelId:e.substring(t+1)}}function me(e,t){let n={"Content-Type":"application/json"};return t==="anthropic"?(n["x-api-key"]=e,n["anthropic-version"]="2023-06-01"):n.Authorization=`Bearer ${e}`,n}function jn(e,t){let n=!e[t],r=e[t]||{failures:0,lastFailed:!1};return r.failures++,r.lastFailed=!0,r.failures>=Be?(r.demotedAt=Date.now(),e[t]=r,!0):(e[t]=r,n)}async function Kn(e,t,n,r){try{let i=`${e.replace(/\/+$/,"")}/${r==="anthropic"?"messages":"chat/completions"}`,a=await fetch(i,{method:"POST",headers:me(t,r),body:JSON.stringify({model:n,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});if(a.ok)return{success:!0,message:"连接成功",statusCode:a.status};let{raw:l,json:c}=await ot(a),d=c?.error?.message,u=typeof d=="string"&&d?d:l;return{success:!1,message:`HTTP ${a.status}: ${u.substring(0,200)}`,statusCode:a.status}}catch(s){return{success:!1,message:`连接失败: ${s.message?.substring(0,200)||"未知错误"}`}}}async function Nn(e){try{if(e.req.method==="GET"||e.req.method==="HEAD")return e.json({error:{message:"该端点仅支持 POST（GET 请求请使用 /v1/models）",type:"invalid_request_error"}},405);let t;try{t=await e.req.json()}catch{return e.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400)}if(!t||typeof t!="object")return e.json({error:{message:"请求体必须是 JSON 对象",type:"invalid_request_error"}},400);let n=t.model;if(!n||typeof n!="string")return e.json({error:{message:"缺少 model 参数",type:"invalid_request_error"}},400);let r=Is(n);if(!r)return e.json({error:{message:`模型格式错误 "${n}"，请使用 提供商ID/模型ID 格式`,type:"invalid_request_error"}},400);let{providerId:s,modelId:o}=r,i=await se(e.env,s);if(!i)return e.json({error:{message:`提供商 "${s}" 不存在`,type:"invalid_request_error"}},404);if(!i.enabled)return e.json({error:{message:`提供商 "${i.name}" 已禁用`,type:"provider_disabled"}},403);if(!i.baseUrl.trim())return e.json({error:{message:`提供商 "${i.name}" 未配置有效的 baseUrl`,type:"provider_misconfigured"}},502);let a=i.models.find(_=>_.id===o);if(!a)return e.json({error:{message:`模型 "${o}" 未在提供商 "${i.name}" 中配置`,type:"invalid_request_error"}},404);if(!a.enabled)return e.json({error:{message:`模型 "${o}" 已禁用`,type:"model_disabled"}},403);let l=i.apiKeys.filter(_=>_?.enabled),c={...t,model:o},d=JSON.stringify(c),u=new URL(e.req.url),g=u.pathname.replace(/^\/v1\/?/,"")||"chat/completions";if(G(s)){let f=["x-opencode-session","x-opencode-session-id","x-session-id","session_id","session-id","conversation_id","conversation-id"].map(x=>e.req.header(x)?.trim()).find(Boolean),p=await Ee({baseUrl:N(i.baseUrl),apiKeys:l,method:e.req.method,subPath:g,search:u.search,body:d,mirrorUrls:ee(e.env),clientSessionId:f,clientSignal:e.req.raw.signal});return new Response(p.body,{status:p.status,statusText:p.statusText,headers:p.headers})}if(l.length===0)return e.json({error:{message:`提供商 "${i.name}" 未配置可用的 API Key`,type:"configuration_error"}},500);let S=`${i.baseUrl.replace(/\/+$/,"")}/${g}${u.search}`,y=await Ps(e.env,s),A=!1,b=[],T=[],w=[],P=[];if(l.length===1)b.push(0);else{let _=Date.now();l.forEach((f,p)=>{let x=y[f.key];x?x.failures>=Be?(x.demotedAt||(y[f.key]={...x,demotedAt:_},A=!0),(_-(x.demotedAt||_)>=Pt?w:P).push(p)):x.lastFailed?T.push(p):b.push(p):b.push(p)})}for(let _=b.length-1;_>0;_--){let f=Math.floor(Math.random()*(_+1));[b[_],b[f]]=[b[f],b[_]]}let C=[...b,...T,...w];C.length===0&&P.length>0&&(C.push(...P),console.log(`[proxy] ${s}: all keys demoted, falling back to ${P.length} key(s)`)),(P.length>0||w.length>0)&&console.log(`[proxy] ${s}: ${P.length} key(s) demoted, ${w.length} key(s) on probation (cooldown expired)`);let I=null,K=!1,h=!1,R=async()=>{await I?.body?.cancel().catch(()=>{})};for(let _ of C){let f=l[_].key;try{let p=await Rs(S,{method:e.req.method,headers:me(f,i.apiType),body:d},e.req.raw.signal);if(p.ok)return y[f]?.failures>0&&(delete y[f],A=!0),(A||K)&&await Mn(e.env,s,y),await R(),new Response(p.body,{status:p.status,headers:{"Content-Type":p.headers.get("Content-Type")||"application/json","Cache-Control":"no-store"}});if(p.status===429){await R(),I=p;continue}if(p.status===401||p.status===403||p.status>=500){jn(y,f)&&(A=!0),K=!0,await R(),I=p;continue}await R();let{raw:x,json:m}=await ot(p),k=m?.error;if(k&&typeof k=="object"&&typeof k.message=="string")return e.json(m,tt(p.status));let U=x.trim(),H=m===null?U?x.substring(0,500):`上游返回 HTTP ${p.status}`:typeof m.message=="string"?m.message:typeof m.detail=="string"?m.detail:typeof k=="string"?k:`上游返回 HTTP ${p.status}`;return e.json({error:{message:H},...m?{upstream:m}:{}},tt(p.status))}catch(p){if(e.req.raw.signal.aborted){h=!0;break}let x=p;jn(y,f)&&(A=!0),K=!0,await R(),console.error(`[proxy] Key 请求异常: ${x.message}`),I=new Response(JSON.stringify({error:{message:"上游请求异常",type:"proxy_error"}}),{status:502});continue}}if((A||K)&&await Mn(e.env,s,y),h)return await R(),new Response(JSON.stringify({error:{message:"客户端已断开连接",type:"client_closed_request"}}),{status:499,headers:{"Content-Type":"application/json"}});if(I){let _=I.status===429,{raw:f}=await ot(I);return e.json({error:{message:_?"所有 API Key 都被上游限流（HTTP 429），请稍后重试":`所有 API Key 已用完，最后一次错误: HTTP ${I.status}`,type:_?"rate_limited":"key_exhausted",detail:(f||"所有 API Key 均失败").substring(0,500)}},tt(I.status))}return e.json({error:{message:"没有可用的 API Key",type:"configuration_error"}},500)}catch(t){return console.error("[proxy] 转发内部错误:",t),e.json({error:{message:"网关内部错误，请稍后重试",type:"server_error"}},500)}}async function Un(e){let t=await F(e.env),n=Math.floor(Date.now()/1e3),r=t.filter(s=>s.enabled&&s.baseUrl.trim()!=="").flatMap(s=>s.models.filter(o=>o.enabled).map(o=>({id:`${s.id}/${o.id}`,provider:s.id,provider_name:s.name,object:"model",created:n,owned_by:s.id})));return e.json({object:"list",data:r})}var Os=new Set(["localhost","metadata","metadata.google.internal"]);function he(e){let t=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(e);if(!t)return!1;let[n,r]=[Number(t[1]),Number(t[2])];return[n,r].some(s=>Number.isNaN(s))?!1:n===10||n===127||n===0||n===172&&r>=16&&r<=31||n===192&&r===168||n===169&&r===254||n===100&&r>=64&&r<=127||n>=224}function Ln(e){let t=e.split(":");if(t.length!==2)return null;let n=parseInt(t[0],16),r=parseInt(t[1],16);return Number.isNaN(n)||Number.isNaN(r)?null:`${n>>8&255}.${n&255}.${r>>8&255}.${r&255}`}function $s(e){let t=e.replace(/^\[|\]$/g,"").toLowerCase();if(!t.includes(":"))return!1;if(t==="::1"||t==="::"||t==="0:0:0:0:0:0:0:1"||t==="0:0:0:0:0:0:0:0"||t.startsWith("fe")||t.startsWith("fc")||t.startsWith("fd")||t.startsWith("2002:")||t.startsWith("64:ff9b:"))return!0;if(t.startsWith("::ffff:")||t.startsWith("0:0:0:0:0:ffff:")){let n=t.replace(/^(0:0:0:0:0:ffff:|::ffff:)/,"");if(he(n))return!0;let r=Ln(n);return r===null?!0:he(r)}if(t.startsWith("::")){let n=t.slice(2);if(n.includes("."))return he(n);let r=Ln(n);if(r!==null)return he(r)}return!1}function ge(e){if(typeof e!="string")return"url 格式无效";let t;try{t=new URL(e)}catch{return"url 格式无效"}if(t.protocol!=="https:")return"仅允许 https:// 上游地址";let n=t.hostname.toLowerCase().replace(/\.$/,"");return n?Os.has(n)||n.endsWith(".local")||n.endsWith(".internal")?"不允许访问内网主机":he(n)||$s(n)?"不允许访问私有/回环/链路本地地址":null:"url 缺少主机名"}function Te(e,t){return Array.isArray(e)?e.map(n=>typeof n=="string"?t(n):n).filter(n=>typeof n=="object"&&n!==null):[]}function Re(e){return Array.isArray(e)?e.some(t=>typeof t=="object"&&t!==null&&"enabled"in t&&typeof t.enabled!="boolean"):!1}function Bn(e){return Array.isArray(e)?e.some(t=>{if(typeof t=="string")return t.trim()==="";if(typeof t!="object"||t===null||Array.isArray(t))return!1;let n=t;return n.enabled===!1?!1:!(typeof n.key=="string"&&n.key.trim()!=="")}):!1}var Ms=/^[A-Za-z0-9._:/-]{1,128}$/;function Hn(e){if(!Array.isArray(e))return null;for(let t of e){let n=typeof t=="string"?t:t?.id;if(typeof n!="string"||!Ms.test(n))return String(n??"")}return null}async function te(e){let t=await e.req.json();return t!==null&&typeof t=="object"?t:{}}var qn=e=>`模型 ID "${e.slice(0,64)}" 含非法字符，仅允许字母、数字与 . _ : / -`,Fn=e=>e==="openai"||e==="anthropic";async function zn(e){let t=await F(e.env),n=await J(e.env),r=t.reduce((o,i)=>o+i.models.length,0),s=t.reduce((o,i)=>o+i.models.filter(a=>a.enabled).length,0);return e.json({success:!0,data:{providersCount:t.length,enabledProvidersCount:t.filter(o=>o.enabled).length,modelsCount:r,enabledModelsCount:s,proxyKeysCount:n.filter(o=>o.enabled).length,adminConfigured:!!(e.env.ADMIN_USERNAME&&e.env.ADMIN_PASSWORD),baseUrl:new URL(e.req.url).origin}})}async function Wn(e){let t=await F(e.env);return e.json({success:!0,data:t})}async function Jn(e){let t=await te(e);if(t.id==="opencode"&&(t.baseUrl=t.baseUrl?N(t.baseUrl):we),typeof t.id!="string"||typeof t.name!="string"||typeof t.baseUrl!="string"||!t.id||!t.name||!t.baseUrl)return e.json({success:!1,message:"id、name、baseUrl 为必填项且必须是字符串"},400);if(!/^[A-Za-z0-9._-]+$/.test(t.id))return e.json({success:!1,message:"提供商 id 只能包含字母、数字、点、下划线和连字符"},400);let n=ge(t.baseUrl);if(n)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${n}`},400);if(t.models!==void 0&&!Array.isArray(t.models))return e.json({success:!1,message:"models 必须是数组"},400);if(t.apiKeys!==void 0&&!Array.isArray(t.apiKeys))return e.json({success:!1,message:"apiKeys 必须是数组"},400);if(Bn(t.apiKeys))return e.json({success:!1,message:"apiKeys 条目必须包含非空的 key"},400);let r=Hn(t.models);if(r!==null)return e.json({success:!1,message:qn(r)},400);if(t.apiType!==void 0&&!Fn(t.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);if(t.enabled!==void 0&&typeof t.enabled!="boolean")return e.json({success:!1,message:"enabled 必须是布尔值"},400);if(Re(t.apiKeys)||Re(t.models))return e.json({success:!1,message:"apiKeys/models 条目里的 enabled 必须是布尔值"},400);let s=new Date().toISOString(),o={id:t.id,name:t.name,baseUrl:t.baseUrl.replace(/\/+$/,""),apiType:t.apiType||"openai",apiKeys:Te(t.apiKeys,i=>({key:i,enabled:!0})),models:t.models?Te(t.models,i=>({id:i,enabled:!0})):[],enabled:t.enabled??!0,createdAt:s,updatedAt:s};return await Ht(e.env,o)?e.json({success:!0,data:await se(e.env,o.id)??o},201):e.json({success:!1,message:`提供商 id "${t.id}" 已存在`},409)}async function Vn(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let n=await te(e),r={};if(n.name!==void 0){if(typeof n.name!="string")return e.json({success:!1,message:"name 必须是字符串"},400);if(!n.name)return e.json({success:!1,message:"name 不能为空"},400);r.name=n.name}if(n.baseUrl!==void 0){let o=ge(n.baseUrl);if(o)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${o}`},400);let i=n.baseUrl.replace(/\/+$/,"");r.baseUrl=t==="opencode"?N(i):i}if(n.models!==void 0&&!Array.isArray(n.models))return e.json({success:!1,message:"models 必须是数组"},400);if(n.apiKeys!==void 0&&!Array.isArray(n.apiKeys))return e.json({success:!1,message:"apiKeys 必须是数组"},400);if(Bn(n.apiKeys))return e.json({success:!1,message:"apiKeys 条目必须包含非空的 key"},400);if(n.apiType!==void 0){if(!Fn(n.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);r.apiType=n.apiType}if(n.apiKeys!==void 0&&(r.apiKeys=Te(n.apiKeys,o=>({key:o,enabled:!0}))),n.enabled!==void 0){if(typeof n.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);r.enabled=n.enabled}if(Re(n.apiKeys)||Re(n.models))return e.json({success:!1,message:"apiKeys/models 条目里的 enabled 必须是布尔值"},400);if(n.models!==void 0){let o=Hn(n.models);if(o!==null)return e.json({success:!1,message:qn(o)},400);r.models=Te(n.models,i=>({id:i,enabled:!0}))}let s=await qe(e.env,t,r);return s?e.json({success:!0,data:await se(e.env,t)??s}):e.json({success:!1,message:"提供商不存在"},404)}async function Yn(e){let t=e.req.param("id");return t?await qt(e.env,t)?e.json({success:!0,message:"提供商已删除"}):e.json({success:!1,message:"提供商不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function Gn(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let{modelId:n}=await te(e);if(!n)return e.json({success:!1,message:"modelId 为必填项"},400);let r=await se(e.env,t);if(!r)return e.json({success:!1,message:"提供商不存在"},404);let s=ge(r.baseUrl);if(s)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${s}`},400);let o=r.apiKeys.filter(l=>l?.enabled);if(!G(r.id)&&o.length===0)return e.json({success:!1,message:"该提供商未配置可用的 API Key"},400);let i=G(r.id)?await et(N(r.baseUrl),o,n,ee(e.env)):await Kn(r.baseUrl,o[0].key,n,r.apiType);return r.models.find(l=>l.id===n)||(i.message=`${i.message?i.message+"；":""}提示：该模型尚未保存到提供商配置，点「保存」后才会生效`),e.json({success:!0,data:i})}async function Xn(e){let{url:t,apiKey:n,apiType:r,providerId:s}=await te(e);if(!t||!n&&!(s&&G(s)))return e.json({success:!1,message:"url 和 apiKey 为必填项"},400);let o=ge(t);if(o)return e.json({success:!1,message:o},400);if(s&&G(s)){if(!n&&ee(e.env).length===0)return e.json({success:!0,data:{success:!1,statusCode:0,message:"请先填写 API Key 或配置 OPENCODE_MIRRORS_URL 环境变量"}});let a=N(t),l=await $n(a,[{key:n,enabled:!0}],ee(e.env));return e.json({success:!0,data:{success:l.success,statusCode:l.statusCode||0,message:l.message,data:l.data}})}let i=t.replace(/\/+$/,"");try{let a=await fetch(`${i}/models`,{method:"GET",headers:me(n,r),signal:AbortSignal.timeout(15e3)}),l=null;if(a.ok)try{l=await a.json()}catch{}return e.json({success:!0,data:{success:a.ok,statusCode:a.status,data:l}})}catch(a){return e.json({success:!0,data:{success:!1,statusCode:0,message:a.message||"连接失败"}})}}async function Qn(e){let{url:t,apiKey:n,apiType:r,model:s,providerId:o}=await te(e);if(!t||!s||!n&&!G(o||""))return e.json({success:!1,message:"url、apiKey、model 为必填项"},400);let i=ge(t);if(i)return e.json({success:!1,message:i},400);if(o&&G(o)){let c=N(t),u=await et(c,n?[{key:n,enabled:!0}]:[],s,ee(e.env));return e.json({success:!0,data:{success:u.success,statusCode:u.statusCode||0,message:u.message}})}let a=t.replace(/\/+$/,""),l=r==="anthropic"?"messages":"chat/completions";try{let c=await fetch(`${a}/${l}`,{method:"POST",headers:{"Content-Type":"application/json",...me(n,r)},body:JSON.stringify({model:s,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});return e.json({success:!0,data:{success:c.ok,statusCode:c.status}})}catch(c){return e.json({success:!0,data:{success:!1,statusCode:0,message:c.message||"连接失败"}})}}async function Zn(e){let n=(await J(e.env)).map(r=>{let s=String(r.key??"");return{...r,key:s.length>12?`${s.substring(0,8)}****${s.substring(s.length-4)}`:s}});return e.json({success:!0,data:n})}async function er(e){let t=await te(e);if(t.name!==void 0&&typeof t.name!="string")return e.json({success:!1,message:"name 必须是字符串"},400);let n=crypto.randomUUID(),r=crypto.randomUUID().replace(/-/g,""),s=`${ve}${r}`,o=t.expiresIn?Ct[t.expiresIn]:void 0,i=typeof o=="number"?new Date(Date.now()+o*1e3).toISOString():null,a={id:n,key:s,name:t.name||`Key-${new Date().toLocaleDateString()}`,enabled:!0,createdAt:new Date().toISOString(),expiresAt:i};return await We(e.env,a),e.json({success:!0,data:a,message:"请立即保存此 Key，关闭后将不再显示"},201)}async function tr(e){let t=e.req.param("id");return t?await zt(e.env,t)?e.json({success:!0,message:"转发 Key 已删除"}):e.json({success:!1,message:"转发 Key 不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function nr(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let n=await te(e),r={};if(n.enabled!==void 0){if(typeof n.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);r.enabled=n.enabled}let s=await Wt(e.env,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,message:"转发 Key 不存在"},404)}var Ds="https://github.com/yutian81/ai-gateway";function at(e){return`<footer class="site-footer">
  <div class="shell site-footer__inner">
    <span>© ${new Date().getFullYear()} <a class="site-footer__link" href="${Ds}" target="_blank" rel="noreferrer">${e}</a></span>
    <span>Cloudflare Workers · Hono · KV</span>
  </div>
</footer>`}var rr=`
// ── 工具函数 ──
function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── UI 函数 ──
function showSpinner(el) {
  // 同一结果容器上已有在途测试时不重复发起：并发响应会互相覆盖，白白消耗上游配额
  if (el.dataset.busy) return false
  el.dataset.busy = '1'
  el.innerHTML = '<span class="mu"><i class="fas fa-spinner fa-spin"></i> 测试中...</span>'
  return true
}
function showResult(el, success, msg, note) {
  delete el.dataset.busy
  el.innerHTML = success
    ? '<div class="al al-s"><i class="fas fa-check-circle"></i> 连接成功' + (note ? ' <span class="mu">' + escapeHtml(note) + '</span>' : '') + '</div>'
    : '<div class="al al-e"><i class="fas fa-times-circle"></i> ' + escapeHtml(msg || '连接失败') + '</div>'
}

// ── API 请求函数 ──
async function testKeyConnection(url, apiType, key, providerId) {
  try {
    var r = await fetch('/admin/api/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, apiKey: key, apiType: apiType, providerId: providerId })
    })
    var d = await r.json()
    if (d.success && d.data) {
      return { success: d.data.success, status: d.data.statusCode, data: d.data.data, message: d.data.message }
    }
    // 后端非 2xx（如 400）时也把状态码与消息带回去，否则调用方只会看到 status 0
    return { success: false, status: r.status, data: null, message: d.message }
  } catch (e) {
    return { success: false, status: 0, data: null, message: e && e.message ? e.message : '请求失败' }
  }
}
async function testModelConnection(url, apiType, key, modelId, providerId) {
  try {
    var r = await fetch('/admin/api/test-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, apiKey: key, apiType: apiType, model: modelId, providerId: providerId })
    })
    var d = await r.json()
    if (d.success && d.data) {
      return { success: d.data.success, status: d.data.statusCode, message: d.data.message }
    }
    return { success: false, status: r.status, message: d.message }
  } catch (e) {
    return { success: false, status: 0, message: e && e.message ? e.message : '请求失败' }
  }
}
`;var E=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),it=e=>`
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="oklch(98.5% 0.004 250)">
  <title>${e} — ${W.title}</title>
  <link rel="icon" href="${W.favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Space+Grotesk:wght@500;600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${W.faCdn}">
  <link rel="stylesheet" href="${Rt}">
</head>`;async function sr(e,t){let n=await F(e.env),s=`https://${e.req.header("host")||"localhost:8787"}/v1`,o=n.filter(l=>l.enabled),i=n.reduce((l,c)=>l+c.models.length,0),a=o.reduce((l,c)=>l+c.models.filter(d=>d.enabled).length,0);return e.html(`<!DOCTYPE html><html lang="zh-CN">
${it("首页")}
<body class="site-page home-page">
<header class="topbar">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${W.title}</span>
      <span class="brand__descriptor">API CONTROL PLANE</span>
    </a>
    <nav class="topbar__actions" aria-label="主导航">
      ${t?'<a href="/admin" class="btn btn-p"><i class="fas fa-sliders-h" aria-hidden="true"></i>管理控制台</a><a href="/admin/logout" class="btn btn-gh"><i class="fas fa-sign-out-alt" aria-hidden="true"></i>退出</a>':'<a href="/admin/login" class="btn btn-p"><i class="fas fa-sign-in-alt" aria-hidden="true"></i>管理员登录</a>'}
    </nav>
  </div>
</header>

<main>
  <section class="shell home-hero" aria-labelledby="home-title">
    <div class="home-hero__copy">
      <p class="eyebrow"><span aria-hidden="true"></span>UNIFIED AI GATEWAY</p>
      <h1 id="home-title">一个 API，调用已配置的所有模型。</h1>
      <p class="home-hero__lede">统一的 OpenAI / Anthropic 兼容入口。模型按提供商归档，转发 Key、启用状态和故障转移集中管理。</p>
      <div class="endpoint-box" aria-label="API 接入地址">
        <span class="endpoint-box__label">BASE URL</span>
        <code>${E(s)}</code>
        <button class="icon-btn copy-control" type="button" data-copy="${E(s)}" aria-label="复制 API 地址">
          <i class="far fa-copy" aria-hidden="true"></i><span>复制</span>
        </button>
      </div>
      <span id="copy-status" class="sr-only" role="status" aria-live="polite"></span>
    </div>

    <figure class="request-panel" aria-labelledby="request-caption">
      <figcaption id="request-caption">
        <span>POST /chat/completions</span>
        <span class="protocol-state"><i aria-hidden="true"></i>OPENAI COMPATIBLE</span>
      </figcaption>
      <pre><code><span class="syntax-command">curl</span> ${E(s)}/chat/completions \\
  <span class="syntax-key">-H</span> <span class="syntax-string">"Authorization: Bearer sk_cf_••••"</span> \\
  <span class="syntax-key">-H</span> <span class="syntax-string">"Content-Type: application/json"</span> \\
  <span class="syntax-key">-d</span> <span class="syntax-string">'{
    "model": "opencode/deepseek-v4-flash-free",
    "messages": [{ "role": "user", "content": "Hello" }]
  }'</span></code></pre>
      <div class="request-panel__foot">
        <span>模型格式</span>
        <code>provider/model</code>
      </div>
    </figure>
  </section>

  <section class="shell metrics-strip" aria-label="网关配置概览">
    <div class="metric"><span class="metric__value">${n.length}</span><span class="metric__label">提供商总计</span></div>
    <div class="metric"><span class="metric__value">${o.length}</span><span class="metric__label">已启用提供商</span></div>
    <div class="metric"><span class="metric__value">${i}</span><span class="metric__label">模型总计</span></div>
    <div class="metric"><span class="metric__value">${a}</span><span class="metric__label">可用模型</span></div>
  </section>

  <section class="shell directory" aria-labelledby="directory-title">
    <div class="section-heading">
      <div>
        <h2 id="directory-title">模型列表</h2>
        <p>点击模型 ID 即可复制；这里只展示已启用的提供商与模型。</p>
      </div>
      <label class="search-field" for="model-search">
        <i class="fas fa-search" aria-hidden="true"></i>
        <span class="sr-only">搜索提供商或模型</span>
        <input id="model-search" type="search" placeholder="搜索提供商或模型" autocomplete="off">
      </label>
    </div>

    <div class="provider-index" id="provider-index">
      ${o.length?o.map(l=>{let c=l.models.filter(d=>d.enabled);return`<article class="provider-row" data-search="${E(`${l.name} ${l.id} ${c.map(d=>d.id).join(" ")}`.toLowerCase())}">
          <div class="provider-row__identity">
            <span class="provider-row__mark" aria-hidden="true">${E(l.name.charAt(0).toUpperCase()||"A")}</span>
            <div>
              <h3>${E(l.name)}</h3>
              <p><code>${E(l.id)}</code><span>${(l.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"} 兼容</span></p>
            </div>
          </div>
          <div class="provider-row__models">
            ${c.length?c.map(d=>{let u=`${l.id}/${d.id}`;return`<button class="model-token copy-control" type="button" data-copy="${E(u)}"><code>${E(u)}</code><i class="far fa-copy" aria-hidden="true"></i></button>`}).join(""):'<span class="empty-inline">暂无启用模型</span>'}
          </div>
          <span class="status-badge status-badge--on"><i aria-hidden="true"></i>已启用</span>
        </article>`}).join(""):`<div class="empty-state"><i class="fas fa-cubes" aria-hidden="true"></i><h3>尚无可用模型</h3><p>管理员启用提供商和模型后，它们会出现在这里。</p>${t?'<a class="btn btn-p" href="/admin">前往管理控制台</a>':""}</div>`}
    </div>
    <div id="search-empty" class="empty-state hd"><i class="fas fa-search" aria-hidden="true"></i><h3>没有匹配结果</h3><p>请尝试输入提供商名称、ID 或模型名称。</p></div>
  </section>
</main>

${at(W.title)}

<script>
(function () {
  var status = document.getElementById('copy-status')
  document.querySelectorAll('.copy-control').forEach(function (button) {
    button.addEventListener('click', async function () {
      var text = button.getAttribute('data-copy') || ''
      var icon = button.querySelector('i')
      var label = button.querySelector('span')
      var reset = function () {
        button.removeAttribute('data-state')
        if (icon) icon.className = 'far fa-copy'
        if (label) label.textContent = '复制'
      }
      try {
        // 非安全上下文/部分 WebView 没有 clipboard API，直接调会抛未捕获错误
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable')
        await navigator.clipboard.writeText(text)
        button.setAttribute('data-state', 'success')
        if (icon) icon.className = 'fas fa-check c-s'
        if (label) label.textContent = '已复制'
        if (status) status.textContent = '已复制 ' + text
        window.setTimeout(reset, 1800)
      } catch (error) {
        button.setAttribute('data-state', 'error')
        if (status) status.textContent = '复制失败，请手动选择文本。'
        // 与成功态一致地复位，否则红色错误边框会一直留着
        window.setTimeout(reset, 1800)
      }
    })
  })

  var search = document.getElementById('model-search')
  var rows = Array.from(document.querySelectorAll('.provider-row'))
  var empty = document.getElementById('search-empty')
  if (search) search.addEventListener('input', function () {
    var query = search.value.trim().toLowerCase()
    var visible = 0
    rows.forEach(function (row) {
      var matched = !query || (row.getAttribute('data-search') || '').includes(query)
      row.classList.toggle('hd', !matched)
      if (matched) visible++
    })
    if (empty) empty.classList.toggle('hd', visible > 0 || !query)
  })
})()
<\/script>
</body></html>`)}async function or(e){return e.html(`<!DOCTYPE html><html lang="zh-CN">
${it("登录")}
<body class="site-page auth-page">
<header class="topbar topbar--auth">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${W.title}</span>
    </a>
    <a href="/" class="btn btn-gh"><i class="fas fa-arrow-left" aria-hidden="true"></i>返回首页</a>
  </div>
</header>

<main class="auth-shell">
  <section class="auth-context" aria-labelledby="auth-context-title">
    <p class="eyebrow"><span aria-hidden="true"></span>CONTROL PLANE ACCESS</p>
    <h1 id="auth-context-title">管理提供商、模型和转发密钥。</h1>
  </section>

  <section class="auth-form-wrap" aria-labelledby="login-title">
    <form class="auth-form" id="login-form" novalidate>
      <div class="auth-form__heading">
        <span class="auth-form__icon" aria-hidden="true"><i class="fas fa-lock"></i></span>
        <div><h2 id="login-title">管理员登录</h2><p>使用部署时配置的账号继续。</p></div>
      </div>

      <div id="er" class="al al-e hd" role="alert" aria-live="assertive">
        <i class="fas fa-exclamation-circle" aria-hidden="true"></i><span id="em"></span>
      </div>

      <div class="fg">
        <label for="u">用户名</label>
        <div class="input-wrap"><i class="far fa-user" aria-hidden="true"></i><input type="text" id="u" name="username" placeholder="admin" autocomplete="username" aria-required="true" aria-describedby="login-helper"></div>
      </div>
      <div class="fg">
        <label for="p">密码</label>
        <div class="input-wrap"><i class="fas fa-key" aria-hidden="true"></i><input type="password" id="p" name="password" placeholder="部署环境变量中的密码" autocomplete="current-password" aria-required="true" aria-describedby="login-helper"><button class="password-toggle" id="password-toggle" type="button" aria-label="显示密码"><i class="far fa-eye" aria-hidden="true"></i></button></div>
      </div>
      <p id="login-helper" class="form-helper">登录成功后将进入管理控制台。</p>
      <button class="btn btn-p btn-submit" id="login-button" type="submit"><span class="button-label"><i class="fas fa-sign-in-alt" aria-hidden="true"></i>登录管理控制台</span><span class="button-loading"><i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>正在验证</span></button>
    </form>
  </section>
</main>

<script>
(function () {
  var form = document.getElementById('login-form')
  var username = document.getElementById('u')
  var password = document.getElementById('p')
  var errorBox = document.getElementById('er')
  var errorMessage = document.getElementById('em')
  var submit = document.getElementById('login-button')
  var toggle = document.getElementById('password-toggle')

  function showError(message) {
    errorMessage.textContent = message
    errorBox.classList.remove('hd')
    username.setAttribute('aria-invalid', 'true')
    password.setAttribute('aria-invalid', 'true')
  }
  function clearError() {
    errorBox.classList.add('hd')
    username.removeAttribute('aria-invalid')
    password.removeAttribute('aria-invalid')
  }

  toggle.addEventListener('click', function () {
    var show = password.type === 'password'
    password.type = show ? 'text' : 'password'
    toggle.setAttribute('aria-label', show ? '隐藏密码' : '显示密码')
    toggle.querySelector('i').className = show ? 'far fa-eye-slash' : 'far fa-eye'
    password.focus({ preventScroll: true })
  })

  form.addEventListener('submit', async function (event) {
    event.preventDefault()
    clearError()
    var u = username.value.trim()
    var p = password.value
    if (!u || !p) {
      showError('请填写用户名和密码后再登录。')
      ;(!u ? username : password).focus()
      return
    }
    submit.disabled = true
    submit.setAttribute('data-state', 'loading')
    try {
      var response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      })
      var data = null
      try {
        data = await response.json()
      } catch (e) {
        // 网关/边缘的错误页是 HTML，不是 JSON：报状态码而不是误报“网络不通”
        showError('服务返回异常（HTTP ' + response.status + '），请稍后重试。')
        submit.disabled = false
        submit.removeAttribute('data-state')
        return
      }
      if (data.success) {
        submit.setAttribute('data-state', 'success')
        window.location.href = '/admin'
        return
      }
      showError(data.message || '登录失败，请检查账号配置。')
    } catch (error) {
      showError('无法连接服务，请检查网络后重试。')
    }
    submit.disabled = false
    submit.removeAttribute('data-state')
  })
})()
<\/script>
</body></html>`)}function js(e,t,n){let r=E(e),s=E(t.id);return`<div class="fc mb-3 field-row" data-idx="${n}"><input type="text" value="${s}" class="fx1" id="mid-${r}-${n}" placeholder="模型 ID"><label class="tg"><input type="checkbox" ${t.enabled?"checked":""} id="men-${r}-${n}" aria-label="启用模型"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" data-mid="${s}" onclick="testMdl('${r}',this.dataset.mid)" title="测试模型" aria-label="测试模型"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmMdl('${r}',${n})" title="移除模型" aria-label="移除模型"><i class="fas fa-times" aria-hidden="true"></i></button></div>`}async function ar(e){let t=await F(e.env),n=await J(e.env);e.header("Cache-Control","no-store");let r=t.filter(a=>a.enabled).length,s=t.reduce((a,l)=>a+l.models.length,0),o=t.reduce((a,l)=>a+l.models.filter(c=>c.enabled).length,0),i=n.filter(a=>a.enabled).length;return e.html(`<!DOCTYPE html><html lang="zh-CN">
${it("管理")}
<body class="site-page admin-page">
<div class="admin-shell">
  <aside class="admin-rail" aria-label="控制台导航">
    <a class="brand admin-rail__brand" href="/">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span><strong>${W.title}</strong><small>CONTROL PLANE</small></span>
    </a>
    <nav class="admin-nav">
      <a class="admin-nav__link is-active" href="#overview"><i class="fas fa-chart-pie" aria-hidden="true"></i><span>概览</span></a>
      <a class="admin-nav__link" href="#providers"><i class="fas fa-server" aria-hidden="true"></i><span>提供商</span><b>${t.length}</b></a>
      <a class="admin-nav__link" href="#proxy-keys"><i class="fas fa-key" aria-hidden="true"></i><span>转发 Key</span><b>${n.length}</b></a>
    </nav>
    <div class="admin-rail__foot">
      <a href="/" class="admin-nav__link"><i class="fas fa-arrow-left" aria-hidden="true"></i><span>返回首页</span></a>
      <a href="/admin/logout" class="admin-nav__link"><i class="fas fa-sign-out-alt" aria-hidden="true"></i><span>退出登录</span></a>
    </div>
  </aside>

  <div class="admin-main">
    <header class="admin-topbar">
      <a class="brand" href="/"><span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span><span class="brand__name">${W.title}</span></a>
      <nav aria-label="移动端控制台导航"><a href="#overview">概览</a><a href="#providers">提供商</a><a href="#proxy-keys">Key</a></nav>
      <a class="icon-btn" href="/admin/logout" aria-label="退出登录"><i class="fas fa-sign-out-alt" aria-hidden="true"></i></a>
    </header>

    <main class="admin-content">
      <div id="toast" class="hd toast" role="status" aria-live="polite"></div>

      <section id="overview" class="admin-overview" aria-labelledby="admin-title">
        <div class="admin-heading">
          <div><p class="eyebrow"><span aria-hidden="true"></span>GATEWAY STATUS</p><h1 id="admin-title">管理控制台</h1><p>配置提供商、模型与客户端访问凭据。变更将写入 Cloudflare KV。</p></div>
          <div class="admin-heading__actions"><a href="/" class="btn btn-s"><i class="fas fa-external-link-alt" aria-hidden="true"></i>查看模型列表</a></div>
        </div>
        <div class="admin-metrics" aria-label="配置统计">
          <div><span>${t.length}</span><p>提供商</p><small>${r} 个已启用</small></div>
          <div><span>${s}</span><p>模型</p><small>${o} 个可用</small></div>
          <div><span>${n.length}</span><p>转发 Key</p><small>${i} 个可用</small></div>
          <div><span class="status-dot status-dot--online"><i aria-hidden="true"></i>已配置</span><p>存储</p><small>Cloudflare KV</small></div>
        </div>
      </section>

      <section id="providers" class="workspace-section" aria-labelledby="providers-title">
        <div class="section-heading section-heading--admin">
          <div><h2 id="providers-title">提供商</h2><p>管理上游地址、协议、API Key 和模型。</p></div>
          <button class="btn btn-p" onclick="showAdd()"><i class="fas fa-plus" aria-hidden="true"></i>添加提供商</button>
        </div>

        <div class="af-w">
          <div id="af" class="hd add-form-panel">
            <div class="panel-heading"><div><span class="panel-heading__mark"><i class="fas fa-plus" aria-hidden="true"></i></span><div><h3>添加新提供商</h3><p>先配置基本信息，再测试 Key 与模型连接。</p></div></div><button class="icon-btn" type="button" onclick="hideAdd()" aria-label="关闭添加表单"><i class="fas fa-times" aria-hidden="true"></i></button></div>
            <div class="fr">
              <div class="fg"><label for="anm">名称</label><input type="text" id="anm" placeholder="DeepSeek"></div>
              <div class="fg"><label for="aid">提供商 ID</label><input type="text" id="aid" placeholder="deepseek"><span class="form-helper">用于模型前缀，创建后不可修改。</span></div>
            </div>
            <div class="fg"><label for="aurl">API 地址</label><input type="url" id="aurl" placeholder="https://api.deepseek.com"></div>
            <div class="fg"><label for="afmt">API 格式</label><select id="afmt" class="select-sm"><option value="openai">OpenAI 兼容</option><option value="anthropic">Anthropic 兼容</option></select></div>
            <fieldset class="form-group"><legend>上游 API Keys</legend><div id="akeys"><div class="fc mb-4 field-row"><input type="text" placeholder="sk-xxx" class="fx1 aki" aria-label="上游 API Key"><label class="tg" title="启用 Key"><input type="checkbox" checked class="ake" aria-label="启用 Key"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制 Key" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" onclick="testNewAKey(this)" title="测试 Key" aria-label="测试 Key"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="this.parentElement.remove()" title="移除 Key" aria-label="移除 Key"><i class="fas fa-times" aria-hidden="true"></i></button></div></div><button class="btn btn-s" onclick="addAKeyRow()"><i class="fas fa-plus" aria-hidden="true"></i>添加 Key</button></fieldset>
            <aside id="amc" class="hd mdl-list-panel"><div class="panel-heading"><div><span class="panel-heading__mark"><i class="fas fa-cube" aria-hidden="true"></i></span><div><h3>可用模型</h3><p>点击“+”添加到配置。</p></div></div><button class="icon-btn" type="button" onclick="hideMdlPanel('amc')" title="关闭可用模型" aria-label="关闭可用模型"><i class="fas fa-times" aria-hidden="true"></i></button></div><div id="amcl"></div></aside>
            <fieldset class="form-group"><legend>模型 ID</legend><div id="amodels"><div class="fc mb-4 field-row"><input type="text" placeholder="deepseek-chat" class="fx1 ami" aria-label="模型 ID"><label class="tg" title="启用模型"><input type="checkbox" checked class="ame" aria-label="启用模型"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" onclick="testNewMdl(this)" title="测试模型" aria-label="测试模型"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="this.parentElement.remove()" title="移除模型" aria-label="移除模型"><i class="fas fa-times" aria-hidden="true"></i></button></div></div><button class="btn btn-s" onclick="addMdlRow()"><i class="fas fa-plus" aria-hidden="true"></i>添加模型</button></fieldset>
            <div class="panel-actions"><label class="switch-label"><span>创建后立即启用</span><span class="tg"><input type="checkbox" checked id="aen"><span class="sl"></span></span></label><div><button class="btn btn-s" onclick="hideAdd()">取消</button><button class="btn btn-p" onclick="createProv()"><i class="fas fa-check" aria-hidden="true"></i>创建提供商</button></div></div>
            <div id="atestR" class="mt-1" aria-live="polite"></div>
          </div>
        </div>

        <div class="gp provider-list" id="plist">
          ${t.length?t.map(a=>`
          <article class="pi" data-id="${E(a.id)}">
            <div class="ps" onclick="tog('${a.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();tog('${a.id}')}" aria-controls="dt-${E(a.id)}">
              <div class="l"><i class="fas fa-chevron-right provider-chevron" aria-hidden="true" id="ch-${E(a.id)}"></i><span class="provider-avatar" aria-hidden="true">${E(a.name.charAt(0).toUpperCase()||"A")}</span><div><h3>${E(a.name)}</h3><div class="pu"><code>${E(a.id)}</code><span>${(a.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"}</span><span>${a.apiKeys.length} Keys</span><span>${a.models.length} 模型</span></div></div></div>
              <div class="fc fx-s0" onclick="event.stopPropagation()"><label class="tg"><input type="checkbox" ${a.enabled?"checked":""} id="en-${E(a.id)}" onchange="togglePb('${a.id}',this.checked)" aria-label="启用 ${E(a.name)}"><span class="sl"></span></label><span class="bd ${a.enabled?"bd-on":"bd-off"}">${a.enabled?"已启用":"未启用"}</span></div>
            </div>
            <div class="pd" id="dt-${E(a.id)}">
              <div class="detail-heading"><div><h3>编辑 ${E(a.name)}</h3><p>保存后，新配置会用于后续转发请求。</p></div><span class="protocol-chip">${(a.apiType||"openai")==="anthropic"?"ANTHROPIC":"OPENAI"}</span></div>
              <div class="fr"><div class="fg"><label>名称</label><input type="text" id="nm-${E(a.id)}" value="${E(a.name)}"></div><div class="fg"><label>ID</label><input type="text" value="${E(a.id)}" disabled></div></div>
              <div class="fg"><label>API 地址</label><input type="url" id="url-${E(a.id)}" value="${E(a.baseUrl)}"></div>
              <div class="fg"><label>API 格式</label><select id="at-${E(a.id)}" class="select-sm"><option value="openai" ${(a.apiType||"openai")==="openai"?"selected":""}>OpenAI 兼容</option><option value="anthropic" ${a.apiType==="anthropic"?"selected":""}>Anthropic 兼容</option></select></div>
              <fieldset class="form-group"><legend>上游 API Keys</legend><div id="keys-${E(a.id)}">${a.apiKeys.filter(Boolean).map((l,c)=>`<div class="fc mb-3 field-row" data-kidx="${c}"><input type="text" value="${E(l.key)}" class="fx1" id="k-${E(a.id)}-${c}" placeholder="API Key" aria-label="API Key"><label class="tg"><input type="checkbox" ${l.enabled?"checked":""} id="ken-${E(a.id)}-${c}" aria-label="启用 Key"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制 Key" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" onclick="testKeyRow('${a.id}',${c})" title="测试 Key" aria-label="测试 Key"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmKeyRow('${a.id}',${c})" title="移除 Key" aria-label="移除 Key"><i class="fas fa-times" aria-hidden="true"></i></button></div>`).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nk-${E(a.id)}" placeholder="新的 API Key" class="fx1"><button class="btn btn-s" onclick="addKeyRow('${a.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <fieldset class="form-group"><legend>模型</legend><div id="ml-${E(a.id)}">${a.models.filter(Boolean).map((l,c)=>js(a.id,l,c)).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nmid-${E(a.id)}" placeholder="新的模型 ID" class="fx1"><button class="btn btn-s" onclick="addMdl('${a.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <div class="detail-actions"><div id="tr-${E(a.id)}" aria-live="polite"></div><div>${a.id==="opencode"?`<button class="btn btn-s" onclick="fetchEditModels('`+a.id+`')"><i class="fas fa-download" aria-hidden="true"></i>获取模型</button>`:""}<button class="btn btn-d" onclick="del('${a.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button><button class="btn btn-p" onclick="save('${a.id}')"><i class="fas fa-save" aria-hidden="true"></i>保存更改</button></div></div>
            </div>
          </article>`).join(""):'<div class="empty-state"><i class="fas fa-server" aria-hidden="true"></i><h3>还没有提供商</h3><p>添加第一个上游提供商，配置 API 地址、Key 和模型。</p><button class="btn btn-p" onclick="showAdd()">添加提供商</button></div>'}
        </div>
      </section>

      <section id="proxy-keys" class="workspace-section" aria-labelledby="proxy-keys-title">
        <div class="section-heading section-heading--admin"><div><h2 id="proxy-keys-title">转发 Key</h2><p>客户端使用这些 Key 访问统一的 <code>/v1</code> 接口。</p></div><button class="btn btn-p" onclick="genKey()"><i class="fas fa-plus" aria-hidden="true"></i>生成转发 Key</button></div>
        <div class="key-list">
          ${n.length===0?'<div class="empty-state"><i class="fas fa-key" aria-hidden="true"></i><h3>暂无转发 Key</h3><p>生成一个 Key 后，客户端才能访问网关。</p><button class="btn btn-p" onclick="genKey()">生成转发 Key</button></div>':""}
          ${n.map(a=>`<article class="ki" data-id="${E(a.id)}"><div class="key-main"><span class="key-icon" aria-hidden="true"><i class="fas fa-key"></i></span><div><div class="kv"><span id="kv-${E(a.id)}" data-full="${E(a.key)}" data-vis="0">${E(a.key.length>12?a.key.substring(0,8)+"****"+a.key.substring(a.key.length-4):a.key)}</span><button class="icon-btn" onclick="toggleKeyVis('${a.id}')" title="显示或隐藏" aria-label="显示或隐藏 Key"><i class="far fa-eye" aria-hidden="true"></i></button><button class="icon-btn" data-copy-val="${E(a.key)}" onclick="copyText(this.dataset.copyVal,this)" title="复制" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button></div><div class="key-meta"><h3>${E(a.name)}</h3><span class="key-meta__sep" aria-hidden="true">-</span><p>创建于 ${new Date(a.createdAt).toLocaleDateString()} · ${a.expiresAt?"有效至 "+new Date(a.expiresAt).toLocaleDateString():"永久有效"}</p></div></div></div><div class="key-actions"><label class="tg"><input type="checkbox" ${a.enabled?"checked":""} onchange="toggleProxyKey('${a.id}',this.checked)" aria-label="启用 ${E(a.name)}"><span class="sl"></span></label><span class="bd ${a.enabled?"bd-on":"bd-off"}">${a.enabled?"已启用":"已禁用"}</span><button class="bd bd-del" onclick="rmKey('${a.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button></div></article>`).join("")}
        </div>
      </section>
    </main>

    ${at(W.title)}
  </div>
</div>

<div id="modal" class="modal-o hd" role="presentation" onclick="if(event.target===this)closeModal()"><div class="modal" id="mc" role="dialog" aria-modal="true" aria-live="polite"></div></div>

<script>${rr}
// copy
function copyText(t, el) {
  const i = el.tagName === 'I' ? el : (el.querySelector('i') || el.parentElement?.querySelector('i'))
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    // 非安全上下文（http:// 或某些内嵌 WebView）没有 clipboard API，直接调用会抛
    toast('当前环境不支持自动复制，请手动选择文本', 'error')
    return
  }
  if (!i) { navigator.clipboard.writeText(t).catch(() => {}); return }
  const oc = i.className
  navigator.clipboard.writeText(t).then(() => {
    i.className = 'fas fa-check c-s'
    el.setAttribute('data-state', 'success')
    setTimeout(() => {
      i.className = oc
      el.removeAttribute('data-state')
    }, 1800)
  }).catch(() => {
    el.setAttribute('data-state', 'error')
    setTimeout(() => el.removeAttribute('data-state'), 1800)
  })
}

// 从当前行读取实时输入值并复制（Key 行与模型 ID 行共用）
function copyRowVal(btn) {
  const inp = btn.parentElement.querySelector('input[type=text]')
  if (inp) copyText(inp.value, btn)
}

// modal
function showM(h) { document.getElementById('mc').innerHTML = h; document.getElementById('modal').classList.remove('hd') }
function closeM() { document.getElementById('modal').classList.add('hd') }
// 点遮罩关闭时也要让挂起的 cM/pM Promise 落地，否则 await 永久悬挂
function closeModal() { const r = window.r; window.r = null; closeM(); if (r) r(null) }
function cM(msg) {
  return new Promise(r => {
    // 连点两次会让第二次覆盖 window.r，前一个 Promise 永不落地
    if (window.r) window.r(false)
    showM('<h3><i class="fas fa-question-circle c-p"></i> 确认</h3><p>' + escapeHtml(msg) + '</p><div class="fa"><button class="btn btn-s" onclick="closeM();r(false)">取消</button><button class="btn btn-p" onclick="closeM();r(true)">确定</button></div>')
    window.r = r
  })
}
function pM(msg, def) {
  return new Promise(r => {
    if (window.r) window.r(null)
    showM('<h3><i class="fas fa-pen c-p"></i> ' + escapeHtml(msg) + '</h3><div class="fg"><input type="text" id="pv" value="' + escapeHtml(def || '') + '" placeholder="请输入"></div><div class="fa"><button class="btn btn-s" id="pMc">取消</button><button class="btn btn-p" id="pMo">确定</button></div>')
    window.r = r
    const inp = document.getElementById('pv')
    if (inp) {
      inp.focus()
      inp.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { closeM(); r(inp.value.trim()) }
      })
    }
    document.getElementById('pMc').addEventListener('click', function() { closeM(); r(null) })
    document.getElementById('pMo').addEventListener('click', function() { closeM(); r(inp.value.trim()) })
  })
}
let toastTimer = 0
function toast(msg, t) {
  const el = document.getElementById('toast')
  const i = t === 'success' ? 'fa-check-circle' : t === 'error' ? 'fa-times-circle' : 'fa-info-circle'
  const cls = t === 'success' ? 'al-s' : t === 'error' ? 'al-e' : 'al-i'
  el.innerHTML = '<div class="al ' + cls + '"><i class="fas ' + i + '"></i> ' + escapeHtml(msg) + '</div>'
  el.classList.remove('hd')
  // 先清掉上一条定时器，否则它会把新提示提前关掉
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.add('hd'), 3000)
}

// 统一的 JSON 请求：网络异常/非 JSON 响应不再变成未捕获的 rejection（点按钮毫无反应、
// 按钮也不恢复），并把 onError/notFound 的 {error:{message}} 形状归一成 d.message
async function apiJson(url, opts) {
  let r
  try { r = await fetch(url, opts) }
  catch (e) { return { success: false, message: '网络错误：' + ((e && e.message) || '请求失败') } }
  let d = null
  try { d = await r.json() } catch (e) {}
  if (!d || typeof d !== 'object') return { success: false, message: 'HTTP ' + r.status + '：响应不是有效的 JSON' }
  if (d.message === undefined && d.error && d.error.message) d.message = d.error.message
  return d
}

// 连通性测试失败时的文案：优先用服务端给的可读原因（如「仅允许 https:// 上游地址」），
// 没有原因时再回落到状态码；status 为 0 表示请求根本没发出去
function httpMsg(result) {
  return result.status
    ? 'HTTP ' + result.status + (result.message ? ': ' + result.message : '')
    : (result.message || '请求失败')
}

// providers
function tog(id) {
  const d = document.getElementById('dt-' + id), c = document.getElementById('ch-' + id)
  d.classList.toggle('open')
  c.style.transform = d.classList.contains('open') ? 'rotate(90deg)' : ''
}

function showAdd() { document.getElementById('af').classList.remove('hd') }
function hideAdd() { document.getElementById('af').classList.add('hd'); document.getElementById('amc').classList.add('hd') }

// aid 输入 opencode 时自动填充 API 地址
document.getElementById('aid').addEventListener('input', function() {
  if (this.value.trim() === 'opencode') {
    document.getElementById('aurl').value = '${we}'
  }
})

// provider api keys (add form)
function addAKeyRow() {
  const c = document.getElementById('akeys')
  const d = document.createElement('div')
  d.className = 'fc mb-4 field-row'
  d.innerHTML = '<input type="text" placeholder="sk-xxx" class="fx1 aki" aria-label="上游 API Key"><label class="tg"><input type="checkbox" checked class="ake" aria-label="启用 Key"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制 Key" aria-label="复制 Key"><i class="far fa-copy"></i></button><button class="icon-btn" onclick="testNewAKey(this)" title="测试 Key" aria-label="测试 Key"><i class="fas fa-plug"></i></button><button class="icon-btn" onclick="this.parentElement.remove()" title="移除 Key" aria-label="移除 Key"><i class="fas fa-times"></i></button>'
  c.appendChild(d)
}

function renderModelGrid(models, editId, providerId) {
  if (providerId === 'opencode') {
    models = (models || []).filter(function(m) {
      return m && typeof m.id === 'string' && /^[A-Za-z0-9._:/-]+$/.test(m.id) && (m.id === 'big-pickle' || m.id.endsWith('-free'))
    })
  }
  // 上游 200 但 data 不是数组（如 {"data":{...}}）时不能直接 .map：抛错会让调用方的
  // showResult 不再执行，结果区永久停在“测试中...
  if (!Array.isArray(models) || models.length === 0) return '<span class="mu">未返回模型列表</span>'
  var h = models.map(function(m) {
    var modelId = String(m.id || '')
    var safeId = escapeHtml(modelId)
    var addFn = editId
      ? 'addMdlToEdit(this.dataset.editId, this.dataset.modelId)'
      : 'addMdlToForm(this.dataset.modelId)'
    var editAttr = editId ? ' data-edit-id="' + escapeHtml(String(editId)) + '"' : ''
    return '<div class="mdl-item">' +
      '<i class="fas fa-cube"></i>' +
      '<span class="fx1 cp ov" data-model-id="' + safeId + '" onclick="copyText(this.dataset.modelId,this)">' + safeId + '</span>' +
      '<button class="btn btn-gh mdl-add-btn" type="button" data-model-id="' + safeId + '"' + editAttr + ' onclick="' + addFn + '" title="添加到表单">+</button></div>'
  }).join('')
  return '<div class="grid-2-gap6">' + h + '</div>'
}

// 可用模型面板 heading（编辑态动态生成；添加态的静态 #amc 没有“全部入库”按钮）
function modelPanelHeading(panelId) {
  return '<div class="panel-heading"><div>' +
    '<span class="panel-heading__mark"><i class="fas fa-cube" aria-hidden="true"></i></span>' +
    '<div><h3>可用模型</h3><p>点击“+”添加到配置。</p></div></div>' +
    '<button class="btn btn-gh" type="button" onclick="addAllUpstream(\\'' + panelId + '\\')" title="把列表内全部模型合并进配置并立即保存">全部入库并保存</button>' +
    '<button class="icon-btn" type="button" onclick="hideMdlPanel(\\'' + panelId + '\\')" title="关闭可用模型" aria-label="关闭可用模型"><i class="fas fa-times" aria-hidden="true"></i></button></div>'
}

// 把当前发现列表里的全部模型合并进提供商配置（去重）并立即保存。
async function addAllUpstream(panelId) {
  const id = panelId.replace(/^mel-/, '')
  if (!document.getElementById('ml-' + id)) { toast('该面板不支持一键入库', 'error'); return }
  const grid = document.getElementById('melc-' + id)
  if (!grid) { toast('请先点击「测试」拉取可用模型', 'error'); return }
  const ids = Array.from(grid.querySelectorAll('.mdl-item .fx1'))
    .map(s => s.textContent.trim()).filter(Boolean)
  if (!ids.length) { toast('发现列表为空', 'error'); return }
  // 无原型对象：键是模型 id，允许下划线，"__proto__" 这类键会使普通对象
  // 的赋值变成改原型，从而静默漏加模型
  const existing = Object.create(null)
  getMdl(id).forEach(m => { existing[m.id] = true })
  let added = 0
  ids.forEach(mid => {
    // 循环内同步标记：上游列表自身重复的 id 会被加两次
    if (!existing[mid]) { existing[mid] = true; addMdlToEdit(id, mid); added++ }
  })
  if (!added) { toast('列表内模型均已存在，无需入库', 'info'); return }
  // 先报进度再保存：save 成功后自己 toast 并 reload（reload 会清掉这条提示）
  toast('已加入 ' + added + ' 个模型，正在保存…')
  await save(id)
}

// 关闭可用模型面板（仅隐藏，不清空已获取的模型数据）
function hideMdlPanel(panelId) {
  document.getElementById(panelId).classList.add('hd')
}

function testNewAKey(btn) {
  const inp = btn.parentElement.querySelector('.aki'), k = inp.value.trim()
  const providerId = document.getElementById('aid').value.trim()
  if (!k && providerId !== 'opencode') { toast('请输入 API Key', 'error'); return }
  const url = document.getElementById('aurl').value.trim()
  if (!url) { toast('请先填写 API 地址', 'error'); return }
  const apiType = document.getElementById('afmt').value
  const tr = document.getElementById('atestR')
  if (!showSpinner(tr)) return
  testKeyConnection(url, apiType, k, providerId).then(function(result) {
    if (result.success && result.data) {
      document.getElementById('amcl').innerHTML = renderModelGrid(result.data.data || [], null, providerId)
      document.getElementById('amc').classList.remove('hd')
    } else {
      document.getElementById('amc').classList.add('hd')
    }
    showResult(tr, result.success, result.success ? '' : httpMsg(result))
  })
}

function addMdlRow() {
  const c = document.getElementById('amodels')
  const d = document.createElement('div')
  d.className = 'fc mb-4 field-row'
  d.innerHTML = '<input type="text" placeholder="deepseek-chat" class="fx1 ami" aria-label="模型 ID"><label class="tg"><input type="checkbox" checked class="ame" aria-label="启用模型"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy"></i></button><button class="icon-btn" onclick="testNewMdl(this)" title="测试模型" aria-label="测试模型"><i class="fas fa-plug"></i></button><button class="icon-btn" onclick="this.parentElement.remove()" title="移除模型" aria-label="移除模型"><i class="fas fa-times"></i></button>'
  c.appendChild(d)
}

function addMdlToForm(mid) {
  const c = document.getElementById('amodels')
  const d = document.createElement('div')
  d.className = 'fc mb-4 field-row'
  d.innerHTML = '<input type="text" value="' + escapeHtml(mid) + '" class="fx1 ami" aria-label="模型 ID"><label class="tg"><input type="checkbox" checked class="ame" aria-label="启用模型"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy"></i></button><button class="icon-btn" onclick="testNewMdl(this)" title="测试模型" aria-label="测试模型"><i class="fas fa-plug"></i></button><button class="icon-btn" onclick="this.parentElement.remove()" title="移除模型" aria-label="移除模型"><i class="fas fa-times"></i></button>'
  c.appendChild(d)
}

function testNewMdl(btn) {
  const inp = btn.parentElement.querySelector('.ami'), mid = inp.value.trim()
  if (!mid) { toast('请输入模型 ID', 'error'); return }
  const url = document.getElementById('aurl').value.trim()
    const akeys = document.querySelectorAll('#akeys .aki')
    const configuredKey = Array.from(akeys).map(function(inp) { return inp.value.trim() }).filter(Boolean)[0] || ''
    const apiType = document.getElementById('afmt').value
    const tr = document.getElementById('atestR')
  const providerId = document.getElementById('aid').value.trim()
  // 非 opencode 提供商没填 Key 时不再用 'dummy' 真发请求（必然 401，会误导为模型 ID 问题）
  if (!configuredKey && providerId !== 'opencode') { toast('请先填写 API Key', 'error'); return }
  const apiKey = configuredKey
  if (!showSpinner(tr)) return
  testModelConnection(url, apiType, apiKey, mid, providerId).then(function(result) {
    showResult(tr, result.success, result.success ? '' : httpMsg(result))
  })
}

async function createProv() {
  const nm = document.getElementById('anm').value.trim(), id = document.getElementById('aid').value.trim()
  const url = document.getElementById('aurl').value.trim(), apiType = document.getElementById('afmt').value
  const aki = document.querySelectorAll('#akeys .aki')
  const keys = Array.from(aki).map((inp, i) => {
    const k = inp.value.trim()
    const en = inp.parentElement.querySelector('.ake')?.checked ?? true
    return k ? { key: k, enabled: en } : null
  }).filter(Boolean)
  const ami = document.querySelectorAll('#amodels .ami')
  const models = Array.from(ami).map(inp => {
    const mid = inp.value.trim()
    const en = inp.parentElement.querySelector('.ame')?.checked ?? true
    return mid ? { id: mid, enabled: en } : null
  }).filter(Boolean)
  const enabled = document.getElementById('aen').checked
  if (!nm || !id || !url) { toast('请填写名称、ID 和 API 地址', 'error'); return }
  const d = await apiJson('/admin/api/providers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name: nm, baseUrl: url, apiType, apiKeys: keys, models, enabled })
  })
  if (d.success) { toast('已创建', 'success'); location.reload() }
  else toast(d.message || '创建失败', 'error')
}

// provider api keys (edit)
function getKeys(id) {
  const c = document.getElementById('keys-' + id)
  const items = c.querySelectorAll('[data-kidx]')
  return Array.from(items).map(item => {
    const idx = parseInt(item.dataset.kidx)
    const k = document.getElementById('k-' + id + '-' + idx).value.trim()
    const en = document.getElementById('ken-' + id + '-' + idx).checked
    return k ? { key: k, enabled: en } : null
  }).filter(Boolean)
}

function addKeyRow(id) {
  const inp = document.getElementById('nk-' + id), k = inp.value.trim()
  if (!k) { toast('请输入 API Key', 'error'); return }
  const c = document.getElementById('keys-' + id), cnt = nextRowIdx(c, '[data-kidx]', 'kidx')
  const d = document.createElement('div')
  d.className = 'fc mb-3 field-row'
  d.dataset.kidx = cnt
  d.innerHTML = '<input type="text" value="' + escapeHtml(k) + '" class="fx1" id="k-' + id + '-' + cnt + '" placeholder="API Key"><label class="tg"><input type="checkbox" checked id="ken-' + id + '-' + cnt + '"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制 Key" aria-label="复制 Key"><i class="far fa-copy"></i></button><button class="icon-btn" onclick="testKeyRow(\\'' + id + '\\',' + cnt + ')" title="测试 Key" aria-label="测试 Key"><i class="fas fa-plug"></i></button><button class="icon-btn" onclick="rmKeyRow(\\'' + id + '\\',' + cnt + ')" title="移除 Key" aria-label="移除 Key"><i class="fas fa-times"></i></button>'
  c.appendChild(d)
  inp.value = ''
  inp.focus()
}

function rmKeyRow(id, idx) {
  const c = document.getElementById('keys-' + id)
  c.querySelectorAll('[data-kidx]').forEach(item => {
    if (parseInt(item.dataset.kidx) === idx) item.remove()
  })
}

// 行索引取「最大值+1」而非当前行数：删除中间行后再新增会复用索引，
// 造成 DOM id 冲突，保存时同一行被读两次、被删的那行在原位置“顶掉”。
function nextRowIdx(c, sel, key) {
  let max = -1
  c.querySelectorAll(sel).forEach(el => { const n = parseInt(el.dataset[key]); if (n > max) max = n })
  return max + 1
}

async function testKeyRow(id, idx) {
  const k = document.getElementById('k-' + id + '-' + idx).value.trim()
  const url = document.getElementById('url-' + id).value.trim()
  if (!k) { toast('请输入 API Key', 'error'); return }
  const apiType = document.getElementById('at-' + id).value
  const tr = document.getElementById('tr-' + id)
  if (!showSpinner(tr)) return
  const result = await testKeyConnection(url, apiType, k, id)
  showResult(tr, result.success, result.success ? '' : httpMsg(result))
  if (result.success && result.data) {
    showEditModelsList(id, result.data.data || [])
  }
}

// opencode 编辑表单 — 获取模型（复用 testKeyConnection 逻辑）
async function fetchEditModels(id) {
  const url = document.getElementById('url-' + id).value.trim()
  const keys = getKeys(id)
  const apiKey = keys.length > 0 ? keys[0].key : ''
  const apiType = document.getElementById('at-' + id).value
  const tr = document.getElementById('tr-' + id)
  if (!showSpinner(tr)) return
  const result = await testKeyConnection(url, apiType, apiKey, id)
  showResult(tr, result.success, result.success ? '' : (result.message || '获取模型失败'))
  if (result.success && result.data) {
    showEditModelsList(id, result.data.data || [])
  }
}

function showEditModelsList(id, models) {
  const cid = 'mel-' + id
  let el = document.getElementById(cid)
  if (!el) {
    // 以 API Keys fieldset 为锚点插入，结构与添加态的 #amc 对称
    const keysFs = document.getElementById('keys-' + id).closest('fieldset')
    el = document.createElement('aside')
    el.id = cid
    el.className = 'mdl-list-panel'
    el.innerHTML = modelPanelHeading(cid) + '<div id="melc-' + id + '"></div>'
    keysFs.insertAdjacentElement('afterend', el)
  }
  el.classList.remove('hd')
  document.getElementById('melc-' + id).innerHTML = renderModelGrid(models, id, id)
}

function addMdlToEdit(id, mid) {
  document.getElementById('nmid-' + id).value = mid
  addMdl(id)
}

function getMdl(id) {
  const c = document.getElementById('ml-' + id), items = c.querySelectorAll('[data-idx]')
  return Array.from(items).map(item => {
    const idx = parseInt(item.dataset.idx), mid = document.getElementById('mid-' + id + '-' + idx).value.trim()
    const en = document.getElementById('men-' + id + '-' + idx).checked
    return mid ? { id: mid, enabled: en } : null
  }).filter(Boolean)
}

async function save(id) {
  const nm = document.getElementById('nm-' + id).value.trim(), url = document.getElementById('url-' + id).value.trim()
  // 与服务端字段校验对齐：名称/地址清空后保存会让列表页标题变空
  if (!nm || !url) { toast('请填写名称和 API 地址', 'error'); return false }
  const apiType = document.getElementById('at-' + id).value
  const keys = getKeys(id)
  const models = getMdl(id), enabled = document.getElementById('en-' + id).checked
  const d = await apiJson('/admin/api/providers/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nm, baseUrl: url, apiType, apiKeys: keys, models, enabled })
  })
  if (d.success) { toast('已保存', 'success'); location.reload(); return true }
  toast(d.message || '保存失败', 'error')
  return false
}

async function del(id) {
  if (!(await cM('确定要删除此提供商？'))) return
  const d = await apiJson('/admin/api/providers/' + encodeURIComponent(id), { method: 'DELETE' })
  if (d.success) { toast('已删除', 'success'); location.reload() }
  else toast(d.message || '删除失败', 'error')
}

function addMdl(id) {
  const inp = document.getElementById('nmid-' + id), mid = inp.value.trim()
  if (!mid) { toast('请输入模型 ID', 'error'); return }
  const c = document.getElementById('ml-' + id), cnt = nextRowIdx(c, '[data-idx]', 'idx')
  const d = document.createElement('div')
  d.className = 'fc mb-3 field-row'
  d.dataset.idx = cnt
  d.innerHTML = '<input type="text" value="' + escapeHtml(mid) + '" class="fx1" id="mid-' + escapeHtml(id) + '-' + cnt + '" placeholder="模型 ID"><label class="tg"><input type="checkbox" checked id="men-' + escapeHtml(id) + '-' + cnt + '"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy"></i></button><button class="icon-btn" id="tm-' + escapeHtml(id) + '-' + cnt + '" title="测试模型" aria-label="测试模型"><i class="fas fa-plug"></i></button><button class="icon-btn" id="rm-' + escapeHtml(id) + '-' + cnt + '" title="移除模型" aria-label="移除模型"><i class="fas fa-times"></i></button>'
  c.appendChild(d)
  // 新增行尚未保存进 KV：测试按钮走直连实测（/admin/api/test-model），
  // 不再依赖服务端已保存配置，消灭“添加后立即测试报不存在”。
  document.getElementById('tm-' + id + '-' + cnt).addEventListener('click', function() { testMdlDirect(id, mid) })
  document.getElementById('rm-' + id + '-' + cnt).addEventListener('click', function() { rmMdl(id, cnt) })
  inp.value = ''
}

// 直连实测：用当前表单里的地址与 Key 直接调用上游，不经已保存配置校验。
async function testMdlDirect(id, mid) {
  const tr = document.getElementById('tr-' + id)
  if (!showSpinner(tr)) return
  const url = document.getElementById('url-' + id).value.trim()
  if (!url) { showResult(tr, false, '请先填写 API 地址'); return }
  const apiType = document.getElementById('at-' + id).value
  const keys = getKeys(id)
  const apiKey = keys.length > 0 ? keys[0].key : ''
  const d = await apiJson('/admin/api/test-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url, apiKey: apiKey, apiType: apiType, model: mid, providerId: id })
  })
  if (d.success && d.data) {
    showResult(tr, d.data.success, d.data.success ? '' : (d.data.message || (d.data.statusCode ? 'HTTP ' + d.data.statusCode : '测试失败')))
  } else {
    showResult(tr, false, d.message || '测试失败')
  }
}

function rmMdl(id, idx) {
  const c = document.getElementById('ml-' + id)
  c.querySelectorAll('[data-idx]').forEach(item => {
    if (parseInt(item.dataset.idx) === idx) item.remove()
  })
}

async function testMdl(id, mid) {
  const tr = document.getElementById('tr-' + id)
  if (!showSpinner(tr)) return
  const d = await apiJson('/admin/api/providers/' + encodeURIComponent(id) + '/test-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId: mid })
  })
  if (d.success && d.data) {
    // 后端降级直测时会附带“尚未保存”提醒，成功态也要展示出来。
    showResult(tr, d.data.success, d.data.success ? '' : (d.data.message || '连接失败'), d.data.success ? d.data.message : '')
  } else {
    showResult(tr, false, d.message || '测试失败')
  }
}

// proxy keys
async function genKey() {
  const name = await pM('输入 Key 名称（可选）')
  if (name === null) return
  showM('<h3><i class="fas fa-key c-p"></i> 生成转发 Key</h3><div class="fg"><label>有效期</label><select id="exp"><option value="30d">30 天</option><option value="90d">90 天</option><option value="180d">180 天</option><option value="1y">1 年</option><option value="forever" selected>永久</option></select></div><div class="fa"><button class="btn btn-s" id="gKc">取消</button><button class="btn btn-p" id="gKo">生成</button></div>')
  document.getElementById('gKc').addEventListener('click', closeM)
  document.getElementById('gKo').addEventListener('click', function() { doGenKey(document.getElementById('exp').value, name) })
}

async function doGenKey(exp, name) {
  closeM()
  const nm = name || ''
  const d = await apiJson('/admin/api/proxy-keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nm, expiresIn: exp })
  })
  if (d.success && d.data) {
    showM('<h3><i class="fas fa-check-circle c-s"></i> 生成成功</h3><p>请妥善保存，切勿泄露：</p><div class="mk">' + escapeHtml(d.data.key) + '</div><div class="fa"><button class="btn btn-p" onclick="closeM();location.reload()">关闭</button></div>')
  } else toast(d.message || '生成失败', 'error')
}

async function rmKey(id) {
  if (!(await cM('确定要删除此 Key？'))) return
  const d = await apiJson('/admin/api/proxy-keys/' + encodeURIComponent(id), { method: 'DELETE' })
  if (d.success) { toast('已删除', 'success'); location.reload() }
  else toast(d.message || '删除失败', 'error')
}

// proxy key list interactions
// 先乐观改 UI，失败则回滚：吊销开关停在错误状态会让管理员以为 Key 已失效
function setPbState(id, on) {
  const pi = document.querySelector('.pi[data-id="' + id + '"]')
  if (!pi) return
  const b = pi.querySelector('.ps .bd')
  if (b) { b.textContent = on ? '已启用' : '未启用'; b.className = 'bd ' + (on ? 'bd-on' : 'bd-off') }
  const cb = document.getElementById('en-' + id)
  if (cb) cb.checked = on
}

async function togglePb(id, checked) {
  const cb = document.getElementById('en-' + id)
  // 连点保护：请求在途时忽略后续点击，否则两个响应各自“回滚”到相反状态
  if (cb && cb.dataset.busy) { cb.checked = !checked; return }
  if (cb) cb.dataset.busy = '1'
  setPbState(id, checked)
  const d = await apiJson('/admin/api/providers/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: checked })
  })
  if (cb) delete cb.dataset.busy
  if (d.success) return
  setPbState(id, !checked)
  toast(d.message || '操作失败', 'error')
}

function toggleKeyVis(id) {
  const el = document.getElementById('kv-' + id)
  const full = el.dataset.full
  const vis = el.dataset.vis === '1'
  if (vis) {
    el.textContent = full.length > 12
      ? full.substring(0, 8) + '****' + full.substring(full.length - 4)
      : full
    el.dataset.vis = '0'
  } else {
    el.textContent = full
    el.dataset.vis = '1'
  }
}

function setPkState(id, on) {
  const ki = document.querySelector('.ki[data-id="' + id + '"]')
  if (!ki) return
  const b = ki.querySelector('span.bd')
  if (b) { b.textContent = on ? '已启用' : '已禁用'; b.className = 'bd ' + (on ? 'bd-on' : 'bd-off') }
  const cb = ki.querySelector('.tg input[type=checkbox]')
  if (cb) cb.checked = on
}

async function toggleProxyKey(id, checked) {
  const ki = document.querySelector('.ki[data-id="' + id + '"]')
  const cb = ki ? ki.querySelector('.tg input[type=checkbox]') : null
  // 与 togglePb 同样的连点保护
  if (cb && cb.dataset.busy) { cb.checked = !checked; return }
  if (cb) cb.dataset.busy = '1'
  const d = await apiJson('/admin/api/proxy-keys/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: checked })
  })
  if (cb) delete cb.dataset.busy
  setPkState(id, d.success ? checked : !checked)
  if (!d.success) toast(d.message || '操作失败', 'error')
}

// 中文说明：根据点击和 URL 锚点同步侧栏选中态，避免导航始终停留在“概览”。
const adminNavLinks = Array.from(document.querySelectorAll('a[href^="#"]'))
function setActiveAdminNav(hash) {
  const targetHash = adminNavLinks.some(function (link) { return link.getAttribute('href') === hash }) ? hash : '#overview'
  adminNavLinks.forEach(function (link) {
    const active = link.getAttribute('href') === targetHash
    link.classList.toggle('is-active', active)
    if (active) link.setAttribute('aria-current', 'page')
    else link.removeAttribute('aria-current')
  })
}
adminNavLinks.forEach(function (link) {
  link.addEventListener('click', function () { setActiveAdminNav(link.getAttribute('href') || '#overview') })
})
window.addEventListener('hashchange', function () { setActiveAdminNav(location.hash) })
setActiveAdminNav(location.hash)
<\/script>
</body></html>`)}var O=new At,Ks=async(e,t)=>{await t(),e.header("X-Frame-Options","DENY"),e.header("X-Content-Type-Options","nosniff")};O.use("*",Ks);O.use("/v1/*",Et());var Pe=null;O.use("*",async(e,t)=>(Pe||(Pe=Vt(e.env).catch(n=>{Pe=null,console.warn("初始数据填充失败:",n)})),await Pe,t()));O.get("/assets/app.css",e=>{let t=e.req.query("v")!==void 0;return e.body(Ue,200,{"Content-Type":"text/css; charset=utf-8","Cache-Control":t?"public, max-age=31536000, immutable":"public, max-age=300"})});O.get("/",async e=>{let t=re(e,"session_id"),n=t?await ke(e.env,t):null;return sr(e,n!==null)});O.get("/admin/login",or);O.post("/admin/login",Zt);O.get("/admin/logout",en);O.use("/admin/*",Qt);O.get("/admin",ar);O.get("/admin/api/status",zn);O.get("/admin/api/providers",Wn);O.post("/admin/api/providers",Jn);O.put("/admin/api/providers/:id",Vn);O.delete("/admin/api/providers/:id",Yn);O.post("/admin/api/providers/:id/test-model",Gn);O.post("/admin/api/test-key",Xn);O.post("/admin/api/test-model",Qn);O.get("/admin/api/proxy-keys",Zn);O.post("/admin/api/proxy-keys",er);O.delete("/admin/api/proxy-keys/:id",tr);O.patch("/admin/api/proxy-keys/:id",nr);O.use("/v1/*",tn);O.get("/v1/models",Un);O.all("/v1/*",Nn);O.notFound(e=>e.json({error:{message:"接口不存在",type:"not_found"}},404));O.onError((e,t)=>e instanceof SyntaxError&&/\bJSON\b|Unexpected (token|end)/i.test(e.message)?t.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400):(console.error("未捕获的错误:",e),t.json({error:{message:"服务器内部错误",type:"server_error"}},500)));var ba=O;export{ba as default};
