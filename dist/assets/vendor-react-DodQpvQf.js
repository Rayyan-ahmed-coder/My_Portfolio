var I={exports:{}},w={};/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Z;function st(){if(Z)return w;Z=1;var a=Symbol.for("react.transitional.element"),f=Symbol.for("react.fragment");function y(d,l,p){var R=null;if(p!==void 0&&(R=""+p),l.key!==void 0&&(R=""+l.key),"key"in l){p={};for(var v in l)v!=="key"&&(p[v]=l[v])}else p=l;return l=p.ref,{$$typeof:a,type:d,key:R,ref:l!==void 0?l:null,props:p}}return w.Fragment=f,w.jsx=y,w.jsxs=y,w}var Q;function it(){return Q||(Q=1,I.exports=st()),I.exports}var xt=it(),U={exports:{}},r={};/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var X;function ct(){if(X)return r;X=1;var a=Symbol.for("react.transitional.element"),f=Symbol.for("react.portal"),y=Symbol.for("react.fragment"),d=Symbol.for("react.strict_mode"),l=Symbol.for("react.profiler"),p=Symbol.for("react.consumer"),R=Symbol.for("react.context"),v=Symbol.for("react.forward_ref"),$=Symbol.for("react.suspense"),T=Symbol.for("react.memo"),x=Symbol.for("react.lazy"),P=Symbol.for("react.activity"),A=Symbol.iterator;function N(t){return t===null||typeof t!="object"?null:(t=A&&t[A]||t["@@iterator"],typeof t=="function"?t:null)}var g={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},S=Object.assign,M={};function C(t,e,o){this.props=t,this.context=e,this.refs=M,this.updater=o||g}C.prototype.isReactComponent={},C.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")},C.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function W(){}W.prototype=C.prototype;function H(t,e,o){this.props=t,this.context=e,this.refs=M,this.updater=o||g}var L=H.prototype=new W;L.constructor=H,S(L,C.prototype),L.isPureReactComponent=!0;var D=Array.isArray;function O(){}var i={H:null,A:null,T:null,S:null},G=Object.prototype.hasOwnProperty;function q(t,e,o){var n=o.ref;return{$$typeof:a,type:t,key:e,ref:n!==void 0?n:null,props:o}}function tt(t,e){return q(t.type,e,t.props)}function Y(t){return typeof t=="object"&&t!==null&&t.$$typeof===a}function et(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(o){return e[o]})}var J=/\/+/g;function b(t,e){return typeof t=="object"&&t!==null&&t.key!=null?et(""+t.key):e.toString(36)}function rt(t){switch(t.status){case"fulfilled":return t.value;case"rejected":throw t.reason;default:switch(typeof t.status=="string"?t.then(O,O):(t.status="pending",t.then(function(e){t.status==="pending"&&(t.status="fulfilled",t.value=e)},function(e){t.status==="pending"&&(t.status="rejected",t.reason=e)})),t.status){case"fulfilled":return t.value;case"rejected":throw t.reason}}throw t}function k(t,e,o,n,u){var s=typeof t;(s==="undefined"||s==="boolean")&&(t=null);var c=!1;if(t===null)c=!0;else switch(s){case"bigint":case"string":case"number":c=!0;break;case"object":switch(t.$$typeof){case a:case f:c=!0;break;case x:return c=t._init,k(c(t._payload),e,o,n,u)}}if(c)return u=u(t),c=n===""?"."+b(t,0):n,D(u)?(o="",c!=null&&(o=c.replace(J,"$&/")+"/"),k(u,e,o,"",function(ut){return ut})):u!=null&&(Y(u)&&(u=tt(u,o+(u.key==null||t&&t.key===u.key?"":(""+u.key).replace(J,"$&/")+"/")+c)),e.push(u)),1;c=0;var E=n===""?".":n+":";if(D(t))for(var _=0;_<t.length;_++)n=t[_],s=E+b(n,_),c+=k(n,e,o,s,u);else if(_=N(t),typeof _=="function")for(t=_.call(t),_=0;!(n=t.next()).done;)n=n.value,s=E+b(n,_++),c+=k(n,e,o,s,u);else if(s==="object"){if(typeof t.then=="function")return k(rt(t),e,o,n,u);throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.")}return c}function j(t,e,o){if(t==null)return t;var n=[],u=0;return k(t,n,"","",function(s){return e.call(o,s,u++)}),n}function nt(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(o){(t._status===0||t._status===-1)&&(t._status=1,t._result=o)},function(o){(t._status===0||t._status===-1)&&(t._status=2,t._result=o)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var B=typeof reportError=="function"?reportError:function(t){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var e=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof t=="object"&&t!==null&&typeof t.message=="string"?String(t.message):String(t),error:t});if(!window.dispatchEvent(e))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",t);return}console.error(t)},ot={map:j,forEach:function(t,e,o){j(t,function(){e.apply(this,arguments)},o)},count:function(t){var e=0;return j(t,function(){e++}),e},toArray:function(t){return j(t,function(e){return e})||[]},only:function(t){if(!Y(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};return r.Activity=P,r.Children=ot,r.Component=C,r.Fragment=y,r.Profiler=l,r.PureComponent=H,r.StrictMode=d,r.Suspense=$,r.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=i,r.__COMPILER_RUNTIME={__proto__:null,c:function(t){return i.H.useMemoCache(t)}},r.cache=function(t){return function(){return t.apply(null,arguments)}},r.cacheSignal=function(){return null},r.cloneElement=function(t,e,o){if(t==null)throw Error("The argument must be a React element, but you passed "+t+".");var n=S({},t.props),u=t.key;if(e!=null)for(s in e.key!==void 0&&(u=""+e.key),e)!G.call(e,s)||s==="key"||s==="__self"||s==="__source"||s==="ref"&&e.ref===void 0||(n[s]=e[s]);var s=arguments.length-2;if(s===1)n.children=o;else if(1<s){for(var c=Array(s),E=0;E<s;E++)c[E]=arguments[E+2];n.children=c}return q(t.type,u,n)},r.createContext=function(t){return t={$$typeof:R,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null},t.Provider=t,t.Consumer={$$typeof:p,_context:t},t},r.createElement=function(t,e,o){var n,u={},s=null;if(e!=null)for(n in e.key!==void 0&&(s=""+e.key),e)G.call(e,n)&&n!=="key"&&n!=="__self"&&n!=="__source"&&(u[n]=e[n]);var c=arguments.length-2;if(c===1)u.children=o;else if(1<c){for(var E=Array(c),_=0;_<c;_++)E[_]=arguments[_+2];u.children=E}if(t&&t.defaultProps)for(n in c=t.defaultProps,c)u[n]===void 0&&(u[n]=c[n]);return q(t,s,u)},r.createRef=function(){return{current:null}},r.forwardRef=function(t){return{$$typeof:v,render:t}},r.isValidElement=Y,r.lazy=function(t){return{$$typeof:x,_payload:{_status:-1,_result:t},_init:nt}},r.memo=function(t,e){return{$$typeof:T,type:t,compare:e===void 0?null:e}},r.startTransition=function(t){var e=i.T,o={};i.T=o;try{var n=t(),u=i.S;u!==null&&u(o,n),typeof n=="object"&&n!==null&&typeof n.then=="function"&&n.then(O,B)}catch(s){B(s)}finally{e!==null&&o.types!==null&&(e.types=o.types),i.T=e}},r.unstable_useCacheRefresh=function(){return i.H.useCacheRefresh()},r.use=function(t){return i.H.use(t)},r.useActionState=function(t,e,o){return i.H.useActionState(t,e,o)},r.useCallback=function(t,e){return i.H.useCallback(t,e)},r.useContext=function(t){return i.H.useContext(t)},r.useDebugValue=function(){},r.useDeferredValue=function(t,e){return i.H.useDeferredValue(t,e)},r.useEffect=function(t,e){return i.H.useEffect(t,e)},r.useEffectEvent=function(t){return i.H.useEffectEvent(t)},r.useId=function(){return i.H.useId()},r.useImperativeHandle=function(t,e,o){return i.H.useImperativeHandle(t,e,o)},r.useInsertionEffect=function(t,e){return i.H.useInsertionEffect(t,e)},r.useLayoutEffect=function(t,e){return i.H.useLayoutEffect(t,e)},r.useMemo=function(t,e){return i.H.useMemo(t,e)},r.useOptimistic=function(t,e){return i.H.useOptimistic(t,e)},r.useReducer=function(t,e,o){return i.H.useReducer(t,e,o)},r.useRef=function(t){return i.H.useRef(t)},r.useState=function(t){return i.H.useState(t)},r.useSyncExternalStore=function(t,e,o){return i.H.useSyncExternalStore(t,e,o)},r.useTransition=function(){return i.H.useTransition()},r.version="19.2.8",r}var K;function at(){return K||(K=1,U.exports=ct()),U.exports}var m=at();/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=(...a)=>a.filter((f,y,d)=>!!f&&f.trim()!==""&&d.indexOf(f)===y).join(" ").trim();/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ft=a=>a.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pt=a=>a.replace(/^([A-Z])|[\s-_]+(\w)/g,(f,y,d)=>d?d.toUpperCase():y.toLowerCase());/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=a=>{const f=pt(a);return f.charAt(0).toUpperCase()+f.slice(1)};/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var z={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lt=a=>{for(const f in a)if(f.startsWith("aria-")||f==="role"||f==="title")return!0;return!1},yt=m.createContext({}),_t=()=>m.useContext(yt),dt=m.forwardRef(({color:a,size:f,strokeWidth:y,absoluteStrokeWidth:d,className:l="",children:p,iconNode:R,...v},$)=>{const{size:T=24,strokeWidth:x=2,absoluteStrokeWidth:P=!1,color:A="currentColor",className:N=""}=_t()??{},g=d??P?Number(y??x)*24/Number(f??T):y??x;return m.createElement("svg",{ref:$,...z,width:f??T??z.width,height:f??T??z.height,stroke:a??A,strokeWidth:g,className:F("lucide",N,l),...!p&&!lt(v)&&{"aria-hidden":"true"},...v},[...R.map(([S,M])=>m.createElement(S,M)),...Array.isArray(p)?p:[p]])});/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=(a,f)=>{const y=m.forwardRef(({className:d,...l},p)=>m.createElement(dt,{ref:p,iconNode:f,className:F(`lucide-${ft(V(a))}`,`lucide-${a}`,d),...l}));return y.displayName=V(a),y};/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Et=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],wt=h("check",Et);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vt=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6h4",key:"135r8i"}]],At=h("clock-3",vt);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ht=[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]],gt=h("copy",ht);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rt=[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]],St=h("gauge",Rt);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mt=[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]],Mt=h("layers",mt);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ct=[["path",{d:"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",key:"132q7q"}],["rect",{x:"2",y:"4",width:"20",height:"16",rx:"2",key:"izxlao"}]],jt=h("mail",Ct);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kt=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],$t=h("sparkles",kt);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tt=[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72",key:"ul74o6"}],["path",{d:"m14 7 3 3",key:"1r5n42"}],["path",{d:"M5 6v4",key:"ilb8ba"}],["path",{d:"M19 14v4",key:"blhpug"}],["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M7 8H3",key:"zfb6yr"}],["path",{d:"M21 16h-4",key:"1cnmox"}],["path",{d:"M11 3H9",key:"1obp7u"}]],Pt=h("wand-sparkles",Tt);export{At as C,St as G,Mt as L,jt as M,$t as S,Pt as W,m as a,wt as b,gt as c,xt as j,at as r};
