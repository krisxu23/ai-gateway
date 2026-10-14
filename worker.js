var $e=(e,t,n)=>(r,s)=>{let a=-1;return i(0);async function i(o){if(o<=a)throw new Error("next() called multiple times");a=o;let c,l=!1,d;if(e[o]?(d=e[o][0][0],r.req.routeIndex=o):d=o===e.length&&s||void 0,d)try{c=await d(r,()=>i(o+1))}catch(u){if(u instanceof Error&&t)r.error=u,c=await t(u,r),l=!0;else throw u}else r.finalized===!1&&n&&(c=await n(r));return c&&(r.finalized===!1||l)&&(r.res=c),r}};var ht=Symbol();var gt=async(e,t=Object.create(null))=>{let{all:n=!1,dot:r=!1}=t,a=(e instanceof pe?e.raw.headers:e.headers).get("Content-Type");return a?.startsWith("multipart/form-data")||a?.startsWith("application/x-www-form-urlencoded")?nr(e,{all:n,dot:r}):{}};async function nr(e,t){let n=await e.formData();return n?rr(n,t):{}}function rr(e,t){let n=Object.create(null);return e.forEach((r,s)=>{t.all||s.endsWith("[]")?sr(n,s,r):n[s]=r}),t.dot&&Object.entries(n).forEach(([r,s])=>{r.includes(".")&&(ar(n,r,s),delete n[r])}),n}var sr=(e,t,n)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(n):e[t]=[e[t],n]:t.endsWith("[]")?e[t]=[n]:e[t]=n},ar=(e,t,n)=>{if(/(?:^|\.)__proto__\./.test(t))return;let r=e,s=t.split(".");s.forEach((a,i)=>{i===s.length-1?r[a]=n:((!r[a]||typeof r[a]!="object"||Array.isArray(r[a])||r[a]instanceof File)&&(r[a]=Object.create(null)),r=r[a])})};var je=e=>{let t=e.split("/");return t[0]===""&&t.shift(),t},yt=e=>{let{groups:t,path:n}=or(e),r=je(n);return ir(r,t)},or=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(n,r)=>{let s=`@${r}`;return t.push([s,n]),s}),{groups:t,path:e}},ir=(e,t)=>{for(let n=t.length-1;n>=0;n--){let[r]=t[n];for(let s=e.length-1;s>=0;s--)if(e[s].includes(r)){e[s]=e[s].replace(r,t[n][1]);break}}return e},fe={},vt=(e,t)=>{if(e==="*")return"*";let n=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(n){let r=`${e}#${t}`;return fe[r]||(n[2]?fe[r]=t&&t[0]!==":"&&t[0]!=="*"?[r,n[1],new RegExp(`^${n[2]}(?=/${t})`)]:[e,n[1],new RegExp(`^${n[2]}$`)]:fe[r]=[e,n[1],!0]),fe[r]}return null},Z=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,n=>{try{return t(n)}catch{return n}})}},cr=e=>Z(e,decodeURI),Me=e=>{let t=e.url,n=t.indexOf("/",t.indexOf(":")+4),r=n;for(;r<t.length;r++){let s=t.charCodeAt(r);if(s===37){let a=t.indexOf("?",r),i=t.indexOf("#",r),o=a===-1?i===-1?void 0:i:i===-1?a:Math.min(a,i),c=t.slice(n,o);return cr(c.includes("%25")?c.replace(/%25/g,"%2525"):c)}else if(s===63||s===35)break}return t.slice(n,r)};var bt=e=>{let t=Me(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},V=(e,t,...n)=>(n.length&&(t=V(t,...n)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`),me=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;let t=e.split("/"),n=[],r="";return t.forEach(s=>{if(s!==""&&!/\:/.test(s))r+="/"+s;else if(/\:/.test(s))if(/\?/.test(s)){n.length===0&&r===""?n.push("/"):n.push(r);let a=s.replace("?","");r+="/"+a,n.push(r)}else r+="/"+s}),n.filter((s,a,i)=>i.indexOf(s)===a)},Ke=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Z(e,se):e):e,xt=(e,t,n)=>{let r;if(!n&&t&&!/[%+]/.test(t)){let i=e.indexOf("?",8);if(i===-1)return;for(e.startsWith(t,i+1)||(i=e.indexOf(`&${t}`,i+1));i!==-1;){let o=e.charCodeAt(i+t.length+1);if(o===61){let c=i+t.length+2,l=e.indexOf("&",c);return Ke(e.slice(c,l===-1?void 0:l))}else if(o==38||isNaN(o))return"";i=e.indexOf(`&${t}`,i+1)}if(r=/[%+]/.test(e),!r)return}let s={};r??=/[%+]/.test(e);let a=e.indexOf("?",8);for(;a!==-1;){let i=e.indexOf("&",a+1),o=e.indexOf("=",a);o>i&&i!==-1&&(o=-1);let c=e.slice(a+1,o===-1?i===-1?void 0:i:o);if(r&&(c=Ke(c)),a=i,c==="")continue;let l;o===-1?l="":(l=e.slice(o+1,i===-1?void 0:i),r&&(l=Ke(l))),n?(s[c]&&Array.isArray(s[c])||(s[c]=[]),s[c].push(l)):s[c]??=l}return t?s[t]:s},wt=xt,kt=(e,t)=>xt(e,t,!0),se=decodeURIComponent;var Et=e=>Z(e,se),pe=class{raw;#t;#e;routeIndex=0;path;bodyCache={};constructor(e,t="/",n=[[]]){this.raw=e,this.path=t,this.#e=n,this.#t={}}param(e){return e?this.#n(e):this.#a()}#n(e){let t=this.#e[0][this.routeIndex][1][e],n=this.#s(t);return n&&/\%/.test(n)?Et(n):n}#a(){let e={},t=Object.keys(this.#e[0][this.routeIndex][1]);for(let n of t){let r=this.#s(this.#e[0][this.routeIndex][1][n]);r!==void 0&&(e[n]=/\%/.test(r)?Et(r):r)}return e}#s(e){return this.#e[1]?this.#e[1][e]:e}query(e){return wt(this.url,e)}queries(e){return kt(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((n,r)=>{t[r]=n}),t}async parseBody(e){return gt(this,e)}#r=e=>{let{bodyCache:t,raw:n}=this,r=t[e];if(r)return r;let s=Object.keys(t)[0];return s?t[s].then(a=>(s==="json"&&(a=JSON.stringify(a)),new Response(a)[e]())):t[e]=n[e]()};json(){return this.#r("text").then(e=>JSON.parse(e))}text(){return this.#r("text")}arrayBuffer(){return this.#r("arrayBuffer")}bytes(){return this.#r("arrayBuffer").then(e=>new Uint8Array(e))}blob(){return this.#r("blob")}formData(){return this.#r("formData")}addValidatedData(e,t){this.#t[e]=t}valid(e){return this.#t[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[ht](){return this.#e}get matchedRoutes(){return this.#e[0].map(([[,e]])=>e)}get routePath(){return this.#e[0].map(([[,e]])=>e)[this.routeIndex].path}};var At={Stringify:1,BeforeStream:2,Stream:3},lr=(e,t)=>{let n=new String(e);return n.isEscaped=!0,n.callbacks=t,n};var Ne=async(e,t,n,r,s)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let a=e.callbacks;if(!a?.length)return Promise.resolve(e);s?s[0]+=e:s=[e];let i=Promise.all(a.map(o=>o({phase:t,buffer:s,context:r}))).then(o=>Promise.all(o.filter(Boolean).map(c=>Ne(c,t,!1,r,s))).then(()=>s[0]));return n?lr(await i,a):i};var dr="text/plain; charset=UTF-8",Le=(e,t)=>({"Content-Type":e,...t}),ae=(e,t)=>new Response(e,t),He=class{#t;#e;env={};#n;finalized=!1;error;#a;#s;#r;#d;#c;#l;#i;#u;#p;constructor(e,t){this.#t=e,t&&(this.#s=t.executionCtx,this.env=t.env,this.#l=t.notFoundHandler,this.#p=t.path,this.#u=t.matchResult)}get req(){return this.#e??=new pe(this.#t,this.#p,this.#u),this.#e}get event(){if(this.#s&&"respondWith"in this.#s)return this.#s;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#s)return this.#s;throw Error("This context has no ExecutionContext")}get res(){return this.#r||=ae(null,{headers:this.#i??=new Headers})}set res(e){if(this.#r&&e){e=ae(e.body,e);for(let[t,n]of this.#r.headers.entries())if(t!=="content-type")if(t==="set-cookie"){let r=this.#r.headers.getSetCookie();e.headers.delete("set-cookie");for(let s of r)e.headers.append("set-cookie",s)}else e.headers.set(t,n)}this.#r=e,this.finalized=!0}render=(...e)=>(this.#c??=t=>this.html(t),this.#c(...e));setLayout=e=>this.#d=e;getLayout=()=>this.#d;setRenderer=e=>{this.#c=e};header=(e,t,n)=>{this.finalized&&(this.#r=ae(this.#r.body,this.#r));let r=this.#r?this.#r.headers:this.#i??=new Headers;t===void 0?r.delete(e):n?.append?r.append(e,t):r.set(e,t)};status=e=>{this.#a=e};set=(e,t)=>{this.#n??=new Map,this.#n.set(e,t)};get=e=>this.#n?this.#n.get(e):void 0;get var(){return this.#n?Object.fromEntries(this.#n):{}}#o(e,t,n){let r=this.#r?new Headers(this.#r.headers):this.#i??new Headers;if(typeof t=="object"&&"headers"in t){let a=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[i,o]of a)i.toLowerCase()==="set-cookie"?r.append(i,o):r.set(i,o)}if(n)for(let[a,i]of Object.entries(n))if(typeof i=="string")r.set(a,i);else{r.delete(a);for(let o of i)r.append(a,o)}let s=typeof t=="number"?t:t?.status??this.#a;return ae(e,{status:s,headers:r})}newResponse=(...e)=>this.#o(...e);body=(e,t,n)=>this.#o(e,t,n);text=(e,t,n)=>!this.#i&&!this.#a&&!t&&!n&&!this.finalized?new Response(e):this.#o(e,t,Le(dr,n));json=(e,t,n)=>this.#o(JSON.stringify(e),t,Le("application/json",n));html=(e,t,n)=>{let r=s=>this.#o(s,t,Le("text/html; charset=UTF-8",n));return typeof e=="object"?Ne(e,At.Stringify,!1,{}).then(r):r(e)};redirect=(e,t)=>{let n=String(e);return this.header("Location",/[^\x00-\xFF]/.test(n)?encodeURI(n):n),this.newResponse(null,t??302)};notFound=()=>(this.#l??=()=>ae(),this.#l(this))};var $="ALL",_t="all",Rt=["get","post","put","delete","options","patch"],he="Can not add a route since the matcher is already built.",ge=class extends Error{};var St="__COMPOSED_HANDLER";var ur=e=>e.text("404 Not Found",404),It=(e,t)=>{if("getResponse"in e){let n=e.getResponse();return t.newResponse(n.body,n)}return console.error(e),t.text("Internal Server Error",500)},Pt=class Tt{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath="/";#t="/";routes=[];constructor(t={}){[...Rt,_t].forEach(a=>{this[a]=(i,...o)=>(typeof i=="string"?this.#t=i:this.#a(a,this.#t,i),o.forEach(c=>{this.#a(a,this.#t,c)}),this)}),this.on=(a,i,...o)=>{for(let c of[i].flat()){this.#t=c;for(let l of[a].flat())o.map(d=>{this.#a(l.toUpperCase(),this.#t,d)})}return this},this.use=(a,...i)=>(typeof a=="string"?this.#t=a:(this.#t="*",i.unshift(a)),i.forEach(o=>{this.#a($,this.#t,o)}),this);let{strict:r,...s}=t;Object.assign(this,s),this.getPath=r??!0?t.getPath??Me:bt}#e(){let t=new Tt({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,t.#n=this.#n,t.routes=this.routes,t}#n=ur;errorHandler=It;route(t,n){let r=this.basePath(t);return n.routes.map(s=>{let a;n.errorHandler===It?a=s.handler:(a=async(i,o)=>(await $e([],n.errorHandler)(i,()=>s.handler(i,o))).res,a[St]=s.handler),r.#a(s.method,s.path,a,s.basePath)}),this}basePath(t){let n=this.#e();return n._basePath=V(this._basePath,t),n}onError=t=>(this.errorHandler=t,this);notFound=t=>(this.#n=t,this);mount(t,n,r){let s,a;r&&(typeof r=="function"?a=r:(a=r.optionHandler,r.replaceRequest===!1?s=c=>c:s=r.replaceRequest));let i=a?c=>{let l=a(c);return Array.isArray(l)?l:[l]}:c=>{let l;try{l=c.executionCtx}catch{}return[c.env,l]};s||=(()=>{let c=V(this._basePath,t),l=c==="/"?0:c.length;return d=>{let u=new URL(d.url);return u.pathname=this.getPath(d).slice(l)||"/",new Request(u,d)}})();let o=async(c,l)=>{let d=await n(s(c.req.raw),...i(c));if(d)return d;await l()};return this.#a($,V(t,"*"),o),this}#a(t,n,r,s){t=t.toUpperCase(),n=V(this._basePath,n);let a={basePath:s!==void 0?V(this._basePath,s):this._basePath,path:n,method:t,handler:r};this.router.add(t,n,[r,a]),this.routes.push(a)}#s(t,n){if(t instanceof Error)return this.errorHandler(t,n);throw t}#r(t,n,r,s){if(s==="HEAD")return(async()=>new Response(null,await this.#r(t,n,r,"GET")))();let a=this.getPath(t,{env:r}),i=this.router.match(s,a),o=new He(t,{path:a,matchResult:i,env:r,executionCtx:n,notFoundHandler:this.#n});if(i[0].length===1){let l;try{l=i[0][0][0][0](o,async()=>{o.res=await this.#n(o)})}catch(d){return this.#s(d,o)}return l instanceof Promise?l.then(d=>d||(o.finalized?o.res:this.#n(o))).catch(d=>this.#s(d,o)):l??this.#n(o)}let c=$e(i[0],this.errorHandler,this.#n);return(async()=>{try{let l=await c(o);if(!l.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return l.res}catch(l){return this.#s(l,o)}})()}fetch=(t,...n)=>this.#r(t,n[1],n[0],t.method);request=(t,n,r,s)=>t instanceof Request?this.fetch(n?new Request(t,n):t,r,s):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${V("/",t)}`,n),r,s));fire=()=>{addEventListener("fetch",t=>{t.respondWith(this.#r(t.request,t,void 0,t.request.method))})}};var ye=[];function De(e,t){let n=this.buildAllMatchers(),r=((s,a)=>{let i=n[s]||n[$],o=i[2][a];if(o)return o;let c=a.match(i[0]);if(!c)return[[],ye];let l=c.indexOf("",1);return[i[1][l],c]});return this.match=r,r(e,t)}var ve="[^/]+",oe=".*",ie="(?:|/.*)",Y=Symbol(),pr=new Set(".\\+*[^]$()");function fr(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===oe||e===ie?1:t===oe||t===ie?-1:e===ve?1:t===ve?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var Ct=class Be{#t;#e;#n=Object.create(null);insert(t,n,r,s,a){if(t.length===0){if(this.#t!==void 0)throw Y;if(a)return;this.#t=n;return}let[i,...o]=t,c=i==="*"?o.length===0?["","",oe]:["","",ve]:i==="/*"?["","",ie]:i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),l;if(c){let d=c[1],u=c[2]||ve;if(d&&c[2]&&(u===".*"||(u=u.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(u))))throw Y;if(l=this.#n[u],!l){if(Object.keys(this.#n).some(x=>x!==oe&&x!==ie))throw Y;if(a)return;l=this.#n[u]=new Be,d!==""&&(l.#e=s.varIndex++)}!a&&d!==""&&r.push([d,l.#e])}else if(l=this.#n[i],!l){if(Object.keys(this.#n).some(d=>d.length>1&&d!==oe&&d!==ie))throw Y;if(a)return;l=this.#n[i]=new Be}l.insert(o,n,r,s,a)}buildRegExpStr(){let n=Object.keys(this.#n).sort(fr).map(r=>{let s=this.#n[r];return(typeof s.#e=="number"?`(${r})@${s.#e}`:pr.has(r)?`\\${r}`:r)+s.buildRegExpStr()});return typeof this.#t=="number"&&n.unshift(`#${this.#t}`),n.length===0?"":n.length===1?n[0]:"(?:"+n.join("|")+")"}};var Ot=class{#t={varIndex:0};#e=new Ct;insert(e,t,n){let r=[],s=[];for(let i=0;;){let o=!1;if(e=e.replace(/\{[^}]+\}/g,c=>{let l=`@\\${i}`;return s[i]=[l,c],i++,o=!0,l}),!o)break}let a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let i=s.length-1;i>=0;i--){let[o]=s[i];for(let c=a.length-1;c>=0;c--)if(a[c].indexOf(o)!==-1){a[c]=a[c].replace(o,s[i][1]);break}}return this.#e.insert(a,t,r,this.#t,n),r}buildRegExp(){let e=this.#e.buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0,n=[],r=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(s,a,i)=>a!==void 0?(n[++t]=Number(a),"$()"):(i!==void 0&&(r[Number(i)]=++t),"")),[new RegExp(`^${e}`),n,r]}};var mr=[/^$/,[],Object.create(null)],$t=Object.create(null);function Kt(e){return $t[e]??=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,n)=>n?`\\${n}`:"(?:|/.*)")}$`)}function hr(){$t=Object.create(null)}function gr(e){let t=new Ot,n=[];if(e.length===0)return mr;let r=e.map(l=>[!/\*|\/:/.test(l[0]),...l]).sort(([l,d],[u,x])=>l?1:u?-1:d.length-x.length),s=Object.create(null);for(let l=0,d=-1,u=r.length;l<u;l++){let[x,w,E]=r[l];x?s[w]=[E.map(([b])=>[b,Object.create(null)]),ye]:d++;let h;try{h=t.insert(w,d,x)}catch(b){throw b===Y?new ge(w):b}x||(n[d]=E.map(([b,v])=>{let R=Object.create(null);for(v-=1;v>=0;v--){let[m,A]=h[v];R[m]=A}return[b,R]}))}let[a,i,o]=t.buildRegExp();for(let l=0,d=n.length;l<d;l++)for(let u=0,x=n[l].length;u<x;u++){let w=n[l][u]?.[1];if(!w)continue;let E=Object.keys(w);for(let h=0,b=E.length;h<b;h++)w[E[h]]=o[w[E[h]]]}let c=[];for(let l in i)c[l]=n[i[l]];return[a,c,s]}function ee(e,t){if(e){for(let n of Object.keys(e).sort((r,s)=>s.length-r.length))if(Kt(n).test(t))return[...e[n]]}}var be=class{name="RegExpRouter";#t;#e;constructor(){this.#t={[$]:Object.create(null)},this.#e={[$]:Object.create(null)}}add(e,t,n){let r=this.#t,s=this.#e;if(!r||!s)throw new Error(he);r[e]||[r,s].forEach(o=>{o[e]=Object.create(null),Object.keys(o[$]).forEach(c=>{o[e][c]=[...o[$][c]]})}),t==="/*"&&(t="*");let a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let o=Kt(t);e===$?Object.keys(r).forEach(c=>{r[c][t]||=ee(r[c],t)||ee(r[$],t)||[]}):r[e][t]||=ee(r[e],t)||ee(r[$],t)||[],Object.keys(r).forEach(c=>{(e===$||e===c)&&Object.keys(r[c]).forEach(l=>{o.test(l)&&r[c][l].push([n,a])})}),Object.keys(s).forEach(c=>{(e===$||e===c)&&Object.keys(s[c]).forEach(l=>o.test(l)&&s[c][l].push([n,a]))});return}let i=me(t)||[t];for(let o=0,c=i.length;o<c;o++){let l=i[o];Object.keys(s).forEach(d=>{(e===$||e===d)&&(s[d][l]||=[...ee(r[d],l)||ee(r[$],l)||[]],s[d][l].push([n,a-c+o+1]))})}}match=De;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#e).concat(Object.keys(this.#t)).forEach(t=>{e[t]||=this.#n(t)}),this.#t=this.#e=void 0,hr(),e}#n(e){let t=[],n=e===$;return[this.#t,this.#e].forEach(r=>{let s=r[e]?Object.keys(r[e]).map(a=>[a,r[e][a]]):[];s.length!==0?(n||=!0,t.push(...s)):e!==$&&t.push(...Object.keys(r[$]).map(a=>[a,r[$][a]]))}),n?gr(t):null}};var Ue=class{name="SmartRouter";#t=[];#e=[];constructor(e){this.#t=e.routers}add(e,t,n){if(!this.#e)throw new Error(he);this.#e.push([e,t,n])}match(e,t){if(!this.#e)throw new Error("Fatal error");let n=this.#t,r=this.#e,s=n.length,a=0,i;for(;a<s;a++){let o=n[a];try{for(let c=0,l=r.length;c<l;c++)o.add(...r[c]);i=o.match(e,t)}catch(c){if(c instanceof ge)continue;throw c}this.match=o.match.bind(o),this.#t=[o],this.#e=void 0;break}if(a===s)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,i}get activeRouter(){if(this.#e||this.#t.length!==1)throw new Error("No active router has been determined yet.");return this.#t[0]}};var ce=Object.create(null),yr=e=>{for(let t in e)return!0;return!1},jt=class Mt{#t;#e;#n;#a=0;#s=ce;constructor(t,n,r){if(this.#e=r||Object.create(null),this.#t=[],t&&n){let s=Object.create(null);s[t]={handler:n,possibleKeys:[],score:0},this.#t=[s]}this.#n=[]}insert(t,n,r){this.#a=++this.#a;let s=this,a=yt(n),i=[];for(let o=0,c=a.length;o<c;o++){let l=a[o],d=a[o+1],u=vt(l,d),x=Array.isArray(u)?u[0]:l;if(x in s.#e){s=s.#e[x],u&&i.push(u[1]);continue}s.#e[x]=new Mt,u&&(s.#n.push(u),i.push(u[1])),s=s.#e[x]}return s.#t.push({[t]:{handler:r,possibleKeys:i.filter((o,c,l)=>l.indexOf(o)===c),score:this.#a}}),s}#r(t,n,r,s,a){for(let i=0,o=n.#t.length;i<o;i++){let c=n.#t[i],l=c[r]||c[$],d={};if(l!==void 0&&(l.params=Object.create(null),t.push(l),s!==ce||a&&a!==ce))for(let u=0,x=l.possibleKeys.length;u<x;u++){let w=l.possibleKeys[u],E=d[l.score];l.params[w]=a?.[w]&&!E?a[w]:s[w]??a?.[w],d[l.score]=!0}}}search(t,n){let r=[];this.#s=ce;let a=[this],i=je(n),o=[],c=i.length,l=null;for(let d=0;d<c;d++){let u=i[d],x=d===c-1,w=[];for(let h=0,b=a.length;h<b;h++){let v=a[h],R=v.#e[u];R&&(R.#s=v.#s,x?(R.#e["*"]&&this.#r(r,R.#e["*"],t,v.#s),this.#r(r,R,t,v.#s)):w.push(R));for(let m=0,A=v.#n.length;m<A;m++){let S=v.#n[m],I=v.#s===ce?{}:{...v.#s};if(S==="*"){let y=v.#e["*"];y&&(this.#r(r,y,t,v.#s),y.#s=I,w.push(y));continue}let[j,P,f]=S;if(!u&&!(f instanceof RegExp))continue;let p=v.#e[j];if(f instanceof RegExp){if(l===null){l=new Array(c);let k=n[0]==="/"?1:0;for(let O=0;O<c;O++)l[O]=k,k+=i[O].length+1}let y=n.substring(l[d]),g=f.exec(y);if(g){if(I[P]=g[0],this.#r(r,p,t,v.#s,I),yr(p.#e)){p.#s=I;let k=g[0].match(/\//)?.length??0;(o[k]||=[]).push(p)}continue}}(f===!0||f.test(u))&&(I[P]=u,x?(this.#r(r,p,t,I,v.#s),p.#e["*"]&&this.#r(r,p.#e["*"],t,I,v.#s)):(p.#s=I,w.push(p)))}}let E=o.shift();a=E?w.concat(E):w}return r.length>1&&r.sort((d,u)=>d.score-u.score),[r.map(({handler:d,params:u})=>[d,u])]}};var qe=class{name="TrieRouter";#t;constructor(){this.#t=new jt}add(e,t,n){let r=me(t);if(r){for(let s=0,a=r.length;s<a;s++)this.#t.insert(e,r[s],n);return}this.#t.insert(e,t,n)}match(e,t){return this.#t.search(e,t)}};var ze=class extends Pt{constructor(e={}){super(e),this.router=e.router??new Ue({routers:[new be,new qe]})}};var Nt=e=>{let t={origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[],...e},n=(s=>typeof s=="string"?s==="*"?()=>s:a=>s===a?a:null:typeof s=="function"?s:a=>s.includes(a)?a:null)(t.origin),r=(s=>typeof s=="function"?s:Array.isArray(s)?()=>s:()=>[])(t.allowMethods);return async function(a,i){function o(l,d){a.res.headers.set(l,d)}let c=await n(a.req.header("origin")||"",a);if(c&&o("Access-Control-Allow-Origin",c),t.credentials&&o("Access-Control-Allow-Credentials","true"),t.exposeHeaders?.length&&o("Access-Control-Expose-Headers",t.exposeHeaders.join(",")),a.req.method==="OPTIONS"){t.origin!=="*"&&o("Vary","Origin"),t.maxAge!=null&&o("Access-Control-Max-Age",t.maxAge.toString());let l=await r(a.req.header("origin")||"",a);l.length&&o("Access-Control-Allow-Methods",l.join(","));let d=t.allowHeaders;if(!d?.length){let u=a.req.header("Access-Control-Request-Headers");u&&(d=u.split(/\s*,\s*/))}return d?.length&&(o("Access-Control-Allow-Headers",d.join(",")),a.res.headers.append("Vary","Access-Control-Request-Headers")),a.res.headers.delete("Content-Length"),a.res.headers.delete("Content-Type"),new Response(null,{headers:a.res.headers,status:204,statusText:"No Content"})}await i(),t.origin!=="*"&&a.header("Vary","Origin",{append:!0})}};var Ht=/^[\w!#$%&'*.^`|~+-]+$/,vr=/^[ !#-:<-[\]-~]*$/,Lt=e=>{let t=0,n=e.length;for(;t<n;){let r=e.charCodeAt(t);if(r!==32&&r!==9)break;t++}for(;n>t;){let r=e.charCodeAt(n-1);if(r!==32&&r!==9)break;n--}return t===0&&n===e.length?e:e.slice(t,n)},Fe=(e,t)=>{if(t&&e.indexOf(t)===-1)return{};let n=e.split(";"),r=Object.create(null);for(let s of n){let a=s.indexOf("=");if(a===-1)continue;let i=Lt(s.substring(0,a));if(t&&t!==i||!Ht.test(i)||i in r)continue;let o=Lt(s.substring(a+1));if(o.startsWith('"')&&o.endsWith('"')&&(o=o.slice(1,-1)),vr.test(o)&&(r[i]=o.indexOf("%")!==-1?Z(o,se):o,t))break}return r};var br=(e,t,n={})=>{if(!Ht.test(e))throw new Error("Invalid cookie name");let r=`${e}=${t}`;if(e.startsWith("__Secure-")&&!n.secure)throw new Error("__Secure- Cookie must have Secure attributes");if(e.startsWith("__Host-")){if(!n.secure)throw new Error("__Host- Cookie must have Secure attributes");if(n.path!=="/")throw new Error('__Host- Cookie must have Path attributes with "/"');if(n.domain)throw new Error("__Host- Cookie must not have Domain attributes")}for(let s of["domain","path","sameSite","priority"])if(n[s]&&/[;\r\n]/.test(n[s]))throw new Error(`${s} must not contain ";", "\\r", or "\\n"`);if(n&&typeof n.maxAge=="number"&&n.maxAge>=0){if(n.maxAge>3456e4)throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");r+=`; Max-Age=${n.maxAge|0}`}if(n.domain&&n.prefix!=="host"&&(r+=`; Domain=${n.domain}`),n.path&&(r+=`; Path=${n.path}`),n.expires){if(n.expires.getTime()-Date.now()>3456e7)throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");r+=`; Expires=${n.expires.toUTCString()}`}if(n.httpOnly&&(r+="; HttpOnly"),n.secure&&(r+="; Secure"),n.sameSite&&(r+=`; SameSite=${n.sameSite.charAt(0).toUpperCase()+n.sameSite.slice(1)}`),n.priority&&(r+=`; Priority=${n.priority.charAt(0).toUpperCase()+n.priority.slice(1)}`),n.partitioned){if(!n.secure)throw new Error("Partitioned Cookie must have Secure attributes");r+="; Partitioned"}return r},xe=(e,t,n)=>(t=encodeURIComponent(t),br(e,t,n));var te=(e,t,n)=>{let r=e.req.raw.headers.get("Cookie");if(typeof t=="string"){if(!r)return;let a=t;return n==="secure"?a="__Secure-"+t:n==="host"&&(a="__Host-"+t),Fe(r,a)[a]}return r?Fe(r):{}};var xr=(e,t,n)=>{let r;return n?.prefix==="secure"?r=xe("__Secure-"+e,t,{path:"/",...n,secure:!0}):n?.prefix==="host"?r=xe("__Host-"+e,t,{...n,path:"/",secure:!0,domain:void 0}):r=xe(e,t,{path:"/",...n}),r},Je=(e,t,n,r)=>{let s=xr(t,n,r);e.header("Set-Cookie",s,{append:!0})};var We=(e,t,n)=>{let r=te(e,t,n?.prefix);return Je(e,t,"",{...n,maxAge:0}),r};var q={title:"AI Gateway",subtitle:"统一的 AI 管理平台",author:"QingYun",authorUrl:"https://github.com/yutian81/ai-gateway",blogUrl:"https://blog.notett.com",description:"AI 提供商 API 代理网关 — 统一 /v1 接口转发",favicon:"https://pan.811520.xyz/icon/ai.webp",faCdn:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"},Ve=10080*60,we="sk_cf_",ke="https://opencode.ai/zen/v1",Dt=300*1e3,Ye=5,M={PROVIDERS:"providers",PROXY_KEYS:"proxy:keys",SESSION_PREFIX:"admin:session:",KEY_HEALTH_PREFIX:"key:health:",OPENCODE_MIGRATION:"migration:opencode-default:v1"},Bt={"30d":720*60*60,"90d":2160*60*60,"180d":4320*60*60,"1y":365*24*60*60,forever:null},Ut=[{id:"opencode",name:"OpenCode",baseUrl:"https://opencode.ai/zen/v1",apiType:"openai",apiKeys:[],models:[{id:"deepseek-v4-flash-free",enabled:!0},{id:"mimo-v2.5-free",enabled:!0},{id:"nemotron-3-ultra-free",enabled:!0},{id:"hy3-free",enabled:!0}],enabled:!0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];var wr=60*1e3,Xe=new Map;function kr(e){let t=Xe.get(e);if(t){if(Date.now()>=t.expiresAt){Xe.delete(e);return}return t.value}}function Jt(e,t,n=wr){Xe.set(e,{value:t,expiresAt:Date.now()+n})}var Wt={[M.PROXY_KEYS]:5*1e3},Vt=e=>typeof e=="object"&&e!==null&&!Array.isArray(e),Ge=e=>({...e,enabled:e.enabled===!0}),qt=(e,t)=>e.map(n=>typeof n=="string"?{[t]:n,enabled:!0}:n).filter(Vt),Er=/^[A-Za-z0-9._-]+$/;function Yt(e,t){let n=t.filter(Vt);if(e===M.PROVIDERS){let r=[];for(let s of n){let a=zt(s.id,"providers");a&&r.push({...s,id:a,name:String(s.name??""),baseUrl:typeof s.baseUrl=="string"?s.baseUrl:"",enabled:s.enabled===!0,models:Array.isArray(s.models)?qt(s.models,"id").map(Ge):[],apiKeys:Array.isArray(s.apiKeys)?qt(s.apiKeys,"key").map(Ge):[]})}return r}if(e===M.PROXY_KEYS){let r=[];for(let s of n){let a=zt(s.id,"转发 Key");a&&r.push(Ge({...s,id:a,key:String(s.key??""),name:String(s.name??"")}))}return r}return n}function zt(e,t){if(typeof e!="string"&&typeof e!="number")return console.warn(`[storage] ${t} 条目缺少可用 id，已丢弃（无法寻址）`),null;let n=String(e).trim();if(!n)return console.warn(`[storage] ${t} 条目 id 为空，已丢弃（无法寻址）`),null;if(Er.test(n))return n;let r=n.replace(/[^A-Za-z0-9._-]/g,"-");return console.warn(`[storage] ${t} 条目 id "${n}" 含非法字符，已归一为 "${r}"`),r}async function Gt(e,t){let n=kr(t);if(n)return n;let r=await e.KV.get(t),s=[];if(r)try{let a=JSON.parse(r);Array.isArray(a)?s=Yt(t,a):console.warn(`[storage] KV 数据不是数组，已按空列表处理: ${t}`)}catch{console.warn(`[storage] KV 数据解析失败，已按空列表处理: ${t}`)}return Jt(t,s,Wt[t]),s}async function Xt(e,t,n){await e.KV.put(t,JSON.stringify(n)),Jt(t,Yt(t,n),Wt[t])}var Ft=new Map;function G(e,t){let n=(Ft.get(e)??Promise.resolve()).then(t,t);return Ft.set(e,n.catch(()=>{})),n}async function H(e){return Gt(e,M.PROVIDERS)}async function Ee(e,t){return(await H(e)).find(r=>r.id===t)??null}async function Ae(e,t){await Xt(e,M.PROVIDERS,t)}function Qt(e,t){return G(M.PROVIDERS,async()=>{let n=await H(e);return n.some(r=>r.id===t.id)?!1:(await Ae(e,[...n,t]),!0)})}function Zt(e,t,n){return G(M.PROVIDERS,async()=>{let r=await H(e),s=r.findIndex(i=>i.id===t);if(s===-1)return null;let a={...r[s],...n,updatedAt:new Date().toISOString()};return await Ae(e,r.map((i,o)=>o===s?a:i)),a})}function en(e,t){return G(M.PROVIDERS,async()=>{let n=await H(e),r=n.filter(s=>s.id!==t);return r.length===n.length?!1:(await Ae(e,r),!0)})}async function tn(e,t,n){let r=crypto.randomUUID(),s={username:t,expiresAt:Date.now()+n*1e3};return await e.KV.put(M.SESSION_PREFIX+r,JSON.stringify(s),{expirationTtl:n}),r}async function _e(e,t){let n=await e.KV.get(M.SESSION_PREFIX+t);if(!n)return null;let r=null;try{let s=JSON.parse(n);s&&typeof s=="object"&&(r=s)}catch{}return!r||typeof r.expiresAt!="number"||r.expiresAt<Date.now()?(await Qe(e,t),null):r}async function Qe(e,t){await e.KV.delete(M.SESSION_PREFIX+t)}async function z(e){return Gt(e,M.PROXY_KEYS)}async function Ze(e,t){await Xt(e,M.PROXY_KEYS,t)}function et(e,t){return G(M.PROXY_KEYS,async()=>{let n=await z(e);await Ze(e,[...n,t])})}function nn(e,t){return G(M.PROXY_KEYS,async()=>{let n=await z(e),r=n.filter(s=>s.id!==t);return r.length===n.length?!1:(await Ze(e,r),!0)})}function rn(e,t,n){return G(M.PROXY_KEYS,async()=>{let r=await z(e),s=r.findIndex(i=>i.id===t);if(s===-1)return null;let a={...r[s],...n};return await Ze(e,r.map((i,o)=>o===s?a:i)),a})}async function sn(e,t){if(!t)return!1;let n=await z(e),r=Date.now();return n.some(s=>s.key===t&&s.enabled&&(!s.expiresAt||r<new Date(s.expiresAt).getTime()))}async function an(e){let t=await H(e);if(t.some(s=>s.id==="opencode"))return;let n=await e.KV.get(M.OPENCODE_MIGRATION),r=Ut.find(s=>s.id==="opencode");n||(r&&!t.some(s=>s.id===r.id)&&await G(M.PROVIDERS,()=>Ae(e,[...t,{...r,apiKeys:r.apiKeys.map(s=>({...s})),models:r.models.map(s=>({...s}))}])),await e.KV.put(M.OPENCODE_MIGRATION,"1")),t.length===0&&!n&&(await z(e)).length===0&&await et(e,{id:crypto.randomUUID(),key:`${we}${crypto.randomUUID().replace(/-/g,"").substring(0,16)}`,name:"测试 Key",enabled:!0,createdAt:new Date().toISOString()})}async function Re(e){let n=new TextEncoder().encode(e),r=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(r)).map(a=>a.toString(16).padStart(2,"0")).join("")}function on(e,t){if(e.byteLength!==t.byteLength)return!1;let n=crypto.subtle;if(typeof n.timingSafeEqual=="function")return n.timingSafeEqual(e,t);let r=0;for(let s=0;s<e.byteLength;s++)r|=e[s]^t[s];return r===0}var Ar=5,_r=900*1e3,Rr=400,F=new Map;function Sr(e,t){let n=F.get(e);return!!n&&n.until>t&&n.count>=Ar}function Ir(e,t){let n=F.get(e),r=n&&n.until>t?n.count+1:1;if(F.set(e,{count:r,until:t+_r}),F.size>1e3){for(let[s,a]of F)a.until<=t&&F.delete(s);for(let s of F.keys()){if(F.size<=1e3)break;F.delete(s)}}}async function cn(e,t){let n=te(e,"session_id"),r=e.req.path;return n?await _e(e.env,n)?t():(We(e,"session_id",{path:"/"}),r.startsWith("/admin/api/")?e.json({success:!1,message:"Session 已过期"},401):e.redirect("/admin/login")):r==="/admin/login"?t():r.startsWith("/admin/api/")?e.json({success:!1,message:"未登录"},401):e.redirect("/admin/login")}async function ln(e){let t=await e.req.json(),n=typeof t?.username=="string"?t.username:"",r=typeof t?.password=="string"?t.password:"",{ADMIN_USERNAME:s,ADMIN_PASSWORD:a}=e.env;if(!s||!a)return e.json({success:!1,message:"未配置管理员账号，请在 Cloudflare 环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD"},500);let i=e.req.header("CF-Connecting-IP")||"unknown",o=Date.now();if(Sr(i,o))return e.json({success:!1,message:"登录失败次数过多，请 15 分钟后再试"},429);if(!n||!r)return e.json({success:!1,message:"请输入用户名和密码"},400);let c=new TextEncoder,[l,d,u,x]=await Promise.all([Re(String(n)),Re(String(s)),Re(String(r)),Re(String(a))]),w=on(c.encode(l),c.encode(d)),E=on(c.encode(u),c.encode(x));if(!w||!E)return Ir(i,o),await new Promise(b=>setTimeout(b,Rr)),e.json({success:!1,message:"用户名或密码错误"},401);F.delete(i);let h=await tn(e.env,n,Ve);return Je(e,"session_id",h,{httpOnly:!0,secure:!0,sameSite:"Strict",path:"/",maxAge:Ve}),e.json({success:!0,message:"登录成功"})}async function dn(e){let t=te(e,"session_id");return t&&(await Qe(e.env,t),We(e,"session_id",{path:"/"})),e.redirect("/")}async function un(e,t){let n=e.req.header("Authorization"),r=n&&/^bearer\s+(.+)$/i.exec(n)?.[1];return r?await sn(e.env,r)?t():e.json({error:{message:"API Key 无效或已禁用",type:"authentication_error"}},401):e.json({error:{message:"缺少或无效的 Authorization 头，格式: Bearer sk_cf_*",type:"authentication_error"}},401)}function pn(e){return/^muse-[A-Za-z0-9.-]*-free$/.test(e)}function T(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)?e:null}function tt(e){if(typeof e=="string")return e;if(Array.isArray(e)){let t="";for(let n of e){let r=T(n);r&&(typeof r.text=="string"?t+=r.text:typeof r.content=="string"&&(t+=r.content))}return t}return""}var Pr=["minimal","low","medium","high","xhigh"],nt="(The model asked for a tool this session doesn't have.)",rt=["bash","read"];function le(e){return typeof e!="string"?!1:rt.includes(e.toLowerCase())}function Tr(e){let t=typeof e=="string"?e.trim().toLowerCase():"";return Pr.includes(t)?t:"low"}function fn(e){let t=Object.create(null);if(!Array.isArray(e.tools))return t;let n=["bash","read"],r=e.tools,s=new Set(r.map(a=>{let i=T(a)?.function;return typeof i?.name=="string"?i.name:void 0}).filter(a=>typeof a=="string"));for(let a of n){if(s.has(a))continue;let i=r.find(o=>{let c=T(o)?.function;return typeof c?.name=="string"&&c.name.toLowerCase()===a});if(i){let o=T(i).function;t[a]=String(o.name),o.name=a,s.add(a)}}return t}function mn(e){let t={};typeof e.model=="string"&&e.model&&(t.model=e.model),e.stream===!0&&(t.stream=!0),e.temperature!==void 0&&(t.temperature=e.temperature),e.top_p!==void 0&&(t.top_p=e.top_p);for(let a of["max_tokens","max_completion_tokens"])if(e[a]!==void 0){let i=Math.floor(Number(e[a]));Number.isFinite(i)&&i>0&&(t.max_output_tokens=Math.max(i,16));break}let n=Array.isArray(e.messages)?e.messages:[],r=[],s="";for(let a of n){let i=T(a);if(!i)continue;let o=typeof i.role=="string"?i.role:"",c=tt(i.content);switch(o){case"system":case"developer":s=s?`${s}

${c}`:c;break;case"user":r.push({role:"user",content:c});break;case"assistant":{if(c&&r.push({role:"assistant",content:c}),Array.isArray(i.tool_calls)){let l=i.tool_calls;for(let d of l){let u=T(d);if(!u)continue;let x=T(u.function),w=typeof x?.name=="string"?String(x.name):"";r.push({type:"function_call",call_id:u.id??"",name:w,arguments:typeof x?.arguments=="string"?x.arguments:""})}}break}case"tool":r.push({type:"function_call_output",call_id:i.tool_call_id??"",output:c});break}}if(t.input=r,s&&(t.instructions=s),Array.isArray(e.tools)&&(t.tools=e.tools.map(a=>{let i=T(a);if(!i)return a;let o=T(i.function);return o?{type:"function",name:o.name??"",description:o.description,parameters:o.parameters}:i})),T(e.tool_choice)){let a=T(e.tool_choice),i=T(a.function);i&&(t.tool_choice={type:"function",name:i.name??""})}else typeof e.tool_choice=="string"&&(t.tool_choice=e.tool_choice);return t.reasoning={effort:Tr(e.reasoning_effort??e.reasoningEffort)},t}function hn(e,t=!1,n={},r=new Set){let s=typeof e.model=="string"?e.model:"",a="",i=[];if(Array.isArray(e.output))for(let E of e.output){let h=T(E);if(h){if(h.type==="message"&&Array.isArray(h.content))for(let b of h.content){let v=T(b);v&&v.type==="output_text"&&typeof v.text=="string"&&(a+=v.text)}else if(h.type==="function_call"){let b=typeof h.name=="string"?h.name:"",v=b.toLowerCase();b&&(n[v]||n[b])&&(b=n[v]||n[b]),i.push({id:h.call_id??h.id??"",type:"function",function:{name:b,arguments:typeof h.arguments=="string"?h.arguments:""}})}}}let o=i.filter(E=>{let h=T(E.function)?.name;if(typeof h!="string")return!0;let b=h.toLowerCase();return n[b]||n[h]?!0:r.size>0?!r.has(b)&&!r.has(h):!(t&&le(h))}),c=i.length>o.length,l="stop",d=T(e.incomplete_details);d&&d.reason==="max_output_tokens"&&(l="length"),o.length>0&&(l="tool_calls"),c&&o.length===0&&!a&&(l="stop");let u={role:"assistant"};o.length>0?(u.tool_calls=o,a&&(u.content=a)):c&&!a?u.content=nt:u.content=a;let x={id:e.id??"",object:"chat.completion",created:e.created_at??0,model:s,choices:[{index:0,message:u,finish_reason:l}]},w=T(e.usage);return w&&(x.usage={prompt_tokens:w.input_tokens??0,completion_tokens:w.output_tokens??0,total_tokens:w.total_tokens??0}),x}function J(e,t,n,r,s){let a={index:0,delta:n};r&&(a.finish_reason=r);let i={id:t,object:"chat.completion.chunk",model:e,choices:[a]};return s&&(i.usage=s),`data: ${JSON.stringify(i)}

`}function gn(e,t=!1,n={},r=new Set){let s=new TextEncoder,a=new TextDecoder,i="",o=`chatcmpl-${Date.now().toString(16)}-${Math.random().toString(16).slice(2,8)}`,c=Object.create(null),l=new Set,d=0,u=!1,x=!1,w=Object.create(null),E=Object.create(null),h=new Set,b=f=>{if(!f)return!1;try{return JSON.parse(f),!0}catch{return!1}},v=()=>d>0&&Object.keys(c).every(f=>h.has(f)||b(w[f])),R=(f,p,y)=>{f.enqueue(s.encode(J(e,o,{tool_calls:[{index:p,function:{arguments:y}}]})))},m=f=>f||"{}",A=(f,p)=>{let y=w[f]??"";return p===y?"":p.startsWith(y)?p.slice(y.length):p},S=f=>{let p=f.toLowerCase(),y=!!(f&&(n[p]||n[f])),g=y?n[p]||n[f]:f,k=le(g)&&!y&&(r.size>0?r.has(p)||r.has(g):t);return{name:g,isStub:k}},I=(f,p,y,g,k)=>{let{name:O,isStub:U}=S(typeof y=="string"?y:"");if(U)return null;let N=c[p];N===void 0&&(N=d++,c[p]=N,f.enqueue(s.encode(J(e,o,{tool_calls:[{index:N,id:k,type:"function",function:{name:O,arguments:""}}]}))));let D=m(typeof g=="string"?g:""),L=A(p,D);return w[p]=D,b(D)&&h.add(p),L&&R(f,N,L),N},j=(f,p)=>{let y=typeof p.type=="string"?p.type:"";switch(y){case"response.output_text.delta":typeof p.delta=="string"&&p.delta&&(x=!0,f.enqueue(s.encode(J(e,o,{content:p.delta}))));break;case"response.output_text.done":!x&&typeof p.text=="string"&&p.text&&(x=!0,f.enqueue(s.encode(J(e,o,{content:p.text}))));break;case"response.output_item.added":{let g=T(p.item);if(g&&g.type==="function_call"){let k=typeof g.id=="string"&&g.id?g.id:typeof g.call_id=="string"?g.call_id:"";if(!k||k in c)break;let{name:O,isStub:U}=S(typeof g.name=="string"?g.name:"");if(U){l.add(k);break}let N=d++;c[k]=N,f.enqueue(s.encode(J(e,o,{tool_calls:[{index:N,id:g.call_id??k,type:"function",function:{name:O,arguments:""}}]})));let D=E[k];if(D!==void 0){delete E[k];let L=m(D.args),K=A(k,L);w[k]=L,b(L)&&h.add(k),K&&R(f,N,K)}}break}case"response.function_call_arguments.delta":{let g=typeof p.item_id=="string"?p.item_id:"";if(l.has(g)||h.has(g))break;let k=c[g];if(k===void 0)break;typeof p.delta=="string"&&p.delta&&(w[g]=(w[g]??"")+p.delta,f.enqueue(s.encode(J(e,o,{tool_calls:[{index:k,function:{arguments:p.delta}}]}))));break}case"response.output_item.done":case"response.function_call_arguments.done":{let g=T(p.item);if(g?.type==="message"&&!x&&Array.isArray(g.content)){for(let K of g.content){let B=T(K);B&&B.type==="output_text"&&typeof B.text=="string"&&B.text&&(x=!0,f.enqueue(s.encode(J(e,o,{content:B.text}))))}break}let k=typeof p.item_id=="string"&&p.item_id?p.item_id:typeof g?.id=="string"&&g.id?g.id:"",O=typeof p.arguments=="string"?p.arguments:typeof g?.arguments=="string"?g.arguments:"",U=typeof g?.name=="string"?g.name:"",N=k?c[k]:void 0;if(N===void 0){k&&(O||U)&&(E[k]={name:U,args:O});break}let D=O?m(O):w[k]||"{}",L=A(k,D);w[k]=D,L&&R(f,N,L),b(D)&&h.add(k);break}case"response.completed":case"response.incomplete":{let g=T(p.response),k=T(g?.usage),O=y==="response.incomplete",U=T(g?.incomplete_details)?.reason==="max_output_tokens";if(Array.isArray(g?.output))for(let L of g.output){let K=T(L);if(K){if(K.type==="function_call"){let B=typeof K.id=="string"&&K.id?K.id:typeof K.call_id=="string"?K.call_id:"";if(!B)continue;I(f,B,K.name,K.arguments,typeof K.call_id=="string"&&K.call_id?K.call_id:B)}else if(K.type==="message"&&!x&&Array.isArray(K.content))for(let B of K.content){let re=T(B);re&&re.type==="output_text"&&typeof re.text=="string"&&re.text&&(x=!0,f.enqueue(s.encode(J(e,o,{content:re.text}))))}}}for(let[L,K]of Object.entries(E))L in c||I(f,L,K.name,K.args,L);let N=d>0?v()?"tool_calls":"length":O||U?"length":"stop",D=k?{prompt_tokens:k.input_tokens??0,completion_tokens:k.output_tokens??0,total_tokens:k.total_tokens??0}:void 0;f.enqueue(s.encode(J(e,o,{},N,D))),f.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}case"response.failed":case"error":{let g=T(p.error)||T(T(p.response)?.error)||T(p.response)||{},k=g.message??g.code??"",O=typeof k=="string"&&k?k:"上游推理失败";f.enqueue(s.encode(`data: ${JSON.stringify({error:{message:O,type:"upstream_error",code:"upstream_error"}})}

`)),f.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}}},P=(f,p)=>{if(u)return;if(f.startsWith(":")){p.enqueue(s.encode(f+`

`));return}if(!f.startsWith("data: ")&&!f.startsWith("data:"))return;let y=f.startsWith("data: ")?f.slice(6).trim():f.slice(5).trim();if(!(!y||y==="[DONE]"))try{j(p,JSON.parse(y))}catch{}};return new TransformStream({transform(f,p){if(u)return;i+=a.decode(f,{stream:!0});let y;for(;(y=i.indexOf(`
`))>=0;){let g=i.slice(0,y).replace(/\r$/,"");if(i=i.slice(y+1),P(g,p),u)return}},flush(f){if(!u&&((i.startsWith("data: ")||i.startsWith("data:"))&&P(i.replace(/\r$/,""),f),!u)){let p=d>0?v()?"tool_calls":"length":x?"length":"stop";f.enqueue(s.encode(J(e,o,{},p))),f.enqueue(s.encode(`data: [DONE]

`))}}})}var Cr="opencode",Or="1.18.31",yn=3e4;function W(e){return e===Cr}function $r(e){return e.filter(t=>typeof t.id=="string"&&/^[A-Za-z0-9._:/-]+$/.test(t.id)&&(t.id==="big-pickle"||t.id.endsWith("-free")))}function X(e){let n=(e.OPENCODE_MIRRORS_URL||"").split(/[\s,;]+/).map(r=>r.trim()).filter(Boolean);return[...new Set(n)]}function Kr(e,t){if(e.length===0)return[];let n=Math.floor(t()*e.length);return[...e.slice(n),...e.slice(0,n)]}function vn(e,t,n=""){return`${e.replace(/\/+$/,"")}/${t.replace(/^\/+/,"")}${n}`}var jr="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";function Mr(e){let t=new Uint8Array(e);return crypto.getRandomValues(t),t}function Nr(e){return Array.from(Mr(e),t=>jr[t%62]).join("")}var Lr=/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/,bn=0,st=0;function it(e,t=Date.now()){let n=1;e==="ses"&&(t===bn?st+=1:(bn=t,st=1),n=st);let r=BigInt(t)*0x1000n+BigInt(n),s=e==="ses"?~r:r,a=Array.from({length:6},(i,o)=>Number(s>>BigInt(40-8*o)&0xffn).toString(16).padStart(2,"0")).join("");return`${e}_${a}${Nr(14)}`}var ne=new Map;function Hr(e){let t=Date.now(),n=ne.get(e);if(n){if(n.expiresAt>t)return n.id;ne.delete(e)}let r=it("ses",t);if(ne.set(e,{id:r,expiresAt:t+1800*1e3}),ne.size>1e3){let s=ne.keys().next().value;s&&ne.delete(s)}return r}function Dr(e){if(!e)return"";for(let t of["messages","input"]){let n=e[t];if(Array.isArray(n)){for(let r of n)if(r&&typeof r=="object"&&r.role==="user"){let s=tt(r.content);if(s)return s}}}return""}function Br(e,t){if(e&&Lr.test(e))return e;let n=Dr(t);return n?Hr(`opencode-session:${n}`):it("ses")}function Ur(e,t,n){return new Headers({"Content-Type":"application/json",Authorization:`Bearer ${e}`,"User-Agent":`opencode/${Or}`,"x-opencode-client":"cli","x-opencode-project":"global","x-opencode-request":t,"x-opencode-session":n,"x-session-affinity":n,"X-Session-Id":n})}var Se=rt;function qr(e){return{type:"function",function:{name:e,description:"Reserved for the host runtime; do not call it.",parameters:{type:"object",properties:{}}}}}function zr(e){let t=e.stream===!0,n={...e,stream:!0},s=[...Array.isArray(n.tools)?n.tools:[]],a=new Set(s.map(l=>{let d=l?.function;return typeof d?.name=="string"?d.name:void 0})),i=Object.create(null),o=new Set;for(let l of Se){if(a.has(l))continue;let d=s.find(u=>{let x=u?.function;return typeof x?.name=="string"&&x.name.toLowerCase()===l});if(d){let u=d.function;i[l]=String(u.name),u.name=l,a.add(l);continue}s.push(qr(l)),a.add(l),o.add(l)}n.tools=s;let c=Array.isArray(e.tools)?e.tools.length>0:!1;return!c&&n.tool_choice===void 0&&(n.tool_choice="none"),{body:n,clientWantsStream:t,stubOnly:!c,back:i,injectedStubs:o}}function Fr(e){return{type:"function",name:e,description:"Reserved for the host runtime; do not call it.",parameters:{type:"object",properties:{}}}}function Jr(e){let n=[...Array.isArray(e.tools)?e.tools:[]],r=new Set(n.map(s=>{let a=s!==null&&typeof s=="object"?s:null;return typeof a?.name=="string"?a.name:void 0}));for(let s of Se)r.has(s)||n.push(Fr(s));e.tools=n}function Wr(e){let t=new Set;if(!Array.isArray(e.tools)){for(let s of Se)t.add(s);return t}let n=e.tools,r=new Set(n.map(s=>{let a=(s!==null&&typeof s=="object"?s:null)?.function;return typeof a?.name=="string"?a.name:void 0}));for(let s of Se){if(r.has(s))continue;n.some(i=>{let o=(i!==null&&typeof i=="object"?i:null)?.function;return typeof o?.name=="string"&&o.name.toLowerCase()===s})||t.add(s)}return t}function kn(e){let t=e.indexOf(`

`),n=e.indexOf(`\r
\r
`);return t===-1&&n===-1?null:t!==-1&&(n===-1||t<n)?{index:t,length:2}:{index:n,length:4}}async function En(e,t,n=!1,r={},s=new Set){let a=await e.text(),i="",o="stop",c,l=[],d=[],u=a.replace(/\r\n/g,`
`).replace(/\r/g,`
`);e:for(let m of u.split(`

`))for(let A of m.split(`
`)){let S=A.trim();if(!S.startsWith("data:"))continue;let I=S.slice(5).trim();if(I==="[DONE]")break e;let j;try{j=JSON.parse(I)}catch{continue}let P=j.choices?.[0];if(P){let f=P.delta;if(f){typeof f.content=="string"&&(i+=f.content);let p=f.tool_calls;if(Array.isArray(p))for(let y of p){let g=y.index,k=Number.isInteger(g)&&g>=0&&g<Yr?g:l.length;l[k]||(l[k]={id:`call_${k}`,type:"function",function:{name:"",arguments:""}},d[k]=""),typeof y.id=="string"&&y.id&&(l[k].id=y.id);let O=y.function??{},U=l[k].function;typeof O.name=="string"&&O.name&&(U.name=O.name),typeof O.arguments=="string"&&(d[k]+=O.arguments)}}typeof P.finish_reason=="string"&&P.finish_reason&&(o=P.finish_reason)}j.usage&&typeof j.usage=="object"&&(c=j.usage)}for(let m=0;m<l.length;m++){let A=l[m];if(!A)continue;let S=A.function,I=typeof S.name=="string"?S.name:"",j=I.toLowerCase();I&&(r[j]||r[I])&&(S.name=r[j]||r[I]),S.arguments=d[m]??""}let x=m=>{let A=m.toLowerCase();return!le(m)||r[A]||r[m]?!1:s.size>0?s.has(A)||s.has(m):n},w=n||s.size>0,E=l.filter(m=>!!m),h=w?E.filter(m=>{let A=m.function??{},S=typeof A.name=="string"?A.name:"";return!x(S)}):E;(o==="tool_calls"||o==="stop")&&h.some(A=>{let S=A.function.arguments;return typeof S=="string"&&S!==""&&!Gr(S)})&&(o="length");let b=w&&E.length>h.length;b&&h.length===0&&o==="tool_calls"&&(o="stop");let v={role:"assistant",content:i===""?null:i};h.length>0?v.tool_calls=h:b&&i===""&&(v.content=nt,o="stop");let R={id:`chatcmpl-${Date.now().toString(36)}`,object:"chat.completion",created:Math.floor(Date.now()/1e3),model:t,choices:[{index:0,message:v,finish_reason:o}]};return c!==void 0&&(R.usage=c),new Response(JSON.stringify(R),{status:e.status,headers:{"Content-Type":"application/json"}})}function Vr(e={},t=new Set,n=!1){let r=new TextEncoder,s=new TextDecoder,a="",i=new Set,o=new Set,c=new Map,l=new Set,d=!1,u=(h,b)=>{let v;try{v=JSON.parse(h)}catch{return null}let R=v.choices?.[0];if(R){let m=R.delta;if(m&&typeof m=="object"){let S=m.tool_calls;if(Array.isArray(S)){let I=[];for(let j of S){let P=typeof j.index=="number"?j.index:-1,f=j.function??{},p=typeof f.name=="string"?f.name:"",y=p.toLowerCase(),g=le(p);if(P>=0){if(o.add(P),g&&(e[y]||e[p]?f.name=e[y]||e[p]:(t.has(y)||t.has(p)||!n)&&i.add(P)),i.has(P)){c.delete(P);continue}if(!p&&!l.has(P)){let O=c.get(P);O?O.push(j):c.set(P,[j]);continue}l.add(P);let k=c.get(P);k&&(c.delete(P),I.push(...k))}else if(g){if(e[y]||e[p])f.name=e[y]||e[p];else if(t.has(y)||t.has(p)||!n)continue}P<0&&(d=!0),I.push(j)}I.length>0?m.tool_calls=I:delete m.tool_calls}}if(R.finish_reason==="tool_calls"&&!d&&o.size>0&&[...o].every(S=>i.has(S))&&(R.finish_reason="stop"),R.finish_reason&&E(b),(m&&typeof m=="object"?Object.keys(m):[]).length===0&&!R.finish_reason&&v.usage===void 0)return null}return JSON.stringify(v)},x=(h,b)=>{let v=b.trim();if(!v)return;if(!v.startsWith("data:")){h.enqueue(r.encode(`${v}
`));return}let R=v.slice(5).trim();if(R==="[DONE]"){h.enqueue(r.encode(`data: [DONE]

`));return}if(!R)return;let m=u(R,h);m!==null&&h.enqueue(r.encode(`data: ${m}

`))},w=(h,b)=>{let v=b.replace(/\r/g,"");if(!v.split(`
`).some(R=>R.trim().startsWith("data:"))){v.trim()&&h.enqueue(r.encode(`${v}

`));return}for(let R of v.split(`
`))x(h,R)},E=h=>{if(c.size===0)return;if(!n){c.clear();return}let b=[];for(let v of c.values())b.push(...v);c.clear(),h.enqueue(r.encode(`data: ${JSON.stringify({id:"chatcmpl-opencode-pending",object:"chat.completion.chunk",choices:[{index:0,delta:{tool_calls:b}}]})}

`))};return new TransformStream({transform(h,b){a+=s.decode(h,{stream:!0});let v;for(;(v=kn(a))!==null;){let R=a.slice(0,v.index);a=a.slice(v.index+v.length),w(b,R)}},flush(h){let b=a;a="",w(h,b),E(h)}})}var xn=256*1024,Yr=256;function Gr(e){try{return JSON.parse(e),!0}catch{return!1}}async function at(e){let t=new Headers(e.headers);t.delete("content-encoding"),t.delete("content-length");let n=Number(e.headers.get("content-length")??""),r;return Number.isFinite(n)&&n>xn?(await e.body?.cancel().catch(()=>{}),t.set("content-type","application/json; charset=utf-8"),r=new TextEncoder().encode(JSON.stringify({error:{message:`上游错误响应体过大(${n} 字节), 已省略`}}))):(r=await e.arrayBuffer(),r.byteLength>xn&&(t.set("content-type","application/json; charset=utf-8"),r=new TextEncoder().encode(JSON.stringify({error:{message:`上游错误响应体过大(${r.byteLength} 字节), 已省略`}})))),{status:e.status,statusText:e.statusText,headers:t,body:r}}function wn(e){return new Response(e.body,{status:e.status,statusText:e.statusText,headers:e.headers})}function Xr(e){let t=e instanceof Error&&e.message?e.message:"OpenCode 上游请求失败";return new Response(JSON.stringify({error:{message:t,type:"proxy_error"}}),{status:502,headers:{"Content-Type":"application/json; charset=utf-8"}})}async function ot(e,t,n,r,s,a){let i=new AbortController,o=()=>i.abort(r.clientSignal?.reason);r.clientSignal?.aborted?i.abort(r.clientSignal.reason):r.clientSignal?.addEventListener("abort",o);let c=setTimeout(()=>i.abort(new Error(`OpenCode 上游 ${yn/1e3}s 内未返回响应头`)),yn),l;try{let d=Ur(n,s,a);r.modelHeader&&d.set("x-opencode-model",r.modelHeader),l=await e(t,{method:r.method,headers:d,body:r.method==="GET"||r.method==="HEAD"?void 0:r.body,signal:i.signal})}finally{clearTimeout(c),r.clientSignal?.removeEventListener("abort",o)}if(l.ok&&l.body&&(l.headers.get("content-type")||"").includes("text/event-stream")){let u=new Headers(l.headers);return u.delete("content-encoding"),u.delete("content-length"),new Response(l.body.pipeThrough(Zr()),{status:l.status,statusText:l.statusText,headers:u})}return l}var Qr=15e3;function Zr(){let e=new TextEncoder,t=new TextDecoder,n="",r=null,s=a=>{r=setTimeout(()=>{try{a.enqueue(e.encode(`: keep-alive

`)),s(a)}catch{r=null}},Qr)};return new TransformStream({start(a){s(a)},transform(a,i){n+=t.decode(a,{stream:!0});let o;for(;(o=kn(n))!==null;){let c=n.slice(0,o.index+o.length);n=n.slice(o.index+o.length),i.enqueue(e.encode(c))}},flush(a){r&&clearTimeout(r);let i=t.decode();n&&a.enqueue(e.encode(n)),i&&a.enqueue(e.encode(i))},cancel(){r&&(clearTimeout(r),r=null)}})}async function Ie(e){if(e.method==="POST"&&/(?:^|\/)chat\/completions$/.test(e.subPath)&&e.body)try{let t=JSON.parse(e.body),n=typeof t.model=="string"?t.model:"";if(n&&pn(n))return await es(e,t,n)}catch{}return An(e)}async function es(e,t,n){let r=fn(t),s=Wr(t),a=mn(t);a.stream=!0,Jr(a),a.tool_choice!==void 0&&a.tool_choice!=="auto"&&(a.tool_choice="auto");let i=!Array.isArray(t.tools)||t.tools.length===0,o=t.stream===!0,c=await An({...e,subPath:e.subPath.replace(/chat\/completions$/,"responses"),body:JSON.stringify(a),modelHeader:n});if(!c.ok)return c;if((c.headers.get("content-type")||"").includes("text/event-stream")&&c.body){let x=new Headers(c.headers);x.delete("content-encoding"),x.delete("content-length");let w=new Response(c.body.pipeThrough(gn(n,o&&i,r,o?s:new Set)),{status:c.status,statusText:c.statusText,headers:x});return o?w:En(w,n,i,r,s)}let d=await c.text(),u;try{u=JSON.stringify(hn(JSON.parse(d),i,r,s))}catch{return new Response(d,{status:c.status,statusText:c.statusText,headers:{"Content-Type":c.headers.get("content-type")||"text/plain; charset=utf-8"}})}return new Response(u,{status:c.status,statusText:c.statusText,headers:{"Content-Type":"application/json"}})}async function An(e){let t=e.fetcher??fetch,n=e.random??Math.random,r=null;if(e.method==="POST"&&typeof e.body=="string")try{let m=JSON.parse(e.body);m&&typeof m=="object"&&!Array.isArray(m)&&(r=m)}catch{}let s=it("msg"),a=Br(e.clientSessionId,r),i=null,o=null,c=null,l=e,d=!0,u="opencode",x=!1,w={},E=new Set;if(r&&Array.isArray(r.messages)){let m=zr(r);l={...e,body:JSON.stringify(m.body)},d=m.clientWantsStream,x=m.stubOnly,w=m.back,E=m.injectedStubs,typeof r.model=="string"&&r.model&&(u=r.model)}let h=m=>{let S=(m.headers.get("content-type")||"").includes("text/event-stream")&&!!m.body;if(!d&&S)return En(m,u,x,w,E);if(d&&(E.size>0||Object.keys(w).length>0)&&S){let I=new Headers(m.headers);return I.delete("content-encoding"),I.delete("content-length"),new Response(m.body.pipeThrough(Vr(w,E,x===!1)),{status:m.status,statusText:m.statusText,headers:I})}return m},b=e.apiKeys.filter(m=>m.enabled&&m.key),v=vn(e.baseUrl,e.subPath,e.search);for(let m of b)try{let A=await ot(t,v,m.key,l,s,a);if(A.ok)return h(A);if(i=await at(A),A.status<500&&A.status!==401&&A.status!==403&&A.status!==429)break}catch(A){c=A;break}for(let m of Kr(e.mirrorUrls,n))try{let A=await ot(t,vn(m,e.subPath,e.search),"public",l,s,a);if(A.ok)return h(A);o=await at(A)}catch(A){c=A}if(!i&&!o||(i?.status===401||i?.status===403)&&!o)try{let m=await ot(t,v,"public",l,s,a);if(m.ok)return h(m);i=await at(m)}catch(m){c=m}return i?wn(i):o?wn(o):Xr(c)}async function ct(e,t,n,r,s){let a=await Ie({baseUrl:e,apiKeys:t,mirrorUrls:r,method:"POST",subPath:"chat/completions",body:JSON.stringify({model:n,messages:[{role:"user",content:"hi"}],max_tokens:64}),fetcher:s});if(a.ok)return{success:!0,message:"连接成功",statusCode:a.status};let i=await a.text();return{success:!1,message:`HTTP ${a.status}: ${i.substring(0,200)}`,statusCode:a.status}}async function _n(e,t,n,r){let s=await Ie({baseUrl:e,apiKeys:t,mirrorUrls:n,method:"GET",subPath:"models",fetcher:r});if(!s.ok)return{success:!1,message:`HTTP ${s.status}: ${(await s.text()).substring(0,200)}`,statusCode:s.status};let a=await s.json();return{success:!0,message:"连接成功",statusCode:s.status,data:{...a,data:Array.isArray(a.data)?$r(a.data):[]}}}var Pe=e=>M.KEY_HEALTH_PREFIX+e,ts=60*1e3,lt=new Map;function ns(e){let t=lt.get(e);if(t){if(Date.now()>=t.expiresAt){lt.delete(e);return}return t.value}}function Pn(e,t){lt.set(e,{value:t,expiresAt:Date.now()+ts})}var rs=3e4;async function ss(e,t,n,r=rs){let s=new AbortController,a=setTimeout(()=>s.abort(new Error(`上游在 ${r/1e3}s 内未返回响应头`)),r),i=()=>s.abort(n?.reason);n?.aborted?s.abort(n.reason):n?.addEventListener("abort",i);try{return await fetch(e,{...t,signal:s.signal})}finally{clearTimeout(a),n?.removeEventListener("abort",i)}}function dt(e){let t=Object.create(null);for(let[n,r]of Object.entries(e))t[n]={...r};return t}async function as(e,t){let n=Pe(t),r=ns(n);if(r)return dt(r);let s=await e.KV.get(n),a={};if(s)try{let i=JSON.parse(s);i&&typeof i=="object"&&(a=i)}catch{console.warn(`[proxy] key 健康数据损坏，已重置: ${n}`)}return Pn(n,a),dt(a)}async function os(e,t,n){let r=Object.create(null);for(let[s,a]of Object.entries(n))a.failures>0&&(r[s]=a);Pn(Pe(t),dt(r)),Object.keys(r).length>0?await e.KV.put(Pe(t),JSON.stringify(r)):await e.KV.delete(Pe(t)).catch(()=>{})}async function Rn(e,t,n){try{await os(e,t,n)}catch(r){console.warn(`[proxy] key 健康状态写入失败: ${r.message}`)}}var Sn=e=>e>=400&&e<=599?e:502;async function ut(e){let t=await e.text().catch(()=>"");try{let n=JSON.parse(t);if(n&&typeof n=="object"&&!Array.isArray(n))return{raw:t,json:n}}catch{}return{raw:t,json:null}}function is(e){let t=e.indexOf("/");return t===-1?null:{providerId:e.substring(0,t),modelId:e.substring(t+1)}}function Tn(e,t){let n={"Content-Type":"application/json"};return t==="anthropic"?(n["x-api-key"]=e,n["anthropic-version"]="2023-06-01"):n.Authorization=`Bearer ${e}`,n}function In(e,t){let n=!e[t],r=e[t]||{failures:0,lastFailed:!1};return r.failures++,r.lastFailed=!0,r.failures>=Ye?(r.demotedAt=Date.now(),e[t]=r,!0):(e[t]=r,n)}async function Cn(e,t,n,r){try{let i=`${e.replace(/\/$/,"")}/${r==="anthropic"?"messages":"chat/completions"}`,o=await fetch(i,{method:"POST",headers:Tn(t,r),body:JSON.stringify({model:n,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});if(o.ok)return{success:!0,message:"连接成功",statusCode:o.status};let{raw:c,json:l}=await ut(o),d=l?.error?.message,u=typeof d=="string"&&d?d:c;return{success:!1,message:`HTTP ${o.status}: ${u.substring(0,200)}`,statusCode:o.status}}catch(s){return{success:!1,message:`连接失败: ${s.message?.substring(0,200)||"未知错误"}`}}}async function On(e){try{if(e.req.method==="GET"||e.req.method==="HEAD")return e.json({error:{message:"该端点仅支持 POST（GET 请求请使用 /v1/models）",type:"invalid_request_error"}},405);let t;try{t=await e.req.json()}catch{return e.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400)}if(!t||typeof t!="object")return e.json({error:{message:"请求体必须是 JSON 对象",type:"invalid_request_error"}},400);let n=t.model;if(!n||typeof n!="string")return e.json({error:{message:"缺少 model 参数",type:"invalid_request_error"}},400);let r=is(n);if(!r)return e.json({error:{message:`模型格式错误 "${n}"，请使用 提供商ID/模型ID 格式`,type:"invalid_request_error"}},400);let{providerId:s,modelId:a}=r,i=await Ee(e.env,s);if(!i)return e.json({error:{message:`提供商 "${s}" 不存在`,type:"invalid_request_error"}},404);if(!i.enabled)return e.json({error:{message:`提供商 "${i.name}" 已禁用`,type:"provider_disabled"}},403);if(!i.baseUrl.trim())return e.json({error:{message:`提供商 "${i.name}" 未配置有效的 baseUrl`,type:"provider_misconfigured"}},502);let o=i.models.find(f=>f.id===a);if(!o)return e.json({error:{message:`模型 "${a}" 未在提供商 "${i.name}" 中配置`,type:"invalid_request_error"}},404);if(!o.enabled)return e.json({error:{message:`模型 "${a}" 已禁用`,type:"model_disabled"}},403);let c=i.apiKeys.filter(f=>f?.enabled),l={...t,model:a},d=new URL(e.req.url),u=d.pathname.replace(/^\/v1\/?/,"")||"chat/completions";if(W(s)){let p=["x-opencode-session","x-session-affinity","x-session-id","session_id","session-id"].map(g=>e.req.header(g)?.trim()).find(Boolean),y=await Ie({baseUrl:i.baseUrl,apiKeys:c,method:e.req.method,subPath:u,search:d.search,body:JSON.stringify(l),mirrorUrls:X(e.env),clientSessionId:p,clientSignal:e.req.raw.signal});return new Response(y.body,{status:y.status,statusText:y.statusText,headers:y.headers})}if(c.length===0)return e.json({error:{message:`提供商 "${i.name}" 未配置可用的 API Key`,type:"configuration_error"}},500);let w=`${i.baseUrl.replace(/\/$/,"")}/${u}${d.search}`,E=await as(e.env,s),h=!1,b=[],v=[],R=[],m=[];if(c.length===1)b.push(0);else{let f=Date.now();c.forEach((p,y)=>{let g=E[p.key];g?g.failures>=Ye?(g.demotedAt||(E[p.key]={...g,demotedAt:f},h=!0),(f-(g.demotedAt||f)>=Dt?R:m).push(y)):g.lastFailed?v.push(y):b.push(y):b.push(y)})}for(let f=b.length-1;f>0;f--){let p=Math.floor(Math.random()*(f+1));[b[f],b[p]]=[b[p],b[f]]}let A=[...b,...v,...R];A.length===0&&m.length>0&&(A.push(...m),console.log(`[proxy] ${s}: all keys demoted, falling back to ${m.length} key(s)`)),(m.length>0||R.length>0)&&console.log(`[proxy] ${s}: ${m.length} key(s) demoted, ${R.length} key(s) on probation (cooldown expired)`);let S=null,I=!1,j=!1,P=async()=>{await S?.body?.cancel().catch(()=>{})};for(let f of A){let p=c[f].key;try{let y=await ss(w,{method:e.req.method,headers:Tn(p,i.apiType),body:JSON.stringify(l)},e.req.raw.signal);if(y.ok)return E[p]?.failures>0&&(delete E[p],h=!0),(h||I)&&await Rn(e.env,s,E),await P(),new Response(y.body,{status:y.status,headers:{"Content-Type":y.headers.get("Content-Type")||"application/json","Cache-Control":"no-store"}});if(y.status===429){await P(),S=y;continue}if(y.status===401||y.status===403||y.status>=500){In(E,p)&&(h=!0),I=!0,await P(),S=y;continue}await P();let{raw:g,json:k}=await ut(y);return e.json(k??{error:{message:g.substring(0,500)}},Sn(y.status))}catch(y){if(e.req.raw.signal.aborted){j=!0;break}let g=y;In(E,p)&&(h=!0),I=!0,await P(),S=new Response(JSON.stringify({error:{message:g.message||"请求失败",type:"proxy_error"}}),{status:502});continue}}if((h||I)&&await Rn(e.env,s,E),j)return await P(),new Response(JSON.stringify({error:{message:"客户端已断开连接",type:"client_closed_request"}}),{status:499,headers:{"Content-Type":"application/json"}});if(S){let f=S.status===429,{raw:p}=await ut(S);return e.json({error:{message:f?"所有 API Key 都被上游限流（HTTP 429），请稍后重试":`所有 API Key 已用完，最后一次错误: HTTP ${S.status}`,type:f?"rate_limited":"key_exhausted",detail:(p||"所有 API Key 均失败").substring(0,500)}},Sn(S.status))}return e.json({error:{message:"没有可用的 API Key",type:"configuration_error"}},500)}catch(t){let n=t;return e.json({error:{message:n.message||"代理转发内部错误",type:"server_error"}},500)}}async function $n(e){let t=await H(e.env),n=Math.floor(Date.now()/1e3),r=t.filter(s=>s.enabled).flatMap(s=>s.models.filter(a=>a.enabled).map(a=>({id:`${s.id}/${a.id}`,provider:s.id,provider_name:s.name,object:"model",created:n,owned_by:s.id})));return e.json({object:"list",data:r})}var cs=new Set(["localhost","metadata","metadata.google.internal"]);function de(e){let t=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(e);if(!t)return!1;let[n,r]=[Number(t[1]),Number(t[2])];return[n,r].some(s=>Number.isNaN(s))?!1:n===10||n===127||n===0||n===172&&r>=16&&r<=31||n===192&&r===168||n===169&&r===254||n===100&&r>=64&&r<=127||n>=224}function Kn(e){let t=e.split(":");if(t.length!==2)return null;let n=parseInt(t[0],16),r=parseInt(t[1],16);return Number.isNaN(n)||Number.isNaN(r)?null:`${n>>8&255}.${n&255}.${r>>8&255}.${r&255}`}function ls(e){let t=e.replace(/^\[|\]$/g,"").toLowerCase();if(!t.includes(":"))return!1;if(t==="::1"||t==="::"||t==="0:0:0:0:0:0:0:1"||t==="0:0:0:0:0:0:0:0"||t.startsWith("fe")||t.startsWith("fc")||t.startsWith("fd")||t.startsWith("2002:")||t.startsWith("64:ff9b:"))return!0;if(t.startsWith("::ffff:")||t.startsWith("0:0:0:0:0:ffff:")){let n=t.replace(/^(0:0:0:0:0:ffff:|::ffff:)/,"");if(de(n))return!0;let r=Kn(n);return r===null?!0:de(r)}if(t.startsWith("::")){let n=t.slice(2);if(n.includes("."))return de(n);let r=Kn(n);if(r!==null)return de(r)}return!1}function ue(e){if(typeof e!="string")return"url 格式无效";let t;try{t=new URL(e)}catch{return"url 格式无效"}if(t.protocol!=="https:")return"仅允许 https:// 上游地址";let n=t.hostname.toLowerCase().replace(/\.$/,"");return n?cs.has(n)||n.endsWith(".local")||n.endsWith(".internal")?"不允许访问内网主机":de(n)||ls(n)?"不允许访问私有/回环/链路本地地址":null:"url 缺少主机名"}function Te(e,t){return Array.isArray(e)?e.map(n=>typeof n=="string"?t(n):n).filter(n=>typeof n=="object"&&n!==null):[]}function Ce(e){return Array.isArray(e)?e.some(t=>typeof t=="object"&&t!==null&&"enabled"in t&&typeof t.enabled!="boolean"):!1}var ds=/^[A-Za-z0-9._:/-]{1,128}$/;function jn(e){if(!Array.isArray(e))return null;for(let t of e){let n=typeof t=="string"?t:t?.id;if(typeof n!="string"||!ds.test(n))return String(n??"")}return null}async function Q(e){let t=await e.req.json();return t!==null&&typeof t=="object"?t:{}}var Mn=e=>`模型 ID "${e.slice(0,64)}" 含非法字符，仅允许字母、数字与 . _ : / -`,Nn=e=>e==="openai"||e==="anthropic";async function Ln(e){let t=await H(e.env),n=await z(e.env),r=t.reduce((a,i)=>a+i.models.length,0),s=t.reduce((a,i)=>a+i.models.filter(o=>o.enabled).length,0);return e.json({success:!0,data:{providersCount:t.length,enabledProvidersCount:t.filter(a=>a.enabled).length,modelsCount:r,enabledModelsCount:s,proxyKeysCount:n.filter(a=>a.enabled).length,adminConfigured:!!(e.env.ADMIN_USERNAME&&e.env.ADMIN_PASSWORD),baseUrl:new URL(e.req.url).origin}})}async function Hn(e){let t=await H(e.env);return e.json({success:!0,data:t})}async function Dn(e){let t=await Q(e);if(t.id==="opencode"&&!t.baseUrl&&(t.baseUrl=ke),typeof t.id!="string"||typeof t.name!="string"||typeof t.baseUrl!="string"||!t.id||!t.name||!t.baseUrl)return e.json({success:!1,message:"id、name、baseUrl 为必填项且必须是字符串"},400);if(!/^[A-Za-z0-9._-]+$/.test(t.id))return e.json({success:!1,message:"提供商 id 只能包含字母、数字、点、下划线和连字符"},400);let n=ue(t.baseUrl);if(n)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${n}`},400);let r=jn(t.models);if(r!==null)return e.json({success:!1,message:Mn(r)},400);if(t.apiType!==void 0&&!Nn(t.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);if(t.enabled!==void 0&&typeof t.enabled!="boolean")return e.json({success:!1,message:"enabled 必须是布尔值"},400);if(Ce(t.apiKeys)||Ce(t.models))return e.json({success:!1,message:"apiKeys/models 条目里的 enabled 必须是布尔值"},400);let s=new Date().toISOString(),a={id:t.id,name:t.name,baseUrl:t.baseUrl.replace(/\/$/,""),apiType:t.apiType||"openai",apiKeys:Te(t.apiKeys,i=>({key:i,enabled:!0})),models:t.models?Te(t.models,i=>({id:i,enabled:!0})):[],enabled:t.enabled??!0,createdAt:s,updatedAt:s};return await Qt(e.env,a)?e.json({success:!0,data:a},201):e.json({success:!1,message:`提供商 id "${t.id}" 已存在`},409)}async function Bn(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let n=await Q(e),r={};if(n.name!==void 0){if(typeof n.name!="string")return e.json({success:!1,message:"name 必须是字符串"},400);if(!n.name)return e.json({success:!1,message:"name 不能为空"},400);r.name=n.name}if(n.baseUrl!==void 0){let a=ue(n.baseUrl);if(a)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${a}`},400);r.baseUrl=n.baseUrl.replace(/\/$/,"")}if(n.apiType!==void 0){if(!Nn(n.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);r.apiType=n.apiType}if(n.apiKeys!==void 0&&(r.apiKeys=Te(n.apiKeys,a=>({key:a,enabled:!0}))),n.enabled!==void 0){if(typeof n.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);r.enabled=n.enabled}if(Ce(n.apiKeys)||Ce(n.models))return e.json({success:!1,message:"apiKeys/models 条目里的 enabled 必须是布尔值"},400);if(n.models!==void 0){let a=jn(n.models);if(a!==null)return e.json({success:!1,message:Mn(a)},400);r.models=Te(n.models,i=>({id:i,enabled:!0}))}let s=await Zt(e.env,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,message:"提供商不存在"},404)}async function Un(e){let t=e.req.param("id");return t?await en(e.env,t)?e.json({success:!0,message:"提供商已删除"}):e.json({success:!1,message:"提供商不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function qn(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let{modelId:n}=await Q(e);if(!n)return e.json({success:!1,message:"modelId 为必填项"},400);let r=await Ee(e.env,t);if(!r)return e.json({success:!1,message:"提供商不存在"},404);let s=ue(r.baseUrl);if(s)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${s}`},400);let a=r.apiKeys.filter(c=>c?.enabled);if(!W(r.id)&&a.length===0)return e.json({success:!1,message:"该提供商未配置可用的 API Key"},400);let i=W(r.id)?await ct(r.baseUrl,a,n,X(e.env)):await Cn(r.baseUrl,a[0].key,n,r.apiType);return r.models.find(c=>c.id===n)||(i.message=`${i.message?i.message+"；":""}提示：该模型尚未保存到提供商配置，点「保存」后才会生效`),e.json({success:!0,data:i})}function zn(e,t){return t==="anthropic"?{"x-api-key":e,"anthropic-version":"2023-06-01"}:{Authorization:`Bearer ${e}`}}async function Fn(e){let{url:t,apiKey:n,apiType:r,providerId:s}=await Q(e);if(!t||!n&&!(s&&W(s)))return e.json({success:!1,message:"url 和 apiKey 为必填项"},400);let a=ue(t);if(a)return e.json({success:!1,message:a},400);if(s&&W(s)){if(!n&&X(e.env).length===0)return e.json({success:!0,data:{success:!1,statusCode:0,message:"请先填写 API Key 或配置 OPENCODE_MIRRORS_URL 环境变量"}});let o=await _n(t,[{key:n,enabled:!0}],X(e.env));return e.json({success:!0,data:{success:o.success,statusCode:o.statusCode||0,message:o.message,data:o.data}})}let i=t.replace(/\/$/,"");try{let o=await fetch(`${i}/models`,{method:"GET",headers:zn(n,r),signal:AbortSignal.timeout(15e3)}),c=null;if(o.ok)try{c=await o.json()}catch{}return e.json({success:!0,data:{success:o.ok,statusCode:o.status,data:c}})}catch(o){return e.json({success:!0,data:{success:!1,statusCode:0,message:o.message||"连接失败"}})}}async function Jn(e){let{url:t,apiKey:n,apiType:r,model:s,providerId:a}=await Q(e);if(!t||!s||!n&&!W(a||""))return e.json({success:!1,message:"url、apiKey、model 为必填项"},400);let i=ue(t);if(i)return e.json({success:!1,message:i},400);if(a&&W(a)){let d=await ct(t,n?[{key:n,enabled:!0}]:[],s,X(e.env));return e.json({success:!0,data:{success:d.success,statusCode:d.statusCode||0,message:d.message}})}let o=t.replace(/\/$/,""),c=r==="anthropic"?"messages":"chat/completions";try{let l=await fetch(`${o}/${c}`,{method:"POST",headers:{"Content-Type":"application/json",...zn(n,r)},body:JSON.stringify({model:s,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});return e.json({success:!0,data:{success:l.ok,statusCode:l.status}})}catch(l){return e.json({success:!0,data:{success:!1,statusCode:0,message:l.message||"连接失败"}})}}async function Wn(e){let n=(await z(e.env)).map(r=>{let s=String(r.key??"");return{...r,key:s.length>12?`${s.substring(0,8)}****${s.substring(s.length-4)}`:s}});return e.json({success:!0,data:n})}async function Vn(e){let t=await Q(e),n=crypto.randomUUID(),r=crypto.randomUUID().replace(/-/g,""),s=`${we}${r}`,a=t.expiresIn?Bt[t.expiresIn]:void 0,i=typeof a=="number"?new Date(Date.now()+a*1e3).toISOString():null,o={id:n,key:s,name:t.name||`Key-${new Date().toLocaleDateString()}`,enabled:!0,createdAt:new Date().toISOString(),expiresAt:i};return await et(e.env,o),e.json({success:!0,data:o,message:"请立即保存此 Key，关闭后将不再显示"},201)}async function Yn(e){let t=e.req.param("id");return t?await nn(e.env,t)?e.json({success:!0,message:"转发 Key 已删除"}):e.json({success:!1,message:"转发 Key 不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function Gn(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let n=await Q(e),r={};if(n.enabled!==void 0){if(typeof n.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);r.enabled=n.enabled}let s=await rn(e.env,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,message:"转发 Key 不存在"},404)}var Xn=`
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
  --color-danger-hover: oklch(45% 0.175 25);
  --color-danger-soft: oklch(96% 0.022 25);
  --color-danger-ink: oklch(38% 0.145 25);
  --color-graphite: oklch(22% 0.016 260);
  --color-graphite-2: oklch(28% 0.018 260);
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
  --space-4xl: 8rem;

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

  /* compatibility aliases for existing management scripts */
  --c-primary: var(--color-accent);
  --c-primary-hover: var(--color-accent-hover);
  --c-primary-glow: var(--color-accent-soft);
  --c-text: var(--color-ink-2);
  --c-text-dark: var(--color-ink);
  --c-text-secondary: var(--color-ink-2);
  --c-text-muted: var(--color-muted);
  --c-text-light: var(--color-muted);
  --c-bg: var(--color-paper-2);
  --c-bg-white: var(--color-paper);
  --c-bg-light: var(--color-paper-2);
  --c-bg-alt: var(--color-paper-2);
  --c-border: var(--color-rule);
  --c-border-dark: var(--color-rule-2);
  --c-success: var(--color-success);
  --c-success-bg: var(--color-success-soft);
  --c-success-text: var(--color-success-ink);
  --c-danger: var(--color-danger);
  --c-danger-bg: var(--color-danger-soft);
  --c-danger-text: var(--color-danger-ink);
  --c-info-bg: var(--color-accent-soft);
  --c-info-text: var(--color-focus);
  --c-overlay: var(--color-overlay);
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
.btn-g { border-color: var(--color-success-soft); background: var(--color-success-soft); color: var(--color-success-ink); }
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
.fr, .fr3 { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 var(--space-sm); }
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
.bd-info, .protocol-chip { background: var(--color-accent-soft); color: var(--color-focus); }
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
.auth-facts { margin-block-start: var(--space-xl); border-block-start: .0625rem solid var(--color-rule); }
.auth-facts > div { padding-block: var(--space-sm); display: grid; grid-template-columns: minmax(7rem, .7fr) minmax(0, 1.3fr); gap: var(--space-sm); border-block-end: .0625rem solid var(--color-rule); }
.auth-facts dt { color: var(--color-muted); font-size: var(--text-xs); }
.auth-facts dd { min-width: 0; color: var(--color-ink); font-size: var(--text-xs); overflow-wrap: anywhere; }
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
.al { min-height: var(--control-h); padding: var(--space-xs); display: flex; align-items: center; gap: var(--space-2xs); border: .0625rem solid transparent; border-radius: var(--radius-control); font-size: var(--text-xs); }
.al-s { border-color: var(--color-success); background: var(--color-success-soft); color: var(--color-success-ink); margin-top: 20px; }
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
.flex-col { display: flex; flex-direction: column; }
.jc-c { justify-content: center; }
.gap-8, .gp8 { gap: var(--space-2xs); }
.gp3, .gp4 { gap: var(--space-3xs); }
.gp6 { gap: var(--space-2xs); }
.mt-1 { margin-block-start: var(--space-3xs); }
.mt-2, .mt-8 { margin-block-start: var(--space-2xs); }
.mt-3, .mt-6 { margin-block-start: var(--space-2xs); }
.mb-2, .mb-10 { margin-block-end: var(--space-2xs); }
.mb-3, .mb-4 { margin-block-end: var(--space-3xs); }
.m-16-0 { margin-block: var(--space-sm); }
.input-mt-6 { margin-block-start: var(--space-2xs); }
.p-14, .p-10-12 { padding: var(--space-xs); }
.fw { width: 100%; }
.fw-4 { font-weight: 400; }
.fw-6 { font-weight: 600; }
.fw-7 { font-weight: 700; }
.fs-xs, .fs-65, .fs-77 { font-size: var(--text-xs); }
.fs-sm, .fs-s, .fs-88 { font-size: var(--text-sm); }
.fs-1 { font-size: var(--text-md); }
.fs-xxs { font-size: .625rem; }
.w12, .w14, .w16 { width: 1rem; }
.c-p { color: var(--color-accent); }
.c-l, .c-muted, .mu { color: var(--color-muted); }
.c-s { color: var(--color-success); }

/* 复制成功态需压过 .model-token i / .mdl-item i:first-child 的 muted 色（0,2,0 > 0,1,1） */
.model-token i.c-s, .mdl-item i.c-s, .mdl-item i:first-child.c-s { color: var(--color-success); }
.c-d { color: var(--color-danger); }
.mu { font-size: var(--text-xs); }
.tc { text-align: center; }
.va-m { vertical-align: middle; }
.ov { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp { cursor: pointer; user-select: none; }
.cd { padding: var(--space-3xs) var(--space-2xs); border-radius: var(--radius-control); background: var(--color-paper-2); color: var(--color-ink); font-family: var(--font-mono); font-size: var(--text-xs); }
.copy-icon { color: var(--color-muted); font-size: var(--text-xs); }

@media (hover: hover) and (pointer: fine) {
  .btn-p:hover { border-color: var(--color-accent-hover); background: var(--color-accent-hover); }
  .btn-s:hover, .btn-gh:hover, .icon-btn:hover, .password-toggle:hover { border-color: var(--color-rule-2); background: var(--color-paper-2); color: var(--color-ink); }
  .btn-g:hover { border-color: var(--color-success); }
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
  .fr3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
`;var us="https://github.com/yutian81/ai-gateway";function pt(e){return`<footer class="site-footer">
  <div class="shell site-footer__inner">
    <span>© ${new Date().getFullYear()} <a class="site-footer__link" href="${us}" target="_blank" rel="noreferrer">${e}</a></span>
    <span>Cloudflare Workers · Hono · KV</span>
  </div>
</footer>`}var Qn=`
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
  el.innerHTML = '<span class="mu"><i class="fas fa-spinner fa-spin"></i> 测试中...</span>'
}
function showResult(el, success, msg) {
  el.innerHTML = success
    ? '<div class="al al-s"><i class="fas fa-check-circle"></i> 连接成功</div>'
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
`;var _=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ft=e=>`
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="oklch(98.5% 0.004 250)">
  <title>${e} — ${q.title}</title>
  <link rel="icon" href="${q.favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Space+Grotesk:wght@500;600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${q.faCdn}">
  <style>${Xn}</style>
</head>`;async function Zn(e,t){let n=await H(e.env),s=`https://${e.req.header("host")||"localhost:8787"}/v1`,a=n.filter(c=>c.enabled),i=n.reduce((c,l)=>c+l.models.length,0),o=a.reduce((c,l)=>c+l.models.filter(d=>d.enabled).length,0);return e.html(`<!DOCTYPE html><html lang="zh-CN">
${ft("首页")}
<body class="site-page home-page">
<header class="topbar">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${q.title}</span>
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
        <code>${_(s)}</code>
        <button class="icon-btn copy-control" type="button" data-copy="${_(s)}" aria-label="复制 API 地址">
          <i class="far fa-copy" aria-hidden="true"></i><span>复制</span>
        </button>
      </div>
    </div>

    <figure class="request-panel" aria-labelledby="request-caption">
      <figcaption id="request-caption">
        <span>POST /chat/completions</span>
        <span class="protocol-state"><i aria-hidden="true"></i>OPENAI COMPATIBLE</span>
      </figcaption>
      <pre><code><span class="syntax-command">curl</span> ${_(s)}/chat/completions \\
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
    <div class="metric"><span class="metric__value">${a.length}</span><span class="metric__label">已启用提供商</span></div>
    <div class="metric"><span class="metric__value">${i}</span><span class="metric__label">模型总计</span></div>
    <div class="metric"><span class="metric__value">${o}</span><span class="metric__label">可用模型</span></div>
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
      ${a.length?a.map(c=>{let l=c.models.filter(d=>d.enabled);return`<article class="provider-row" data-search="${_(`${c.name} ${c.id} ${l.map(d=>d.id).join(" ")}`.toLowerCase())}">
          <div class="provider-row__identity">
            <span class="provider-row__mark" aria-hidden="true">${_(c.name.charAt(0).toUpperCase()||"A")}</span>
            <div>
              <h3>${_(c.name)}</h3>
              <p><code>${_(c.id)}</code><span>${(c.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"} 兼容</span></p>
            </div>
          </div>
          <div class="provider-row__models">
            ${l.length?l.map(d=>{let u=`${c.id}/${d.id}`;return`<button class="model-token copy-control" type="button" data-copy="${_(u)}"><code>${_(u)}</code><i class="far fa-copy" aria-hidden="true"></i></button>`}).join(""):'<span class="empty-inline">暂无启用模型</span>'}
          </div>
          <span class="status-badge status-badge--on"><i aria-hidden="true"></i>已启用</span>
        </article>`}).join(""):`<div class="empty-state"><i class="fas fa-cubes" aria-hidden="true"></i><h3>尚无可用模型</h3><p>管理员启用提供商和模型后，它们会出现在这里。</p>${t?'<a class="btn btn-p" href="/admin">前往管理控制台</a>':""}</div>`}
    </div>
    <div id="search-empty" class="empty-state hd"><i class="fas fa-search" aria-hidden="true"></i><h3>没有匹配结果</h3><p>请尝试输入提供商名称、ID 或模型名称。</p></div>
  </section>
</main>

${pt(q.title)}

<script>
(function () {
  var status = document.getElementById('copy-status')
  document.querySelectorAll('.copy-control').forEach(function (button) {
    button.addEventListener('click', async function () {
      var text = button.getAttribute('data-copy') || ''
      var icon = button.querySelector('i')
      var label = button.querySelector('span')
      try {
        await navigator.clipboard.writeText(text)
        button.setAttribute('data-state', 'success')
        if (icon) icon.className = 'fas fa-check c-s'
        if (label) label.textContent = '已复制'
        if (status) status.textContent = '已复制 ' + text
        window.setTimeout(function () {
          button.removeAttribute('data-state')
          if (icon) icon.className = 'far fa-copy'
          if (label) label.textContent = '复制'
        }, 1800)
      } catch (error) {
        button.setAttribute('data-state', 'error')
        if (status) status.textContent = '复制失败，请手动选择文本。'
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
</body></html>`)}async function er(e){return e.html(`<!DOCTYPE html><html lang="zh-CN">
${ft("登录")}
<body class="site-page auth-page">
<header class="topbar topbar--auth">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${q.title}</span>
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
      var data = await response.json()
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
</body></html>`)}function ps(e,t,n){let r=_(e),s=_(t.id);return`<div class="fc mb-3 field-row" data-idx="${n}"><input type="text" value="${s}" class="fx1" id="mid-${r}-${n}" placeholder="模型 ID"><label class="tg"><input type="checkbox" ${t.enabled?"checked":""} id="men-${r}-${n}" aria-label="启用模型"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" data-mid="${s}" onclick="testMdl('${r}',this.dataset.mid)" title="测试模型" aria-label="测试模型"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmMdl('${r}',${n})" title="移除模型" aria-label="移除模型"><i class="fas fa-times" aria-hidden="true"></i></button></div>`}async function tr(e){let t=await H(e.env),n=await z(e.env);e.header("Cache-Control","no-store");let r=t.filter(o=>o.enabled).length,s=t.reduce((o,c)=>o+c.models.length,0),a=t.reduce((o,c)=>o+c.models.filter(l=>l.enabled).length,0),i=n.filter(o=>o.enabled).length;return e.html(`<!DOCTYPE html><html lang="zh-CN">
${ft("管理")}
<body class="site-page admin-page">
<div class="admin-shell">
  <aside class="admin-rail" aria-label="控制台导航">
    <a class="brand admin-rail__brand" href="/">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span><strong>${q.title}</strong><small>CONTROL PLANE</small></span>
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
      <a class="brand" href="/"><span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span><span class="brand__name">${q.title}</span></a>
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
          <div><span>${s}</span><p>模型</p><small>${a} 个可用</small></div>
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
          ${t.length?t.map(o=>`
          <article class="pi" data-id="${_(o.id)}">
            <div class="ps" onclick="tog('${o.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();tog('${o.id}')}" aria-controls="dt-${_(o.id)}">
              <div class="l"><i class="fas fa-chevron-right provider-chevron" aria-hidden="true" id="ch-${_(o.id)}"></i><span class="provider-avatar" aria-hidden="true">${_(o.name.charAt(0).toUpperCase()||"A")}</span><div><h3>${_(o.name)}</h3><div class="pu"><code>${_(o.id)}</code><span>${(o.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"}</span><span>${o.apiKeys.length} Keys</span><span>${o.models.length} 模型</span></div></div></div>
              <div class="fc fx-s0" onclick="event.stopPropagation()"><label class="tg"><input type="checkbox" ${o.enabled?"checked":""} id="en-${_(o.id)}" onchange="togglePb('${o.id}',this.checked)" aria-label="启用 ${_(o.name)}"><span class="sl"></span></label><span class="bd ${o.enabled?"bd-on":"bd-off"}">${o.enabled?"已启用":"未启用"}</span></div>
            </div>
            <div class="pd" id="dt-${_(o.id)}">
              <div class="detail-heading"><div><h3>编辑 ${_(o.name)}</h3><p>保存后，新配置会用于后续转发请求。</p></div><span class="protocol-chip">${(o.apiType||"openai")==="anthropic"?"ANTHROPIC":"OPENAI"}</span></div>
              <div class="fr"><div class="fg"><label>名称</label><input type="text" id="nm-${_(o.id)}" value="${_(o.name)}"></div><div class="fg"><label>ID</label><input type="text" value="${_(o.id)}" disabled></div></div>
              <div class="fg"><label>API 地址</label><input type="url" id="url-${_(o.id)}" value="${_(o.baseUrl)}"></div>
              <div class="fg"><label>API 格式</label><select id="at-${_(o.id)}" class="select-sm"><option value="openai" ${(o.apiType||"openai")==="openai"?"selected":""}>OpenAI 兼容</option><option value="anthropic" ${o.apiType==="anthropic"?"selected":""}>Anthropic 兼容</option></select></div>
              <fieldset class="form-group"><legend>上游 API Keys</legend><div id="keys-${_(o.id)}">${o.apiKeys.filter(Boolean).map((c,l)=>`<div class="fc mb-3 field-row" data-kidx="${l}"><input type="text" value="${_(c.key)}" class="fx1" id="k-${_(o.id)}-${l}" placeholder="API Key" aria-label="API Key"><label class="tg"><input type="checkbox" ${c.enabled?"checked":""} id="ken-${_(o.id)}-${l}" aria-label="启用 Key"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制 Key" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" onclick="testKeyRow('${o.id}',${l})" title="测试 Key" aria-label="测试 Key"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmKeyRow('${o.id}',${l})" title="移除 Key" aria-label="移除 Key"><i class="fas fa-times" aria-hidden="true"></i></button></div>`).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nk-${_(o.id)}" placeholder="新的 API Key" class="fx1"><button class="btn btn-s" onclick="addKeyRow('${o.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <fieldset class="form-group"><legend>模型</legend><div id="ml-${_(o.id)}">${o.models.filter(Boolean).map((c,l)=>ps(o.id,c,l)).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nmid-${_(o.id)}" placeholder="新的模型 ID" class="fx1"><button class="btn btn-s" onclick="addMdl('${o.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <div class="detail-actions"><div id="tr-${_(o.id)}" aria-live="polite"></div><div>${o.id==="opencode"?`<button class="btn btn-s" onclick="fetchEditModels('`+o.id+`')"><i class="fas fa-download" aria-hidden="true"></i>获取模型</button>`:""}<button class="btn btn-d" onclick="del('${o.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button><button class="btn btn-p" onclick="save('${o.id}')"><i class="fas fa-save" aria-hidden="true"></i>保存更改</button></div></div>
            </div>
          </article>`).join(""):'<div class="empty-state"><i class="fas fa-server" aria-hidden="true"></i><h3>还没有提供商</h3><p>添加第一个上游提供商，配置 API 地址、Key 和模型。</p><button class="btn btn-p" onclick="showAdd()">添加提供商</button></div>'}
        </div>
      </section>

      <section id="proxy-keys" class="workspace-section" aria-labelledby="proxy-keys-title">
        <div class="section-heading section-heading--admin"><div><h2 id="proxy-keys-title">转发 Key</h2><p>客户端使用这些 Key 访问统一的 <code>/v1</code> 接口。</p></div><button class="btn btn-p" onclick="genKey()"><i class="fas fa-plus" aria-hidden="true"></i>生成转发 Key</button></div>
        <div class="key-list">
          ${n.length===0?'<div class="empty-state"><i class="fas fa-key" aria-hidden="true"></i><h3>暂无转发 Key</h3><p>生成一个 Key 后，客户端才能访问网关。</p><button class="btn btn-p" onclick="genKey()">生成转发 Key</button></div>':""}
          ${n.map(o=>`<article class="ki" data-id="${_(o.id)}"><div class="key-main"><span class="key-icon" aria-hidden="true"><i class="fas fa-key"></i></span><div><div class="kv"><span id="kv-${_(o.id)}" data-full="${_(o.key)}" data-vis="0">${_(o.key.length>12?o.key.substring(0,8)+"****"+o.key.substring(o.key.length-4):o.key)}</span><button class="icon-btn" onclick="toggleKeyVis('${o.id}')" title="显示或隐藏" aria-label="显示或隐藏 Key"><i class="far fa-eye" aria-hidden="true"></i></button><button class="icon-btn" data-copy-val="${_(o.key)}" onclick="copyText(this.dataset.copyVal,this)" title="复制" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button></div><div class="key-meta"><h3>${_(o.name)}</h3><span class="key-meta__sep" aria-hidden="true">-</span><p>创建于 ${new Date(o.createdAt).toLocaleDateString()} · ${o.expiresAt?"有效至 "+new Date(o.expiresAt).toLocaleDateString():"永久有效"}</p></div></div></div><div class="key-actions"><label class="tg"><input type="checkbox" ${o.enabled?"checked":""} onchange="toggleProxyKey('${o.id}',this.checked)" aria-label="启用 ${_(o.name)}"><span class="sl"></span></label><span class="bd ${o.enabled?"bd-on":"bd-off"}">${o.enabled?"已启用":"已禁用"}</span><button class="bd bd-del" onclick="rmKey('${o.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button></div></article>`).join("")}
        </div>
      </section>
    </main>

    ${pt(q.title)}
  </div>
</div>

<div id="modal" class="modal-o hd" role="presentation" onclick="if(event.target===this)closeModal()"><div class="modal" id="mc" role="dialog" aria-modal="true" aria-live="polite"></div></div>

<script>${Qn}
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
    showM('<h3><i class="fas fa-question-circle c-p"></i> 确认</h3><p>' + escapeHtml(msg) + '</p><div class="fa"><button class="btn btn-s" onclick="closeM();r(false)">取消</button><button class="btn btn-p" onclick="closeM();r(true)">确定</button></div>')
    window.r = r
  })
}
function pM(msg, def) {
  return new Promise(r => {
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
  const i = t === 'success' ? 'fa-check-circle' : 'fa-times-circle'
  const cls = t === 'success' ? 'al-s' : 'al-e'
  el.innerHTML = '<div class="al ' + cls + '"><i class="fas ' + i + '"></i> ' + escapeHtml(msg) + '</div>'
  el.classList.remove('hd')
  // 上一条的定时器不清理，会把新提示提前关掉
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

// 连通性测试失败时的文案：status 为 0 表示请求根本没发出去，显示 “HTTP 0” 没有意义
function httpMsg(result) {
  return result.status ? 'HTTP ' + result.status : (result.message || '请求失败')
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
    document.getElementById('aurl').value = '${ke}'
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
  if (!models || models.length === 0) return '<span class="mu">未返回模型列表</span>'
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
  if (!added) { toast('列表内模型均已存在，无需入库', 'error'); return }
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
  showSpinner(tr)
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
  showSpinner(tr)
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
  showSpinner(tr)
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
  showSpinner(tr)
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
  showSpinner(tr)
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
    showResult(tr, d.data.success, d.data.success ? '' : (d.data.message || ('HTTP ' + d.data.statusCode)))
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
  showSpinner(tr)
  const d = await apiJson('/admin/api/providers/' + encodeURIComponent(id) + '/test-model', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modelId: mid })
  })
  if (d.success && d.data) {
    if (d.data.success && d.data.message) {
      // 后端降级直测时会附带“尚未保存”提醒，成功态也要展示出来。
      tr.innerHTML = '<div class="al al-s"><i class="fas fa-check-circle"></i> 连接成功 <span class="mu">' + escapeHtml(d.data.message) + '</span></div>'
    } else {
      showResult(tr, d.data.success, d.data.success ? '' : (d.data.message || '连接失败'))
    }
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
</body></html>`)}var C=new ze;C.use("/v1/*",Nt());var mt=async(e,t)=>{await t(),e.header("X-Frame-Options","DENY"),e.header("X-Content-Type-Options","nosniff")};C.use("/admin/*",mt);C.use("/",mt);C.use("/v1/*",mt);var Oe=null;C.use("*",async(e,t)=>(Oe||(Oe=an(e.env).catch(n=>{Oe=null,console.warn("初始数据填充失败:",n)})),await Oe,t()));C.get("/",async e=>{let t=te(e,"session_id"),n=t?await _e(e.env,t):null;return Zn(e,n!==null)});C.get("/admin/login",er);C.post("/admin/login",ln);C.get("/admin/logout",dn);C.use("/admin/*",cn);C.get("/admin",tr);C.get("/admin/api/status",Ln);C.get("/admin/api/providers",Hn);C.post("/admin/api/providers",Dn);C.put("/admin/api/providers/:id",Bn);C.delete("/admin/api/providers/:id",Un);C.post("/admin/api/providers/:id/test-model",qn);C.post("/admin/api/test-key",Fn);C.post("/admin/api/test-model",Jn);C.get("/admin/api/proxy-keys",Wn);C.post("/admin/api/proxy-keys",Vn);C.delete("/admin/api/proxy-keys/:id",Yn);C.patch("/admin/api/proxy-keys/:id",Gn);C.use("/v1/*",un);C.get("/v1/models",$n);C.all("/v1/*",On);C.notFound(e=>e.json({error:{message:"接口不存在",type:"not_found"}},404));C.onError((e,t)=>e instanceof SyntaxError?t.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400):(console.error("未捕获的错误:",e),t.json({error:{message:"服务器内部错误",type:"server_error"}},500)));var xo=C;export{xo as default};
