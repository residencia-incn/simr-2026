import{j as c,av as d,r as u}from"./index-DT5lBi1O.js";const y=({value:s,size:e=200,level:t="H"})=>{const i=e*.25,a=`data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="white" />
            <text x="50" y="46" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="black" text-anchor="middle">SIMR</text>
            <text x="50" y="76" font-family="system-ui, sans-serif" font-weight="900" font-size="26" fill="black" text-anchor="middle">2026</text>
        </svg>
    `)}`;return c.jsx("div",{className:"relative inline-block qr-container",style:{width:e,height:e},children:c.jsx(d,{value:s,size:e,level:t,includeMargin:!1,bgColor:"#FFFFFF",fgColor:"#000000",imageSettings:{src:a,height:i,width:i,excavate:!0}})})},h=(s,e={key:null,direction:"asc"})=>{const[t,i]=u.useState(e);return{items:u.useMemo(()=>{if(!s)return[];let n=[...s];return t.key!==null&&n.sort((l,g)=>{const o=l[t.key],r=g[t.key];return o==null?1:r==null?-1:typeof o=="string"&&typeof r=="string"?t.direction==="asc"?o.localeCompare(r):r.localeCompare(o):o<r?t.direction==="asc"?-1:1:o>r?t.direction==="asc"?1:-1:0}),n},[s,t]),sortConfig:t,requestSort:n=>{let l="asc";t.key===n&&t.direction==="asc"&&(l="desc"),i({key:n,direction:l})},resetSort:()=>{i({key:null,direction:"asc"})}}};export{y as C,h as u};
