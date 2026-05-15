import{j as e}from"./index-DT5lBi1O.js";import{S as m}from"./shield-BgfMLu_-.js";const w=({fixture:r,onMatchClick:n})=>{const i=r?.quarters||[],p=r?.semis||[],x=r?.final||[],o=i.length>0,l=p.length>0,a=({match:t,title:s,phase:c,index:d})=>e.jsxs("div",{onClick:()=>n&&n(t,c,d),className:`w-52 bg-zinc-900/95 border rounded-xl overflow-hidden shadow-xl transition-all group shrink-0 relative
                ${t.isActive?"border-incn-gold shadow-[0_0_20px_rgba(201,169,89,0.3)] bracket-pulse":"border-white/10 hover:border-incn-gold/40"}
                ${n?"cursor-pointer hover:scale-[1.03]":""}`,children:[e.jsxs("div",{className:`px-3 py-1.5 border-b border-white/5 flex justify-between items-center ${t.isActive?"bg-incn-gold/20":"bg-black/40"}`,children:[e.jsxs("div",{className:"flex flex-col text-left",children:[e.jsx("span",{className:`text-[7px] uppercase tracking-[0.2em] font-bold ${t.isActive?"text-incn-gold":"text-white/40"}`,children:s}),e.jsx("span",{className:`text-[9px] font-bold ${t.isActive?"text-white":"text-incn-gold/80"}`,children:t.time||"00:00"})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[t.isActive&&e.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"}),e.jsx("span",{className:`text-[7px] uppercase font-bold ${t.isActive?"text-incn-gold":"text-white/20"} transition-colors`,children:t.isActive?"EN VIVO":t.status})]})]}),e.jsxs("div",{className:"px-3 py-2.5 flex items-center justify-between gap-2 border-b border-white/5",children:[e.jsxs("div",{className:"flex items-center gap-2 overflow-hidden",children:[e.jsx(m,{size:11,className:parseInt(t.score1)>parseInt(t.score2)||t.score1==="W"?"text-incn-gold":"text-white/15"}),e.jsx("span",{className:`text-[11px] font-bold truncate ${parseInt(t.score1)>parseInt(t.score2)||t.score1==="W"?"text-white":"text-white/40"}`,children:t.team1})]}),e.jsx("span",{className:"text-[11px] font-mono font-bold text-incn-gold",children:t.score1})]}),e.jsxs("div",{className:"px-3 py-2.5 flex items-center justify-between gap-2",children:[e.jsxs("div",{className:"flex items-center gap-2 overflow-hidden",children:[e.jsx(m,{size:11,className:parseInt(t.score2)>parseInt(t.score1)||t.score2==="W"?"text-incn-gold":"text-white/15"}),e.jsx("span",{className:`text-[11px] font-bold truncate ${parseInt(t.score2)>parseInt(t.score1)||t.score2==="W"?"text-white":"text-white/40"}`,children:t.team2})]}),e.jsx("span",{className:"text-[11px] font-mono font-bold text-incn-gold",children:t.score2})]})]}),g=({size:t=56,className:s=""})=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:t,height:t,viewBox:"0 0 512 512",preserveAspectRatio:"xMidYMid meet",className:s,children:[e.jsx("defs",{children:e.jsxs("linearGradient",{id:"trophyGradient",x1:"0%",y1:"0%",x2:"0%",y2:"100%",children:[e.jsx("stop",{offset:"0%",stopColor:"#FFE082"})," ",e.jsx("stop",{offset:"50%",stopColor:"#C9A959"})," ",e.jsx("stop",{offset:"100%",stopColor:"#8A6D3B"})," "]})}),e.jsxs("g",{transform:"translate(0.000000,512.000000) scale(0.100000,-0.100000)",fill:"url(#trophyGradient)",stroke:"#000",strokeWidth:"20",children:[e.jsx("path",{d:"M2367 5105 c-298 -49 -544 -178 -748 -393 -173 -181 -286 -401 -336 -650 -24 -121 -24 -375 1 -492 40 -184 103 -330 218 -505 218 -331 351 -762 398 -1290 14 -161 30 -511 29 -665 l0 -125 -51 -30 c-97 -56 -148 -154 -148 -285 l0 -67 -74 -5 c-128 -8 -220 -69 -270 -177 -17 -38 -21 -70 -24 -189 -4 -160 3 -194 49 -217 41 -22 1086 -22 1128 -1 46 24 62 80 39 131 -25 55 -27 55 -543 55 l-475 0 0 66 c0 62 2 68 34 100 l34 34 931 0 931 0 32 -29 c30 -26 33 -35 36 -100 l4 -71 -146 0 c-161 0 -193 -8 -214 -55 -15 -33 -15 -57 0 -90 22 -50 49 -55 273 -55 292 0 289 -2 283 232 -3 119 -7 151 -24 189 -50 108 -142 169 -270 177 l-74 5 0 67 c0 131 -51 229 -148 285 l-51 30 0 130 c-1 154 15 492 29 660 48 536 178 954 410 1310 111 170 167 302 206 485 25 115 25 370 1 492 -88 443 -398 813 -813 972 -191 73 -463 103 -657 71z m333 -195 c41 -6 81 -12 90 -15 11 -4 37 -68 79 -200 l62 -194 -79 -108 -79 -108 -213 0 -213 0 -79 108 -79 108 62 194 c46 144 67 196 80 200 69 22 255 29 369 15z m-633 -123 c-3 -7 -17 -55 -33 -105 l-27 -92 -114 0 c-63 0 -112 4 -109 9 12 18 144 121 206 160 70 43 85 48 77 28z m1061 -28 c62 -38 196 -141 208 -160 3 -5 -46 -9 -109 -9 l-114 0 -27 92 c-16 50 -30 98 -33 105 -8 20 2 16 75 -28z m-1025 -481 c41 -57 77 -108 80 -113 3 -6 -22 -98 -57 -205 l-63 -194 -129 -43 c-71 -24 -134 -41 -141 -39 -6 3 -82 56 -168 118 l-157 113 6 62 c9 87 49 220 97 319 l40 84 209 0 209 0 74 -102z m1446 18 c48 -99 88 -232 97 -319 l6 -62 -155 -113 c-86 -62 -162 -114 -169 -117 -7 -3 -71 14 -142 38 l-130 43 -62 194 c-35 107 -60 199 -57 204 3 6 39 57 80 114 l74 102 209 0 209 0 40 -84z m-749 -393 c29 -93 53 -171 54 -175 1 -7 -284 -218 -294 -218 -10 0 -295 211 -294 218 0 4 25 82 54 175 l54 167 186 0 186 0 54 -167z m-1215 -321 c33 -25 63 -48 67 -52 5 -3 -9 -55 -29 -115 l-36 -110 -29 64 c-32 72 -64 173 -77 244 l-9 48 27 -17 c14 -10 53 -37 86 -62z m2045 -6 c-15 -66 -80 -249 -95 -264 -2 -2 -18 41 -35 95 -18 54 -35 103 -37 109 -3 8 170 144 184 144 0 0 -7 -38 -17 -84z m-1335 -127 l166 -121 -3 -141 -3 -140 -164 -120 -163 -119 -75 38 c-84 44 -218 142 -280 206 l-42 43 63 195 64 194 124 42 c67 24 129 43 135 43 7 1 87 -53 178 -120z m839 78 l128 -43 64 -194 64 -195 -71 -67 c-77 -73 -208 -165 -282 -198 l-46 -21 -163 119 -163 119 -3 141 -3 141 167 120 c91 67 169 121 173 121 4 0 64 -19 135 -43z m-483 -719 c58 -42 85 -66 78 -73 -12 -12 -305 -14 -333 -2 -15 6 -4 18 70 72 49 35 91 65 93 65 2 0 43 -28 92 -62z m-650 -161 c91 -43 201 -80 312 -104 115 -25 380 -25 497 0 131 28 277 82 391 144 13 7 -53 -172 -84 -231 -31 -59 -134 -170 -254 -277 -56 -48 -63 -59 -63 -91 0 -68 71 -122 131 -100 13 6 44 26 68 46 24 20 46 35 48 32 3 -2 0 -37 -6 -78 -21 -138 -41 -433 -47 -710 l-7 -278 -429 0 -428 0 0 53 c0 117 60 264 155 377 109 130 118 159 61 216 -55 55 -110 43 -180 -41 -28 -34 -41 -44 -46 -34 -4 8 -10 68 -14 134 -18 310 -82 661 -165 903 -16 46 -26 81 -22 79 3 -1 40 -20 82 -40z m1155 -1881 c32 -32 34 -38 34 -100 l0 -66 -630 0 -630 0 0 66 c0 62 2 68 34 100 l34 34 562 0 562 0 34 -34z"}),e.jsx("path",{d:"M2531 1926 c-87 -48 -50 -186 50 -186 53 0 98 48 99 103 0 75 -81 121 -149 83z"}),e.jsx("path",{d:"M2841 186 c-87 -48 -50 -186 49 -186 51 0 100 49 100 99 0 75 -83 124 -149 87z"})]})]}),h=({match1:t,match2:s,title1:c,title2:d,phase:b,idx1:u,idx2:f,isLast:j})=>e.jsxs("div",{className:"bracket-pair",children:[e.jsx("div",{className:"bracket-match",children:e.jsx(a,{match:t,title:c,phase:b,index:u})}),e.jsx("div",{className:"bracket-match",children:e.jsx(a,{match:s,title:d,phase:b,index:f})})]});return e.jsxs("div",{className:"bracket-container",children:[e.jsx("style",{children:`
                /* Animación para partido en vivo */
                @keyframes pulse-gentle {
                    0%, 100% { box-shadow: 0 0 15px rgba(201,169,89,0.2); }
                    50% { box-shadow: 0 0 25px rgba(201,169,89,0.5); }
                }
                .bracket-pulse { animation: pulse-gentle 2s infinite ease-in-out; }

                /* Contenedor principal del bracket */
                .bracket-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 40px 20px;
                    width: 100%;
                    overflow-x: auto;
                }

                /* Headers de fases */
                .bracket-headers {
                    display: flex;
                    gap: 80px;
                    margin-bottom: 32px;
                }
                .bracket-headers > div {
                    width: 208px;
                    text-align: center;
                }

                /* Layout del bracket */
                .bracket-rounds {
                    display: flex;
                    align-items: center;
                    gap: 0;
                }

                /* Cada ronda es una columna */
                .bracket-round {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                /* Par de partidos con conector */
                .bracket-pair {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    position: relative;
                    margin: 16px 0;
                }

                /* Línea vertical derecha que une el par */
                .bracket-pair::after {
                    content: '';
                    position: absolute;
                    right: -24px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 0;
                    height: calc(50% + 8px);
                    border-right: 1.5px solid rgba(201,169,89,0.35);
                }

                /* Líneas horizontales desde cada partido hacia la línea vertical */
                .bracket-pair .bracket-match {
                    position: relative;
                }
                .bracket-pair .bracket-match::after {
                    content: '';
                    position: absolute;
                    right: -24px;
                    top: 50%;
                    width: 24px;
                    height: 0;
                    border-top: 1.5px solid rgba(201,169,89,0.35);
                }

                /* Línea horizontal desde el punto medio del par hacia la siguiente ronda */
                .bracket-pair::before {
                    content: '';
                    position: absolute;
                    right: -48px;
                    top: 50%;
                    width: 24px;
                    height: 0;
                    border-top: 1.5px solid rgba(201,169,89,0.35);
                }

                /* Partido individual con conector de entrada */
                .bracket-single {
                    position: relative;
                    margin: 16px 0;
                }
                .bracket-single::before {
                    content: '';
                    position: absolute;
                    left: -24px;
                    top: 50%;
                    width: 24px;
                    height: 0;
                    border-top: 1.5px solid rgba(201,169,89,0.35);
                }

                /* Conector de salida de partido individual */
                .bracket-single.has-output::after {
                    content: '';
                    position: absolute;
                    right: -24px;
                    top: 50%;
                    width: 24px;
                    height: 0;
                    border-top: 1.5px solid rgba(201,169,89,0.35);
                }

                /* Conector vertical entre dos partidos individuales (semis) */
                .bracket-round-semis-connector {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    position: relative;
                }
                .bracket-round-semis-connector::after {
                    content: '';
                    position: absolute;
                    right: -24px;
                    top: 50%;
                    transform: translateY(-50%);
                    height: 50%;
                    border-right: 1.5px solid rgba(201,169,89,0.35);
                }
                .bracket-round-semis-connector::before {
                    content: '';
                    position: absolute;
                    right: -48px;
                    top: 50%;
                    width: 24px;
                    height: 0;
                    border-top: 1.5px solid rgba(201,169,89,0.35);
                }

                /* Espaciador entre rondas */
                .bracket-spacer {
                    width: 48px;
                    flex-shrink: 0;
                }

                /* Final con entrada */
                .bracket-final {
                    position: relative;
                }
                .bracket-final::before {
                    content: '';
                    position: absolute;
                    left: -24px;
                    top: 50%;
                    width: 24px;
                    height: 0;
                    border-top: 1.5px solid rgba(201,169,89,0.35);
                }
            `}),e.jsxs("div",{className:"bracket-headers text-[11px] font-cinzel font-bold tracking-[.3em] uppercase",children:[o&&e.jsx("div",{className:"text-white/30",children:"Cuartos de Final"}),l&&e.jsx("div",{className:"text-incn-gold/50",children:"Semifinales"}),e.jsx("div",{className:"text-white",children:"Gran Final"})]}),e.jsxs("div",{className:"bracket-rounds",children:[o&&e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:"bracket-round",children:[i.length>=2&&e.jsx(h,{match1:i[0],match2:i[1],title1:"Cuartos 1",title2:"Cuartos 2",phase:"quarters",idx1:0,idx2:1}),i.length>=4&&e.jsx(h,{match1:i[2],match2:i[3],title1:"Cuartos 3",title2:"Cuartos 4",phase:"quarters",idx1:2,idx2:3})]}),e.jsx("div",{className:"bracket-spacer"})]}),l&&e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"bracket-round bracket-round-semis-connector",style:{gap:o?"100px":"40px"},children:p.map((t,s)=>e.jsx("div",{className:"bracket-single has-output",children:e.jsx(a,{match:t,title:`Semis ${s+1}`,phase:"semis",index:s})},s))}),e.jsx("div",{className:"bracket-spacer"})]}),e.jsx("div",{className:"bracket-round",children:e.jsx("div",{className:l?"bracket-final":"",children:e.jsxs("div",{className:"relative",children:[e.jsx(a,{match:x[0]||{team1:"TBD",team2:"TBD",status:"Sorteo",score1:"-",score2:"-"},title:x[0]?.status==="Finalizado"?"El Campeón":"Gran Final",phase:"final",index:0}),e.jsx("div",{className:"absolute -top-20 left-1/2 -translate-x-1/2 opacity-20 pointer-events-none",children:e.jsx(g,{size:56,className:"text-incn-gold"})})]})})})]})]})};export{w as T};
