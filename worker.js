var _e=(e,t,r)=>(n,s)=>{let a=-1;return i(0);async function i(o){if(o<=a)throw new Error("next() called multiple times");a=o;let l,c=!1,d;if(e[o]?(d=e[o][0][0],n.req.routeIndex=o):d=o===e.length&&s||void 0,d)try{l=await d(n,()=>i(o+1))}catch(u){if(u instanceof Error&&t)n.error=u,l=await t(u,n),c=!0;else throw u}else n.finalized===!1&&r&&(l=await r(n));return l&&(n.finalized===!1||c)&&(n.res=l),n}};var it=Symbol();var lt=async(e,t=Object.create(null))=>{let{all:r=!1,dot:n=!1}=t,a=(e instanceof se?e.raw.headers:e.headers).get("Content-Type");return a?.startsWith("multipart/form-data")||a?.startsWith("application/x-www-form-urlencoded")?qr(e,{all:r,dot:n}):{}};async function qr(e,t){let r=await e.formData();return r?zr(r,t):{}}function zr(e,t){let r=Object.create(null);return e.forEach((n,s)=>{t.all||s.endsWith("[]")?Fr(r,s,n):r[s]=n}),t.dot&&Object.entries(r).forEach(([n,s])=>{n.includes(".")&&(Vr(r,n,s),delete r[n])}),r}var Fr=(e,t,r)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(r):e[t]=[e[t],r]:t.endsWith("[]")?e[t]=[r]:e[t]=r},Vr=(e,t,r)=>{if(/(?:^|\.)__proto__\./.test(t))return;let n=e,s=t.split(".");s.forEach((a,i)=>{i===s.length-1?n[a]=r:((!n[a]||typeof n[a]!="object"||Array.isArray(n[a])||n[a]instanceof File)&&(n[a]=Object.create(null)),n=n[a])})};var Re=e=>{let t=e.split("/");return t[0]===""&&t.shift(),t},ct=e=>{let{groups:t,path:r}=Wr(e),n=Re(r);return Jr(n,t)},Wr=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(r,n)=>{let s=`@${n}`;return t.push([s,r]),s}),{groups:t,path:e}},Jr=(e,t)=>{for(let r=t.length-1;r>=0;r--){let[n]=t[r];for(let s=e.length-1;s>=0;s--)if(e[s].includes(n)){e[s]=e[s].replace(n,t[r][1]);break}}return e},ae={},dt=(e,t)=>{if(e==="*")return"*";let r=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){let n=`${e}#${t}`;return ae[n]||(r[2]?ae[n]=t&&t[0]!==":"&&t[0]!=="*"?[n,r[1],new RegExp(`^${r[2]}(?=/${t})`)]:[e,r[1],new RegExp(`^${r[2]}$`)]:ae[n]=[e,r[1],!0]),ae[n]}return null},F=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return t(r)}catch{return r}})}},Yr=e=>F(e,decodeURI),Se=e=>{let t=e.url,r=t.indexOf("/",t.indexOf(":")+4),n=r;for(;n<t.length;n++){let s=t.charCodeAt(n);if(s===37){let a=t.indexOf("?",n),i=t.indexOf("#",n),o=a===-1?i===-1?void 0:i:i===-1?a:Math.min(a,i),l=t.slice(r,o);return Yr(l.includes("%25")?l.replace(/%25/g,"%2525"):l)}else if(s===63||s===35)break}return t.slice(r,n)};var ut=e=>{let t=Se(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},H=(e,t,...r)=>(r.length&&(t=H(t,...r)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`),oe=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;let t=e.split("/"),r=[],n="";return t.forEach(s=>{if(s!==""&&!/\:/.test(s))n+="/"+s;else if(/\:/.test(s))if(/\?/.test(s)){r.length===0&&n===""?r.push("/"):r.push(n);let a=s.replace("?","");n+="/"+a,r.push(n)}else n+="/"+s}),r.filter((s,a,i)=>i.indexOf(s)===a)},Ae=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?F(e,G):e):e,pt=(e,t,r)=>{let n;if(!r&&t&&!/[%+]/.test(t)){let i=e.indexOf("?",8);if(i===-1)return;for(e.startsWith(t,i+1)||(i=e.indexOf(`&${t}`,i+1));i!==-1;){let o=e.charCodeAt(i+t.length+1);if(o===61){let l=i+t.length+2,c=e.indexOf("&",l);return Ae(e.slice(l,c===-1?void 0:c))}else if(o==38||isNaN(o))return"";i=e.indexOf(`&${t}`,i+1)}if(n=/[%+]/.test(e),!n)return}let s={};n??=/[%+]/.test(e);let a=e.indexOf("?",8);for(;a!==-1;){let i=e.indexOf("&",a+1),o=e.indexOf("=",a);o>i&&i!==-1&&(o=-1);let l=e.slice(a+1,o===-1?i===-1?void 0:i:o);if(n&&(l=Ae(l)),a=i,l==="")continue;let c;o===-1?c="":(c=e.slice(o+1,i===-1?void 0:i),n&&(c=Ae(c))),r?(s[l]&&Array.isArray(s[l])||(s[l]=[]),s[l].push(c)):s[l]??=c}return t?s[t]:s},mt=pt,ft=(e,t)=>pt(e,t,!0),G=decodeURIComponent;var ht=e=>F(e,G),se=class{raw;#t;#e;routeIndex=0;path;bodyCache={};constructor(e,t="/",r=[[]]){this.raw=e,this.path=t,this.#e=r,this.#t={}}param(e){return e?this.#r(e):this.#a()}#r(e){let t=this.#e[0][this.routeIndex][1][e],r=this.#s(t);return r&&/\%/.test(r)?ht(r):r}#a(){let e={},t=Object.keys(this.#e[0][this.routeIndex][1]);for(let r of t){let n=this.#s(this.#e[0][this.routeIndex][1][r]);n!==void 0&&(e[r]=/\%/.test(n)?ht(n):n)}return e}#s(e){return this.#e[1]?this.#e[1][e]:e}query(e){return mt(this.url,e)}queries(e){return ft(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((r,n)=>{t[n]=r}),t}async parseBody(e){return lt(this,e)}#n=e=>{let{bodyCache:t,raw:r}=this,n=t[e];if(n)return n;let s=Object.keys(t)[0];return s?t[s].then(a=>(s==="json"&&(a=JSON.stringify(a)),new Response(a)[e]())):t[e]=r[e]()};json(){return this.#n("text").then(e=>JSON.parse(e))}text(){return this.#n("text")}arrayBuffer(){return this.#n("arrayBuffer")}bytes(){return this.#n("arrayBuffer").then(e=>new Uint8Array(e))}blob(){return this.#n("blob")}formData(){return this.#n("formData")}addValidatedData(e,t){this.#t[e]=t}valid(e){return this.#t[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[it](){return this.#e}get matchedRoutes(){return this.#e[0].map(([[,e]])=>e)}get routePath(){return this.#e[0].map(([[,e]])=>e)[this.routeIndex].path}};var gt={Stringify:1,BeforeStream:2,Stream:3},Gr=(e,t)=>{let r=new String(e);return r.isEscaped=!0,r.callbacks=t,r};var Pe=async(e,t,r,n,s)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let a=e.callbacks;if(!a?.length)return Promise.resolve(e);s?s[0]+=e:s=[e];let i=Promise.all(a.map(o=>o({phase:t,buffer:s,context:n}))).then(o=>Promise.all(o.filter(Boolean).map(l=>Pe(l,t,!1,n,s))).then(()=>s[0]));return r?Gr(await i,a):i};var Xr="text/plain; charset=UTF-8",Ie=(e,t)=>({"Content-Type":e,...t}),X=(e,t)=>new Response(e,t),Te=class{#t;#e;env={};#r;finalized=!1;error;#a;#s;#n;#d;#l;#c;#i;#u;#p;constructor(e,t){this.#t=e,t&&(this.#s=t.executionCtx,this.env=t.env,this.#c=t.notFoundHandler,this.#p=t.path,this.#u=t.matchResult)}get req(){return this.#e??=new se(this.#t,this.#p,this.#u),this.#e}get event(){if(this.#s&&"respondWith"in this.#s)return this.#s;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#s)return this.#s;throw Error("This context has no ExecutionContext")}get res(){return this.#n||=X(null,{headers:this.#i??=new Headers})}set res(e){if(this.#n&&e){e=X(e.body,e);for(let[t,r]of this.#n.headers.entries())if(t!=="content-type")if(t==="set-cookie"){let n=this.#n.headers.getSetCookie();e.headers.delete("set-cookie");for(let s of n)e.headers.append("set-cookie",s)}else e.headers.set(t,r)}this.#n=e,this.finalized=!0}render=(...e)=>(this.#l??=t=>this.html(t),this.#l(...e));setLayout=e=>this.#d=e;getLayout=()=>this.#d;setRenderer=e=>{this.#l=e};header=(e,t,r)=>{this.finalized&&(this.#n=X(this.#n.body,this.#n));let n=this.#n?this.#n.headers:this.#i??=new Headers;t===void 0?n.delete(e):r?.append?n.append(e,t):n.set(e,t)};status=e=>{this.#a=e};set=(e,t)=>{this.#r??=new Map,this.#r.set(e,t)};get=e=>this.#r?this.#r.get(e):void 0;get var(){return this.#r?Object.fromEntries(this.#r):{}}#o(e,t,r){let n=this.#n?new Headers(this.#n.headers):this.#i??new Headers;if(typeof t=="object"&&"headers"in t){let a=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[i,o]of a)i.toLowerCase()==="set-cookie"?n.append(i,o):n.set(i,o)}if(r)for(let[a,i]of Object.entries(r))if(typeof i=="string")n.set(a,i);else{n.delete(a);for(let o of i)n.append(a,o)}let s=typeof t=="number"?t:t?.status??this.#a;return X(e,{status:s,headers:n})}newResponse=(...e)=>this.#o(...e);body=(e,t,r)=>this.#o(e,t,r);text=(e,t,r)=>!this.#i&&!this.#a&&!t&&!r&&!this.finalized?new Response(e):this.#o(e,t,Ie(Xr,r));json=(e,t,r)=>this.#o(JSON.stringify(e),t,Ie("application/json",r));html=(e,t,r)=>{let n=s=>this.#o(s,t,Ie("text/html; charset=UTF-8",r));return typeof e=="object"?Pe(e,gt.Stringify,!1,{}).then(n):n(e)};redirect=(e,t)=>{let r=String(e);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,t??302)};notFound=()=>(this.#c??=()=>X(),this.#c(this))};var O="ALL",yt="all",vt=["get","post","put","delete","options","patch"],ie="Can not add a route since the matcher is already built.",le=class extends Error{};var bt="__COMPOSED_HANDLER";var Qr=e=>e.text("404 Not Found",404),xt=(e,t)=>{if("getResponse"in e){let r=e.getResponse();return t.newResponse(r.body,r)}return console.error(e),t.text("Internal Server Error",500)},wt=class kt{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath="/";#t="/";routes=[];constructor(t={}){[...vt,yt].forEach(a=>{this[a]=(i,...o)=>(typeof i=="string"?this.#t=i:this.#a(a,this.#t,i),o.forEach(l=>{this.#a(a,this.#t,l)}),this)}),this.on=(a,i,...o)=>{for(let l of[i].flat()){this.#t=l;for(let c of[a].flat())o.map(d=>{this.#a(c.toUpperCase(),this.#t,d)})}return this},this.use=(a,...i)=>(typeof a=="string"?this.#t=a:(this.#t="*",i.unshift(a)),i.forEach(o=>{this.#a(O,this.#t,o)}),this);let{strict:n,...s}=t;Object.assign(this,s),this.getPath=n??!0?t.getPath??Se:ut}#e(){let t=new kt({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,t.#r=this.#r,t.routes=this.routes,t}#r=Qr;errorHandler=xt;route(t,r){let n=this.basePath(t);return r.routes.map(s=>{let a;r.errorHandler===xt?a=s.handler:(a=async(i,o)=>(await _e([],r.errorHandler)(i,()=>s.handler(i,o))).res,a[bt]=s.handler),n.#a(s.method,s.path,a,s.basePath)}),this}basePath(t){let r=this.#e();return r._basePath=H(this._basePath,t),r}onError=t=>(this.errorHandler=t,this);notFound=t=>(this.#r=t,this);mount(t,r,n){let s,a;n&&(typeof n=="function"?a=n:(a=n.optionHandler,n.replaceRequest===!1?s=l=>l:s=n.replaceRequest));let i=a?l=>{let c=a(l);return Array.isArray(c)?c:[c]}:l=>{let c;try{c=l.executionCtx}catch{}return[l.env,c]};s||=(()=>{let l=H(this._basePath,t),c=l==="/"?0:l.length;return d=>{let u=new URL(d.url);return u.pathname=this.getPath(d).slice(c)||"/",new Request(u,d)}})();let o=async(l,c)=>{let d=await r(s(l.req.raw),...i(l));if(d)return d;await c()};return this.#a(O,H(t,"*"),o),this}#a(t,r,n,s){t=t.toUpperCase(),r=H(this._basePath,r);let a={basePath:s!==void 0?H(this._basePath,s):this._basePath,path:r,method:t,handler:n};this.router.add(t,r,[n,a]),this.routes.push(a)}#s(t,r){if(t instanceof Error)return this.errorHandler(t,r);throw t}#n(t,r,n,s){if(s==="HEAD")return(async()=>new Response(null,await this.#n(t,r,n,"GET")))();let a=this.getPath(t,{env:n}),i=this.router.match(s,a),o=new Te(t,{path:a,matchResult:i,env:n,executionCtx:r,notFoundHandler:this.#r});if(i[0].length===1){let c;try{c=i[0][0][0][0](o,async()=>{o.res=await this.#r(o)})}catch(d){return this.#s(d,o)}return c instanceof Promise?c.then(d=>d||(o.finalized?o.res:this.#r(o))).catch(d=>this.#s(d,o)):c??this.#r(o)}let l=_e(i[0],this.errorHandler,this.#r);return(async()=>{try{let c=await l(o);if(!c.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return c.res}catch(c){return this.#s(c,o)}})()}fetch=(t,...r)=>this.#n(t,r[1],r[0],t.method);request=(t,r,n,s)=>t instanceof Request?this.fetch(r?new Request(t,r):t,n,s):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${H("/",t)}`,r),n,s));fire=()=>{addEventListener("fetch",t=>{t.respondWith(this.#n(t.request,t,void 0,t.request.method))})}};var ce=[];function Ce(e,t){let r=this.buildAllMatchers(),n=((s,a)=>{let i=r[s]||r[O],o=i[2][a];if(o)return o;let l=a.match(i[0]);if(!l)return[[],ce];let c=l.indexOf("",1);return[i[1][c],l]});return this.match=n,n(e,t)}var de="[^/]+",Q=".*",Z="(?:|/.*)",D=Symbol(),Zr=new Set(".\\+*[^]$()");function en(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===Q||e===Z?1:t===Q||t===Z?-1:e===de?1:t===de?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var Et=class Oe{#t;#e;#r=Object.create(null);insert(t,r,n,s,a){if(t.length===0){if(this.#t!==void 0)throw D;if(a)return;this.#t=r;return}let[i,...o]=t,l=i==="*"?o.length===0?["","",Q]:["","",de]:i==="/*"?["","",Z]:i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),c;if(l){let d=l[1],u=l[2]||de;if(d&&l[2]&&(u===".*"||(u=u.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(u))))throw D;if(c=this.#r[u],!c){if(Object.keys(this.#r).some(h=>h!==Q&&h!==Z))throw D;if(a)return;c=this.#r[u]=new Oe,d!==""&&(c.#e=s.varIndex++)}!a&&d!==""&&n.push([d,c.#e])}else if(c=this.#r[i],!c){if(Object.keys(this.#r).some(d=>d.length>1&&d!==Q&&d!==Z))throw D;if(a)return;c=this.#r[i]=new Oe}c.insert(o,r,n,s,a)}buildRegExpStr(){let r=Object.keys(this.#r).sort(en).map(n=>{let s=this.#r[n];return(typeof s.#e=="number"?`(${n})@${s.#e}`:Zr.has(n)?`\\${n}`:n)+s.buildRegExpStr()});return typeof this.#t=="number"&&r.unshift(`#${this.#t}`),r.length===0?"":r.length===1?r[0]:"(?:"+r.join("|")+")"}};var _t=class{#t={varIndex:0};#e=new Et;insert(e,t,r){let n=[],s=[];for(let i=0;;){let o=!1;if(e=e.replace(/\{[^}]+\}/g,l=>{let c=`@\\${i}`;return s[i]=[c,l],i++,o=!0,c}),!o)break}let a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let i=s.length-1;i>=0;i--){let[o]=s[i];for(let l=a.length-1;l>=0;l--)if(a[l].indexOf(o)!==-1){a[l]=a[l].replace(o,s[i][1]);break}}return this.#e.insert(a,t,n,this.#t,r),n}buildRegExp(){let e=this.#e.buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0,r=[],n=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(s,a,i)=>a!==void 0?(r[++t]=Number(a),"$()"):(i!==void 0&&(n[Number(i)]=++t),"")),[new RegExp(`^${e}`),r,n]}};var tn=[/^$/,[],Object.create(null)],At=Object.create(null);function Rt(e){return At[e]??=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,r)=>r?`\\${r}`:"(?:|/.*)")}$`)}function rn(){At=Object.create(null)}function nn(e){let t=new _t,r=[];if(e.length===0)return tn;let n=e.map(c=>[!/\*|\/:/.test(c[0]),...c]).sort(([c,d],[u,h])=>c?1:u?-1:d.length-h.length),s=Object.create(null);for(let c=0,d=-1,u=n.length;c<u;c++){let[h,m,g]=n[c];h?s[m]=[g.map(([b])=>[b,Object.create(null)]),ce]:d++;let v;try{v=t.insert(m,d,h)}catch(b){throw b===D?new le(m):b}h||(r[d]=g.map(([b,x])=>{let _=Object.create(null);for(x-=1;x>=0;x--){let[p,f]=v[x];_[p]=f}return[b,_]}))}let[a,i,o]=t.buildRegExp();for(let c=0,d=r.length;c<d;c++)for(let u=0,h=r[c].length;u<h;u++){let m=r[c][u]?.[1];if(!m)continue;let g=Object.keys(m);for(let v=0,b=g.length;v<b;v++)m[g[v]]=o[m[g[v]]]}let l=[];for(let c in i)l[c]=r[i[c]];return[a,l,s]}function V(e,t){if(e){for(let r of Object.keys(e).sort((n,s)=>s.length-n.length))if(Rt(r).test(t))return[...e[r]]}}var ue=class{name="RegExpRouter";#t;#e;constructor(){this.#t={[O]:Object.create(null)},this.#e={[O]:Object.create(null)}}add(e,t,r){let n=this.#t,s=this.#e;if(!n||!s)throw new Error(ie);n[e]||[n,s].forEach(o=>{o[e]=Object.create(null),Object.keys(o[O]).forEach(l=>{o[e][l]=[...o[O][l]]})}),t==="/*"&&(t="*");let a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let o=Rt(t);e===O?Object.keys(n).forEach(l=>{n[l][t]||=V(n[l],t)||V(n[O],t)||[]}):n[e][t]||=V(n[e],t)||V(n[O],t)||[],Object.keys(n).forEach(l=>{(e===O||e===l)&&Object.keys(n[l]).forEach(c=>{o.test(c)&&n[l][c].push([r,a])})}),Object.keys(s).forEach(l=>{(e===O||e===l)&&Object.keys(s[l]).forEach(c=>o.test(c)&&s[l][c].push([r,a]))});return}let i=oe(t)||[t];for(let o=0,l=i.length;o<l;o++){let c=i[o];Object.keys(s).forEach(d=>{(e===O||e===d)&&(s[d][c]||=[...V(n[d],c)||V(n[O],c)||[]],s[d][c].push([r,a-l+o+1]))})}}match=Ce;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#e).concat(Object.keys(this.#t)).forEach(t=>{e[t]||=this.#r(t)}),this.#t=this.#e=void 0,rn(),e}#r(e){let t=[],r=e===O;return[this.#t,this.#e].forEach(n=>{let s=n[e]?Object.keys(n[e]).map(a=>[a,n[e][a]]):[];s.length!==0?(r||=!0,t.push(...s)):e!==O&&t.push(...Object.keys(n[O]).map(a=>[a,n[O][a]]))}),r?nn(t):null}};var $e=class{name="SmartRouter";#t=[];#e=[];constructor(e){this.#t=e.routers}add(e,t,r){if(!this.#e)throw new Error(ie);this.#e.push([e,t,r])}match(e,t){if(!this.#e)throw new Error("Fatal error");let r=this.#t,n=this.#e,s=r.length,a=0,i;for(;a<s;a++){let o=r[a];try{for(let l=0,c=n.length;l<c;l++)o.add(...n[l]);i=o.match(e,t)}catch(l){if(l instanceof le)continue;throw l}this.match=o.match.bind(o),this.#t=[o],this.#e=void 0;break}if(a===s)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,i}get activeRouter(){if(this.#e||this.#t.length!==1)throw new Error("No active router has been determined yet.");return this.#t[0]}};var ee=Object.create(null),sn=e=>{for(let t in e)return!0;return!1},St=class Pt{#t;#e;#r;#a=0;#s=ee;constructor(t,r,n){if(this.#e=n||Object.create(null),this.#t=[],t&&r){let s=Object.create(null);s[t]={handler:r,possibleKeys:[],score:0},this.#t=[s]}this.#r=[]}insert(t,r,n){this.#a=++this.#a;let s=this,a=ct(r),i=[];for(let o=0,l=a.length;o<l;o++){let c=a[o],d=a[o+1],u=dt(c,d),h=Array.isArray(u)?u[0]:c;if(h in s.#e){s=s.#e[h],u&&i.push(u[1]);continue}s.#e[h]=new Pt,u&&(s.#r.push(u),i.push(u[1])),s=s.#e[h]}return s.#t.push({[t]:{handler:n,possibleKeys:i.filter((o,l,c)=>c.indexOf(o)===l),score:this.#a}}),s}#n(t,r,n,s,a){for(let i=0,o=r.#t.length;i<o;i++){let l=r.#t[i],c=l[n]||l[O],d={};if(c!==void 0&&(c.params=Object.create(null),t.push(c),s!==ee||a&&a!==ee))for(let u=0,h=c.possibleKeys.length;u<h;u++){let m=c.possibleKeys[u],g=d[c.score];c.params[m]=a?.[m]&&!g?a[m]:s[m]??a?.[m],d[c.score]=!0}}}search(t,r){let n=[];this.#s=ee;let a=[this],i=Re(r),o=[],l=i.length,c=null;for(let d=0;d<l;d++){let u=i[d],h=d===l-1,m=[];for(let v=0,b=a.length;v<b;v++){let x=a[v],_=x.#e[u];_&&(_.#s=x.#s,h?(_.#e["*"]&&this.#n(n,_.#e["*"],t,x.#s),this.#n(n,_,t,x.#s)):m.push(_));for(let p=0,f=x.#r.length;p<f;p++){let w=x.#r[p],y=x.#s===ee?{}:{...x.#s};if(w==="*"){let E=x.#e["*"];E&&(this.#n(n,E,t,x.#s),E.#s=y,m.push(E));continue}let[S,P,A]=w;if(!u&&!(A instanceof RegExp))continue;let R=x.#e[S];if(A instanceof RegExp){if(c===null){c=new Array(l);let L=r[0]==="/"?1:0;for(let Y=0;Y<l;Y++)c[Y]=L,L+=i[Y].length+1}let E=r.substring(c[d]),T=A.exec(E);if(T){if(y[P]=T[0],this.#n(n,R,t,x.#s,y),sn(R.#e)){R.#s=y;let L=T[0].match(/\//)?.length??0;(o[L]||=[]).push(R)}continue}}(A===!0||A.test(u))&&(y[P]=u,h?(this.#n(n,R,t,y,x.#s),R.#e["*"]&&this.#n(n,R.#e["*"],t,y,x.#s)):(R.#s=y,m.push(R)))}}let g=o.shift();a=g?m.concat(g):m}return n.length>1&&n.sort((d,u)=>d.score-u.score),[n.map(({handler:d,params:u})=>[d,u])]}};var Ke=class{name="TrieRouter";#t;constructor(){this.#t=new St}add(e,t,r){let n=oe(t);if(n){for(let s=0,a=n.length;s<a;s++)this.#t.insert(e,n[s],r);return}this.#t.insert(e,t,r)}match(e,t){return this.#t.search(e,t)}};var je=class extends wt{constructor(e={}){super(e),this.router=e.router??new $e({routers:[new ue,new Ke]})}};var It=e=>{let t={origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[],...e},r=(s=>typeof s=="string"?s==="*"?()=>s:a=>s===a?a:null:typeof s=="function"?s:a=>s.includes(a)?a:null)(t.origin),n=(s=>typeof s=="function"?s:Array.isArray(s)?()=>s:()=>[])(t.allowMethods);return async function(a,i){function o(c,d){a.res.headers.set(c,d)}let l=await r(a.req.header("origin")||"",a);if(l&&o("Access-Control-Allow-Origin",l),t.credentials&&o("Access-Control-Allow-Credentials","true"),t.exposeHeaders?.length&&o("Access-Control-Expose-Headers",t.exposeHeaders.join(",")),a.req.method==="OPTIONS"){t.origin!=="*"&&o("Vary","Origin"),t.maxAge!=null&&o("Access-Control-Max-Age",t.maxAge.toString());let c=await n(a.req.header("origin")||"",a);c.length&&o("Access-Control-Allow-Methods",c.join(","));let d=t.allowHeaders;if(!d?.length){let u=a.req.header("Access-Control-Request-Headers");u&&(d=u.split(/\s*,\s*/))}return d?.length&&(o("Access-Control-Allow-Headers",d.join(",")),a.res.headers.append("Vary","Access-Control-Request-Headers")),a.res.headers.delete("Content-Length"),a.res.headers.delete("Content-Type"),new Response(null,{headers:a.res.headers,status:204,statusText:"No Content"})}await i(),t.origin!=="*"&&a.header("Vary","Origin",{append:!0})}};var Ct=/^[\w!#$%&'*.^`|~+-]+$/,an=/^[ !#-:<-[\]-~]*$/,Tt=e=>{let t=0,r=e.length;for(;t<r;){let n=e.charCodeAt(t);if(n!==32&&n!==9)break;t++}for(;r>t;){let n=e.charCodeAt(r-1);if(n!==32&&n!==9)break;r--}return t===0&&r===e.length?e:e.slice(t,r)},Me=(e,t)=>{if(t&&e.indexOf(t)===-1)return{};let r=e.split(";"),n=Object.create(null);for(let s of r){let a=s.indexOf("=");if(a===-1)continue;let i=Tt(s.substring(0,a));if(t&&t!==i||!Ct.test(i)||i in n)continue;let o=Tt(s.substring(a+1));if(o.startsWith('"')&&o.endsWith('"')&&(o=o.slice(1,-1)),an.test(o)&&(n[i]=o.indexOf("%")!==-1?F(o,G):o,t))break}return n};var on=(e,t,r={})=>{if(!Ct.test(e))throw new Error("Invalid cookie name");let n=`${e}=${t}`;if(e.startsWith("__Secure-")&&!r.secure)throw new Error("__Secure- Cookie must have Secure attributes");if(e.startsWith("__Host-")){if(!r.secure)throw new Error("__Host- Cookie must have Secure attributes");if(r.path!=="/")throw new Error('__Host- Cookie must have Path attributes with "/"');if(r.domain)throw new Error("__Host- Cookie must not have Domain attributes")}for(let s of["domain","path","sameSite","priority"])if(r[s]&&/[;\r\n]/.test(r[s]))throw new Error(`${s} must not contain ";", "\\r", or "\\n"`);if(r&&typeof r.maxAge=="number"&&r.maxAge>=0){if(r.maxAge>3456e4)throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");n+=`; Max-Age=${r.maxAge|0}`}if(r.domain&&r.prefix!=="host"&&(n+=`; Domain=${r.domain}`),r.path&&(n+=`; Path=${r.path}`),r.expires){if(r.expires.getTime()-Date.now()>3456e7)throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");n+=`; Expires=${r.expires.toUTCString()}`}if(r.httpOnly&&(n+="; HttpOnly"),r.secure&&(n+="; Secure"),r.sameSite&&(n+=`; SameSite=${r.sameSite.charAt(0).toUpperCase()+r.sameSite.slice(1)}`),r.priority&&(n+=`; Priority=${r.priority.charAt(0).toUpperCase()+r.priority.slice(1)}`),r.partitioned){if(!r.secure)throw new Error("Partitioned Cookie must have Secure attributes");n+="; Partitioned"}return n},pe=(e,t,r)=>(t=encodeURIComponent(t),on(e,t,r));var W=(e,t,r)=>{let n=e.req.raw.headers.get("Cookie");if(typeof t=="string"){if(!n)return;let a=t;return r==="secure"?a="__Secure-"+t:r==="host"&&(a="__Host-"+t),Me(n,a)[a]}return n?Me(n):{}};var ln=(e,t,r)=>{let n;return r?.prefix==="secure"?n=pe("__Secure-"+e,t,{path:"/",...r,secure:!0}):r?.prefix==="host"?n=pe("__Host-"+e,t,{...r,path:"/",secure:!0,domain:void 0}):n=pe(e,t,{path:"/",...r}),n},Ne=(e,t,r,n)=>{let s=ln(t,r,n);e.header("Set-Cookie",s,{append:!0})};var Le=(e,t,r)=>{let n=W(e,t,r?.prefix);return Ne(e,t,"",{...r,maxAge:0}),n};var j={title:"AI Gateway",subtitle:"统一的 AI 管理平台",author:"QingYun",authorUrl:"https://github.com/yutian81/ai-gateway",blogUrl:"https://blog.notett.com",description:"AI 提供商 API 代理网关 — 统一 /v1 接口转发",favicon:"https://pan.811520.xyz/icon/ai.webp",faCdn:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"},He=10080*60,me="sk_cf_",fe="https://opencode.ai/zen/v1",Ot=300*1e3,De=5,$={PROVIDERS:"providers",PROXY_KEYS:"proxy:keys",SESSION_PREFIX:"admin:session:",KEY_HEALTH_PREFIX:"key:health:",OPENCODE_MIGRATION:"migration:opencode-default:v1"},$t={"30d":720*60*60,"90d":2160*60*60,"180d":4320*60*60,"1y":365*24*60*60,forever:null},Kt=[{id:"opencode",name:"OpenCode",baseUrl:"https://opencode.ai/zen/v1",apiType:"openai",apiKeys:[],models:[{id:"deepseek-v4-flash-free",enabled:!0},{id:"mimo-v2.5-free",enabled:!0},{id:"nemotron-3-ultra-free",enabled:!0},{id:"hy3-free",enabled:!0}],enabled:!0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];var cn=60*1e3,qe=new Map;function dn(e){let t=qe.get(e);if(t){if(Date.now()>=t.expiresAt){qe.delete(e);return}return t.value}}function Nt(e,t,r=cn){qe.set(e,{value:t,expiresAt:Date.now()+r})}var Lt={[$.PROXY_KEYS]:5*1e3},Be=e=>typeof e=="object"&&e!==null&&!Array.isArray(e),Ue=e=>({...e,enabled:e.enabled===!0}),jt=/^[A-Za-z0-9._-]+$/;function un(e,t){let r=t.filter(Be);return e===$.PROVIDERS?r.filter(n=>typeof n.id=="string"&&jt.test(n.id)).map(n=>({...n,id:n.id,name:String(n.name??""),baseUrl:typeof n.baseUrl=="string"?n.baseUrl:"",enabled:n.enabled===!0,models:Array.isArray(n.models)?n.models.filter(Be).map(Ue):[],apiKeys:Array.isArray(n.apiKeys)?n.apiKeys.filter(Be).map(Ue):[]})):e===$.PROXY_KEYS?r.filter(n=>typeof n.id=="string"&&jt.test(n.id)).map(n=>Ue({...n,id:n.id,key:String(n.key??""),name:String(n.name??"")})):r}async function Ht(e,t){let r=dn(t);if(r)return r;let n=await e.KV.get(t),s=[];if(n)try{let a=JSON.parse(n);Array.isArray(a)?s=un(t,a):console.warn(`[storage] KV 数据不是数组，已按空列表处理: ${t}`)}catch{console.warn(`[storage] KV 数据解析失败，已按空列表处理: ${t}`)}return Nt(t,s,Lt[t]),s}async function Dt(e,t,r){await e.KV.put(t,JSON.stringify(r)),Nt(t,r,Lt[t])}var Mt=new Map;function B(e,t){let r=(Mt.get(e)??Promise.resolve()).then(t,t);return Mt.set(e,r.catch(()=>{})),r}async function K(e){return Ht(e,$.PROVIDERS)}async function he(e,t){return(await K(e)).find(n=>n.id===t)??null}async function ge(e,t){await Dt(e,$.PROVIDERS,t)}function Bt(e,t){return B($.PROVIDERS,async()=>{let r=await K(e);await ge(e,[...r,t])})}function Ut(e,t,r){return B($.PROVIDERS,async()=>{let n=await K(e),s=n.findIndex(i=>i.id===t);if(s===-1)return null;let a={...n[s],...r,updatedAt:new Date().toISOString()};return await ge(e,n.map((i,o)=>o===s?a:i)),a})}function qt(e,t){return B($.PROVIDERS,async()=>{let r=await K(e),n=r.filter(s=>s.id!==t);return n.length===r.length?!1:(await ge(e,n),!0)})}async function zt(e,t,r){let n=crypto.randomUUID(),s={username:t,expiresAt:Date.now()+r*1e3};return await e.KV.put($.SESSION_PREFIX+n,JSON.stringify(s),{expirationTtl:r}),n}async function ye(e,t){let r=await e.KV.get($.SESSION_PREFIX+t);if(!r)return null;let n=null;try{let s=JSON.parse(r);s&&typeof s=="object"&&(n=s)}catch{}return!n||typeof n.expiresAt!="number"||n.expiresAt<Date.now()?(await ze(e,t),null):n}async function ze(e,t){await e.KV.delete($.SESSION_PREFIX+t)}async function M(e){return Ht(e,$.PROXY_KEYS)}async function Fe(e,t){await Dt(e,$.PROXY_KEYS,t)}function Ve(e,t){return B($.PROXY_KEYS,async()=>{let r=await M(e);await Fe(e,[...r,t])})}function Ft(e,t){return B($.PROXY_KEYS,async()=>{let r=await M(e),n=r.filter(s=>s.id!==t);return n.length===r.length?!1:(await Fe(e,n),!0)})}function Vt(e,t,r){return B($.PROXY_KEYS,async()=>{let n=await M(e),s=n.findIndex(i=>i.id===t);if(s===-1)return null;let a={...n[s],...r};return await Fe(e,n.map((i,o)=>o===s?a:i)),a})}async function Wt(e,t){if(!t)return!1;let r=await M(e),n=Date.now();return r.some(s=>s.key===t&&s.enabled&&(!s.expiresAt||n<new Date(s.expiresAt).getTime()))}async function Jt(e){let t=await K(e);if(t.some(s=>s.id==="opencode"))return;let r=await e.KV.get($.OPENCODE_MIGRATION),n=Kt.find(s=>s.id==="opencode");r||(n&&!t.some(s=>s.id===n.id)&&await B($.PROVIDERS,()=>ge(e,[...t,{...n,apiKeys:n.apiKeys.map(s=>({...s})),models:n.models.map(s=>({...s}))}])),await e.KV.put($.OPENCODE_MIGRATION,"1")),t.length===0&&!r&&(await M(e)).length===0&&await Ve(e,{id:crypto.randomUUID(),key:`${me}${crypto.randomUUID().replace(/-/g,"").substring(0,16)}`,name:"测试 Key",enabled:!0,createdAt:new Date().toISOString()})}async function ve(e){let r=new TextEncoder().encode(e),n=await crypto.subtle.digest("SHA-256",r);return Array.from(new Uint8Array(n)).map(a=>a.toString(16).padStart(2,"0")).join("")}function Yt(e,t){if(e.byteLength!==t.byteLength)return!1;let r=crypto.subtle;if(typeof r.timingSafeEqual=="function")return r.timingSafeEqual(e,t);let n=0;for(let s=0;s<e.byteLength;s++)n|=e[s]^t[s];return n===0}var pn=5,mn=900*1e3,fn=400,U=new Map;function hn(e,t){let r=U.get(e);return!!r&&r.until>t&&r.count>=pn}function gn(e,t){let r=U.get(e),n=r&&r.until>t?r.count+1:1;if(U.set(e,{count:n,until:t+mn}),U.size>1e3)for(let[s,a]of U)a.until<=t&&U.delete(s)}async function Gt(e,t){let r=W(e,"session_id"),n=e.req.path;return r?await ye(e.env,r)?t():(Le(e,"session_id",{path:"/"}),n.startsWith("/admin/api/")?e.json({success:!1,message:"Session 已过期"},401):e.redirect("/admin/login")):n==="/admin/login"?t():n.startsWith("/admin/api/")?e.json({success:!1,message:"未登录"},401):e.redirect("/admin/login")}async function Xt(e){let t=await e.req.json(),r=typeof t?.username=="string"?t.username:"",n=typeof t?.password=="string"?t.password:"",{ADMIN_USERNAME:s,ADMIN_PASSWORD:a}=e.env;if(!s||!a)return e.json({success:!1,message:"未配置管理员账号，请在 Cloudflare 环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD"},500);let i=e.req.header("CF-Connecting-IP")||"unknown",o=Date.now();if(hn(i,o))return e.json({success:!1,message:"登录失败次数过多，请 15 分钟后再试"},429);if(!r||!n)return e.json({success:!1,message:"请输入用户名和密码"},400);let l=new TextEncoder,[c,d,u,h]=await Promise.all([ve(String(r)),ve(String(s)),ve(String(n)),ve(String(a))]),m=Yt(l.encode(c),l.encode(d)),g=Yt(l.encode(u),l.encode(h));if(!m||!g)return gn(i,o),await new Promise(b=>setTimeout(b,fn)),e.json({success:!1,message:"用户名或密码错误"},401);U.delete(i);let v=await zt(e.env,r,He);return Ne(e,"session_id",v,{httpOnly:!0,secure:!0,sameSite:"Strict",path:"/",maxAge:He}),e.json({success:!0,message:"登录成功"})}async function Qt(e){let t=W(e,"session_id");return t&&(await ze(e.env,t),Le(e,"session_id",{path:"/"})),e.redirect("/")}async function Zt(e,t){let r=e.req.header("Authorization");if(!r||!r.startsWith("Bearer "))return e.json({error:{message:"缺少或无效的 Authorization 头，格式: Bearer sk_cf_*",type:"authentication_error"}},401);let n=r.slice(7);return await Wt(e.env,n)?t():e.json({error:{message:"API Key 无效或已禁用",type:"authentication_error"}},401)}function er(e){return/^muse-[A-Za-z0-9.-]*-free$/.test(e)}function C(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)?e:null}function We(e){if(typeof e=="string")return e;if(Array.isArray(e)){let t="";for(let r of e){let n=C(r);n&&(typeof n.text=="string"?t+=n.text:typeof n.content=="string"&&(t+=n.content))}return t}return""}var yn=["minimal","low","medium","high","xhigh"],Je="(The model asked for a tool this session doesn't have.)",Ye=["bash","read"];function te(e){return typeof e!="string"?!1:Ye.includes(e.toLowerCase())}function vn(e){let t=typeof e=="string"?e.trim().toLowerCase():"";return yn.includes(t)?t:"low"}function tr(e){let t={};if(!Array.isArray(e.tools))return t;let r=["bash","read"],n=e.tools,s=new Set(n.map(a=>{let i=C(a)?.function;return typeof i?.name=="string"?i.name:void 0}).filter(a=>typeof a=="string"));for(let a of r){if(s.has(a))continue;let i=n.find(o=>{let l=C(o)?.function;return typeof l?.name=="string"&&l.name.toLowerCase()===a});if(i){let o=C(i).function;t[a]=String(o.name),o.name=a,s.add(a)}}return t}function rr(e){let t={};typeof e.model=="string"&&e.model&&(t.model=e.model),e.stream===!0&&(t.stream=!0),e.temperature!==void 0&&(t.temperature=e.temperature),e.top_p!==void 0&&(t.top_p=e.top_p);for(let a of["max_tokens","max_completion_tokens"])if(e[a]!==void 0){let i=Math.floor(Number(e[a]));Number.isFinite(i)&&i>0&&(t.max_output_tokens=Math.max(i,16));break}let r=Array.isArray(e.messages)?e.messages:[],n=[],s="";for(let a of r){let i=C(a);if(!i)continue;let o=typeof i.role=="string"?i.role:"",l=We(i.content);switch(o){case"system":case"developer":s=s?`${s}

${l}`:l;break;case"user":n.push({role:"user",content:l});break;case"assistant":{if(l&&n.push({role:"assistant",content:l}),Array.isArray(i.tool_calls)){let c=i.tool_calls;for(let d of c){let u=C(d);if(!u)continue;let h=C(u.function),m=typeof h?.name=="string"?String(h.name):"";n.push({type:"function_call",call_id:u.id??"",name:m,arguments:typeof h?.arguments=="string"?h.arguments:""})}}break}case"tool":n.push({type:"function_call_output",call_id:i.tool_call_id??"",output:l});break}}if(t.input=n,s&&(t.instructions=s),Array.isArray(e.tools)&&(t.tools=e.tools.map(a=>{let i=C(a);if(!i)return a;let o=C(i.function);return o?{type:"function",name:o.name??"",description:o.description,parameters:o.parameters}:i})),C(e.tool_choice)){let a=C(e.tool_choice),i=C(a.function);i&&(t.tool_choice={type:"function",name:i.name??""})}else typeof e.tool_choice=="string"&&(t.tool_choice=e.tool_choice);return t.reasoning={effort:vn(e.reasoning_effort??e.reasoningEffort)},t}function nr(e,t=!1,r={},n=new Set){let s=typeof e.model=="string"?e.model:"",a="",i=[];if(Array.isArray(e.output))for(let g of e.output){let v=C(g);if(v){if(v.type==="message"&&Array.isArray(v.content))for(let b of v.content){let x=C(b);x&&x.type==="output_text"&&typeof x.text=="string"&&(a+=x.text)}else if(v.type==="function_call"){let b=typeof v.name=="string"?v.name:"",x=b.toLowerCase();b&&(r[x]||r[b])&&(b=r[x]||r[b]),i.push({id:v.call_id??v.id??"",type:"function",function:{name:b,arguments:typeof v.arguments=="string"?v.arguments:""}})}}}let o=i.filter(g=>{let v=C(g.function)?.name;if(typeof v!="string")return!0;let b=v.toLowerCase();return r[b]||r[v]?!0:n.size>0?!n.has(b)&&!n.has(v):!(t&&te(v))}),l=i.length>o.length,c="stop",d=C(e.incomplete_details);d&&d.reason==="max_output_tokens"&&(c="length"),o.length>0&&(c="tool_calls"),l&&o.length===0&&!a&&(c="stop");let u={role:"assistant"};o.length>0?(u.tool_calls=o,a&&(u.content=a)):l&&!a?u.content=Je:u.content=a;let h={id:e.id??"",object:"chat.completion",created:e.created_at??0,model:s,choices:[{index:0,message:u,finish_reason:c}]},m=C(e.usage);return m&&(h.usage={prompt_tokens:m.input_tokens??0,completion_tokens:m.output_tokens??0,total_tokens:m.total_tokens??0}),h}function J(e,t,r,n,s){let a={index:0,delta:r};n&&(a.finish_reason=n);let i={id:t,object:"chat.completion.chunk",model:e,choices:[a]};return s&&(i.usage=s),`data: ${JSON.stringify(i)}

`}function sr(e,t=!1,r={},n=new Set){let s=new TextEncoder,a=new TextDecoder,i="",o=`chatcmpl-${Date.now().toString(16)}`,l={},c=new Set,d=0,u=!1,h=!1,m={},g=new Set,v=p=>{if(!p)return!1;try{return JSON.parse(p),!0}catch{return!1}},b=()=>d>0&&Object.keys(l).every(p=>g.has(p)||v(m[p])),x=(p,f)=>{let w=typeof f.type=="string"?f.type:"";switch(w){case"response.output_text.delta":typeof f.delta=="string"&&f.delta&&(h=!0,p.enqueue(s.encode(J(e,o,{content:f.delta}))));break;case"response.output_item.added":{let y=C(f.item);if(y&&y.type==="function_call"){let S=typeof y.id=="string"?y.id:"",P=typeof y.name=="string"?y.name:"",A=P.toLowerCase(),R=!!(P&&(r[A]||r[P]));if(R&&(P=r[A]||r[P]),te(P)&&!R&&(n.size>0?n.has(A)||n.has(P):t)){c.add(S);break}let T=d++;l[S]=T,p.enqueue(s.encode(J(e,o,{tool_calls:[{index:T,id:y.call_id??S,type:"function",function:{name:P,arguments:""}}]})))}break}case"response.function_call_arguments.delta":{let y=typeof f.item_id=="string"?f.item_id:"";if(c.has(y))break;let S=l[y];if(S===void 0)break;typeof f.delta=="string"&&f.delta&&(m[y]=(m[y]??"")+f.delta,p.enqueue(s.encode(J(e,o,{tool_calls:[{index:S,function:{arguments:f.delta}}]}))));break}case"response.output_item.done":case"response.function_call_arguments.done":{let y=C(f.item),S=typeof f.item_id=="string"?f.item_id:typeof y?.id=="string"?y.id:"",P=l[S];if(P!==void 0){let A=typeof f.arguments=="string"?f.arguments:typeof y?.arguments=="string"?y.arguments:"";A&&!m[S]&&(m[S]=A,p.enqueue(s.encode(J(e,o,{tool_calls:[{index:P,function:{arguments:A}}]})))),g.add(S)}break}case"response.completed":case"response.incomplete":{let y=C(f.response),S=C(y?.usage),P=w==="response.incomplete",A=d>0?P&&!b()?"length":"tool_calls":P?"length":"stop",R=S?{prompt_tokens:S.input_tokens??0,completion_tokens:S.output_tokens??0,total_tokens:S.total_tokens??0}:void 0;p.enqueue(s.encode(J(e,o,{},A,R))),p.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}case"response.failed":case"error":{let y=C(f.error)||C(C(f.response)?.error)||C(f.response)||{},S=y.message??y.code??"",P=typeof S=="string"&&S?S:"上游推理失败";p.enqueue(s.encode(`data: ${JSON.stringify({error:{message:P,type:"upstream_error",code:"upstream_error"}})}

`)),p.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}}},_=(p,f)=>{if(u)return;if(p.startsWith(":")){f.enqueue(s.encode(p+`

`));return}if(!p.startsWith("data: ")&&!p.startsWith("data:"))return;let w=p.startsWith("data: ")?p.slice(6).trim():p.slice(5).trim();if(!(!w||w==="[DONE]"))try{x(f,JSON.parse(w))}catch{}};return new TransformStream({transform(p,f){if(u)return;i+=a.decode(p,{stream:!0});let w;for(;(w=i.indexOf(`
`))>=0;){let y=i.slice(0,w).replace(/\r$/,"");if(i=i.slice(w+1),_(y,f),u)return}},flush(p){if(!u&&((i.startsWith("data: ")||i.startsWith("data:"))&&_(i.replace(/\r$/,""),p),!u)){let f=d>0?b()?"tool_calls":"length":h?"length":"stop";p.enqueue(s.encode(J(e,o,{},f))),p.enqueue(s.encode(`data: [DONE]

`))}}})}var bn="opencode",xn="1.18.31",ar=3e4;function N(e){return e===bn}function wn(e){return e.filter(t=>typeof t.id=="string"&&/^[A-Za-z0-9._:/-]+$/.test(t.id)&&(t.id==="big-pickle"||t.id.endsWith("-free")))}function q(e){let r=(e.OPENCODE_MIRRORS_URL||"").split(/[\s,;]+/).map(n=>n.trim()).filter(Boolean);return[...new Set(r)]}function kn(e,t){if(e.length===0)return[];let r=Math.floor(t()*e.length);return[...e.slice(r),...e.slice(0,r)]}function or(e,t,r=""){return`${e.replace(/\/+$/,"")}/${t.replace(/^\/+/,"")}${r}`}var En="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";function _n(e){let t=new Uint8Array(e);return crypto.getRandomValues(t),t}function An(e){return Array.from(_n(e),t=>En[t%62]).join("")}var Rn=/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/,ir=0,Ge=0;function Ze(e,t=Date.now()){let r=1;e==="ses"&&(t===ir?Ge+=1:(ir=t,Ge=1),r=Ge);let n=BigInt(t)*0x1000n+BigInt(r),s=e==="ses"?~n:n,a=Array.from({length:6},(i,o)=>Number(s>>BigInt(40-8*o)&0xffn).toString(16).padStart(2,"0")).join("");return`${e}_${a}${An(14)}`}var re=new Map;function Sn(e){let t=Date.now(),r=re.get(e);if(r&&r.expiresAt>t)return r.id;let n=Ze("ses",t);if(re.set(e,{id:n,expiresAt:t+1800*1e3}),re.size>1e3){let s=re.keys().next().value;s&&re.delete(s)}return n}function Pn(e){if(!e)return"";for(let t of["messages","input"]){let r=e[t];if(Array.isArray(r)){for(let n of r)if(n&&typeof n=="object"&&n.role==="user"){let s=We(n.content);if(s)return s}}}return""}function In(e,t){if(e&&Rn.test(e))return e;let r=Pn(t);return r?Sn(`opencode-session:${r}`):Ze("ses")}function Tn(e,t,r){return new Headers({"Content-Type":"application/json",Authorization:`Bearer ${e}`,"User-Agent":`opencode/${xn}`,"x-opencode-client":"cli","x-opencode-project":"global","x-opencode-request":t,"x-opencode-session":r,"x-session-affinity":r,"X-Session-Id":r})}var be=Ye;function Cn(e){return{type:"function",function:{name:e,description:"Reserved for the host runtime; do not call it.",parameters:{type:"object",properties:{}}}}}function On(e){let t=e.stream===!0,r={...e,stream:!0},s=[...Array.isArray(r.tools)?r.tools:[]],a=new Set(s.map(c=>{let d=c?.function;return typeof d?.name=="string"?d.name:void 0})),i={},o=new Set;for(let c of be){if(a.has(c))continue;let d=s.find(u=>{let h=u?.function;return typeof h?.name=="string"&&h.name.toLowerCase()===c});if(d){let u=d.function;i[c]=String(u.name),u.name=c,a.add(c);continue}s.push(Cn(c)),a.add(c),o.add(c)}r.tools=s;let l=Array.isArray(e.tools)?e.tools.length>0:!1;return!l&&r.tool_choice===void 0&&(r.tool_choice="none"),{body:r,clientWantsStream:t,stubOnly:!l,back:i,injectedStubs:o}}function $n(e){return{type:"function",name:e,description:"Reserved for the host runtime; do not call it.",parameters:{type:"object",properties:{}}}}function Kn(e){let r=[...Array.isArray(e.tools)?e.tools:[]],n=new Set(r.map(s=>{let a=s!==null&&typeof s=="object"?s:null;return typeof a?.name=="string"?a.name:void 0}));for(let s of be)n.has(s)||r.push($n(s));e.tools=r}function jn(e){let t=new Set;if(!Array.isArray(e.tools)){for(let s of be)t.add(s);return t}let r=e.tools,n=new Set(r.map(s=>{let a=(s!==null&&typeof s=="object"?s:null)?.function;return typeof a?.name=="string"?a.name:void 0}));for(let s of be){if(n.has(s))continue;r.some(i=>{let o=(i!==null&&typeof i=="object"?i:null)?.function;return typeof o?.name=="string"&&o.name.toLowerCase()===s})||t.add(s)}return t}function cr(e){let t=e.indexOf(`

`),r=e.indexOf(`\r
\r
`);return t===-1&&r===-1?null:t!==-1&&(r===-1||t<r)?{index:t,length:2}:{index:r,length:4}}async function dr(e,t,r=!1,n={},s=new Set){let a=await e.text(),i="",o="stop",l,c=[],d=[],u=a.replace(/\r\n/g,`
`).replace(/\r/g,`
`);e:for(let _ of u.split(`

`))for(let p of _.split(`
`)){let f=p.trim();if(!f.startsWith("data:"))continue;let w=f.slice(5).trim();if(w==="[DONE]")break e;let y;try{y=JSON.parse(w)}catch{continue}let S=y.choices?.[0];if(S){let P=S.delta;if(P){typeof P.content=="string"&&(i+=P.content);let A=P.tool_calls;if(Array.isArray(A))for(let R of A){let E=typeof R.index=="number"?R.index:c.length;c[E]||(c[E]={id:`call_${E}`,type:"function",function:{name:"",arguments:""}},d[E]=""),typeof R.id=="string"&&R.id&&(c[E].id=R.id);let T=R.function??{},L=c[E].function;typeof T.name=="string"&&T.name&&(L.name=T.name),typeof T.arguments=="string"&&(d[E]+=T.arguments)}}typeof S.finish_reason=="string"&&S.finish_reason&&(o=S.finish_reason)}y.usage&&typeof y.usage=="object"&&(l=y.usage)}for(let _=0;_<c.length;_++){let p=c[_];if(!p)continue;let f=p.function,w=typeof f.name=="string"?f.name:"",y=w.toLowerCase();w&&(n[y]||n[w])&&(f.name=n[y]||n[w]),f.arguments=d[_]??""}let h=_=>{let p=_.toLowerCase();return!te(_)||n[p]||n[_]?!1:s.size>0?s.has(p)||s.has(_):r},m=r||s.size>0,g=m?c.filter(_=>{if(!_)return!1;let p=_.function??{},f=typeof p.name=="string"?p.name:"";return!h(f)}):c,v=m&&c.length>g.length;v&&g.length===0&&o==="tool_calls"&&(o="stop");let b={role:"assistant",content:i===""?null:i};g.length>0?b.tool_calls=g:v&&i===""&&(b.content=Je,o="stop");let x={id:`chatcmpl-${Date.now().toString(36)}`,object:"chat.completion",created:Math.floor(Date.now()/1e3),model:t,choices:[{index:0,message:b,finish_reason:o}]};return l!==void 0&&(x.usage=l),new Response(JSON.stringify(x),{status:e.status,headers:{"Content-Type":"application/json"}})}function Mn(e={},t=new Set,r=!1){let n=new TextEncoder,s=new TextDecoder,a="",i=new Set,o=new Set,l=u=>{let h;try{h=JSON.parse(u)}catch{return null}let m=h.choices?.[0];if(m){let g=m.delta;if(g&&typeof g=="object"){let b=g.tool_calls;if(Array.isArray(b)){let x=[];for(let _ of b){let p=typeof _.index=="number"?_.index:-1,f=_.function??{},w=typeof f.name=="string"?f.name:"",y=w.toLowerCase(),S=te(w);if(p>=0){if(o.add(p),S&&(e[y]||e[w]?f.name=e[y]||e[w]:(t.has(y)||t.has(w)||!r)&&i.add(p)),i.has(p))continue}else if(S){if(e[y]||e[w])f.name=e[y]||e[w];else if(t.has(y)||t.has(w)||!r)continue}x.push(_)}x.length>0?g.tool_calls=x:delete g.tool_calls}}if(m.finish_reason==="tool_calls"&&o.size>0&&[...o].every(b=>i.has(b))&&(m.finish_reason="stop"),(g&&typeof g=="object"?Object.keys(g):[]).length===0&&!m.finish_reason&&h.usage===void 0)return null}return JSON.stringify(h)},c=(u,h)=>{let m=h.trim();if(!m)return;if(!m.startsWith("data:")){u.enqueue(n.encode(`${m}
`));return}let g=m.slice(5).trim();if(g==="[DONE]"){u.enqueue(n.encode(`data: [DONE]

`));return}if(!g)return;let v=l(g);v!==null&&u.enqueue(n.encode(`data: ${v}

`))},d=(u,h)=>{let m=h.replace(/\r/g,"");if(!m.split(`
`).some(g=>g.trim().startsWith("data:"))){m.trim()&&u.enqueue(n.encode(`${m}

`));return}for(let g of m.split(`
`))c(u,g)};return new TransformStream({transform(u,h){a+=s.decode(u,{stream:!0});let m;for(;(m=cr(a))!==null;){let g=a.slice(0,m.index);a=a.slice(m.index+m.length),d(h,g)}},flush(u){let h=a;a="",d(u,h)}})}async function Xe(e){let t=new Headers(e.headers);return t.delete("content-encoding"),t.delete("content-length"),{status:e.status,statusText:e.statusText,headers:t,body:await e.arrayBuffer()}}function lr(e){return new Response(e.body,{status:e.status,statusText:e.statusText,headers:e.headers})}function Nn(e){let t=e instanceof Error&&e.message?e.message:"OpenCode 上游请求失败";return new Response(JSON.stringify({error:{message:t,type:"proxy_error"}}),{status:502,headers:{"Content-Type":"application/json; charset=utf-8"}})}async function Qe(e,t,r,n,s,a){let i=new AbortController,o=()=>i.abort(n.clientSignal?.reason);n.clientSignal?.aborted?i.abort(n.clientSignal.reason):n.clientSignal?.addEventListener("abort",o);let l=setTimeout(()=>i.abort(new Error(`OpenCode 上游 ${ar/1e3}s 内未返回响应头`)),ar),c;try{let d=Tn(r,s,a);n.modelHeader&&d.set("x-opencode-model",n.modelHeader),c=await e(t,{method:n.method,headers:d,body:n.method==="GET"||n.method==="HEAD"?void 0:n.body,signal:i.signal})}finally{clearTimeout(l),n.clientSignal?.removeEventListener("abort",o)}if(c.ok&&c.body&&(c.headers.get("content-type")||"").includes("text/event-stream")){let u=new Headers(c.headers);return u.delete("content-encoding"),u.delete("content-length"),new Response(c.body.pipeThrough(Hn()),{status:c.status,statusText:c.statusText,headers:u})}return c}var Ln=15e3;function Hn(){let e=new TextEncoder,t=new TextDecoder,r="",n=null,s=a=>{n=setTimeout(()=>{try{a.enqueue(e.encode(`: keep-alive

`)),s(a)}catch{n=null}},Ln)};return new TransformStream({start(a){s(a)},transform(a,i){r+=t.decode(a,{stream:!0});let o;for(;(o=cr(r))!==null;){let l=r.slice(0,o.index+o.length);r=r.slice(o.index+o.length),i.enqueue(e.encode(l))}},flush(a){n&&clearTimeout(n);let i=t.decode();r&&a.enqueue(e.encode(r)),i&&a.enqueue(e.encode(i))},cancel(){n&&(clearTimeout(n),n=null)}})}async function xe(e){if(e.method==="POST"&&/(?:^|\/)chat\/completions$/.test(e.subPath)&&e.body)try{let t=JSON.parse(e.body),r=typeof t.model=="string"?t.model:"";if(r&&er(r))return await Dn(e,t,r)}catch{}return ur(e)}async function Dn(e,t,r){let n=tr(t),s=jn(t),a=rr(t);a.stream=!0,Kn(a),a.tool_choice!==void 0&&a.tool_choice!=="auto"&&(a.tool_choice="auto");let i=!Array.isArray(t.tools)||t.tools.length===0,o=t.stream===!0,l=await ur({...e,subPath:e.subPath.replace(/chat\/completions$/,"responses"),body:JSON.stringify(a),modelHeader:r});if(!l.ok)return l;if((l.headers.get("content-type")||"").includes("text/event-stream")&&l.body){let h=new Headers(l.headers);h.delete("content-encoding"),h.delete("content-length");let m=new Response(l.body.pipeThrough(sr(r,o&&i,n,o?s:new Set)),{status:l.status,statusText:l.statusText,headers:h});return o?m:dr(m,r,i,n,s)}let d=await l.text(),u;try{u=JSON.stringify(nr(JSON.parse(d),i,n,s))}catch{return new Response(d,{status:l.status,statusText:l.statusText,headers:{"Content-Type":l.headers.get("content-type")||"text/plain; charset=utf-8"}})}return new Response(u,{status:l.status,statusText:l.statusText,headers:{"Content-Type":"application/json"}})}async function ur(e){let t=e.fetcher??fetch,r=e.random??Math.random,n=null;if(e.method==="POST"&&typeof e.body=="string")try{let p=JSON.parse(e.body);p&&typeof p=="object"&&!Array.isArray(p)&&(n=p)}catch{}let s=Ze("msg"),a=In(e.clientSessionId,n),i=null,o=null,l=null,c=e,d=!0,u="opencode",h=!1,m={},g=new Set;if(n&&Array.isArray(n.messages)){let p=On(n);c={...e,body:JSON.stringify(p.body)},d=p.clientWantsStream,h=p.stubOnly,m=p.back,g=p.injectedStubs,typeof n.model=="string"&&n.model&&(u=n.model)}let v=p=>{let w=(p.headers.get("content-type")||"").includes("text/event-stream")&&!!p.body;if(!d&&w)return dr(p,u,h,m,g);if(d&&(g.size>0||Object.keys(m).length>0)&&w){let y=new Headers(p.headers);return y.delete("content-encoding"),y.delete("content-length"),new Response(p.body.pipeThrough(Mn(m,g,h===!1)),{status:p.status,statusText:p.statusText,headers:y})}return p},b=e.apiKeys.filter(p=>p.enabled&&p.key),x=or(e.baseUrl,e.subPath,e.search);for(let p of b)try{let f=await Qe(t,x,p.key,c,s,a);if(f.ok)return v(f);if(i=await Xe(f),f.status<500&&f.status!==401&&f.status!==403&&f.status!==429)break}catch(f){l=f;break}for(let p of kn(e.mirrorUrls,r))try{let f=await Qe(t,or(p,e.subPath,e.search),"public",c,s,a);if(f.ok)return v(f);o=await Xe(f)}catch(f){l=f}if(!i&&!o||(i?.status===401||i?.status===403)&&!o)try{let p=await Qe(t,x,"public",c,s,a);if(p.ok)return v(p);i=await Xe(p)}catch(p){l=p}return i?lr(i):o?lr(o):Nn(l)}async function et(e,t,r,n,s){let a=await xe({baseUrl:e,apiKeys:t,mirrorUrls:n,method:"POST",subPath:"chat/completions",body:JSON.stringify({model:r,messages:[{role:"user",content:"hi"}],max_tokens:64}),fetcher:s});if(a.ok)return{success:!0,message:"连接成功",statusCode:a.status};let i=await a.text();return{success:!1,message:`HTTP ${a.status}: ${i.substring(0,200)}`,statusCode:a.status}}async function pr(e,t,r,n){let s=await xe({baseUrl:e,apiKeys:t,mirrorUrls:r,method:"GET",subPath:"models",fetcher:n});if(!s.ok)return{success:!1,message:`HTTP ${s.status}: ${(await s.text()).substring(0,200)}`,statusCode:s.status};let a=await s.json();return{success:!0,message:"连接成功",statusCode:s.status,data:{...a,data:Array.isArray(a.data)?wn(a.data):[]}}}var we=e=>$.KEY_HEALTH_PREFIX+e,Bn=60*1e3,tt=new Map;function Un(e){let t=tt.get(e);if(t){if(Date.now()>=t.expiresAt){tt.delete(e);return}return t.value}}function gr(e,t){tt.set(e,{value:t,expiresAt:Date.now()+Bn})}var qn=3e4;async function zn(e,t,r,n=qn){let s=new AbortController,a=setTimeout(()=>s.abort(new Error(`上游在 ${n/1e3}s 内未返回响应头`)),n),i=()=>s.abort(r?.reason);r?.aborted?s.abort(r.reason):r?.addEventListener("abort",i);try{return await fetch(e,{...t,signal:s.signal})}finally{clearTimeout(a),r?.removeEventListener("abort",i)}}function rt(e){return Object.fromEntries(Object.entries(e).map(([t,r])=>[t,{...r}]))}async function Fn(e,t){let r=we(t),n=Un(r);if(n)return rt(n);let s=await e.KV.get(r),a={};if(s)try{let i=JSON.parse(s);i&&typeof i=="object"&&(a=i)}catch{console.warn(`[proxy] key 健康数据损坏，已重置: ${r}`)}return gr(r,a),rt(a)}async function Vn(e,t,r){let n={};for(let[s,a]of Object.entries(r))a.failures>0&&(n[s]=a);gr(we(t),rt(n)),Object.keys(n).length>0?await e.KV.put(we(t),JSON.stringify(n)):await e.KV.delete(we(t)).catch(()=>{})}async function mr(e,t,r){try{await Vn(e,t,r)}catch(n){console.warn(`[proxy] key 健康状态写入失败: ${n.message}`)}}var fr=e=>e>=400&&e<=599?e:502;async function nt(e){let t=await e.text().catch(()=>"");try{let r=JSON.parse(t);if(r&&typeof r=="object")return{raw:t,json:r}}catch{}return{raw:t,json:null}}function Wn(e){let t=e.indexOf("/");return t===-1?null:{providerId:e.substring(0,t),modelId:e.substring(t+1)}}function yr(e,t){let r={"Content-Type":"application/json"};return t==="anthropic"?(r["x-api-key"]=e,r["anthropic-version"]="2023-06-01"):r.Authorization=`Bearer ${e}`,r}function hr(e,t){let r=!e[t],n=e[t]||{failures:0,lastFailed:!1};return n.failures++,n.lastFailed=!0,n.failures>=De?(n.demotedAt=Date.now(),e[t]=n,!0):(e[t]=n,r)}async function vr(e,t,r,n){try{let i=`${e.replace(/\/$/,"")}/${n==="anthropic"?"messages":"chat/completions"}`,o=await fetch(i,{method:"POST",headers:yr(t,n),body:JSON.stringify({model:r,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});if(o.ok)return{success:!0,message:"连接成功",statusCode:o.status};let{raw:l,json:c}=await nt(o),d=c?.error?.message,u=typeof d=="string"&&d?d:l;return{success:!1,message:`HTTP ${o.status}: ${u.substring(0,200)}`,statusCode:o.status}}catch(s){return{success:!1,message:`连接失败: ${s.message?.substring(0,200)||"未知错误"}`}}}async function br(e){try{if(e.req.method==="GET"||e.req.method==="HEAD")return e.json({error:{message:"该端点仅支持 POST（GET 请求请使用 /v1/models）",type:"invalid_request_error"}},405);let t;try{t=await e.req.json()}catch{return e.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400)}if(!t||typeof t!="object")return e.json({error:{message:"请求体必须是 JSON 对象",type:"invalid_request_error"}},400);let r=t.model;if(!r||typeof r!="string")return e.json({error:{message:"缺少 model 参数",type:"invalid_request_error"}},400);let n=Wn(r);if(!n)return e.json({error:{message:`模型格式错误 "${r}"，请使用 提供商ID/模型ID 格式`,type:"invalid_request_error"}},400);let{providerId:s,modelId:a}=n,i=await he(e.env,s);if(!i)return e.json({error:{message:`提供商 "${s}" 不存在`,type:"invalid_request_error"}},404);if(!i.enabled)return e.json({error:{message:`提供商 "${i.name}" 已禁用`,type:"provider_disabled"}},403);if(!i.baseUrl.trim())return e.json({error:{message:`提供商 "${i.name}" 未配置有效的 baseUrl`,type:"provider_misconfigured"}},502);let o=i.models.find(A=>A.id===a);if(!o)return e.json({error:{message:`模型 "${a}" 未在提供商 "${i.name}" 中配置`,type:"invalid_request_error"}},404);if(!o.enabled)return e.json({error:{message:`模型 "${a}" 已禁用`,type:"model_disabled"}},403);let l=i.apiKeys.filter(A=>A?.enabled),c={...t,model:a},d=new URL(e.req.url),u=d.pathname.replace(/^\/v1\/?/,"")||"chat/completions";if(N(s)){let R=["x-opencode-session","x-session-affinity","x-session-id","session_id","session-id"].map(T=>e.req.header(T)?.trim()).find(Boolean),E=await xe({baseUrl:i.baseUrl,apiKeys:l,method:e.req.method,subPath:u,search:d.search,body:JSON.stringify(c),mirrorUrls:q(e.env),clientSessionId:R,clientSignal:e.req.raw.signal});return new Response(E.body,{status:E.status,statusText:E.statusText,headers:E.headers})}if(l.length===0)return e.json({error:{message:`提供商 "${i.name}" 未配置可用的 API Key`,type:"configuration_error"}},500);let m=`${i.baseUrl.replace(/\/$/,"")}/${u}${d.search}`,g=await Fn(e.env,s),v=!1,b=[],x=[],_=[],p=[];if(l.length===1)b.push(0);else{let A=Date.now();l.forEach((R,E)=>{let T=g[R.key];T?T.failures>=De?(T.demotedAt||(g[R.key]={...T,demotedAt:A},v=!0),(A-(T.demotedAt||A)>=Ot?_:p).push(E)):T.lastFailed?x.push(E):b.push(E):b.push(E)})}for(let A=b.length-1;A>0;A--){let R=Math.floor(Math.random()*(A+1));[b[A],b[R]]=[b[R],b[A]]}let f=[...b,...x,..._];f.length===0&&p.length>0&&(f.push(...p),console.log(`[proxy] ${s}: all keys demoted, falling back to ${p.length} key(s)`)),(p.length>0||_.length>0)&&console.log(`[proxy] ${s}: ${p.length} key(s) demoted, ${_.length} key(s) on probation (cooldown expired)`);let w=null,y=!1,S=!1,P=async()=>{await w?.body?.cancel().catch(()=>{})};for(let A of f){let R=l[A].key;try{let E=await zn(m,{method:e.req.method,headers:yr(R,i.apiType),body:JSON.stringify(c)},e.req.raw.signal);if(E.ok)return g[R]?.failures>0&&(delete g[R],v=!0),(v||y)&&await mr(e.env,s,g),await P(),new Response(E.body,{status:E.status,headers:{"Content-Type":E.headers.get("Content-Type")||"application/json","Cache-Control":"no-store"}});if(E.status===429){await P(),w=E;continue}if(E.status===401||E.status===403||E.status>=500){hr(g,R)&&(v=!0),y=!0,await P(),w=E;continue}let{raw:T,json:L}=await nt(E);return e.json(L??{error:{message:T.substring(0,500)}},fr(E.status))}catch(E){if(e.req.raw.signal.aborted){S=!0;break}let T=E;hr(g,R)&&(v=!0),y=!0,await P(),w=new Response(JSON.stringify({error:{message:T.message||"请求失败",type:"proxy_error"}}),{status:502});continue}}if((v||y)&&await mr(e.env,s,g),S)return new Response(JSON.stringify({error:{message:"客户端已断开连接",type:"client_closed_request"}}),{status:499,headers:{"Content-Type":"application/json"}});if(w){let{raw:A}=await nt(w);return e.json({error:{message:`所有 API Key 已用完，最后一次错误: HTTP ${w.status}`,type:"key_exhausted",detail:(A||"所有 API Key 均失败").substring(0,500)}},fr(w.status))}return e.json({error:{message:"没有可用的 API Key",type:"configuration_error"}},500)}catch(t){let r=t;return e.json({error:{message:r.message||"代理转发内部错误",type:"server_error"}},500)}}async function xr(e){let t=await K(e.env),r=Math.floor(Date.now()/1e3),n=t.filter(s=>s.enabled).flatMap(s=>s.models.filter(a=>a.enabled).map(a=>({id:`${s.id}/${a.id}`,provider:s.id,provider_name:s.name,object:"model",created:r,owned_by:s.id})));return e.json({object:"list",data:n})}var Jn=new Set(["localhost","metadata","metadata.google.internal"]);function st(e){let t=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(e);if(!t)return!1;let[r,n]=[Number(t[1]),Number(t[2])];return[r,n].some(s=>Number.isNaN(s))?!1:r===10||r===127||r===0||r===172&&n>=16&&n<=31||r===192&&n===168||r===169&&n===254||r===100&&n>=64&&n<=127||r>=224}function Yn(e){let t=e.replace(/^\[|\]$/g,"").toLowerCase();if(!t.includes(":"))return!1;if(t==="::1"||t==="::"||t==="0:0:0:0:0:0:0:1"||t==="0:0:0:0:0:0:0:0"||t.startsWith("fe")||t.startsWith("fc")||t.startsWith("fd")||t.startsWith("2002:")||t.startsWith("64:ff9b:"))return!0;if(t.startsWith("::ffff:")||t.startsWith("0:0:0:0:0:ffff:")){let r=t.replace(/^(0:0:0:0:0:ffff:|::ffff:)/,"");if(st(r))return!0;let n=r.split(":");if(n.length===2){let s=parseInt(n[0],16),a=parseInt(n[1],16);if(!Number.isNaN(s)&&!Number.isNaN(a)){let i=s>>8&255,o=s&255,l=a>>8&255,c=a&255;return st(`${i}.${o}.${l}.${c}`)}}return!0}return!1}function ne(e){let t;try{t=new URL(e)}catch{return"url 格式无效"}if(t.protocol!=="https:")return"仅允许 https:// 上游地址";let r=t.hostname.toLowerCase().replace(/\.$/,"");return r?Jn.has(r)||r.endsWith(".local")||r.endsWith(".internal")?"不允许访问内网主机":st(r)||Yn(r)?"不允许访问私有/回环/链路本地地址":null:"url 缺少主机名"}function ke(e,t){return Array.isArray(e)?e.map(r=>typeof r=="string"?t(r):r).filter(r=>typeof r=="object"&&r!==null):[]}var Gn=/^[A-Za-z0-9._:/-]{1,128}$/;function wr(e){if(!Array.isArray(e))return null;for(let t of e){let r=typeof t=="string"?t:t?.id;if(typeof r!="string"||!Gn.test(r))return String(r??"")}return null}async function z(e){let t=await e.req.json();return t!==null&&typeof t=="object"?t:{}}var kr=e=>`模型 ID "${e.slice(0,64)}" 含非法字符，仅允许字母、数字与 . _ : / -`,Er=e=>e==="openai"||e==="anthropic";async function _r(e){let t=await K(e.env),r=await M(e.env),n=t.reduce((a,i)=>a+i.models.length,0),s=t.reduce((a,i)=>a+i.models.filter(o=>o.enabled).length,0);return e.json({success:!0,data:{providersCount:t.length,enabledProvidersCount:t.filter(a=>a.enabled).length,modelsCount:n,enabledModelsCount:s,proxyKeysCount:r.filter(a=>a.enabled).length,adminConfigured:!!(e.env.ADMIN_USERNAME&&e.env.ADMIN_PASSWORD),baseUrl:new URL(e.req.url).origin}})}async function Ar(e){let t=await K(e.env);return e.json({success:!0,data:t})}async function Rr(e){let t=await z(e);if(t.id==="opencode"&&!t.baseUrl&&(t.baseUrl=fe),!t.id||!t.name||!t.baseUrl)return e.json({success:!1,message:"id、name、baseUrl 为必填项"},400);if(typeof t.id!="string"||!/^[A-Za-z0-9._-]+$/.test(t.id))return e.json({success:!1,message:"提供商 id 只能包含字母、数字、点、下划线和连字符"},400);let r=ne(t.baseUrl);if(r)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${r}`},400);if((await K(e.env)).some(o=>o.id===t.id))return e.json({success:!1,message:`提供商 id "${t.id}" 已存在`},409);let s=wr(t.models);if(s!==null)return e.json({success:!1,message:kr(s)},400);if(t.apiType!==void 0&&!Er(t.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);if(t.enabled!==void 0&&typeof t.enabled!="boolean")return e.json({success:!1,message:"enabled 必须是布尔值"},400);let a=new Date().toISOString(),i={id:t.id,name:t.name,baseUrl:t.baseUrl.replace(/\/$/,""),apiType:t.apiType||"openai",apiKeys:ke(t.apiKeys,o=>({key:o,enabled:!0})),models:t.models?ke(t.models,o=>({id:o,enabled:!0})):[],enabled:t.enabled??!0,createdAt:a,updatedAt:a};return await Bt(e.env,i),e.json({success:!0,data:i},201)}async function Sr(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let r=await z(e),n={};if(r.name!==void 0&&(n.name=r.name),r.baseUrl!==void 0){let a=ne(r.baseUrl);if(a)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${a}`},400);n.baseUrl=r.baseUrl.replace(/\/$/,"")}if(r.apiType!==void 0){if(!Er(r.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);n.apiType=r.apiType}if(r.apiKeys!==void 0&&(n.apiKeys=ke(r.apiKeys,a=>({key:a,enabled:!0}))),r.enabled!==void 0){if(typeof r.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);n.enabled=r.enabled}if(r.models!==void 0){let a=wr(r.models);if(a!==null)return e.json({success:!1,message:kr(a)},400);n.models=ke(r.models,i=>({id:i,enabled:!0}))}let s=await Ut(e.env,t,n);return s?e.json({success:!0,data:s}):e.json({success:!1,message:"提供商不存在"},404)}async function Pr(e){let t=e.req.param("id");return t?await qt(e.env,t)?e.json({success:!0,message:"提供商已删除"}):e.json({success:!1,message:"提供商不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function Ir(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let{modelId:r}=await z(e);if(!r)return e.json({success:!1,message:"modelId 为必填项"},400);let n=await he(e.env,t);if(!n)return e.json({success:!1,message:"提供商不存在"},404);let s=ne(n.baseUrl);if(s)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${s}`},400);let a=n.apiKeys.filter(l=>l?.enabled);if(!N(n.id)&&a.length===0)return e.json({success:!1,message:"该提供商未配置可用的 API Key"},400);let i=N(n.id)?await et(n.baseUrl,a,r,q(e.env)):await vr(n.baseUrl,a[0].key,r,n.apiType);return n.models.find(l=>l.id===r)||(i.message=`${i.message?i.message+"；":""}提示：该模型尚未保存到提供商配置，点「保存」后才会生效`),e.json({success:!0,data:i})}function Tr(e,t){return t==="anthropic"?{"x-api-key":e,"anthropic-version":"2023-06-01"}:{Authorization:`Bearer ${e}`}}async function Cr(e){let{url:t,apiKey:r,apiType:n,providerId:s}=await z(e);if(!t||!r&&!(s&&N(s)))return e.json({success:!1,message:"url 和 apiKey 为必填项"},400);let a=ne(t);if(a)return e.json({success:!1,message:a},400);if(s&&N(s)){if(!r&&q(e.env).length===0)return e.json({success:!0,data:{success:!1,statusCode:0,message:"请先填写 API Key 或配置 OPENCODE_MIRRORS_URL 环境变量"}});let o=await pr(t,[{key:r,enabled:!0}],q(e.env));return e.json({success:!0,data:{success:o.success,statusCode:o.statusCode||0,message:o.message,data:o.data}})}let i=t.replace(/\/$/,"");try{let o=await fetch(`${i}/models`,{method:"GET",headers:Tr(r,n),signal:AbortSignal.timeout(15e3)}),l=null;if(o.ok)try{l=await o.json()}catch{}return e.json({success:!0,data:{success:o.ok,statusCode:o.status,data:l}})}catch(o){return e.json({success:!0,data:{success:!1,statusCode:0,message:o.message||"连接失败"}})}}async function Or(e){let{url:t,apiKey:r,apiType:n,model:s,providerId:a}=await z(e);if(!t||!s||!r&&!N(a||""))return e.json({success:!1,message:"url、apiKey、model 为必填项"},400);let i=ne(t);if(i)return e.json({success:!1,message:i},400);if(a&&N(a)){let d=await et(t,r?[{key:r,enabled:!0}]:[],s,q(e.env));return e.json({success:!0,data:{success:d.success,statusCode:d.statusCode||0,message:d.message}})}let o=t.replace(/\/$/,""),l=n==="anthropic"?"messages":"chat/completions";try{let c=await fetch(`${o}/${l}`,{method:"POST",headers:{"Content-Type":"application/json",...Tr(r,n)},body:JSON.stringify({model:s,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});return e.json({success:!0,data:{success:c.ok,statusCode:c.status}})}catch(c){return e.json({success:!0,data:{success:!1,statusCode:0,message:c.message||"连接失败"}})}}async function $r(e){let r=(await M(e.env)).map(n=>{let s=String(n.key??"");return{...n,key:s.length>12?`${s.substring(0,8)}****${s.substring(s.length-4)}`:s}});return e.json({success:!0,data:r})}async function Kr(e){let t=await z(e),r=crypto.randomUUID(),n=crypto.randomUUID().replace(/-/g,""),s=`${me}${n}`,a=t.expiresIn?$t[t.expiresIn]:void 0,i=typeof a=="number"?new Date(Date.now()+a*1e3).toISOString():null,o={id:r,key:s,name:t.name||`Key-${new Date().toLocaleDateString()}`,enabled:!0,createdAt:new Date().toISOString(),expiresAt:i};return await Ve(e.env,o),e.json({success:!0,data:o,message:"请立即保存此 Key，关闭后将不再显示"},201)}async function jr(e){let t=e.req.param("id");return t?await Ft(e.env,t)?e.json({success:!0,message:"转发 Key 已删除"}):e.json({success:!1,message:"转发 Key 不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function Mr(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let r=await z(e),n={};if(r.enabled!==void 0){if(typeof r.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);n.enabled=r.enabled}let s=await Vt(e.env,t,n);return s?e.json({success:!0,data:s}):e.json({success:!1,message:"转发 Key 不存在"},404)}var Nr=`
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
`;var Xn="https://github.com/yutian81/ai-gateway";function at(e){return`<footer class="site-footer">
  <div class="shell site-footer__inner">
    <span>© ${new Date().getFullYear()} <a class="site-footer__link" href="${Xn}" target="_blank" rel="noreferrer">${e}</a></span>
    <span>Cloudflare Workers · Hono · KV</span>
  </div>
</footer>`}var Lr=`
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
    return { success: false, status: 0, data: null }
  } catch (e) {
    return { success: false, status: 0, data: null }
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
      return { success: d.data.success, status: d.data.statusCode }
    }
    return { success: false, status: 0 }
  } catch (e) {
    return { success: false, status: 0 }
  }
}
`;var k=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ot=e=>`
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="oklch(98.5% 0.004 250)">
  <title>${e} — ${j.title}</title>
  <link rel="icon" href="${j.favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Space+Grotesk:wght@500;600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${j.faCdn}">
  <style>${Nr}</style>
</head>`;async function Hr(e,t){let r=await K(e.env),s=`https://${e.req.header("host")||"localhost:8787"}/v1`,a=r.filter(l=>l.enabled),i=r.reduce((l,c)=>l+c.models.length,0),o=a.reduce((l,c)=>l+c.models.filter(d=>d.enabled).length,0);return e.html(`<!DOCTYPE html><html lang="zh-CN">
${ot("首页")}
<body class="site-page home-page">
<header class="topbar">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${j.title}</span>
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
        <code>${k(s)}</code>
        <button class="icon-btn copy-control" type="button" data-copy="${k(s)}" aria-label="复制 API 地址">
          <i class="far fa-copy" aria-hidden="true"></i><span>复制</span>
        </button>
      </div>
    </div>

    <figure class="request-panel" aria-labelledby="request-caption">
      <figcaption id="request-caption">
        <span>POST /chat/completions</span>
        <span class="protocol-state"><i aria-hidden="true"></i>OPENAI COMPATIBLE</span>
      </figcaption>
      <pre><code><span class="syntax-command">curl</span> ${k(s)}/chat/completions \\
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
    <div class="metric"><span class="metric__value">${r.length}</span><span class="metric__label">提供商总计</span></div>
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
      ${a.length?a.map(l=>{let c=l.models.filter(d=>d.enabled);return`<article class="provider-row" data-search="${k(`${l.name} ${l.id} ${c.map(d=>d.id).join(" ")}`.toLowerCase())}">
          <div class="provider-row__identity">
            <span class="provider-row__mark" aria-hidden="true">${k(l.name.charAt(0).toUpperCase()||"A")}</span>
            <div>
              <h3>${k(l.name)}</h3>
              <p><code>${k(l.id)}</code><span>${(l.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"} 兼容</span></p>
            </div>
          </div>
          <div class="provider-row__models">
            ${c.length?c.map(d=>{let u=`${l.id}/${d.id}`;return`<button class="model-token copy-control" type="button" data-copy="${k(u)}"><code>${k(u)}</code><i class="far fa-copy" aria-hidden="true"></i></button>`}).join(""):'<span class="empty-inline">暂无启用模型</span>'}
          </div>
          <span class="status-badge status-badge--on"><i aria-hidden="true"></i>已启用</span>
        </article>`}).join(""):`<div class="empty-state"><i class="fas fa-cubes" aria-hidden="true"></i><h3>尚无可用模型</h3><p>管理员启用提供商和模型后，它们会出现在这里。</p>${t?'<a class="btn btn-p" href="/admin">前往管理控制台</a>':""}</div>`}
    </div>
    <div id="search-empty" class="empty-state hd"><i class="fas fa-search" aria-hidden="true"></i><h3>没有匹配结果</h3><p>请尝试输入提供商名称、ID 或模型名称。</p></div>
  </section>
</main>

${at(j.title)}

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
</body></html>`)}async function Dr(e){return e.html(`<!DOCTYPE html><html lang="zh-CN">
${ot("登录")}
<body class="site-page auth-page">
<header class="topbar topbar--auth">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${j.title}</span>
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
</body></html>`)}function Qn(e,t,r){let n=k(e),s=k(t.id);return`<div class="fc mb-3 field-row" data-idx="${r}"><input type="text" value="${s}" class="fx1" id="mid-${n}-${r}" placeholder="模型 ID"><label class="tg"><input type="checkbox" ${t.enabled?"checked":""} id="men-${n}-${r}" aria-label="启用模型"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" data-mid="${s}" onclick="testMdl('${n}',this.dataset.mid)" title="测试模型" aria-label="测试模型"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmMdl('${n}',${r})" title="移除模型" aria-label="移除模型"><i class="fas fa-times" aria-hidden="true"></i></button></div>`}async function Br(e){let t=await K(e.env),r=await M(e.env);e.header("Cache-Control","no-store");let n=t.filter(o=>o.enabled).length,s=t.reduce((o,l)=>o+l.models.length,0),a=t.reduce((o,l)=>o+l.models.filter(c=>c.enabled).length,0),i=r.filter(o=>o.enabled).length;return e.html(`<!DOCTYPE html><html lang="zh-CN">
${ot("管理")}
<body class="site-page admin-page">
<div class="admin-shell">
  <aside class="admin-rail" aria-label="控制台导航">
    <a class="brand admin-rail__brand" href="/">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span><strong>${j.title}</strong><small>CONTROL PLANE</small></span>
    </a>
    <nav class="admin-nav">
      <a class="admin-nav__link is-active" href="#overview"><i class="fas fa-chart-pie" aria-hidden="true"></i><span>概览</span></a>
      <a class="admin-nav__link" href="#providers"><i class="fas fa-server" aria-hidden="true"></i><span>提供商</span><b>${t.length}</b></a>
      <a class="admin-nav__link" href="#proxy-keys"><i class="fas fa-key" aria-hidden="true"></i><span>转发 Key</span><b>${r.length}</b></a>
    </nav>
    <div class="admin-rail__foot">
      <a href="/" class="admin-nav__link"><i class="fas fa-arrow-left" aria-hidden="true"></i><span>返回首页</span></a>
      <a href="/admin/logout" class="admin-nav__link"><i class="fas fa-sign-out-alt" aria-hidden="true"></i><span>退出登录</span></a>
    </div>
  </aside>

  <div class="admin-main">
    <header class="admin-topbar">
      <a class="brand" href="/"><span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span><span class="brand__name">${j.title}</span></a>
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
          <div><span>${t.length}</span><p>提供商</p><small>${n} 个已启用</small></div>
          <div><span>${s}</span><p>模型</p><small>${a} 个可用</small></div>
          <div><span>${r.length}</span><p>转发 Key</p><small>${i} 个可用</small></div>
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
          <article class="pi" data-id="${k(o.id)}">
            <div class="ps" onclick="tog('${o.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();tog('${o.id}')}" aria-controls="dt-${k(o.id)}">
              <div class="l"><i class="fas fa-chevron-right provider-chevron" aria-hidden="true" id="ch-${k(o.id)}"></i><span class="provider-avatar" aria-hidden="true">${k(o.name.charAt(0).toUpperCase()||"A")}</span><div><h3>${k(o.name)}</h3><div class="pu"><code>${k(o.id)}</code><span>${(o.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"}</span><span>${o.apiKeys.length} Keys</span><span>${o.models.length} 模型</span></div></div></div>
              <div class="fc fx-s0" onclick="event.stopPropagation()"><label class="tg"><input type="checkbox" ${o.enabled?"checked":""} id="en-${k(o.id)}" onchange="togglePb('${o.id}',this.checked)" aria-label="启用 ${k(o.name)}"><span class="sl"></span></label><span class="bd ${o.enabled?"bd-on":"bd-off"}">${o.enabled?"已启用":"未启用"}</span></div>
            </div>
            <div class="pd" id="dt-${k(o.id)}">
              <div class="detail-heading"><div><h3>编辑 ${k(o.name)}</h3><p>保存后，新配置会用于后续转发请求。</p></div><span class="protocol-chip">${(o.apiType||"openai")==="anthropic"?"ANTHROPIC":"OPENAI"}</span></div>
              <div class="fr"><div class="fg"><label>名称</label><input type="text" id="nm-${k(o.id)}" value="${k(o.name)}"></div><div class="fg"><label>ID</label><input type="text" value="${k(o.id)}" disabled></div></div>
              <div class="fg"><label>API 地址</label><input type="url" id="url-${k(o.id)}" value="${k(o.baseUrl)}"></div>
              <div class="fg"><label>API 格式</label><select id="at-${k(o.id)}" class="select-sm"><option value="openai" ${(o.apiType||"openai")==="openai"?"selected":""}>OpenAI 兼容</option><option value="anthropic" ${o.apiType==="anthropic"?"selected":""}>Anthropic 兼容</option></select></div>
              <fieldset class="form-group"><legend>上游 API Keys</legend><div id="keys-${k(o.id)}">${o.apiKeys.filter(Boolean).map((l,c)=>`<div class="fc mb-3 field-row" data-kidx="${c}"><input type="text" value="${k(l.key)}" class="fx1" id="k-${k(o.id)}-${c}" placeholder="API Key" aria-label="API Key"><label class="tg"><input type="checkbox" ${l.enabled?"checked":""} id="ken-${k(o.id)}-${c}" aria-label="启用 Key"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制 Key" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" onclick="testKeyRow('${o.id}',${c})" title="测试 Key" aria-label="测试 Key"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmKeyRow('${o.id}',${c})" title="移除 Key" aria-label="移除 Key"><i class="fas fa-times" aria-hidden="true"></i></button></div>`).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nk-${k(o.id)}" placeholder="新的 API Key" class="fx1"><button class="btn btn-s" onclick="addKeyRow('${o.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <fieldset class="form-group"><legend>模型</legend><div id="ml-${k(o.id)}">${o.models.filter(Boolean).map((l,c)=>Qn(o.id,l,c)).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nmid-${k(o.id)}" placeholder="新的模型 ID" class="fx1"><button class="btn btn-s" onclick="addMdl('${o.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <div class="detail-actions"><div id="tr-${k(o.id)}" aria-live="polite"></div><div>${o.id==="opencode"?`<button class="btn btn-s" onclick="fetchEditModels('`+o.id+`')"><i class="fas fa-download" aria-hidden="true"></i>获取模型</button>`:""}<button class="btn btn-d" onclick="del('${o.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button><button class="btn btn-p" onclick="save('${o.id}')"><i class="fas fa-save" aria-hidden="true"></i>保存更改</button></div></div>
            </div>
          </article>`).join(""):'<div class="empty-state"><i class="fas fa-server" aria-hidden="true"></i><h3>还没有提供商</h3><p>添加第一个上游提供商，配置 API 地址、Key 和模型。</p><button class="btn btn-p" onclick="showAdd()">添加提供商</button></div>'}
        </div>
      </section>

      <section id="proxy-keys" class="workspace-section" aria-labelledby="proxy-keys-title">
        <div class="section-heading section-heading--admin"><div><h2 id="proxy-keys-title">转发 Key</h2><p>客户端使用这些 Key 访问统一的 <code>/v1</code> 接口。</p></div><button class="btn btn-p" onclick="genKey()"><i class="fas fa-plus" aria-hidden="true"></i>生成转发 Key</button></div>
        <div class="key-list">
          ${r.length===0?'<div class="empty-state"><i class="fas fa-key" aria-hidden="true"></i><h3>暂无转发 Key</h3><p>生成一个 Key 后，客户端才能访问网关。</p><button class="btn btn-p" onclick="genKey()">生成转发 Key</button></div>':""}
          ${r.map(o=>`<article class="ki" data-id="${k(o.id)}"><div class="key-main"><span class="key-icon" aria-hidden="true"><i class="fas fa-key"></i></span><div><div class="kv"><span id="kv-${k(o.id)}" data-full="${k(o.key)}" data-vis="0">${k(o.key.length>12?o.key.substring(0,8)+"*****"+o.key.substring(o.key.length-4):o.key)}</span><button class="icon-btn" onclick="toggleKeyVis('${o.id}')" title="显示或隐藏" aria-label="显示或隐藏 Key"><i class="far fa-eye" aria-hidden="true"></i></button><button class="icon-btn" data-copy-val="${k(o.key)}" onclick="copyText(this.dataset.copyVal,this)" title="复制" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button></div><div class="key-meta"><h3>${k(o.name)}</h3><span class="key-meta__sep" aria-hidden="true">-</span><p>创建于 ${new Date(o.createdAt).toLocaleDateString()} · ${o.expiresAt?"有效至 "+new Date(o.expiresAt).toLocaleDateString():"永久有效"}</p></div></div></div><div class="key-actions"><label class="tg"><input type="checkbox" ${o.enabled?"checked":""} onchange="toggleProxyKey('${o.id}',this.checked)" aria-label="启用 ${k(o.name)}"><span class="sl"></span></label><span class="bd ${o.enabled?"bd-on":"bd-off"}">${o.enabled?"已启用":"已禁用"}</span><button class="bd bd-del" onclick="rmKey('${o.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button></div></article>`).join("")}
        </div>
      </section>
    </main>

    ${at(j.title)}
  </div>
</div>

<div id="modal" class="modal-o hd" role="presentation" onclick="if(event.target===this)closeModal()"><div class="modal" id="mc" role="dialog" aria-modal="true" aria-live="polite"></div></div>

<script>${Lr}
// copy
function copyText(t, el) {
  const i = el.tagName === 'I' ? el : (el.querySelector('i') || el.parentElement?.querySelector('i'))
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
    document.getElementById('aurl').value = '${fe}'
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

// 可用模型面板 heading（添加态静态 HTML 与编辑态动态生成共用同一结构）
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
  const existing = {}
  getMdl(id).forEach(m => { existing[m.id] = true })
  let added = 0
  ids.forEach(mid => {
    // 循环内同步标记：上游列表自身重复的 id 会被加两次
    if (!existing[mid]) { existing[mid] = true; addMdlToEdit(id, mid); added++ }
  })
  if (!added) { toast('列表内模型均已存在，无需入库', 'error'); return }
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
  if (!nm || !url) { toast('请填写名称和 API 地址', 'error'); return }
  const apiType = document.getElementById('at-' + id).value
  const keys = getKeys(id)
  const models = getMdl(id), enabled = document.getElementById('en-' + id).checked
  const d = await apiJson('/admin/api/providers/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: nm, baseUrl: url, apiType, apiKeys: keys, models, enabled })
  })
  if (d.success) { toast('已保存', 'success'); location.reload() }
  else toast(d.message || '保存失败', 'error')
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
  try {
    const r = await fetch('/admin/api/test-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, apiKey: apiKey, apiType: apiType, model: mid, providerId: id })
    })
    const d = await r.json()
    if (d.success && d.data) {
      showResult(tr, d.data.success, d.data.success ? '' : (d.data.message || ('HTTP ' + d.data.statusCode)))
    } else {
      showResult(tr, false, d.message || '测试失败')
    }
  } catch (e) { showResult(tr, false, '请求失败') }
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
  try {
    const r = await fetch('/admin/api/providers/' + encodeURIComponent(id) + '/test-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: mid })
    })
    const d = await r.json()
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
  } catch (e) { showResult(tr, false, '请求失败') }
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
  setPbState(id, checked)
  const d = await apiJson('/admin/api/providers/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: checked })
  })
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
      ? full.substring(0, 8) + '*****' + full.substring(full.length - 4)
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
  const d = await apiJson('/admin/api/proxy-keys/' + encodeURIComponent(id), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: checked })
  })
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
</body></html>`)}var I=new je;I.use("/v1/*",It());var Ur=async(e,t)=>{await t(),e.header("X-Frame-Options","DENY"),e.header("X-Content-Type-Options","nosniff")};I.use("/admin/*",Ur);I.use("/",Ur);var Ee=null;I.use("*",async(e,t)=>(Ee||(Ee=Jt(e.env).catch(r=>{throw Ee=null,r})),await Ee,t()));I.get("/",async e=>{let t=W(e,"session_id"),r=t?await ye(e.env,t):null;return Hr(e,r!==null)});I.get("/admin/login",Dr);I.post("/admin/login",Xt);I.get("/admin/logout",Qt);I.use("/admin/*",Gt);I.get("/admin",Br);I.get("/admin/api/status",_r);I.get("/admin/api/providers",Ar);I.post("/admin/api/providers",Rr);I.put("/admin/api/providers/:id",Sr);I.delete("/admin/api/providers/:id",Pr);I.post("/admin/api/providers/:id/test-model",Ir);I.post("/admin/api/test-key",Cr);I.post("/admin/api/test-model",Or);I.get("/admin/api/proxy-keys",$r);I.post("/admin/api/proxy-keys",Kr);I.delete("/admin/api/proxy-keys/:id",jr);I.patch("/admin/api/proxy-keys/:id",Mr);I.use("/v1/*",Zt);I.get("/v1/models",xr);I.all("/v1/*",br);I.notFound(e=>e.json({error:{message:"接口不存在",type:"not_found"}},404));I.onError((e,t)=>e instanceof SyntaxError?t.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400):(console.error("未捕获的错误:",e),t.json({error:{message:"服务器内部错误",type:"server_error"}},500)));var ao=I;export{ao as default};
