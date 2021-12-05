(function(){/*

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';var g,aa="function"==typeof Object.create?Object.create:function(a){function b(){}
b.prototype=a;return new b},l;
if("function"==typeof Object.setPrototypeOf)l=Object.setPrototypeOf;else{var m;a:{var ba={a:!0},n={};try{n.__proto__=ba;m=n.a;break a}catch(a){}m=!1}l=m?function(a,b){a.__proto__=b;if(a.__proto__!==b)throw new TypeError(a+" is not extensible");return a}:null}var p=l;
function q(a,b){a.prototype=aa(b.prototype);a.prototype.constructor=a;if(p)p(a,b);else for(var c in b)if("prototype"!=c)if(Object.defineProperties){var d=Object.getOwnPropertyDescriptor(b,c);d&&Object.defineProperty(a,c,d)}else a[c]=b[c];a.W=b.prototype}
var t=this||self;function u(a){a=a.split(".");for(var b=t,c=0;c<a.length;c++)if(b=b[a[c]],null==b)return null;return b}
function ca(a,b,c){return a.call.apply(a.bind,arguments)}
function da(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var e=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(e,d);return a.apply(b,e)}}return function(){return a.apply(b,arguments)}}
function v(a,b,c){Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?v=ca:v=da;return v.apply(null,arguments)}
function w(a,b){a=a.split(".");var c=t;a[0]in c||"undefined"==typeof c.execScript||c.execScript("var "+a[0]);for(var d;a.length&&(d=a.shift());)a.length||void 0===b?c[d]&&c[d]!==Object.prototype[d]?c=c[d]:c=c[d]={}:c[d]=b}
;var x={},z=null;var ea="function"===typeof Uint8Array;var A="function"===typeof Symbol&&"symbol"===typeof Symbol()?Symbol(void 0):void 0;function B(a){Object.isFrozen(a)||(A?a[A]|=1:void 0!==a.g?a.g|=1:Object.defineProperties(a,{g:{value:1,configurable:!0,writable:!0,enumerable:!1}}));return a}
;function C(a){return null!==a&&"object"===typeof a&&a.constructor===Object}
;function D(a,b){if(null!=a)return Array.isArray(a)||C(a)?E(a,b):b(a)}
function E(a,b){if(Array.isArray(a)){for(var c=Array(a.length),d=0;d<a.length;d++)c[d]=D(a[d],b);if(b=Array.isArray(a)){var e;A?e=a[A]:e=a.g;b=(null==e?0:e)&1}b&&B(c);return c}e={};for(c in a)e[c]=D(a[c],b);return e}
function F(a){a:switch(typeof a){case "number":a=isFinite(a)?a:String(a);break a;case "object":if(ea&&null!=a&&a instanceof Uint8Array){var b;void 0===b&&(b=0);if(!z){z={};for(var c="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""),d=["+/=","+/","-_=","-_.","-_"],e=0;5>e;e++){var f=c.concat(d[e].split(""));x[e]=f;for(var h=0;h<f.length;h++){var k=f[h];void 0===z[k]&&(z[k]=h)}}}b=x[b];c=Array(Math.floor(a.length/3));d=b[64]||"";for(e=f=0;f<a.length-2;f+=3){var r=a[f],y=a[f+
1];k=a[f+2];h=b[r>>2];r=b[(r&3)<<4|y>>4];y=b[(y&15)<<2|k>>6];k=b[k&63];c[e++]=""+h+r+y+k}h=0;k=d;switch(a.length-f){case 2:h=a[f+1],k=b[(h&15)<<2]||d;case 1:a=a[f],c[e]=""+b[a>>2]+b[(a&3)<<4|h>>4]+k+d}a=c.join("")}}return Array.isArray(a)?E(a,F):a}
;var G;function H(a,b,c){var d=G;G=null;a||(a=d);d=this.constructor.V;a||(a=d?[d]:[]);this.h=(d?0:-1)-(this.constructor.U||0);this.g=a;a:{d=this.g.length;a=d-1;if(d&&(d=this.g[a],C(d))){this.j=a-this.h;this.i=d;break a}void 0!==b&&-1<b?(this.j=Math.max(b,a+1-this.h),this.i=null):this.j=Number.MAX_VALUE}if(c)for(b=0;b<c.length;b++)a=c[b],a<this.j?(a+=this.h,(d=this.g[a])?Array.isArray(d)&&B(d):this.g[a]=I):(d=this.j+this.h,this.g[d]||(this.i=this.g[d]={}),(d=this.i[a])?Array.isArray(d)&&B(d):this.i[a]=I)}
var I=Object.freeze(B([]));H.prototype.toJSON=function(){return E(this.g,F)};
H.prototype.toString=function(){return this.g.toString()};function J(){this.s=this.s;this.B=this.B}
J.prototype.s=!1;J.prototype.dispose=function(){this.s||(this.s=!0,this.G())};
J.prototype.G=function(){if(this.B)for(;this.B.length;)this.B.shift()()};function K(a){H.call(this,a,1)}
q(K,H);var L,M,N,O=t.window,P=(null===(L=null===O||void 0===O?void 0:O.yt)||void 0===L?void 0:L.config_)||(null===(M=null===O||void 0===O?void 0:O.ytcfg)||void 0===M?void 0:M.data_)||{},fa=(null===(N=null===O||void 0===O?void 0:O.ytcfg)||void 0===N?void 0:N.obfuscatedData_)||[];function ha(){K.apply(this,arguments)}
q(ha,K);new ha(fa);w("yt.config_",P);w("yt.configJspb_",fa);function Q(a,b){return a in P?P[a]:b}
;function ia(a,b){a=ja(a);return void 0===a&&void 0!==b?b:Number(a||0)}
function ja(a){var b=Q("EXPERIMENTS_FORCED_FLAGS",{});return void 0!==b[a]?b[a]:Q("EXPERIMENT_FLAGS",{})[a]}
;var ka=ia("web_emulated_idle_callback_delay",300),la=1E3/60-3;
function R(a){a=void 0===a?{}:a;J.call(this);this.g=[];this.g[8]=[];this.g[4]=[];this.g[3]=[];this.g[2]=[];this.g[1]=[];this.g[0]=[];this.j=0;this.N=a.timeout||1;this.i={};this.o=la;this.C=this.h=this.m=0;this.D=this.l=!1;this.u=[];this.H=v(this.R,this);this.M=v(this.T,this);this.J=v(this.O,this);this.K=v(this.P,this);this.L=v(this.S,this);this.A=this.F=!1;var b;if(b=!!window.requestIdleCallback)b=ja("disable_scheduler_requestIdleCallback"),b=!("string"===typeof b&&"false"===b?0:b);this.I=b;(this.v=
!!a.useRaf&&!!window.requestAnimationFrame)&&document.addEventListener("visibilitychange",this.H)}
q(R,J);function ma(a,b){var c=Date.now();S(b);b=Date.now()-c;a.l||(a.o-=b)}
function na(a,b,c,d){++a.C;if(10==c)return ma(a,b),a.C;var e=a.C;a.i[e]=b;a.l&&!d?a.u.push({id:e,priority:c}):(a.g[c].push(e),a.D||a.l||(0!=a.h&&T(a)!=a.m&&U(a),a.start()));return e}
function oa(a){a.u.length=0;for(var b=4;0<=b;b--)a.g[b].length=0;a.g[8].length=0;a.i={};U(a)}
function T(a){if(a.g[8].length){if(a.A)return 4;if(!document.hidden&&a.v)return 3}for(var b=4;b>=a.j;b--)if(0<a.g[b].length)return 0<b?!document.hidden&&a.v?3:2:1;return 0}
function S(a){try{a()}catch(b){(a=u("yt.logging.errors.log"))&&a(b)}}
function pa(a){if(a.g[8].length)return!0;for(var b=3;0<=b;b--)if(a.g[b].length)return!0;return!1}
g=R.prototype;g.P=function(a){var b=void 0;a&&(b=a.timeRemaining());this.F=!0;V(this,b);this.F=!1};
g.T=function(){V(this)};
g.O=function(){qa(this)};
g.S=function(){this.A=!0;var a=T(this);4==a&&a!=this.m&&(U(this),this.start());V(this);this.A=!1};
g.R=function(){document.hidden||qa(this);this.h&&(U(this),this.start())};
function qa(a){U(a);a.l=!0;for(var b=Date.now(),c=a.g[8];c.length;){var d=c.shift(),e=a.i[d];delete a.i[d];e&&S(e)}ra(a);a.l=!1;pa(a)&&a.start();a.o-=Date.now()-b}
function ra(a){for(var b=0,c=a.u.length;b<c;b++){var d=a.u[b];a.g[d.priority].push(d.id)}a.u.length=0}
function V(a,b){a.A&&4==a.m&&a.h||U(a);a.l=!0;b=Date.now()+(b||a.o);for(var c=a.g[4];c.length;){var d=c.shift(),e=a.i[d];delete a.i[d];e&&S(e)}c=a.F?0:1;c=a.j>c?a.j:c;if(!(Date.now()>=b)){do{a:{d=a;e=c;for(var f=3;f>=e;f--)for(var h=d.g[f];h.length;){var k=h.shift(),r=d.i[k];delete d.i[k];if(r){d=r;break a}}d=null}d&&S(d)}while(d&&Date.now()<b)}a.l=!1;ra(a);a.o=la;pa(a)&&a.start()}
g.start=function(){this.D=!1;if(0==this.h)switch(this.m=T(this),this.m){case 1:var a=this.K;this.h=this.I?window.requestIdleCallback(a,{timeout:3E3}):window.setTimeout(a,ka);break;case 2:this.h=window.setTimeout(this.M,this.N);break;case 3:this.h=window.requestAnimationFrame(this.L);break;case 4:this.h=window.setTimeout(this.J,0)}};
function U(a){if(a.h){switch(a.m){case 1:var b=a.h;a.I?window.cancelIdleCallback(b):window.clearTimeout(b);break;case 2:case 4:window.clearTimeout(a.h);break;case 3:window.cancelAnimationFrame(a.h)}a.h=0}}
g.G=function(){oa(this);U(this);this.v&&document.removeEventListener("visibilitychange",this.H);J.prototype.G.call(this)};var W=u("yt.scheduler.instance.timerIdMap_")||{},sa=ia("kevlar_tuner_scheduler_soft_state_timer_ms",800),X=0,Y=0;function Z(){var a=u("ytglobal.schedulerInstanceInstance_");if(!a||a.s)a=new R(Q("scheduler",void 0)||{}),w("ytglobal.schedulerInstanceInstance_",a);return a}
function ta(){var a=u("ytglobal.schedulerInstanceInstance_");a&&(a&&"function"==typeof a.dispose&&a.dispose(),w("ytglobal.schedulerInstanceInstance_",null))}
function ua(){oa(Z())}
function va(a,b,c){if(0==c||void 0===c)return c=void 0===c,-na(Z(),a,b,c);var d=window.setTimeout(function(){var e=na(Z(),a,b);W[d]=e},c);
return d}
function wa(a){var b=Z();ma(b,a)}
function xa(a){var b=Z();if(0>a)delete b.i[-a];else{var c=W[a];c?(delete b.i[c],delete W[a]):window.clearTimeout(a)}}
function ya(a){var b=u("ytcsi.tick");b&&b(a)}
function za(){ya("jse");Aa()}
function Aa(){window.clearTimeout(X);Z().start()}
function Ba(){var a=Z();U(a);a.D=!0;window.clearTimeout(X);X=window.setTimeout(za,sa)}
function Ca(){window.clearTimeout(Y);Y=window.setTimeout(function(){ya("jset");Da(0)},sa)}
function Da(a){Ca();var b=Z();b.j=a;b.start()}
function Ea(a){Ca();var b=Z();b.j>a&&(b.j=a,b.start())}
function Fa(){window.clearTimeout(Y);var a=Z();a.j=0;a.start()}
;u("yt.scheduler.initialized")||(w("yt.scheduler.instance.dispose",ta),w("yt.scheduler.instance.addJob",va),w("yt.scheduler.instance.addImmediateJob",wa),w("yt.scheduler.instance.cancelJob",xa),w("yt.scheduler.instance.cancelAllJobs",ua),w("yt.scheduler.instance.start",Aa),w("yt.scheduler.instance.pause",Ba),w("yt.scheduler.instance.setPriorityThreshold",Da),w("yt.scheduler.instance.enablePriorityThreshold",Ea),w("yt.scheduler.instance.clearPriorityThreshold",Fa),w("yt.scheduler.initialized",!0));}).call(this);
