"use strict";var r=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var g=Object.getOwnPropertyNames;var i=Object.prototype.hasOwnProperty;var u=(e,o)=>{for(var n in o)r(e,n,{get:o[n],enumerable:!0})},y=(e,o,n,b)=>{if(o&&typeof o=="object"||typeof o=="function")for(let t of g(o))!i.call(e,t)&&t!==n&&r(e,t,{get:()=>o[t],enumerable:!(b=d(o,t))||b.enumerable});return e};var G=e=>y(r({},"__esModule",{value:!0}),e);var c={};u(c,{getGoodbyeName:()=>a});module.exports=G(c);function a(e){return`Goodbye ${e}!`}0&&(module.exports={getGoodbyeName});