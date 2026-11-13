document.addEventListener("DOMContentLoaded",async()=>{
 const grid=$("#posts-grid");if(!grid)return;
 try{
  const posts=await api("/api/posts");
  if(!posts.length){grid.innerHTML='<div class="empty-state">New articles are on the way. Subscribe to hear from us.</div>';return;}
  grid.innerHTML=posts.map(p=>`<article class="post-card"><span class="post-category">${escapeHTML(p.category||"EcoDry journal")}</span><h3>${escapeHTML(p.title)}</h3><span class="post-date">${new Date(p.createdAt).toLocaleDateString("en-NG",{day:"numeric",month:"long",year:"numeric"})}</span><p>${escapeHTML(p.excerpt||p.body.slice(0,180))}</p><details><summary class="text-link">Read article</summary><p style="white-space:pre-line;margin-top:14px">${escapeHTML(p.body)}</p></details></article>`).join("");
 }catch(e){grid.innerHTML=`<div class="empty-state">${escapeHTML(e.message)}</div>`;}
});
