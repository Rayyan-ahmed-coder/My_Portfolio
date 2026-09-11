import{a as u,b as h,w as d,e as o,$ as g,o as f}from"./main-8JC6vulX.js";import"./vendor-react-Bgoug6E6.js";import"./vendor-react-dom-Bz6qTDkC.js";import"./vendor-packages-Bb8JjhAW.js";const c="contentLoader",m=2,b=(()=>{const t=new URL("./",window.location.href).toString();return new URL("data/projects.json",t).toString()})(),a=(i,t)=>typeof i=="string"&&i.trim()!==""?i:t,v=(i,t)=>{if(typeof i!="object"||i===null)return d(c,`Skipping project #${t}: not an object`),null;const e=i,s=e.content??{},r=Array.isArray(e.preview)?e.preview:[],n=Number.parseInt(String(e.number??""),10),p=a(e.target,"_blank").toLowerCase();return{main:e.main===!0,number:Number.isFinite(n)?n:0,preview:[a(r[0],"Not Defined"),a(r[1],"Not Defined")],type:a(e.type,"Type Value not set"),heading:a(s.heading,"Untitled Project"),description:a(s.description,"Description not set"),category:a(e.category,"unknown").toLowerCase().trim(),tags:Array.isArray(e.tags)?e.tags.filter(l=>typeof l=="string"):[],link:a(e.link,"#"),openInNewTab:p.includes("blank"),preFetch:e.preFetch===!0}},w=i=>Array.isArray(i)?i.map((t,e)=>v(t,e)).filter(t=>t!==null):(d(c,"Projects payload is not an array"),[]);class P{#r;#s=null;#o=[];#t=[];#e=null;#n=null;#i=!1;#a=!1;constructor(){this.#r=u("#projects-grid"),this.init()}init(){const t=this.#r;if(!t){h(c,"Target #projects-grid element not found in DOM",new Error("missing-grid"));return}const e=()=>f(()=>void this.loadProjects(),50);if(!("IntersectionObserver"in window)){e();return}const s=t.closest("section")??t;this.#e=new IntersectionObserver(r=>{r.some(n=>n.isIntersecting)&&(this.#e?.disconnect(),this.#e=null,e())},{rootMargin:"240px 0px",threshold:.01}),this.#e.observe(s)}async loadProjects(t=1){const e=this.#r;if(!e||this.#i)return;this.#i=!0,this.#s?.abort();const s=new AbortController;this.#s=s;try{const r=await fetch(b,{cache:"force-cache",signal:s.signal,headers:{Accept:"application/json"}});if(!r.ok)throw new Error(`HTTP ${r.status} while loading projects`);const n=w(await r.json());if(!n.length){this.#c('<p class="error-msg">No Projects Found.</p>');return}this.#l(e,n),this.#a=!0}catch(r){if(r instanceof Error&&r.name==="AbortError")return;if(t<m){d(c,`Project load attempt ${t} failed; retrying`,r),this.#i=!1,await this.loadProjects(t+1);return}h(c,"Failed to load projects",r),this.#c('<p class="error-msg">Failed to Load Projects.</p>')}finally{this.#i=!1}}get loaded(){return this.#a}#l(t,e){const s=document.createElement("template");s.innerHTML=e.map(r=>this.#d(r)).join(""),t.replaceChildren(s.content),this.#p(t),document.dispatchEvent(new CustomEvent("content:loaded",{detail:{count:e.length}}))}#d(t){const e=String(t.number).padStart(2,"0"),s=o(t.heading),r=t.tags.map(l=>`<span>${o(l)}</span>`).join(""),n=t.openInNewTab?'target="_blank" rel="noopener noreferrer"':'target="_self"';return`
        <article class="${t.main?"project-card project-card-large":"project-card"}" data-category="${o(t.category)}" data-reveal>
            <div class="project-preview">
                <div class="project-number" aria-hidden="true">${e}</div>
                <div class="project-preview-content">
                    <span>${o(t.preview[0])}</span>
                    <strong>${o(t.preview[1])}</strong>
                </div>
            </div>

            <div class="project-content">
                <div>
                    <p class="project-type">${o(t.type)}</p>
                    <h3 id="project-title-${e}">${s}</h3>
                    <p>${o(t.description)}</p>
                </div>

                <div class="project-footer">
                    <div class="project-tags" role="list" aria-label="Project technologies">${r}</div>
                    <a class="project-link"
                       href="${o(encodeURI(t.link))}"
                       title="Explore ${s}"
                       ${n}
                       ${t.preFetch?"":'prefetch="false"'}
                       aria-describedby="project-title-${e}">
                        View <span class="link-arrow" aria-hidden="true">↗</span>
                    </a>
                </div>
            </div>
        </article>`}#c(t){this.#r&&(this.#r.innerHTML=t)}#p(t){if(this.#n?.(),this.#t=Array.from(g(".filter-button")),this.#o=Array.from(g(".project-card",t)),!this.#t.length)return;const e=this.#t[0].closest(".project-filters")??document,s=r=>{const n=r.target?.closest(".filter-button");n&&this.#t.includes(n)&&this.#h(n)};e.addEventListener("click",s),this.#n=()=>e.removeEventListener("click",s)}#h(t){const e=(t.dataset.filter??"").trim().toLowerCase();requestAnimationFrame(()=>{for(const s of this.#o){const r=e==="all"||(s.dataset.category??"").includes(e);s.classList.toggle("is-hidden",!r)}for(const s of this.#t){const r=s===t;s.classList.toggle("active",r),s.setAttribute("aria-pressed",String(r))}})}destroy(){this.#s?.abort(),this.#s=null,this.#e?.disconnect(),this.#e=null,this.#n?.(),this.#n=null,this.#o=[],this.#t=[]}}export{b as PROJECTS_URL,P as default,w as parseProjects};
