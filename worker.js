var Ne=(e,t,n)=>(r,s)=>{let a=-1;return i(0);async function i(o){if(o<=a)throw new Error("next() called multiple times");a=o;let l,c=!1,d;if(e[o]?(d=e[o][0][0],r.req.routeIndex=o):d=o===e.length&&s||void 0,d)try{l=await d(r,()=>i(o+1))}catch(u){if(u instanceof Error&&t)r.error=u,l=await t(u,r),c=!0;else throw u}else r.finalized===!1&&n&&(l=await n(r));return l&&(r.finalized===!1||c)&&(r.res=l),r}};var vt=Symbol();var xt=async(e,t=Object.create(null))=>{let{all:n=!1,dot:r=!1}=t,a=(e instanceof ge?e.raw.headers:e.headers).get("Content-Type");return a?.startsWith("multipart/form-data")||a?.startsWith("application/x-www-form-urlencoded")?pr(e,{all:n,dot:r}):{}};async function pr(e,t){let n=await e.formData();return n?fr(n,t):{}}function fr(e,t){let n=Object.create(null);return e.forEach((r,s)=>{t.all||s.endsWith("[]")?mr(n,s,r):n[s]=r}),t.dot&&Object.entries(n).forEach(([r,s])=>{r.includes(".")&&(hr(n,r,s),delete n[r])}),n}var mr=(e,t,n)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(n):e[t]=[e[t],n]:t.endsWith("[]")?e[t]=[n]:e[t]=n},hr=(e,t,n)=>{if(/(?:^|\.)__proto__\./.test(t))return;let r=e,s=t.split(".");s.forEach((a,i)=>{i===s.length-1?r[a]=n:((!r[a]||typeof r[a]!="object"||Array.isArray(r[a])||r[a]instanceof File)&&(r[a]=Object.create(null)),r=r[a])})};var He=e=>{let t=e.split("/");return t[0]===""&&t.shift(),t},wt=e=>{let{groups:t,path:n}=gr(e),r=He(n);return yr(r,t)},gr=e=>{let t=[];return e=e.replace(/\{[^}]+\}/g,(n,r)=>{let s=`@${r}`;return t.push([s,n]),s}),{groups:t,path:e}},yr=(e,t)=>{for(let n=t.length-1;n>=0;n--){let[r]=t[n];for(let s=e.length-1;s>=0;s--)if(e[s].includes(r)){e[s]=e[s].replace(r,t[n][1]);break}}return e},ye={},kt=(e,t)=>{if(e==="*")return"*";let n=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(n){let r=`${e}#${t}`;return ye[r]||(n[2]?ye[r]=t&&t[0]!==":"&&t[0]!=="*"?[r,n[1],new RegExp(`^${n[2]}(?=/${t})`)]:[e,n[1],new RegExp(`^${n[2]}$`)]:ye[r]=[e,n[1],!0]),ye[r]}return null},te=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,n=>{try{return t(n)}catch{return n}})}},br=e=>te(e,decodeURI),De=e=>{let t=e.url,n=t.indexOf("/",t.indexOf(":")+4),r=n;for(;r<t.length;r++){let s=t.charCodeAt(r);if(s===37){let a=t.indexOf("?",r),i=t.indexOf("#",r),o=a===-1?i===-1?void 0:i:i===-1?a:Math.min(a,i),l=t.slice(n,o);return br(l.includes("%25")?l.replace(/%25/g,"%2525"):l)}else if(s===63||s===35)break}return t.slice(n,r)};var Et=e=>{let t=De(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},G=(e,t,...n)=>(n.length&&(t=G(t,...n)),`${e?.[0]==="/"?"":"/"}${e}${t==="/"?"":`${e?.at(-1)==="/"?"":"/"}${t?.[0]==="/"?t.slice(1):t}`}`),be=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;let t=e.split("/"),n=[],r="";return t.forEach(s=>{if(s!==""&&!/\:/.test(s))r+="/"+s;else if(/\:/.test(s))if(/\?/.test(s)){n.length===0&&r===""?n.push("/"):n.push(r);let a=s.replace("?","");r+="/"+a,n.push(r)}else r+="/"+s}),n.filter((s,a,i)=>i.indexOf(s)===a)},Le=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?te(e,le):e):e,At=(e,t,n)=>{let r;if(!n&&t&&!/[%+]/.test(t)){let i=e.indexOf("?",8);if(i===-1)return;for(e.startsWith(t,i+1)||(i=e.indexOf(`&${t}`,i+1));i!==-1;){let o=e.charCodeAt(i+t.length+1);if(o===61){let l=i+t.length+2,c=e.indexOf("&",l);return Le(e.slice(l,c===-1?void 0:c))}else if(o==38||isNaN(o))return"";i=e.indexOf(`&${t}`,i+1)}if(r=/[%+]/.test(e),!r)return}let s={};r??=/[%+]/.test(e);let a=e.indexOf("?",8);for(;a!==-1;){let i=e.indexOf("&",a+1),o=e.indexOf("=",a);o>i&&i!==-1&&(o=-1);let l=e.slice(a+1,o===-1?i===-1?void 0:i:o);if(r&&(l=Le(l)),a=i,l==="")continue;let c;o===-1?c="":(c=e.slice(o+1,i===-1?void 0:i),r&&(c=Le(c))),n?(s[l]&&Array.isArray(s[l])||(s[l]=[]),s[l].push(c)):s[l]??=c}return t?s[t]:s},_t=At,Rt=(e,t)=>At(e,t,!0),le=decodeURIComponent;var St=e=>te(e,le),ge=class{raw;#t;#e;routeIndex=0;path;bodyCache={};constructor(e,t="/",n=[[]]){this.raw=e,this.path=t,this.#e=n,this.#t={}}param(e){return e?this.#n(e):this.#a()}#n(e){let t=this.#e[0][this.routeIndex][1][e],n=this.#s(t);return n&&/\%/.test(n)?St(n):n}#a(){let e={},t=Object.keys(this.#e[0][this.routeIndex][1]);for(let n of t){let r=this.#s(this.#e[0][this.routeIndex][1][n]);r!==void 0&&(e[n]=/\%/.test(r)?St(r):r)}return e}#s(e){return this.#e[1]?this.#e[1][e]:e}query(e){return _t(this.url,e)}queries(e){return Rt(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;let t={};return this.raw.headers.forEach((n,r)=>{t[r]=n}),t}async parseBody(e){return xt(this,e)}#r=e=>{let{bodyCache:t,raw:n}=this,r=t[e];if(r)return r;let s=Object.keys(t)[0];return s?t[s].then(a=>(s==="json"&&(a=JSON.stringify(a)),new Response(a)[e]())):t[e]=n[e]()};json(){return this.#r("text").then(e=>JSON.parse(e))}text(){return this.#r("text")}arrayBuffer(){return this.#r("arrayBuffer")}bytes(){return this.#r("arrayBuffer").then(e=>new Uint8Array(e))}blob(){return this.#r("blob")}formData(){return this.#r("formData")}addValidatedData(e,t){this.#t[e]=t}valid(e){return this.#t[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[vt](){return this.#e}get matchedRoutes(){return this.#e[0].map(([[,e]])=>e)}get routePath(){return this.#e[0].map(([[,e]])=>e)[this.routeIndex].path}};var Tt={Stringify:1,BeforeStream:2,Stream:3},vr=(e,t)=>{let n=new String(e);return n.isEscaped=!0,n.callbacks=t,n};var Be=async(e,t,n,r,s)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));let a=e.callbacks;if(!a?.length)return Promise.resolve(e);s?s[0]+=e:s=[e];let i=Promise.all(a.map(o=>o({phase:t,buffer:s,context:r}))).then(o=>Promise.all(o.filter(Boolean).map(l=>Be(l,t,!1,r,s))).then(()=>s[0]));return n?vr(await i,a):i};var xr="text/plain; charset=UTF-8",Ue=(e,t)=>({"Content-Type":e,...t}),ce=(e,t)=>new Response(e,t),qe=class{#t;#e;env={};#n;finalized=!1;error;#a;#s;#r;#d;#l;#c;#i;#u;#p;constructor(e,t){this.#t=e,t&&(this.#s=t.executionCtx,this.env=t.env,this.#c=t.notFoundHandler,this.#p=t.path,this.#u=t.matchResult)}get req(){return this.#e??=new ge(this.#t,this.#p,this.#u),this.#e}get event(){if(this.#s&&"respondWith"in this.#s)return this.#s;throw Error("This context has no FetchEvent")}get executionCtx(){if(this.#s)return this.#s;throw Error("This context has no ExecutionContext")}get res(){return this.#r||=ce(null,{headers:this.#i??=new Headers})}set res(e){if(this.#r&&e){e=ce(e.body,e);for(let[t,n]of this.#r.headers.entries())if(t!=="content-type")if(t==="set-cookie"){let r=this.#r.headers.getSetCookie();e.headers.delete("set-cookie");for(let s of r)e.headers.append("set-cookie",s)}else e.headers.set(t,n)}this.#r=e,this.finalized=!0}render=(...e)=>(this.#l??=t=>this.html(t),this.#l(...e));setLayout=e=>this.#d=e;getLayout=()=>this.#d;setRenderer=e=>{this.#l=e};header=(e,t,n)=>{this.finalized&&(this.#r=ce(this.#r.body,this.#r));let r=this.#r?this.#r.headers:this.#i??=new Headers;t===void 0?r.delete(e):n?.append?r.append(e,t):r.set(e,t)};status=e=>{this.#a=e};set=(e,t)=>{this.#n??=new Map,this.#n.set(e,t)};get=e=>this.#n?this.#n.get(e):void 0;get var(){return this.#n?Object.fromEntries(this.#n):{}}#o(e,t,n){let r=this.#r?new Headers(this.#r.headers):this.#i??new Headers;if(typeof t=="object"&&"headers"in t){let a=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(let[i,o]of a)i.toLowerCase()==="set-cookie"?r.append(i,o):r.set(i,o)}if(n)for(let[a,i]of Object.entries(n))if(typeof i=="string")r.set(a,i);else{r.delete(a);for(let o of i)r.append(a,o)}let s=typeof t=="number"?t:t?.status??this.#a;return ce(e,{status:s,headers:r})}newResponse=(...e)=>this.#o(...e);body=(e,t,n)=>this.#o(e,t,n);text=(e,t,n)=>!this.#i&&!this.#a&&!t&&!n&&!this.finalized?new Response(e):this.#o(e,t,Ue(xr,n));json=(e,t,n)=>this.#o(JSON.stringify(e),t,Ue("application/json",n));html=(e,t,n)=>{let r=s=>this.#o(s,t,Ue("text/html; charset=UTF-8",n));return typeof e=="object"?Be(e,Tt.Stringify,!1,{}).then(r):r(e)};redirect=(e,t)=>{let n=String(e);return this.header("Location",/[^\x00-\xFF]/.test(n)?encodeURI(n):n),this.newResponse(null,t??302)};notFound=()=>(this.#c??=()=>ce(),this.#c(this))};var j="ALL",Pt="all",It=["get","post","put","delete","options","patch"],ve="Can not add a route since the matcher is already built.",xe=class extends Error{};var Ct="__COMPOSED_HANDLER";var wr=e=>e.text("404 Not Found",404),Ot=(e,t)=>{if("getResponse"in e){let n=e.getResponse();return t.newResponse(n.body,n)}return console.error(e),t.text("Internal Server Error",500)},$t=class Kt{get;post;put;delete;options;patch;all;on;use;router;getPath;_basePath="/";#t="/";routes=[];constructor(t={}){[...It,Pt].forEach(a=>{this[a]=(i,...o)=>(typeof i=="string"?this.#t=i:this.#a(a,this.#t,i),o.forEach(l=>{this.#a(a,this.#t,l)}),this)}),this.on=(a,i,...o)=>{for(let l of[i].flat()){this.#t=l;for(let c of[a].flat())o.map(d=>{this.#a(c.toUpperCase(),this.#t,d)})}return this},this.use=(a,...i)=>(typeof a=="string"?this.#t=a:(this.#t="*",i.unshift(a)),i.forEach(o=>{this.#a(j,this.#t,o)}),this);let{strict:r,...s}=t;Object.assign(this,s),this.getPath=r??!0?t.getPath??De:Et}#e(){let t=new Kt({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,t.#n=this.#n,t.routes=this.routes,t}#n=wr;errorHandler=Ot;route(t,n){let r=this.basePath(t);return n.routes.map(s=>{let a;n.errorHandler===Ot?a=s.handler:(a=async(i,o)=>(await Ne([],n.errorHandler)(i,()=>s.handler(i,o))).res,a[Ct]=s.handler),r.#a(s.method,s.path,a,s.basePath)}),this}basePath(t){let n=this.#e();return n._basePath=G(this._basePath,t),n}onError=t=>(this.errorHandler=t,this);notFound=t=>(this.#n=t,this);mount(t,n,r){let s,a;r&&(typeof r=="function"?a=r:(a=r.optionHandler,r.replaceRequest===!1?s=l=>l:s=r.replaceRequest));let i=a?l=>{let c=a(l);return Array.isArray(c)?c:[c]}:l=>{let c;try{c=l.executionCtx}catch{}return[l.env,c]};s||=(()=>{let l=G(this._basePath,t),c=l==="/"?0:l.length;return d=>{let u=new URL(d.url);return u.pathname=this.getPath(d).slice(c)||"/",new Request(u,d)}})();let o=async(l,c)=>{let d=await n(s(l.req.raw),...i(l));if(d)return d;await c()};return this.#a(j,G(t,"*"),o),this}#a(t,n,r,s){t=t.toUpperCase(),n=G(this._basePath,n);let a={basePath:s!==void 0?G(this._basePath,s):this._basePath,path:n,method:t,handler:r};this.router.add(t,n,[r,a]),this.routes.push(a)}#s(t,n){if(t instanceof Error)return this.errorHandler(t,n);throw t}#r(t,n,r,s){if(s==="HEAD")return(async()=>new Response(null,await this.#r(t,n,r,"GET")))();let a=this.getPath(t,{env:r}),i=this.router.match(s,a),o=new qe(t,{path:a,matchResult:i,env:r,executionCtx:n,notFoundHandler:this.#n});if(i[0].length===1){let c;try{c=i[0][0][0][0](o,async()=>{o.res=await this.#n(o)})}catch(d){return this.#s(d,o)}return c instanceof Promise?c.then(d=>d||(o.finalized?o.res:this.#n(o))).catch(d=>this.#s(d,o)):c??this.#n(o)}let l=Ne(i[0],this.errorHandler,this.#n);return(async()=>{try{let c=await l(o);if(!c.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return c.res}catch(c){return this.#s(c,o)}})()}fetch=(t,...n)=>this.#r(t,n[1],n[0],t.method);request=(t,n,r,s)=>t instanceof Request?this.fetch(n?new Request(t,n):t,r,s):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${G("/",t)}`,n),r,s));fire=()=>{addEventListener("fetch",t=>{t.respondWith(this.#r(t.request,t,void 0,t.request.method))})}};var we=[];function ze(e,t){let n=this.buildAllMatchers(),r=((s,a)=>{let i=n[s]||n[j],o=i[2][a];if(o)return o;let l=a.match(i[0]);if(!l)return[[],we];let c=l.indexOf("",1);return[i[1][c],l]});return this.match=r,r(e,t)}var ke="[^/]+",de=".*",ue="(?:|/.*)",X=Symbol(),kr=new Set(".\\+*[^]$()");function Er(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===de||e===ue?1:t===de||t===ue?-1:e===ke?1:t===ke?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var jt=class Fe{#t;#e;#n=Object.create(null);insert(t,n,r,s,a){if(t.length===0){if(this.#t!==void 0)throw X;if(a)return;this.#t=n;return}let[i,...o]=t,l=i==="*"?o.length===0?["","",de]:["","",ke]:i==="/*"?["","",ue]:i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/),c;if(l){let d=l[1],u=l[2]||ke;if(d&&l[2]&&(u===".*"||(u=u.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(u))))throw X;if(c=this.#n[u],!c){if(Object.keys(this.#n).some(v=>v!==de&&v!==ue))throw X;if(a)return;c=this.#n[u]=new Fe,d!==""&&(c.#e=s.varIndex++)}!a&&d!==""&&r.push([d,c.#e])}else if(c=this.#n[i],!c){if(Object.keys(this.#n).some(d=>d.length>1&&d!==de&&d!==ue))throw X;if(a)return;c=this.#n[i]=new Fe}c.insert(o,n,r,s,a)}buildRegExpStr(){let n=Object.keys(this.#n).sort(Er).map(r=>{let s=this.#n[r];return(typeof s.#e=="number"?`(${r})@${s.#e}`:kr.has(r)?`\\${r}`:r)+s.buildRegExpStr()});return typeof this.#t=="number"&&n.unshift(`#${this.#t}`),n.length===0?"":n.length===1?n[0]:"(?:"+n.join("|")+")"}};var Mt=class{#t={varIndex:0};#e=new jt;insert(e,t,n){let r=[],s=[];for(let i=0;;){let o=!1;if(e=e.replace(/\{[^}]+\}/g,l=>{let c=`@\\${i}`;return s[i]=[c,l],i++,o=!0,c}),!o)break}let a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let i=s.length-1;i>=0;i--){let[o]=s[i];for(let l=a.length-1;l>=0;l--)if(a[l].indexOf(o)!==-1){a[l]=a[l].replace(o,s[i][1]);break}}return this.#e.insert(a,t,r,this.#t,n),r}buildRegExp(){let e=this.#e.buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0,n=[],r=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(s,a,i)=>a!==void 0?(n[++t]=Number(a),"$()"):(i!==void 0&&(r[Number(i)]=++t),"")),[new RegExp(`^${e}`),n,r]}};var Ar=[/^$/,[],Object.create(null)],Nt=Object.create(null);function Lt(e){return Nt[e]??=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,n)=>n?`\\${n}`:"(?:|/.*)")}$`)}function _r(){Nt=Object.create(null)}function Rr(e){let t=new Mt,n=[];if(e.length===0)return Ar;let r=e.map(c=>[!/\*|\/:/.test(c[0]),...c]).sort(([c,d],[u,v])=>c?1:u?-1:d.length-v.length),s=Object.create(null);for(let c=0,d=-1,u=r.length;c<u;c++){let[v,w,S]=r[c];v?s[w]=[S.map(([y])=>[y,Object.create(null)]),we]:d++;let h;try{h=t.insert(w,d,v)}catch(y){throw y===X?new xe(w):y}v||(n[d]=S.map(([y,g])=>{let A=Object.create(null);for(g-=1;g>=0;g--){let[b,E]=h[g];A[b]=E}return[y,A]}))}let[a,i,o]=t.buildRegExp();for(let c=0,d=n.length;c<d;c++)for(let u=0,v=n[c].length;u<v;u++){let w=n[c][u]?.[1];if(!w)continue;let S=Object.keys(w);for(let h=0,y=S.length;h<y;h++)w[S[h]]=o[w[S[h]]]}let l=[];for(let c in i)l[c]=n[i[c]];return[a,l,s]}function ne(e,t){if(e){for(let n of Object.keys(e).sort((r,s)=>s.length-r.length))if(Lt(n).test(t))return[...e[n]]}}var Ee=class{name="RegExpRouter";#t;#e;constructor(){this.#t={[j]:Object.create(null)},this.#e={[j]:Object.create(null)}}add(e,t,n){let r=this.#t,s=this.#e;if(!r||!s)throw new Error(ve);r[e]||[r,s].forEach(o=>{o[e]=Object.create(null),Object.keys(o[j]).forEach(l=>{o[e][l]=[...o[j][l]]})}),t==="/*"&&(t="*");let a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){let o=Lt(t);e===j?Object.keys(r).forEach(l=>{r[l][t]||=ne(r[l],t)||ne(r[j],t)||[]}):r[e][t]||=ne(r[e],t)||ne(r[j],t)||[],Object.keys(r).forEach(l=>{(e===j||e===l)&&Object.keys(r[l]).forEach(c=>{o.test(c)&&r[l][c].push([n,a])})}),Object.keys(s).forEach(l=>{(e===j||e===l)&&Object.keys(s[l]).forEach(c=>o.test(c)&&s[l][c].push([n,a]))});return}let i=be(t)||[t];for(let o=0,l=i.length;o<l;o++){let c=i[o];Object.keys(s).forEach(d=>{(e===j||e===d)&&(s[d][c]||=[...ne(r[d],c)||ne(r[j],c)||[]],s[d][c].push([n,a-l+o+1]))})}}match=ze;buildAllMatchers(){let e=Object.create(null);return Object.keys(this.#e).concat(Object.keys(this.#t)).forEach(t=>{e[t]||=this.#n(t)}),this.#t=this.#e=void 0,_r(),e}#n(e){let t=[],n=e===j;return[this.#t,this.#e].forEach(r=>{let s=r[e]?Object.keys(r[e]).map(a=>[a,r[e][a]]):[];s.length!==0?(n||=!0,t.push(...s)):e!==j&&t.push(...Object.keys(r[j]).map(a=>[a,r[j][a]]))}),n?Rr(t):null}};var Je=class{name="SmartRouter";#t=[];#e=[];constructor(e){this.#t=e.routers}add(e,t,n){if(!this.#e)throw new Error(ve);this.#e.push([e,t,n])}match(e,t){if(!this.#e)throw new Error("Fatal error");let n=this.#t,r=this.#e,s=n.length,a=0,i;for(;a<s;a++){let o=n[a];try{for(let l=0,c=r.length;l<c;l++)o.add(...r[l]);i=o.match(e,t)}catch(l){if(l instanceof xe)continue;throw l}this.match=o.match.bind(o),this.#t=[o],this.#e=void 0;break}if(a===s)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,i}get activeRouter(){if(this.#e||this.#t.length!==1)throw new Error("No active router has been determined yet.");return this.#t[0]}};var pe=Object.create(null),Sr=e=>{for(let t in e)return!0;return!1},Ht=class Dt{#t;#e;#n;#a=0;#s=pe;constructor(t,n,r){if(this.#e=r||Object.create(null),this.#t=[],t&&n){let s=Object.create(null);s[t]={handler:n,possibleKeys:[],score:0},this.#t=[s]}this.#n=[]}insert(t,n,r){this.#a=++this.#a;let s=this,a=wt(n),i=[];for(let o=0,l=a.length;o<l;o++){let c=a[o],d=a[o+1],u=kt(c,d),v=Array.isArray(u)?u[0]:c;if(v in s.#e){s=s.#e[v],u&&i.push(u[1]);continue}s.#e[v]=new Dt,u&&(s.#n.push(u),i.push(u[1])),s=s.#e[v]}return s.#t.push({[t]:{handler:r,possibleKeys:i.filter((o,l,c)=>c.indexOf(o)===l),score:this.#a}}),s}#r(t,n,r,s,a){for(let i=0,o=n.#t.length;i<o;i++){let l=n.#t[i],c=l[r]||l[j],d={};if(c!==void 0&&(c.params=Object.create(null),t.push(c),s!==pe||a&&a!==pe))for(let u=0,v=c.possibleKeys.length;u<v;u++){let w=c.possibleKeys[u],S=d[c.score];c.params[w]=a?.[w]&&!S?a[w]:s[w]??a?.[w],d[c.score]=!0}}}search(t,n){let r=[];this.#s=pe;let a=[this],i=He(n),o=[],l=i.length,c=null;for(let d=0;d<l;d++){let u=i[d],v=d===l-1,w=[];for(let h=0,y=a.length;h<y;h++){let g=a[h],A=g.#e[u];A&&(A.#s=g.#s,v?(A.#e["*"]&&this.#r(r,A.#e["*"],t,g.#s),this.#r(r,A,t,g.#s)):w.push(A));for(let b=0,E=g.#n.length;b<E;b++){let I=g.#n[b],T=g.#s===pe?{}:{...g.#s};if(I==="*"){let p=g.#e["*"];p&&(this.#r(r,p,t,g.#s),p.#s=T,w.push(p));continue}let[M,C,P]=I;if(!u&&!(P instanceof RegExp))continue;let _=g.#e[M];if(P instanceof RegExp){if(c===null){c=new Array(l);let k=n[0]==="/"?1:0;for(let f=0;f<l;f++)c[f]=k,k+=i[f].length+1}let p=n.substring(c[d]),m=P.exec(p);if(m){if(T[C]=m[0],this.#r(r,_,t,g.#s,T),Sr(_.#e)){_.#s=T;let k=m[0].match(/\//)?.length??0;(o[k]||=[]).push(_)}continue}}(P===!0||P.test(u))&&(T[C]=u,v?(this.#r(r,_,t,T,g.#s),_.#e["*"]&&this.#r(r,_.#e["*"],t,T,g.#s)):(_.#s=T,w.push(_)))}}let S=o.shift();a=S?w.concat(S):w}return r.length>1&&r.sort((d,u)=>d.score-u.score),[r.map(({handler:d,params:u})=>[d,u])]}};var We=class{name="TrieRouter";#t;constructor(){this.#t=new Ht}add(e,t,n){let r=be(t);if(r){for(let s=0,a=r.length;s<a;s++)this.#t.insert(e,r[s],n);return}this.#t.insert(e,t,n)}match(e,t){return this.#t.search(e,t)}};var Ve=class extends $t{constructor(e={}){super(e),this.router=e.router??new Je({routers:[new Ee,new We]})}};var Bt=e=>{let t={origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[],...e},n=(s=>typeof s=="string"?s==="*"?()=>s:a=>s===a?a:null:typeof s=="function"?s:a=>s.includes(a)?a:null)(t.origin),r=(s=>typeof s=="function"?s:Array.isArray(s)?()=>s:()=>[])(t.allowMethods);return async function(a,i){function o(c,d){a.res.headers.set(c,d)}let l=await n(a.req.header("origin")||"",a);if(l&&o("Access-Control-Allow-Origin",l),t.credentials&&o("Access-Control-Allow-Credentials","true"),t.exposeHeaders?.length&&o("Access-Control-Expose-Headers",t.exposeHeaders.join(",")),a.req.method==="OPTIONS"){t.origin!=="*"&&o("Vary","Origin"),t.maxAge!=null&&o("Access-Control-Max-Age",t.maxAge.toString());let c=await r(a.req.header("origin")||"",a);c.length&&o("Access-Control-Allow-Methods",c.join(","));let d=t.allowHeaders;if(!d?.length){let u=a.req.header("Access-Control-Request-Headers");u&&(d=u.split(/\s*,\s*/))}return d?.length&&(o("Access-Control-Allow-Headers",d.join(",")),a.res.headers.append("Vary","Access-Control-Request-Headers")),a.res.headers.delete("Content-Length"),a.res.headers.delete("Content-Type"),new Response(null,{headers:a.res.headers,status:204,statusText:"No Content"})}await i(),t.origin!=="*"&&a.header("Vary","Origin",{append:!0})}};var qt=/^[\w!#$%&'*.^`|~+-]+$/,Tr=/^[ !#-:<-[\]-~]*$/,Ut=e=>{let t=0,n=e.length;for(;t<n;){let r=e.charCodeAt(t);if(r!==32&&r!==9)break;t++}for(;n>t;){let r=e.charCodeAt(n-1);if(r!==32&&r!==9)break;n--}return t===0&&n===e.length?e:e.slice(t,n)},Ye=(e,t)=>{if(t&&e.indexOf(t)===-1)return{};let n=e.split(";"),r=Object.create(null);for(let s of n){let a=s.indexOf("=");if(a===-1)continue;let i=Ut(s.substring(0,a));if(t&&t!==i||!qt.test(i)||i in r)continue;let o=Ut(s.substring(a+1));if(o.startsWith('"')&&o.endsWith('"')&&(o=o.slice(1,-1)),Tr.test(o)&&(r[i]=o.indexOf("%")!==-1?te(o,le):o,t))break}return r};var Pr=(e,t,n={})=>{if(!qt.test(e))throw new Error("Invalid cookie name");let r=`${e}=${t}`;if(e.startsWith("__Secure-")&&!n.secure)throw new Error("__Secure- Cookie must have Secure attributes");if(e.startsWith("__Host-")){if(!n.secure)throw new Error("__Host- Cookie must have Secure attributes");if(n.path!=="/")throw new Error('__Host- Cookie must have Path attributes with "/"');if(n.domain)throw new Error("__Host- Cookie must not have Domain attributes")}for(let s of["domain","path","sameSite","priority"])if(n[s]&&/[;\r\n]/.test(n[s]))throw new Error(`${s} must not contain ";", "\\r", or "\\n"`);if(n&&typeof n.maxAge=="number"&&n.maxAge>=0){if(n.maxAge>3456e4)throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");r+=`; Max-Age=${n.maxAge|0}`}if(n.domain&&n.prefix!=="host"&&(r+=`; Domain=${n.domain}`),n.path&&(r+=`; Path=${n.path}`),n.expires){if(n.expires.getTime()-Date.now()>3456e7)throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");r+=`; Expires=${n.expires.toUTCString()}`}if(n.httpOnly&&(r+="; HttpOnly"),n.secure&&(r+="; Secure"),n.sameSite&&(r+=`; SameSite=${n.sameSite.charAt(0).toUpperCase()+n.sameSite.slice(1)}`),n.priority&&(r+=`; Priority=${n.priority.charAt(0).toUpperCase()+n.priority.slice(1)}`),n.partitioned){if(!n.secure)throw new Error("Partitioned Cookie must have Secure attributes");r+="; Partitioned"}return r},Ae=(e,t,n)=>(t=encodeURIComponent(t),Pr(e,t,n));var re=(e,t,n)=>{let r=e.req.raw.headers.get("Cookie");if(typeof t=="string"){if(!r)return;let a=t;return n==="secure"?a="__Secure-"+t:n==="host"&&(a="__Host-"+t),Ye(r,a)[a]}return r?Ye(r):{}};var Ir=(e,t,n)=>{let r;return n?.prefix==="secure"?r=Ae("__Secure-"+e,t,{path:"/",...n,secure:!0}):n?.prefix==="host"?r=Ae("__Host-"+e,t,{...n,path:"/",secure:!0,domain:void 0}):r=Ae(e,t,{path:"/",...n}),r},Ge=(e,t,n,r)=>{let s=Ir(t,n,r);e.header("Set-Cookie",s,{append:!0})};var Xe=(e,t,n)=>{let r=re(e,t,n?.prefix);return Ge(e,t,"",{...n,maxAge:0}),r};var F={title:"AI Gateway",subtitle:"统一的 AI 管理平台",author:"QingYun",authorUrl:"https://github.com/yutian81/ai-gateway",blogUrl:"https://blog.notett.com",description:"AI 提供商 API 代理网关 — 统一 /v1 接口转发",favicon:"https://pan.811520.xyz/icon/ai.webp",faCdn:"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"},Qe=10080*60,_e="sk_cf_",Re="https://opencode.ai/zen/v1",zt=300*1e3,Ze=5,N={PROVIDERS:"providers",PROXY_KEYS:"proxy:keys",SESSION_PREFIX:"admin:session:",KEY_HEALTH_PREFIX:"key:health:",OPENCODE_MIGRATION:"migration:opencode-default:v1"},Ft={"30d":720*60*60,"90d":2160*60*60,"180d":4320*60*60,"1y":365*24*60*60,forever:null},Jt=[{id:"opencode",name:"OpenCode",baseUrl:"https://opencode.ai/zen/v1",apiType:"openai",apiKeys:[],models:[{id:"deepseek-v4-flash-free",enabled:!0},{id:"mimo-v2.5-free",enabled:!0},{id:"nemotron-3-ultra-free",enabled:!0},{id:"hy3-free",enabled:!0}],enabled:!0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];var Cr=60*1e3,et=new Map;function Or(e){let t=et.get(e);if(t){if(Date.now()>=t.expiresAt){et.delete(e);return}return t.value}}function Xt(e,t,n=Cr){et.set(e,{value:t,expiresAt:Date.now()+n})}var Qt={[N.PROXY_KEYS]:5*1e3},Zt=e=>typeof e=="object"&&e!==null&&!Array.isArray(e),Wt=e=>({...e,enabled:e.enabled===!0}),Vt=(e,t)=>e.map(n=>typeof n=="string"?{[t]:n,enabled:!0}:n).filter(Zt),$r=/^[A-Za-z0-9._-]+$/;function en(e,t){let n=t.filter(Zt);if(e===N.PROVIDERS){let r=[];for(let s of n){let a=Yt(s.id,"providers");a&&r.push({...s,id:a,name:String(s.name??""),baseUrl:typeof s.baseUrl=="string"?s.baseUrl:"",enabled:s.enabled===!0,models:Array.isArray(s.models)?Vt(s.models,"id").map(Wt):[],apiKeys:Array.isArray(s.apiKeys)?Vt(s.apiKeys,"key").map(i=>({...i,enabled:i.enabled===!0&&typeof i.key=="string"&&i.key.trim()!==""})):[]})}return r}if(e===N.PROXY_KEYS){let r=[];for(let s of n){let a=Yt(s.id,"转发 Key");a&&r.push(Wt({...s,id:a,key:String(s.key??""),name:String(s.name??"")}))}return r}return n}function Yt(e,t){if(typeof e!="string"&&typeof e!="number")return console.warn(`[storage] ${t} 条目缺少可用 id，已丢弃（无法寻址）`),null;let n=String(e).trim();if(!n)return console.warn(`[storage] ${t} 条目 id 为空，已丢弃（无法寻址）`),null;if($r.test(n))return n;let r=n.replace(/[^A-Za-z0-9._-]/g,"-");return console.warn(`[storage] ${t} 条目 id "${n}" 含非法字符，已归一为 "${r}"`),r}async function tn(e,t){let n=Or(t);if(n)return n;let r=await e.KV.get(t),s=[];if(r)try{let a=JSON.parse(r);Array.isArray(a)?s=en(t,a):console.warn(`[storage] KV 数据不是数组，已按空列表处理: ${t}`)}catch{console.warn(`[storage] KV 数据解析失败，已按空列表处理: ${t}`)}return Xt(t,s,Qt[t]),s}async function nn(e,t,n){let r=en(t,n);await e.KV.put(t,JSON.stringify(r)),Xt(t,r,Qt[t])}var Gt=new Map;function Q(e,t){let n=(Gt.get(e)??Promise.resolve()).then(t,t);return Gt.set(e,n.catch(()=>{})),n}async function B(e){return tn(e,N.PROVIDERS)}async function se(e,t){return(await B(e)).find(r=>r.id===t)??null}async function Se(e,t){await nn(e,N.PROVIDERS,t)}function rn(e,t){return Q(N.PROVIDERS,async()=>{let n=await B(e);return n.some(r=>r.id===t.id)?!1:(await Se(e,[...n,t]),!0)})}function sn(e,t,n){return Q(N.PROVIDERS,async()=>{let r=await B(e),s=r.findIndex(i=>i.id===t);if(s===-1)return null;let a={...r[s],...n,updatedAt:new Date().toISOString()};return await Se(e,r.map((i,o)=>o===s?a:i)),a})}function an(e,t){return Q(N.PROVIDERS,async()=>{let n=await B(e),r=n.filter(s=>s.id!==t);return r.length===n.length?!1:(await Se(e,r),!0)})}async function on(e,t,n){let r=crypto.randomUUID(),s={username:t,expiresAt:Date.now()+n*1e3};return await e.KV.put(N.SESSION_PREFIX+r,JSON.stringify(s),{expirationTtl:n}),r}async function Te(e,t){let n=await e.KV.get(N.SESSION_PREFIX+t);if(!n)return null;let r=null;try{let s=JSON.parse(n);s&&typeof s=="object"&&(r=s)}catch{}return!r||typeof r.expiresAt!="number"||r.expiresAt<Date.now()?(await tt(e,t),null):r}async function tt(e,t){await e.KV.delete(N.SESSION_PREFIX+t)}async function J(e){return tn(e,N.PROXY_KEYS)}async function nt(e,t){await nn(e,N.PROXY_KEYS,t)}function rt(e,t){return Q(N.PROXY_KEYS,async()=>{let n=await J(e);await nt(e,[...n,t])})}function ln(e,t){return Q(N.PROXY_KEYS,async()=>{let n=await J(e),r=n.filter(s=>s.id!==t);return r.length===n.length?!1:(await nt(e,r),!0)})}function cn(e,t,n){return Q(N.PROXY_KEYS,async()=>{let r=await J(e),s=r.findIndex(i=>i.id===t);if(s===-1)return null;let a={...r[s],...n};return await nt(e,r.map((i,o)=>o===s?a:i)),a})}async function dn(e,t){if(!t)return!1;let n=await J(e),r=Date.now();return n.some(s=>s.key!==t||!s.enabled?!1:s.expiresAt==null?!0:typeof s.expiresAt=="string"&&r<new Date(s.expiresAt).getTime())}async function un(e){let t=await B(e);if(t.some(s=>s.id==="opencode"))return;let n=await e.KV.get(N.OPENCODE_MIGRATION),r=Jt.find(s=>s.id==="opencode");n||(r&&!t.some(s=>s.id===r.id)&&await Q(N.PROVIDERS,()=>Se(e,[...t,{...r,apiKeys:r.apiKeys.map(s=>({...s})),models:r.models.map(s=>({...s}))}])),await e.KV.put(N.OPENCODE_MIGRATION,"1")),t.length===0&&!n&&(await J(e)).length===0&&await rt(e,{id:crypto.randomUUID(),key:`${_e}${crypto.randomUUID().replace(/-/g,"").substring(0,16)}`,name:"测试 Key",enabled:!0,createdAt:new Date().toISOString()})}async function Pe(e){let n=new TextEncoder().encode(e),r=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(r)).map(a=>a.toString(16).padStart(2,"0")).join("")}function pn(e,t){if(e.byteLength!==t.byteLength)return!1;let n=crypto.subtle;if(typeof n.timingSafeEqual=="function")return n.timingSafeEqual(e,t);let r=0;for(let s=0;s<e.byteLength;s++)r|=e[s]^t[s];return r===0}var Kr=5,jr=900*1e3,Mr=400,W=new Map;function Nr(e,t){let n=W.get(e);return!!n&&n.until>t&&n.count>=Kr}function fn(e,t){let n=W.get(e),r=n&&n.until>t?n.count+1:1;if(W.set(e,{count:r,until:t+jr}),W.size>1e3){for(let[s,a]of W)a.until<=t&&W.delete(s);for(let s of W.keys()){if(W.size<=1e3)break;W.delete(s)}}}async function hn(e,t){let n=re(e,"session_id"),r=e.req.path;return n?await Te(e.env,n)?t():(Xe(e,"session_id",{path:"/"}),r.startsWith("/admin/api/")?e.json({success:!1,message:"Session 已过期"},401):e.redirect("/admin/login")):r==="/admin/login"?t():r.startsWith("/admin/api/")?e.json({success:!1,message:"未登录"},401):e.redirect("/admin/login")}var mn=256,Lr=8*1024;async function gn(e){let t=await e.req.text();if(t.length>Lr)return e.json({success:!1,message:"请求体过大"},413);let n=null;try{n=JSON.parse(t)}catch{return e.json({success:!1,message:"请求体必须是合法的 JSON"},400)}let r=n&&typeof n=="object"?n:null,s=typeof r?.username=="string"?r.username:"",a=typeof r?.password=="string"?r.password:"",{ADMIN_USERNAME:i,ADMIN_PASSWORD:o}=e.env;if(!i||!o)return e.json({success:!1,message:"未配置管理员账号，请在 Cloudflare 环境变量中设置 ADMIN_USERNAME 和 ADMIN_PASSWORD"},503);let l=e.req.header("CF-Connecting-IP")||"unknown",c=Date.now();if(Nr(l,c))return e.json({success:!1,message:"登录失败次数过多，请 15 分钟后再试"},429);if(!s||!a)return e.json({success:!1,message:"请输入用户名和密码"},400);if(s.length>mn||a.length>mn)return fn(l,c),e.json({success:!1,message:"用户名或密码错误"},401);let d=new TextEncoder,[u,v,w,S]=await Promise.all([Pe(String(s)),Pe(String(i)),Pe(String(a)),Pe(String(o))]),h=pn(d.encode(u),d.encode(v)),y=pn(d.encode(w),d.encode(S));if(!h||!y)return fn(l,c),await new Promise(A=>setTimeout(A,Mr)),e.json({success:!1,message:"用户名或密码错误"},401);W.delete(l);let g=await on(e.env,s,Qe);return Ge(e,"session_id",g,{httpOnly:!0,secure:!0,sameSite:"Strict",path:"/",maxAge:Qe}),e.json({success:!0,message:"登录成功"})}async function yn(e){let t=re(e,"session_id");return t&&(await tt(e.env,t),Xe(e,"session_id",{path:"/"})),e.redirect("/")}async function bn(e,t){let n=e.req.header("Authorization"),r=n&&/^bearer\s+(.+)$/i.exec(n)?.[1];return r?await dn(e.env,r)?t():e.json({error:{message:"API Key 无效或已禁用",type:"authentication_error"}},401):e.json({error:{message:"缺少或无效的 Authorization 头，格式: Bearer sk_cf_*",type:"authentication_error"}},401)}async function st(e,t){let n=e.body?.getReader();if(!n)return new Uint8Array;let r=[],s=0;try{for(;;){let{done:o,value:l}=await n.read();if(o)break;if(s+=l.byteLength,s>t)return await n.cancel().catch(()=>{}),null;r.push(l)}}catch{}let a=new Uint8Array(s),i=0;for(let o of r)a.set(o,i),i+=o.byteLength;return a}async function vn(e,t){let n=await st(e,t);return n===null?null:new TextDecoder().decode(n)}function xn(e){return/^muse-[A-Za-z0-9.-]*-free$/.test(e)}function O(e){return e!==null&&typeof e=="object"&&!Array.isArray(e)?e:null}function at(e){if(typeof e=="string")return e;if(Array.isArray(e)){let t="";for(let n of e){let r=O(n);r&&(typeof r.text=="string"?t+=r.text:typeof r.content=="string"&&(t+=r.content))}return t}return""}var Hr=["minimal","low","medium","high","xhigh"],ot="(The model asked for a tool this session doesn't have.)",Dr=8*1024*1024,Ie=["bash","read"];function fe(e){return typeof e!="string"?!1:Ie.includes(e.toLowerCase())}function Br(e){let t=typeof e=="string"?e.trim().toLowerCase():"";return Hr.includes(t)?t:"low"}function wn(e){let t=Object.create(null);if(!Array.isArray(e.tools))return t;let n=e.tools,r=new Set(n.map(s=>{let a=O(s)?.function;return typeof a?.name=="string"?a.name:void 0}).filter(s=>typeof s=="string"));for(let s of Ie){if(r.has(s))continue;let a=n.find(i=>{let o=O(i)?.function;return typeof o?.name=="string"&&o.name.toLowerCase()===s});if(a){let i=O(a).function;t[s]=String(i.name),i.name=s,r.add(s)}}return t}function kn(e){let t={};typeof e.model=="string"&&e.model&&(t.model=e.model),e.stream===!0&&(t.stream=!0),e.temperature!==void 0&&(t.temperature=e.temperature),e.top_p!==void 0&&(t.top_p=e.top_p);for(let a of["max_tokens","max_completion_tokens"])if(e[a]!==void 0){let i=Math.floor(Number(e[a]));Number.isFinite(i)&&i>0&&(t.max_output_tokens=Math.max(i,16));break}let n=Array.isArray(e.messages)?e.messages:[],r=[],s="";for(let a of n){let i=O(a);if(!i)continue;let o=typeof i.role=="string"?i.role:"",l=at(i.content);switch(o){case"system":case"developer":s=s?`${s}

${l}`:l;break;case"user":r.push({role:"user",content:l});break;case"assistant":{if(l&&r.push({role:"assistant",content:l}),Array.isArray(i.tool_calls)){let c=i.tool_calls;for(let d of c){let u=O(d);if(!u)continue;let v=O(u.function),w=typeof v?.name=="string"?String(v.name):"";r.push({type:"function_call",call_id:u.id??"",name:w,arguments:typeof v?.arguments=="string"?v.arguments:""})}}break}case"tool":r.push({type:"function_call_output",call_id:i.tool_call_id??"",output:l});break}}if(t.input=r,s&&(t.instructions=s),Array.isArray(e.tools)&&(t.tools=e.tools.map(a=>{let i=O(a);if(!i)return a;let o=O(i.function);return o?{type:"function",name:o.name??"",description:o.description,parameters:o.parameters}:i})),O(e.tool_choice)){let a=O(e.tool_choice),i=O(a.function);i&&(t.tool_choice={type:"function",name:i.name??""})}else typeof e.tool_choice=="string"&&(t.tool_choice=e.tool_choice);return t.reasoning={effort:Br(e.reasoning_effort??e.reasoningEffort)},t}function En(e,t=!1,n={},r=new Set){let s=typeof e.model=="string"?e.model:"",a="",i=[];if(Array.isArray(e.output))for(let S of e.output){let h=O(S);if(h){if(h.type==="message"&&Array.isArray(h.content))for(let y of h.content){let g=O(y);g&&g.type==="output_text"&&typeof g.text=="string"&&(a+=g.text)}else if(h.type==="function_call"){let y=typeof h.name=="string"?h.name:"",g=y.toLowerCase();y&&(n[g]||n[y])&&(y=n[g]||n[y]),i.push({id:h.call_id??h.id??"",type:"function",function:{name:y,arguments:typeof h.arguments=="string"?h.arguments:""}})}}}let o=i.filter(S=>{let h=O(S.function)?.name;if(typeof h!="string")return!0;let y=h.toLowerCase();return n[y]||n[h]?!0:r.size>0?!r.has(y)&&!r.has(h):!(t&&fe(h))}),l=i.length>o.length,c="stop",d=O(e.incomplete_details);d&&d.reason==="max_output_tokens"&&(c="length"),o.length>0&&(c="tool_calls"),l&&o.length===0&&!a&&(c="stop");let u={role:"assistant"};o.length>0?(u.tool_calls=o,a&&(u.content=a)):l&&!a?u.content=ot:u.content=a;let v={id:e.id??"",object:"chat.completion",created:e.created_at??0,model:s,choices:[{index:0,message:u,finish_reason:c}]},w=O(e.usage);return w&&(v.usage={prompt_tokens:w.input_tokens??0,completion_tokens:w.output_tokens??0,total_tokens:w.total_tokens??0}),v}function V(e,t,n,r,s){let a={index:0,delta:n};r&&(a.finish_reason=r);let i={id:t,object:"chat.completion.chunk",model:e,choices:[a]};return s&&(i.usage=s),`data: ${JSON.stringify(i)}

`}function An(e,t=!1,n={},r=new Set){let s=new TextEncoder,a=new TextDecoder,i="",o=`chatcmpl-${Date.now().toString(16)}-${Math.random().toString(16).slice(2,8)}`,l=Object.create(null),c=new Set,d=0,u=!1,v=!1,w="",S="",h=Object.create(null),y=Object.create(null),g=new Set,A=p=>{if(!p)return!1;try{return JSON.parse(p),!0}catch{return!1}},b=()=>d>0&&Object.keys(l).every(p=>g.has(p)||A(h[p])),E=(p,m,k)=>{p.enqueue(s.encode(V(e,o,{tool_calls:[{index:m,function:{arguments:k}}]})))},I=p=>p||"{}",T=(p,m)=>{let k=h[p]??"";return m===k?"":m.startsWith(k)?m.slice(k.length):m},M=p=>{let m=p.toLowerCase(),k=!!(p&&(n[m]||n[p])),f=k?n[m]||n[p]:p,x=fe(f)&&!k&&(r.size>0?r.has(m)||r.has(f):t);return{name:f,isStub:x}},C=(p,m,k,f,x)=>{if(c.has(m)||typeof k!="string"||k==="")return null;let{name:L,isStub:q}=M(typeof k=="string"?k:"");if(q)return null;let H=l[m];H===void 0&&(H=d++,l[m]=H,p.enqueue(s.encode(V(e,o,{tool_calls:[{index:H,id:x,type:"function",function:{name:L,arguments:""}}]}))));let D=I(typeof f=="string"?f:""),U=T(m,D);return h[m]=D,A(D)&&g.add(m),U&&E(p,H,U),H},P=(p,m)=>{let k=typeof m.type=="string"?m.type:"";switch(k){case"response.output_text.delta":{let f=typeof m.delta=="string"?m.delta:"";if(f&&S&&w===S)break;f&&(v=!0,w+=f,p.enqueue(s.encode(V(e,o,{content:f}))));break}case"response.output_text.done":{let f=typeof m.text=="string"?m.text:"";if(!f||!f.startsWith(w))break;S=f;let x=f.slice(w.length);if(!x)break;v=!0,w=f,p.enqueue(s.encode(V(e,o,{content:x})));break}case"response.output_item.added":{let f=O(m.item);if(f&&f.type==="function_call"){let x=typeof f.id=="string"&&f.id?f.id:typeof f.call_id=="string"?f.call_id:"";if(!x||x in l)break;let{name:L,isStub:q}=M(typeof f.name=="string"?f.name:"");if(q){c.add(x),typeof f.call_id=="string"&&f.call_id&&c.add(f.call_id),delete y[x];break}let H=d++;l[x]=H,p.enqueue(s.encode(V(e,o,{tool_calls:[{index:H,id:f.call_id??x,type:"function",function:{name:L,arguments:""}}]})));let D=y[x];if(D!==void 0){delete y[x];let U=I(D.args),z=T(x,U);h[x]=U,A(U)&&g.add(x),z&&E(p,H,z)}}break}case"response.function_call_arguments.delta":{let f=typeof m.item_id=="string"?m.item_id:"";if(c.has(f)||g.has(f))break;let x=l[f];if(x===void 0)break;typeof m.delta=="string"&&m.delta&&(h[f]=(h[f]??"")+m.delta,p.enqueue(s.encode(V(e,o,{tool_calls:[{index:x,function:{arguments:m.delta}}]}))));break}case"response.output_item.done":case"response.function_call_arguments.done":{let f=O(m.item);if(f?.type==="message"&&!v&&Array.isArray(f.content)){for(let z of f.content){let K=O(z);K&&K.type==="output_text"&&typeof K.text=="string"&&K.text&&(v=!0,p.enqueue(s.encode(V(e,o,{content:K.text}))))}break}let x=typeof m.item_id=="string"&&m.item_id?m.item_id:typeof f?.id=="string"&&f.id?f.id:"",L=typeof m.arguments=="string"?m.arguments:typeof f?.arguments=="string"?f.arguments:"",q=typeof f?.name=="string"?f.name:"";if(x&&c.has(x))break;let H=x?l[x]:void 0;if(H===void 0){x&&(L||q)&&(y[x]={name:q,args:L});break}let D=L?I(L):h[x]||"{}",U=T(x,D);h[x]=D,U&&E(p,H,U),A(D)&&g.add(x);break}case"response.completed":case"response.incomplete":{let f=O(m.response),x=O(f?.usage),L=k==="response.incomplete",q=O(f?.incomplete_details)?.reason==="max_output_tokens";if(Array.isArray(f?.output))for(let z of f.output){let K=O(z);if(K){if(K.type==="function_call"){let oe=typeof K.id=="string"&&K.id?K.id:typeof K.call_id=="string"?K.call_id:"";if(!oe)continue;C(p,oe,K.name,K.arguments,typeof K.call_id=="string"&&K.call_id?K.call_id:oe)}else if(K.type==="message"&&!v&&Array.isArray(K.content))for(let oe of K.content){let ie=O(oe);ie&&ie.type==="output_text"&&typeof ie.text=="string"&&ie.text&&(v=!0,p.enqueue(s.encode(V(e,o,{content:ie.text}))))}}}for(let[z,K]of Object.entries(y))z in l||C(p,z,K.name,K.args,z);let H=d===0&&c.size>0&&!v,D=d>0?b()?"tool_calls":"length":H?"stop":L||q?"length":"stop",U=x?{prompt_tokens:x.input_tokens??0,completion_tokens:x.output_tokens??0,total_tokens:x.total_tokens??0}:void 0;p.enqueue(s.encode(V(e,o,{},D,U))),p.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}case"response.failed":case"error":{let f=O(m.error)||O(O(m.response)?.error)||O(m.response)||{},x=f.message??f.code??"",L=typeof x=="string"&&x?x:"上游推理失败";p.enqueue(s.encode(`data: ${JSON.stringify({error:{message:L,type:"upstream_error",code:"upstream_error"}})}

`)),p.enqueue(s.encode(`data: [DONE]

`)),u=!0;break}}},_=(p,m)=>{if(u)return;if(p.startsWith(":")){m.enqueue(s.encode(p+`

`));return}if(!p.startsWith("data: ")&&!p.startsWith("data:"))return;let k=p.startsWith("data: ")?p.slice(6).trim():p.slice(5).trim();if(!(!k||k==="[DONE]"))try{P(m,JSON.parse(k))}catch{}};return new TransformStream({transform(p,m){if(u)return;i+=a.decode(p,{stream:!0});let k;for(;(k=i.indexOf(`
`))>=0;){let f=i.slice(0,k).replace(/\r$/,"");if(i=i.slice(k+1),_(f,m),u)return}i.length>Dr&&m.error(new Error("上游 SSE 行超出缓冲上限"))},flush(p){if(!u&&((i.startsWith("data: ")||i.startsWith("data:"))&&_(i.replace(/\r$/,""),p),!u)){let m=d>0?b()?"tool_calls":"length":v?"length":"stop";p.enqueue(s.encode(V(e,o,{},m))),p.enqueue(s.encode(`data: [DONE]

`))}}})}var Ur="opencode",qr="1.18.31",_n=3e4;function Y(e){return e===Ur}function zr(e){return e.filter(t=>typeof t.id=="string"&&/^[A-Za-z0-9._:/-]+$/.test(t.id)&&(t.id==="big-pickle"||t.id.endsWith("-free")))}function Z(e){let n=(e.OPENCODE_MIRRORS_URL||"").split(/[\s,;]+/).map(r=>r.trim()).filter(Boolean);return[...new Set(n)]}function Fr(e,t){if(e.length===0)return[];let n=Math.floor(t()*e.length);return[...e.slice(n),...e.slice(0,n)]}function Rn(e,t,n=""){return`${e.replace(/\/+$/,"")}/${t.replace(/^\/+/,"")}${n}`}var Jr="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";function Wr(e){let t=new Uint8Array(e);return crypto.getRandomValues(t),t}function Vr(e){return Array.from(Wr(e),t=>Jr[t%62]).join("")}var Yr=/^ses_[0-9a-f]{12}[0-9A-Za-z]{14}$/,Sn=0,it=0;function dt(e,t=Date.now()){let n=1;e==="ses"&&(t===Sn?it+=1:(Sn=t,it=1),n=it);let r=BigInt(t)*0x1000n+BigInt(n),s=e==="ses"?~r:r,a=Array.from({length:6},(i,o)=>Number(s>>BigInt(40-8*o)&0xffn).toString(16).padStart(2,"0")).join("");return`${e}_${a}${Vr(14)}`}var ae=new Map;function Gr(e){let t=Date.now(),n=ae.get(e);if(n){if(n.expiresAt>t)return n.id;ae.delete(e)}let r=dt("ses",t);if(ae.set(e,{id:r,expiresAt:t+1800*1e3}),ae.size>1e3){let s=ae.keys().next().value;s&&ae.delete(s)}return r}function Xr(e){if(!e)return"";for(let t of["messages","input"]){let n=e[t];if(Array.isArray(n)){for(let r of n)if(r&&typeof r=="object"&&r.role==="user"){let s=at(r.content);if(s)return s}}}return""}function Qr(e,t){if(e&&Yr.test(e))return e;let n=Xr(t);return n?Gr(`opencode-session:${n}`):dt("ses")}function Zr(e,t,n){return new Headers({"Content-Type":"application/json",Authorization:`Bearer ${e}`,"User-Agent":`opencode/${qr}`,"x-opencode-client":"cli","x-opencode-project":"global","x-opencode-request":t,"x-opencode-session":n,"x-session-affinity":n,"X-Session-Id":n})}var Ce=Ie;function es(e){return{type:"function",function:{name:e,description:"Reserved for the host runtime; do not call it.",parameters:{type:"object",properties:{}}}}}function ts(e){let t=e.stream===!0,n={...e,stream:!0},s=[...Array.isArray(n.tools)?n.tools:[]],a=new Set(s.map(c=>{let d=c?.function;return typeof d?.name=="string"?d.name:void 0})),i=Object.create(null),o=new Set;for(let c of Ce){if(a.has(c))continue;let d=s.find(u=>{let v=u?.function;return typeof v?.name=="string"&&v.name.toLowerCase()===c});if(d){let u=d.function;i[c]=String(u.name),u.name=c,a.add(c);continue}s.push(es(c)),a.add(c),o.add(c)}n.tools=s;let l=Array.isArray(e.tools)?e.tools.length>0:!1;return!l&&n.tool_choice===void 0&&(n.tool_choice="none"),{body:n,clientWantsStream:t,stubOnly:!l,back:i,injectedStubs:o}}function ns(e){return{type:"function",name:e,description:"Reserved for the host runtime; do not call it.",parameters:{type:"object",properties:{}}}}function rs(e){let n=[...Array.isArray(e.tools)?e.tools:[]],r=new Set(n.map(s=>{let a=s!==null&&typeof s=="object"?s:null;return typeof a?.name=="string"?a.name:void 0}));for(let s of Ce)r.has(s)||n.push(ns(s));e.tools=n}function ss(e){let t=new Set;if(!Array.isArray(e.tools)){for(let s of Ce)t.add(s);return t}let n=e.tools,r=new Set(n.map(s=>{let a=(s!==null&&typeof s=="object"?s:null)?.function;return typeof a?.name=="string"?a.name:void 0}));for(let s of Ce){if(r.has(s))continue;n.some(i=>{let o=(i!==null&&typeof i=="object"?i:null)?.function;return typeof o?.name=="string"&&o.name.toLowerCase()===s})||t.add(s)}return t}function Cn(e){let t=e.indexOf(`

`),n=e.indexOf(`\r
\r
`);return t===-1&&n===-1?null:t!==-1&&(n===-1||t<n)?{index:t,length:2}:{index:n,length:4}}async function On(e,t,n=!1,r={},s=new Set){let a=await e.text(),i="",o="stop",l,c=[],d=[],u=new Map,v=a.replace(/\r\n/g,`
`).replace(/\r/g,`
`);e:for(let E of v.split(`

`))for(let I of E.split(`
`)){let T=I.trim();if(!T.startsWith("data:"))continue;let M=T.slice(5).trim();if(M==="[DONE]")break e;let C;try{C=JSON.parse(M)}catch{continue}let P=C.choices?.[0];if(P){let _=P.delta;if(_){typeof _.content=="string"&&(i+=_.content);let p=_.tool_calls;if(Array.isArray(p))for(let m of p){let k=m.index,f=typeof k=="number"?k:NaN,x;if(Number.isInteger(f)&&f>=0&&f<Pn)x=f;else{let H=typeof k=="string"?`s:${k}`:`n:${String(f)}`,D=u.get(H);x=D===void 0?Pn+u.size:D,u.set(H,x)}c[x]||(c[x]={id:`call_${x}`,type:"function",function:{name:"",arguments:""}},d[x]=""),typeof m.id=="string"&&m.id&&(c[x].id=m.id);let L=m.function??{},q=c[x].function;typeof L.name=="string"&&L.name&&(q.name=L.name),typeof L.arguments=="string"&&(d[x]+=L.arguments)}}typeof P.finish_reason=="string"&&P.finish_reason&&(o=P.finish_reason)}C.usage&&typeof C.usage=="object"&&(l=C.usage)}for(let E=0;E<c.length;E++){let I=c[E];if(!I)continue;let T=I.function,M=typeof T.name=="string"?T.name:"",C=M.toLowerCase();M&&(r[C]||r[M])&&(T.name=r[C]||r[M]),T.arguments=d[E]??""}let w=E=>{let I=E.toLowerCase();return!fe(E)||r[I]||r[E]?!1:s.size>0?s.has(I)||s.has(E):n},S=n||s.size>0,h=c.filter(E=>!!E),y=S?h.filter(E=>{let I=E.function??{},T=typeof I.name=="string"?I.name:"";return!w(T)}):h;(o==="tool_calls"||o==="stop")&&y.some(I=>{let T=I.function.arguments;return typeof T=="string"&&T!==""&&!os(T)})&&(o="length");let g=S&&h.length>y.length;g&&y.length===0&&o==="tool_calls"&&(o="stop");let A={role:"assistant",content:i===""?null:i};y.length>0?A.tool_calls=y:g&&i===""&&(A.content=ot,o="stop");let b={id:`chatcmpl-${Date.now().toString(36)}`,object:"chat.completion",created:Math.floor(Date.now()/1e3),model:t,choices:[{index:0,message:A,finish_reason:o}]};return l!==void 0&&(b.usage=l),new Response(JSON.stringify(b),{status:e.status,headers:{"Content-Type":"application/json"}})}function as(e={},t=new Set,n=!1){let r=new TextEncoder,s=new TextDecoder,a="",i=new Set,o=new Set,l=new Map,c=new Set,d=!1,u=(h,y)=>{let g;try{g=JSON.parse(h)}catch{return null}let A=g.choices?.[0];if(A){let b=A.delta;if(b&&typeof b=="object"){let I=b.tool_calls;if(Array.isArray(I)){let T=[];for(let M of I){let C=typeof M.index=="number"?M.index:-1,P=M.function??{},_=typeof P.name=="string"?P.name:"",p=_.toLowerCase(),m=fe(_);if(C>=0){if(o.add(C),m&&(e[p]||e[_]?P.name=e[p]||e[_]:(t.has(p)||t.has(_)||!n)&&i.add(C)),i.has(C)){l.delete(C);continue}if(!_&&!c.has(C)){let f=l.get(C);f?f.push(M):l.set(C,[M]);continue}c.add(C);let k=l.get(C);k&&(l.delete(C),T.push(...k))}else if(m){if(e[p]||e[_])P.name=e[p]||e[_];else if(t.has(p)||t.has(_)||!n)continue}C<0&&(d=!0),T.push(M)}T.length>0?b.tool_calls=T:delete b.tool_calls}}if(A.finish_reason==="tool_calls"&&!d&&o.size>0&&[...o].every(I=>i.has(I))&&(A.finish_reason="stop"),A.finish_reason&&S(y),(b&&typeof b=="object"?Object.keys(b):[]).length===0&&!A.finish_reason&&g.usage===void 0)return null}return JSON.stringify(g)},v=(h,y)=>{let g=y.trim();if(!g)return;if(!g.startsWith("data:")){h.enqueue(r.encode(`${g}
`));return}let A=g.slice(5).trim();if(A==="[DONE]"){h.enqueue(r.encode(`data: [DONE]

`));return}if(!A)return;let b=u(A,h);b!==null&&h.enqueue(r.encode(`data: ${b}

`))},w=(h,y)=>{let g=y.replace(/\r/g,"");if(!g.split(`
`).some(A=>A.trim().startsWith("data:"))){g.trim()&&h.enqueue(r.encode(`${g}

`));return}for(let A of g.split(`
`))v(h,A)},S=h=>{if(l.size===0)return;if(!n){l.clear();return}let y=[];for(let g of l.values())y.push(...g);l.clear(),h.enqueue(r.encode(`data: ${JSON.stringify({id:"chatcmpl-opencode-pending",object:"chat.completion.chunk",choices:[{index:0,delta:{tool_calls:y}}]})}

`))};return new TransformStream({transform(h,y){a+=s.decode(h,{stream:!0});let g;for(;(g=Cn(a))!==null;){let A=a.slice(0,g.index);a=a.slice(g.index+g.length),w(y,A)}a.length>$n&&y.error(new Error("上游 SSE 事件超出缓冲上限"))},flush(h){let y=a;a="",w(h,y),S(h)}})}var Tn=256*1024,$n=8*1024*1024,Pn=256;function os(e){try{return JSON.parse(e),!0}catch{return!1}}async function lt(e){let t=new Headers(e.headers);t.delete("content-encoding"),t.delete("content-length"),t.delete("transfer-encoding"),t.delete("connection");let n=await st(e,Tn);return n===null?(t.set("content-type","application/json; charset=utf-8"),{status:e.status,statusText:e.statusText,headers:t,body:new TextEncoder().encode(JSON.stringify({error:{message:`上游错误响应体过大(>${Tn} 字节), 已省略`}}))}):{status:e.status,statusText:e.statusText,headers:t,body:n}}function In(e){return new Response(e.body,{status:e.status,statusText:e.statusText,headers:e.headers})}function is(e){let t=e instanceof Error&&e.message?e.message:"OpenCode 上游请求失败";return new Response(JSON.stringify({error:{message:t,type:"proxy_error"}}),{status:502,headers:{"Content-Type":"application/json; charset=utf-8"}})}async function ct(e,t,n,r,s,a){let i=new AbortController,o=()=>i.abort(r.clientSignal?.reason);r.clientSignal?.aborted?i.abort(r.clientSignal.reason):r.clientSignal?.addEventListener("abort",o);let l=setTimeout(()=>i.abort(new Error(`OpenCode 上游 ${_n/1e3}s 内未返回响应头`)),_n),c;try{let d=Zr(n,s,a);r.modelHeader&&d.set("x-opencode-model",r.modelHeader),c=await e(t,{method:r.method,headers:d,body:r.method==="GET"||r.method==="HEAD"?void 0:r.body,signal:i.signal})}finally{clearTimeout(l),r.clientSignal?.removeEventListener("abort",o)}if(c.ok&&c.body&&(c.headers.get("content-type")||"").includes("text/event-stream")){let u=new Headers(c.headers);return u.delete("content-encoding"),u.delete("content-length"),new Response(c.body.pipeThrough(cs()),{status:c.status,statusText:c.statusText,headers:u})}return c}var ls=15e3;function cs(){let e=new TextEncoder,t=new TextDecoder,n="",r=null,s=a=>{r=setTimeout(()=>{try{a.enqueue(e.encode(`: keep-alive

`)),s(a)}catch{r=null}},ls)};return new TransformStream({start(a){s(a)},transform(a,i){n+=t.decode(a,{stream:!0});let o;for(;(o=Cn(n))!==null;){let l=n.slice(0,o.index+o.length);n=n.slice(o.index+o.length),i.enqueue(e.encode(l))}n.length>$n&&(i.enqueue(e.encode(n)),n="")},flush(a){r&&clearTimeout(r);let i=t.decode();n&&a.enqueue(e.encode(n)),i&&a.enqueue(e.encode(i))},cancel(){r&&(clearTimeout(r),r=null)}})}async function Oe(e){if(e.method==="POST"&&/(?:^|\/)chat\/completions$/.test(e.subPath)&&e.body)try{let t=JSON.parse(e.body),n=typeof t.model=="string"?t.model:"";if(n&&xn(n))return await ds(e,t,n)}catch{}return Kn(e)}async function ds(e,t,n){let r=wn(t),s=ss(t),a=kn(t);a.stream=!0,rs(a),a.tool_choice!==void 0&&a.tool_choice!=="auto"&&(a.tool_choice="auto");let i=!Array.isArray(t.tools)||t.tools.length===0,o=t.stream===!0,l=await Kn({...e,subPath:e.subPath.replace(/chat\/completions$/,"responses"),body:JSON.stringify(a),modelHeader:n});if(!l.ok)return l;if((l.headers.get("content-type")||"").includes("text/event-stream")&&l.body){let v=new Headers(l.headers);v.delete("content-encoding"),v.delete("content-length");let w=new Response(l.body.pipeThrough(An(n,o&&i,r,o?s:new Set)),{status:l.status,statusText:l.statusText,headers:v});return o?w:On(w,n,i,r,s)}let d=await l.text(),u;try{u=JSON.stringify(En(JSON.parse(d),i,r,s))}catch{return new Response(d,{status:l.status,statusText:l.statusText,headers:{"Content-Type":l.headers.get("content-type")||"text/plain; charset=utf-8"}})}return new Response(u,{status:l.status,statusText:l.statusText,headers:{"Content-Type":"application/json"}})}async function Kn(e){let t=e.fetcher??fetch,n=e.random??Math.random,r=null;if(e.method==="POST"&&typeof e.body=="string")try{let b=JSON.parse(e.body);b&&typeof b=="object"&&!Array.isArray(b)&&(r=b)}catch{}let s=dt("msg"),a=Qr(e.clientSessionId,r),i=null,o=null,l=null,c=e,d=!0,u="opencode",v=!1,w={},S=new Set;if(r&&Array.isArray(r.messages)){let b=ts(r);c={...e,body:JSON.stringify(b.body)},d=b.clientWantsStream,v=b.stubOnly,w=b.back,S=b.injectedStubs,typeof r.model=="string"&&r.model&&(u=r.model)}let h=b=>{let I=(b.headers.get("content-type")||"").includes("text/event-stream")&&!!b.body;if(!d&&I)return On(b,u,v,w,S);if(d&&(S.size>0||Object.keys(w).length>0)&&I){let T=new Headers(b.headers);return T.delete("content-encoding"),T.delete("content-length"),new Response(b.body.pipeThrough(as(w,S,v===!1)),{status:b.status,statusText:b.statusText,headers:T})}return b},y=e.apiKeys.filter(b=>b.enabled&&b.key),g=Rn(e.baseUrl,e.subPath,e.search);for(let b of y)try{let E=await ct(t,g,b.key,c,s,a);if(E.ok)return h(E);if(i=await lt(E),E.status<500&&E.status!==401&&E.status!==403&&E.status!==429)break}catch(E){l=E;break}for(let b of Fr(e.mirrorUrls,n))try{let E=await ct(t,Rn(b,e.subPath,e.search),"public",c,s,a);if(E.ok)return h(E);o=await lt(E)}catch(E){l=E}if(y.length===0||(i?.status===401||i?.status===403)&&!o)try{let b=await ct(t,g,"public",c,s,a);if(b.ok)return h(b);i=await lt(b)}catch(b){l=b}return i?In(i):o?In(o):is(l)}async function ut(e,t,n,r,s){let a=await Oe({baseUrl:e,apiKeys:t,mirrorUrls:r,method:"POST",subPath:"chat/completions",body:JSON.stringify({model:n,messages:[{role:"user",content:"hi"}],max_tokens:64}),fetcher:s});if(a.ok)return{success:!0,message:"连接成功",statusCode:a.status};let i=await a.text();return{success:!1,message:`HTTP ${a.status}: ${i.substring(0,200)}`,statusCode:a.status}}async function jn(e,t,n,r){let s=await Oe({baseUrl:e,apiKeys:t,mirrorUrls:n,method:"GET",subPath:"models",fetcher:r});if(!s.ok)return{success:!1,message:`HTTP ${s.status}: ${(await s.text()).substring(0,200)}`,statusCode:s.status};let a=await s.json();return{success:!0,message:"连接成功",statusCode:s.status,data:{...a,data:Array.isArray(a.data)?zr(a.data):[]}}}var $e=e=>N.KEY_HEALTH_PREFIX+e,us=60*1e3,ps=5e3,ft=new Map;function fs(e){let t=ft.get(e);if(t){if(Date.now()>=t.expiresAt){ft.delete(e);return}return t.value}}function mt(e,t,n=us){ft.set(e,{value:t,expiresAt:Date.now()+n})}var ms=3e4;async function hs(e,t,n,r=ms){let s=new AbortController,a=setTimeout(()=>s.abort(new Error(`上游在 ${r/1e3}s 内未返回响应头`)),r),i=()=>s.abort(n?.reason);n?.aborted?s.abort(n.reason):n?.addEventListener("abort",i);try{return await fetch(e,{...t,signal:s.signal})}finally{clearTimeout(a),n?.removeEventListener("abort",i)}}function ht(e){let t=Object.create(null);for(let[n,r]of Object.entries(e))t[n]={...r};return t}async function gs(e,t){let n=$e(t),r=fs(n);if(r)return ht(r);let s=null;try{s=await e.KV.get(n)}catch(i){return console.warn(`[proxy] key 健康状态读取失败，按全健康处理: ${i.message}`),mt(n,{},ps),{}}let a={};if(s)try{let i=JSON.parse(s);i&&typeof i=="object"&&(a=i)}catch{console.warn(`[proxy] key 健康数据损坏，已重置: ${n}`)}return mt(n,a),ht(a)}async function ys(e,t,n){let r=Object.create(null);for(let[s,a]of Object.entries(n))a.failures>0&&(r[s]=a);mt($e(t),ht(r)),Object.keys(r).length>0?await e.KV.put($e(t),JSON.stringify(r)):await e.KV.delete($e(t)).catch(()=>{})}async function Mn(e,t,n){try{await ys(e,t,n)}catch(r){console.warn(`[proxy] key 健康状态写入失败: ${r.message}`)}}var pt=e=>e>=400&&e<=599?e:502,Nn=64*1024;async function gt(e){let t=await vn(e,Nn);if(t===null)return{raw:`上游错误响应体过大（>${Nn/1024}KB），已忽略`,json:null};try{let n=JSON.parse(t);if(n&&typeof n=="object"&&!Array.isArray(n))return{raw:t,json:n}}catch{}return{raw:t,json:null}}function bs(e){let t=e.indexOf("/");return t===-1?null:{providerId:e.substring(0,t),modelId:e.substring(t+1)}}function Hn(e,t){let n={"Content-Type":"application/json"};return t==="anthropic"?(n["x-api-key"]=e,n["anthropic-version"]="2023-06-01"):n.Authorization=`Bearer ${e}`,n}function Ln(e,t){let n=!e[t],r=e[t]||{failures:0,lastFailed:!1};return r.failures++,r.lastFailed=!0,r.failures>=Ze?(r.demotedAt=Date.now(),e[t]=r,!0):(e[t]=r,n)}async function Dn(e,t,n,r){try{let i=`${e.replace(/\/+$/,"")}/${r==="anthropic"?"messages":"chat/completions"}`,o=await fetch(i,{method:"POST",headers:Hn(t,r),body:JSON.stringify({model:n,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});if(o.ok)return{success:!0,message:"连接成功",statusCode:o.status};let{raw:l,json:c}=await gt(o),d=c?.error?.message,u=typeof d=="string"&&d?d:l;return{success:!1,message:`HTTP ${o.status}: ${u.substring(0,200)}`,statusCode:o.status}}catch(s){return{success:!1,message:`连接失败: ${s.message?.substring(0,200)||"未知错误"}`}}}async function Bn(e){try{if(e.req.method==="GET"||e.req.method==="HEAD")return e.json({error:{message:"该端点仅支持 POST（GET 请求请使用 /v1/models）",type:"invalid_request_error"}},405);let t;try{t=await e.req.json()}catch{return e.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400)}if(!t||typeof t!="object")return e.json({error:{message:"请求体必须是 JSON 对象",type:"invalid_request_error"}},400);let n=t.model;if(!n||typeof n!="string")return e.json({error:{message:"缺少 model 参数",type:"invalid_request_error"}},400);let r=bs(n);if(!r)return e.json({error:{message:`模型格式错误 "${n}"，请使用 提供商ID/模型ID 格式`,type:"invalid_request_error"}},400);let{providerId:s,modelId:a}=r,i=await se(e.env,s);if(!i)return e.json({error:{message:`提供商 "${s}" 不存在`,type:"invalid_request_error"}},404);if(!i.enabled)return e.json({error:{message:`提供商 "${i.name}" 已禁用`,type:"provider_disabled"}},403);if(!i.baseUrl.trim())return e.json({error:{message:`提供商 "${i.name}" 未配置有效的 baseUrl`,type:"provider_misconfigured"}},502);let o=i.models.find(P=>P.id===a);if(!o)return e.json({error:{message:`模型 "${a}" 未在提供商 "${i.name}" 中配置`,type:"invalid_request_error"}},404);if(!o.enabled)return e.json({error:{message:`模型 "${a}" 已禁用`,type:"model_disabled"}},403);let l=i.apiKeys.filter(P=>P?.enabled),c={...t,model:a},d=new URL(e.req.url),u=d.pathname.replace(/^\/v1\/?/,"")||"chat/completions";if(Y(s)){let _=["x-opencode-session","x-session-affinity","x-session-id","session_id","session-id"].map(m=>e.req.header(m)?.trim()).find(Boolean),p=await Oe({baseUrl:i.baseUrl,apiKeys:l,method:e.req.method,subPath:u,search:d.search,body:JSON.stringify(c),mirrorUrls:Z(e.env),clientSessionId:_,clientSignal:e.req.raw.signal});return new Response(p.body,{status:p.status,statusText:p.statusText,headers:p.headers})}if(l.length===0)return e.json({error:{message:`提供商 "${i.name}" 未配置可用的 API Key`,type:"configuration_error"}},500);let w=`${i.baseUrl.replace(/\/+$/,"")}/${u}${d.search}`,S=await gs(e.env,s),h=!1,y=[],g=[],A=[],b=[];if(l.length===1)y.push(0);else{let P=Date.now();l.forEach((_,p)=>{let m=S[_.key];m?m.failures>=Ze?(m.demotedAt||(S[_.key]={...m,demotedAt:P},h=!0),(P-(m.demotedAt||P)>=zt?A:b).push(p)):m.lastFailed?g.push(p):y.push(p):y.push(p)})}for(let P=y.length-1;P>0;P--){let _=Math.floor(Math.random()*(P+1));[y[P],y[_]]=[y[_],y[P]]}let E=[...y,...g,...A];E.length===0&&b.length>0&&(E.push(...b),console.log(`[proxy] ${s}: all keys demoted, falling back to ${b.length} key(s)`)),(b.length>0||A.length>0)&&console.log(`[proxy] ${s}: ${b.length} key(s) demoted, ${A.length} key(s) on probation (cooldown expired)`);let I=null,T=!1,M=!1,C=async()=>{await I?.body?.cancel().catch(()=>{})};for(let P of E){let _=l[P].key;try{let p=await hs(w,{method:e.req.method,headers:Hn(_,i.apiType),body:JSON.stringify(c)},e.req.raw.signal);if(p.ok)return S[_]?.failures>0&&(delete S[_],h=!0),(h||T)&&await Mn(e.env,s,S),await C(),new Response(p.body,{status:p.status,headers:{"Content-Type":p.headers.get("Content-Type")||"application/json","Cache-Control":"no-store"}});if(p.status===429){await C(),I=p;continue}if(p.status===401||p.status===403||p.status>=500){Ln(S,_)&&(h=!0),T=!0,await C(),I=p;continue}await C();let{raw:m,json:k}=await gt(p),f=k?.error;if(f&&typeof f=="object"&&typeof f.message=="string")return e.json(k,pt(p.status));let x=m.trim(),L=k===null?x?m.substring(0,500):`上游返回 HTTP ${p.status}`:typeof k.message=="string"?k.message:typeof k.detail=="string"?k.detail:typeof f=="string"?f:`上游返回 HTTP ${p.status}`;return e.json({error:{message:L},...k?{upstream:k}:{}},pt(p.status))}catch(p){if(e.req.raw.signal.aborted){M=!0;break}let m=p;Ln(S,_)&&(h=!0),T=!0,await C(),console.error(`[proxy] Key 请求异常: ${m.message}`),I=new Response(JSON.stringify({error:{message:"上游请求异常",type:"proxy_error"}}),{status:502});continue}}if((h||T)&&await Mn(e.env,s,S),M)return await C(),new Response(JSON.stringify({error:{message:"客户端已断开连接",type:"client_closed_request"}}),{status:499,headers:{"Content-Type":"application/json"}});if(I){let P=I.status===429,{raw:_}=await gt(I);return e.json({error:{message:P?"所有 API Key 都被上游限流（HTTP 429），请稍后重试":`所有 API Key 已用完，最后一次错误: HTTP ${I.status}`,type:P?"rate_limited":"key_exhausted",detail:(_||"所有 API Key 均失败").substring(0,500)}},pt(I.status))}return e.json({error:{message:"没有可用的 API Key",type:"configuration_error"}},500)}catch(t){return console.error("[proxy] 转发内部错误:",t),e.json({error:{message:"网关内部错误，请稍后重试",type:"server_error"}},500)}}async function Un(e){let t=await B(e.env),n=Math.floor(Date.now()/1e3),r=t.filter(s=>s.enabled&&s.baseUrl.trim()!=="").flatMap(s=>s.models.filter(a=>a.enabled).map(a=>({id:`${s.id}/${a.id}`,provider:s.id,provider_name:s.name,object:"model",created:n,owned_by:s.id})));return e.json({object:"list",data:r})}var vs=new Set(["localhost","metadata","metadata.google.internal"]);function me(e){let t=/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(e);if(!t)return!1;let[n,r]=[Number(t[1]),Number(t[2])];return[n,r].some(s=>Number.isNaN(s))?!1:n===10||n===127||n===0||n===172&&r>=16&&r<=31||n===192&&r===168||n===169&&r===254||n===100&&r>=64&&r<=127||n>=224}function qn(e){let t=e.split(":");if(t.length!==2)return null;let n=parseInt(t[0],16),r=parseInt(t[1],16);return Number.isNaN(n)||Number.isNaN(r)?null:`${n>>8&255}.${n&255}.${r>>8&255}.${r&255}`}function xs(e){let t=e.replace(/^\[|\]$/g,"").toLowerCase();if(!t.includes(":"))return!1;if(t==="::1"||t==="::"||t==="0:0:0:0:0:0:0:1"||t==="0:0:0:0:0:0:0:0"||t.startsWith("fe")||t.startsWith("fc")||t.startsWith("fd")||t.startsWith("2002:")||t.startsWith("64:ff9b:"))return!0;if(t.startsWith("::ffff:")||t.startsWith("0:0:0:0:0:ffff:")){let n=t.replace(/^(0:0:0:0:0:ffff:|::ffff:)/,"");if(me(n))return!0;let r=qn(n);return r===null?!0:me(r)}if(t.startsWith("::")){let n=t.slice(2);if(n.includes("."))return me(n);let r=qn(n);if(r!==null)return me(r)}return!1}function he(e){if(typeof e!="string")return"url 格式无效";let t;try{t=new URL(e)}catch{return"url 格式无效"}if(t.protocol!=="https:")return"仅允许 https:// 上游地址";let n=t.hostname.toLowerCase().replace(/\.$/,"");return n?vs.has(n)||n.endsWith(".local")||n.endsWith(".internal")?"不允许访问内网主机":me(n)||xs(n)?"不允许访问私有/回环/链路本地地址":null:"url 缺少主机名"}function Ke(e,t){return Array.isArray(e)?e.map(n=>typeof n=="string"?t(n):n).filter(n=>typeof n=="object"&&n!==null):[]}function je(e){return Array.isArray(e)?e.some(t=>typeof t=="object"&&t!==null&&"enabled"in t&&typeof t.enabled!="boolean"):!1}function zn(e){return Array.isArray(e)?e.some(t=>{if(typeof t=="string")return t.trim()==="";if(typeof t!="object"||t===null||Array.isArray(t))return!1;let n=t;return n.enabled===!1?!1:!(typeof n.key=="string"&&n.key.trim()!=="")}):!1}var ws=/^[A-Za-z0-9._:/-]{1,128}$/;function Fn(e){if(!Array.isArray(e))return null;for(let t of e){let n=typeof t=="string"?t:t?.id;if(typeof n!="string"||!ws.test(n))return String(n??"")}return null}async function ee(e){let t=await e.req.json();return t!==null&&typeof t=="object"?t:{}}var Jn=e=>`模型 ID "${e.slice(0,64)}" 含非法字符，仅允许字母、数字与 . _ : / -`,Wn=e=>e==="openai"||e==="anthropic";async function Vn(e){let t=await B(e.env),n=await J(e.env),r=t.reduce((a,i)=>a+i.models.length,0),s=t.reduce((a,i)=>a+i.models.filter(o=>o.enabled).length,0);return e.json({success:!0,data:{providersCount:t.length,enabledProvidersCount:t.filter(a=>a.enabled).length,modelsCount:r,enabledModelsCount:s,proxyKeysCount:n.filter(a=>a.enabled).length,adminConfigured:!!(e.env.ADMIN_USERNAME&&e.env.ADMIN_PASSWORD),baseUrl:new URL(e.req.url).origin}})}async function Yn(e){let t=await B(e.env);return e.json({success:!0,data:t})}async function Gn(e){let t=await ee(e);if(t.id==="opencode"&&!t.baseUrl&&(t.baseUrl=Re),typeof t.id!="string"||typeof t.name!="string"||typeof t.baseUrl!="string"||!t.id||!t.name||!t.baseUrl)return e.json({success:!1,message:"id、name、baseUrl 为必填项且必须是字符串"},400);if(!/^[A-Za-z0-9._-]+$/.test(t.id))return e.json({success:!1,message:"提供商 id 只能包含字母、数字、点、下划线和连字符"},400);let n=he(t.baseUrl);if(n)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${n}`},400);if(t.models!==void 0&&!Array.isArray(t.models))return e.json({success:!1,message:"models 必须是数组"},400);if(t.apiKeys!==void 0&&!Array.isArray(t.apiKeys))return e.json({success:!1,message:"apiKeys 必须是数组"},400);if(zn(t.apiKeys))return e.json({success:!1,message:"apiKeys 条目必须包含非空的 key"},400);let r=Fn(t.models);if(r!==null)return e.json({success:!1,message:Jn(r)},400);if(t.apiType!==void 0&&!Wn(t.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);if(t.enabled!==void 0&&typeof t.enabled!="boolean")return e.json({success:!1,message:"enabled 必须是布尔值"},400);if(je(t.apiKeys)||je(t.models))return e.json({success:!1,message:"apiKeys/models 条目里的 enabled 必须是布尔值"},400);let s=new Date().toISOString(),a={id:t.id,name:t.name,baseUrl:t.baseUrl.replace(/\/+$/,""),apiType:t.apiType||"openai",apiKeys:Ke(t.apiKeys,i=>({key:i,enabled:!0})),models:t.models?Ke(t.models,i=>({id:i,enabled:!0})):[],enabled:t.enabled??!0,createdAt:s,updatedAt:s};return await rn(e.env,a)?e.json({success:!0,data:await se(e.env,a.id)??a},201):e.json({success:!1,message:`提供商 id "${t.id}" 已存在`},409)}async function Xn(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let n=await ee(e),r={};if(n.name!==void 0){if(typeof n.name!="string")return e.json({success:!1,message:"name 必须是字符串"},400);if(!n.name)return e.json({success:!1,message:"name 不能为空"},400);r.name=n.name}if(n.baseUrl!==void 0){let a=he(n.baseUrl);if(a)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${a}`},400);r.baseUrl=n.baseUrl.replace(/\/+$/,"")}if(n.models!==void 0&&!Array.isArray(n.models))return e.json({success:!1,message:"models 必须是数组"},400);if(n.apiKeys!==void 0&&!Array.isArray(n.apiKeys))return e.json({success:!1,message:"apiKeys 必须是数组"},400);if(zn(n.apiKeys))return e.json({success:!1,message:"apiKeys 条目必须包含非空的 key"},400);if(n.apiType!==void 0){if(!Wn(n.apiType))return e.json({success:!1,message:"apiType 只能是 'openai' 或 'anthropic'"},400);r.apiType=n.apiType}if(n.apiKeys!==void 0&&(r.apiKeys=Ke(n.apiKeys,a=>({key:a,enabled:!0}))),n.enabled!==void 0){if(typeof n.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);r.enabled=n.enabled}if(je(n.apiKeys)||je(n.models))return e.json({success:!1,message:"apiKeys/models 条目里的 enabled 必须是布尔值"},400);if(n.models!==void 0){let a=Fn(n.models);if(a!==null)return e.json({success:!1,message:Jn(a)},400);r.models=Ke(n.models,i=>({id:i,enabled:!0}))}let s=await sn(e.env,t,r);return s?e.json({success:!0,data:await se(e.env,t)??s}):e.json({success:!1,message:"提供商不存在"},404)}async function Qn(e){let t=e.req.param("id");return t?await an(e.env,t)?e.json({success:!0,message:"提供商已删除"}):e.json({success:!1,message:"提供商不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function Zn(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let{modelId:n}=await ee(e);if(!n)return e.json({success:!1,message:"modelId 为必填项"},400);let r=await se(e.env,t);if(!r)return e.json({success:!1,message:"提供商不存在"},404);let s=he(r.baseUrl);if(s)return e.json({success:!1,message:`提供商 baseUrl 不安全: ${s}`},400);let a=r.apiKeys.filter(l=>l?.enabled);if(!Y(r.id)&&a.length===0)return e.json({success:!1,message:"该提供商未配置可用的 API Key"},400);let i=Y(r.id)?await ut(r.baseUrl,a,n,Z(e.env)):await Dn(r.baseUrl,a[0].key,n,r.apiType);return r.models.find(l=>l.id===n)||(i.message=`${i.message?i.message+"；":""}提示：该模型尚未保存到提供商配置，点「保存」后才会生效`),e.json({success:!0,data:i})}function er(e,t){return t==="anthropic"?{"x-api-key":e,"anthropic-version":"2023-06-01"}:{Authorization:`Bearer ${e}`}}async function tr(e){let{url:t,apiKey:n,apiType:r,providerId:s}=await ee(e);if(!t||!n&&!(s&&Y(s)))return e.json({success:!1,message:"url 和 apiKey 为必填项"},400);let a=he(t);if(a)return e.json({success:!1,message:a},400);if(s&&Y(s)){if(!n&&Z(e.env).length===0)return e.json({success:!0,data:{success:!1,statusCode:0,message:"请先填写 API Key 或配置 OPENCODE_MIRRORS_URL 环境变量"}});let o=await jn(t,[{key:n,enabled:!0}],Z(e.env));return e.json({success:!0,data:{success:o.success,statusCode:o.statusCode||0,message:o.message,data:o.data}})}let i=t.replace(/\/+$/,"");try{let o=await fetch(`${i}/models`,{method:"GET",headers:er(n,r),signal:AbortSignal.timeout(15e3)}),l=null;if(o.ok)try{l=await o.json()}catch{}return e.json({success:!0,data:{success:o.ok,statusCode:o.status,data:l}})}catch(o){return e.json({success:!0,data:{success:!1,statusCode:0,message:o.message||"连接失败"}})}}async function nr(e){let{url:t,apiKey:n,apiType:r,model:s,providerId:a}=await ee(e);if(!t||!s||!n&&!Y(a||""))return e.json({success:!1,message:"url、apiKey、model 为必填项"},400);let i=he(t);if(i)return e.json({success:!1,message:i},400);if(a&&Y(a)){let d=await ut(t,n?[{key:n,enabled:!0}]:[],s,Z(e.env));return e.json({success:!0,data:{success:d.success,statusCode:d.statusCode||0,message:d.message}})}let o=t.replace(/\/+$/,""),l=r==="anthropic"?"messages":"chat/completions";try{let c=await fetch(`${o}/${l}`,{method:"POST",headers:{"Content-Type":"application/json",...er(n,r)},body:JSON.stringify({model:s,messages:[{role:"user",content:"hi"}],max_tokens:64}),signal:AbortSignal.timeout(15e3)});return e.json({success:!0,data:{success:c.ok,statusCode:c.status}})}catch(c){return e.json({success:!0,data:{success:!1,statusCode:0,message:c.message||"连接失败"}})}}async function rr(e){let n=(await J(e.env)).map(r=>{let s=String(r.key??"");return{...r,key:s.length>12?`${s.substring(0,8)}****${s.substring(s.length-4)}`:s}});return e.json({success:!0,data:n})}async function sr(e){let t=await ee(e);if(t.name!==void 0&&typeof t.name!="string")return e.json({success:!1,message:"name 必须是字符串"},400);let n=crypto.randomUUID(),r=crypto.randomUUID().replace(/-/g,""),s=`${_e}${r}`,a=t.expiresIn?Ft[t.expiresIn]:void 0,i=typeof a=="number"?new Date(Date.now()+a*1e3).toISOString():null,o={id:n,key:s,name:t.name||`Key-${new Date().toLocaleDateString()}`,enabled:!0,createdAt:new Date().toISOString(),expiresAt:i};return await rt(e.env,o),e.json({success:!0,data:o,message:"请立即保存此 Key，关闭后将不再显示"},201)}async function ar(e){let t=e.req.param("id");return t?await ln(e.env,t)?e.json({success:!0,message:"转发 Key 已删除"}):e.json({success:!1,message:"转发 Key 不存在"},404):e.json({success:!1,message:"缺少 id 参数"},400)}async function or(e){let t=e.req.param("id");if(!t)return e.json({success:!1,message:"缺少 id 参数"},400);let n=await ee(e),r={};if(n.enabled!==void 0){if(typeof n.enabled!="boolean")return e.json({success:!1,message:"enabled 必须为布尔值"},400);r.enabled=n.enabled}let s=await cn(e.env,t,r);return s?e.json({success:!0,data:s}):e.json({success:!1,message:"转发 Key 不存在"},404)}var ir=`
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
`;var ks="https://github.com/yutian81/ai-gateway";function yt(e){return`<footer class="site-footer">
  <div class="shell site-footer__inner">
    <span>© ${new Date().getFullYear()} <a class="site-footer__link" href="${ks}" target="_blank" rel="noreferrer">${e}</a></span>
    <span>Cloudflare Workers · Hono · KV</span>
  </div>
</footer>`}var lr=`
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
`;var R=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),bt=e=>`
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="oklch(98.5% 0.004 250)">
  <title>${e} — ${F.title}</title>
  <link rel="icon" href="${F.favicon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@400;500;600&amp;family=Space+Grotesk:wght@500;600&amp;display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${F.faCdn}">
  <style>${ir}</style>
</head>`;async function cr(e,t){let n=await B(e.env),s=`https://${e.req.header("host")||"localhost:8787"}/v1`,a=n.filter(l=>l.enabled),i=n.reduce((l,c)=>l+c.models.length,0),o=a.reduce((l,c)=>l+c.models.filter(d=>d.enabled).length,0);return e.html(`<!DOCTYPE html><html lang="zh-CN">
${bt("首页")}
<body class="site-page home-page">
<header class="topbar">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${F.title}</span>
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
        <code>${R(s)}</code>
        <button class="icon-btn copy-control" type="button" data-copy="${R(s)}" aria-label="复制 API 地址">
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
      <pre><code><span class="syntax-command">curl</span> ${R(s)}/chat/completions \\
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
      ${a.length?a.map(l=>{let c=l.models.filter(d=>d.enabled);return`<article class="provider-row" data-search="${R(`${l.name} ${l.id} ${c.map(d=>d.id).join(" ")}`.toLowerCase())}">
          <div class="provider-row__identity">
            <span class="provider-row__mark" aria-hidden="true">${R(l.name.charAt(0).toUpperCase()||"A")}</span>
            <div>
              <h3>${R(l.name)}</h3>
              <p><code>${R(l.id)}</code><span>${(l.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"} 兼容</span></p>
            </div>
          </div>
          <div class="provider-row__models">
            ${c.length?c.map(d=>{let u=`${l.id}/${d.id}`;return`<button class="model-token copy-control" type="button" data-copy="${R(u)}"><code>${R(u)}</code><i class="far fa-copy" aria-hidden="true"></i></button>`}).join(""):'<span class="empty-inline">暂无启用模型</span>'}
          </div>
          <span class="status-badge status-badge--on"><i aria-hidden="true"></i>已启用</span>
        </article>`}).join(""):`<div class="empty-state"><i class="fas fa-cubes" aria-hidden="true"></i><h3>尚无可用模型</h3><p>管理员启用提供商和模型后，它们会出现在这里。</p>${t?'<a class="btn btn-p" href="/admin">前往管理控制台</a>':""}</div>`}
    </div>
    <div id="search-empty" class="empty-state hd"><i class="fas fa-search" aria-hidden="true"></i><h3>没有匹配结果</h3><p>请尝试输入提供商名称、ID 或模型名称。</p></div>
  </section>
</main>

${yt(F.title)}

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
</body></html>`)}async function dr(e){return e.html(`<!DOCTYPE html><html lang="zh-CN">
${bt("登录")}
<body class="site-page auth-page">
<header class="topbar topbar--auth">
  <div class="shell topbar__inner">
    <a class="brand" href="/" aria-label="AI Gateway 首页">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span class="brand__name">${F.title}</span>
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
</body></html>`)}function Es(e,t,n){let r=R(e),s=R(t.id);return`<div class="fc mb-3 field-row" data-idx="${n}"><input type="text" value="${s}" class="fx1" id="mid-${r}-${n}" placeholder="模型 ID"><label class="tg"><input type="checkbox" ${t.enabled?"checked":""} id="men-${r}-${n}" aria-label="启用模型"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制模型 ID" aria-label="复制模型 ID"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" data-mid="${s}" onclick="testMdl('${r}',this.dataset.mid)" title="测试模型" aria-label="测试模型"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmMdl('${r}',${n})" title="移除模型" aria-label="移除模型"><i class="fas fa-times" aria-hidden="true"></i></button></div>`}async function ur(e){let t=await B(e.env),n=await J(e.env);e.header("Cache-Control","no-store");let r=t.filter(o=>o.enabled).length,s=t.reduce((o,l)=>o+l.models.length,0),a=t.reduce((o,l)=>o+l.models.filter(c=>c.enabled).length,0),i=n.filter(o=>o.enabled).length;return e.html(`<!DOCTYPE html><html lang="zh-CN">
${bt("管理")}
<body class="site-page admin-page">
<div class="admin-shell">
  <aside class="admin-rail" aria-label="控制台导航">
    <a class="brand admin-rail__brand" href="/">
      <span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span>
      <span><strong>${F.title}</strong><small>CONTROL PLANE</small></span>
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
      <a class="brand" href="/"><span class="brand__mark" aria-hidden="true"><i class="fas fa-cloud"></i></span><span class="brand__name">${F.title}</span></a>
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
          <article class="pi" data-id="${R(o.id)}">
            <div class="ps" onclick="tog('${o.id}')" role="button" tabindex="0" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();tog('${o.id}')}" aria-controls="dt-${R(o.id)}">
              <div class="l"><i class="fas fa-chevron-right provider-chevron" aria-hidden="true" id="ch-${R(o.id)}"></i><span class="provider-avatar" aria-hidden="true">${R(o.name.charAt(0).toUpperCase()||"A")}</span><div><h3>${R(o.name)}</h3><div class="pu"><code>${R(o.id)}</code><span>${(o.apiType||"openai")==="anthropic"?"Anthropic":"OpenAI"}</span><span>${o.apiKeys.length} Keys</span><span>${o.models.length} 模型</span></div></div></div>
              <div class="fc fx-s0" onclick="event.stopPropagation()"><label class="tg"><input type="checkbox" ${o.enabled?"checked":""} id="en-${R(o.id)}" onchange="togglePb('${o.id}',this.checked)" aria-label="启用 ${R(o.name)}"><span class="sl"></span></label><span class="bd ${o.enabled?"bd-on":"bd-off"}">${o.enabled?"已启用":"未启用"}</span></div>
            </div>
            <div class="pd" id="dt-${R(o.id)}">
              <div class="detail-heading"><div><h3>编辑 ${R(o.name)}</h3><p>保存后，新配置会用于后续转发请求。</p></div><span class="protocol-chip">${(o.apiType||"openai")==="anthropic"?"ANTHROPIC":"OPENAI"}</span></div>
              <div class="fr"><div class="fg"><label>名称</label><input type="text" id="nm-${R(o.id)}" value="${R(o.name)}"></div><div class="fg"><label>ID</label><input type="text" value="${R(o.id)}" disabled></div></div>
              <div class="fg"><label>API 地址</label><input type="url" id="url-${R(o.id)}" value="${R(o.baseUrl)}"></div>
              <div class="fg"><label>API 格式</label><select id="at-${R(o.id)}" class="select-sm"><option value="openai" ${(o.apiType||"openai")==="openai"?"selected":""}>OpenAI 兼容</option><option value="anthropic" ${o.apiType==="anthropic"?"selected":""}>Anthropic 兼容</option></select></div>
              <fieldset class="form-group"><legend>上游 API Keys</legend><div id="keys-${R(o.id)}">${o.apiKeys.filter(Boolean).map((l,c)=>`<div class="fc mb-3 field-row" data-kidx="${c}"><input type="text" value="${R(l.key)}" class="fx1" id="k-${R(o.id)}-${c}" placeholder="API Key" aria-label="API Key"><label class="tg"><input type="checkbox" ${l.enabled?"checked":""} id="ken-${R(o.id)}-${c}" aria-label="启用 Key"><span class="sl"></span></label><button class="icon-btn" onclick="copyRowVal(this)" title="复制 Key" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button><button class="icon-btn" onclick="testKeyRow('${o.id}',${c})" title="测试 Key" aria-label="测试 Key"><i class="fas fa-plug" aria-hidden="true"></i></button><button class="icon-btn" onclick="rmKeyRow('${o.id}',${c})" title="移除 Key" aria-label="移除 Key"><i class="fas fa-times" aria-hidden="true"></i></button></div>`).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nk-${R(o.id)}" placeholder="新的 API Key" class="fx1"><button class="btn btn-s" onclick="addKeyRow('${o.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <fieldset class="form-group"><legend>模型</legend><div id="ml-${R(o.id)}">${o.models.filter(Boolean).map((l,c)=>Es(o.id,l,c)).join("")}</div><div class="fc mt-1 field-row"><input type="text" id="nmid-${R(o.id)}" placeholder="新的模型 ID" class="fx1"><button class="btn btn-s" onclick="addMdl('${o.id}')"><i class="fas fa-plus" aria-hidden="true"></i>添加</button></div></fieldset>
              <div class="detail-actions"><div id="tr-${R(o.id)}" aria-live="polite"></div><div>${o.id==="opencode"?`<button class="btn btn-s" onclick="fetchEditModels('`+o.id+`')"><i class="fas fa-download" aria-hidden="true"></i>获取模型</button>`:""}<button class="btn btn-d" onclick="del('${o.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button><button class="btn btn-p" onclick="save('${o.id}')"><i class="fas fa-save" aria-hidden="true"></i>保存更改</button></div></div>
            </div>
          </article>`).join(""):'<div class="empty-state"><i class="fas fa-server" aria-hidden="true"></i><h3>还没有提供商</h3><p>添加第一个上游提供商，配置 API 地址、Key 和模型。</p><button class="btn btn-p" onclick="showAdd()">添加提供商</button></div>'}
        </div>
      </section>

      <section id="proxy-keys" class="workspace-section" aria-labelledby="proxy-keys-title">
        <div class="section-heading section-heading--admin"><div><h2 id="proxy-keys-title">转发 Key</h2><p>客户端使用这些 Key 访问统一的 <code>/v1</code> 接口。</p></div><button class="btn btn-p" onclick="genKey()"><i class="fas fa-plus" aria-hidden="true"></i>生成转发 Key</button></div>
        <div class="key-list">
          ${n.length===0?'<div class="empty-state"><i class="fas fa-key" aria-hidden="true"></i><h3>暂无转发 Key</h3><p>生成一个 Key 后，客户端才能访问网关。</p><button class="btn btn-p" onclick="genKey()">生成转发 Key</button></div>':""}
          ${n.map(o=>`<article class="ki" data-id="${R(o.id)}"><div class="key-main"><span class="key-icon" aria-hidden="true"><i class="fas fa-key"></i></span><div><div class="kv"><span id="kv-${R(o.id)}" data-full="${R(o.key)}" data-vis="0">${R(o.key.length>12?o.key.substring(0,8)+"****"+o.key.substring(o.key.length-4):o.key)}</span><button class="icon-btn" onclick="toggleKeyVis('${o.id}')" title="显示或隐藏" aria-label="显示或隐藏 Key"><i class="far fa-eye" aria-hidden="true"></i></button><button class="icon-btn" data-copy-val="${R(o.key)}" onclick="copyText(this.dataset.copyVal,this)" title="复制" aria-label="复制 Key"><i class="far fa-copy" aria-hidden="true"></i></button></div><div class="key-meta"><h3>${R(o.name)}</h3><span class="key-meta__sep" aria-hidden="true">-</span><p>创建于 ${new Date(o.createdAt).toLocaleDateString()} · ${o.expiresAt?"有效至 "+new Date(o.expiresAt).toLocaleDateString():"永久有效"}</p></div></div></div><div class="key-actions"><label class="tg"><input type="checkbox" ${o.enabled?"checked":""} onchange="toggleProxyKey('${o.id}',this.checked)" aria-label="启用 ${R(o.name)}"><span class="sl"></span></label><span class="bd ${o.enabled?"bd-on":"bd-off"}">${o.enabled?"已启用":"已禁用"}</span><button class="bd bd-del" onclick="rmKey('${o.id}')"><i class="fas fa-trash" aria-hidden="true"></i>删除</button></div></article>`).join("")}
        </div>
      </section>
    </main>

    ${yt(F.title)}
  </div>
</div>

<div id="modal" class="modal-o hd" role="presentation" onclick="if(event.target===this)closeModal()"><div class="modal" id="mc" role="dialog" aria-modal="true" aria-live="polite"></div></div>

<script>${lr}
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
    document.getElementById('aurl').value = '${Re}'
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
</body></html>`)}var $=new Ve,As=async(e,t)=>{await t(),e.header("X-Frame-Options","DENY"),e.header("X-Content-Type-Options","nosniff")};$.use("*",As);$.use("/v1/*",Bt());var Me=null;$.use("*",async(e,t)=>(Me||(Me=un(e.env).catch(n=>{Me=null,console.warn("初始数据填充失败:",n)})),await Me,t()));$.get("/",async e=>{let t=re(e,"session_id"),n=t?await Te(e.env,t):null;return cr(e,n!==null)});$.get("/admin/login",dr);$.post("/admin/login",gn);$.get("/admin/logout",yn);$.use("/admin/*",hn);$.get("/admin",ur);$.get("/admin/api/status",Vn);$.get("/admin/api/providers",Yn);$.post("/admin/api/providers",Gn);$.put("/admin/api/providers/:id",Xn);$.delete("/admin/api/providers/:id",Qn);$.post("/admin/api/providers/:id/test-model",Zn);$.post("/admin/api/test-key",tr);$.post("/admin/api/test-model",nr);$.get("/admin/api/proxy-keys",rr);$.post("/admin/api/proxy-keys",sr);$.delete("/admin/api/proxy-keys/:id",ar);$.patch("/admin/api/proxy-keys/:id",or);$.use("/v1/*",bn);$.get("/v1/models",Un);$.all("/v1/*",Bn);$.notFound(e=>e.json({error:{message:"接口不存在",type:"not_found"}},404));$.onError((e,t)=>e instanceof SyntaxError&&/\bJSON\b|Unexpected (token|end)/i.test(e.message)?t.json({error:{message:"请求体必须是合法的 JSON",type:"invalid_request_error"}},400):(console.error("未捕获的错误:",e),t.json({error:{message:"服务器内部错误",type:"server_error"}},500)));var jo=$;export{jo as default};
