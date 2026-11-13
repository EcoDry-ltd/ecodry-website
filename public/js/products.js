document.addEventListener("DOMContentLoaded", () => {
  const grid=$("#products-grid"); if(!grid)return;
  const q=$("#product-search"), cat=$("#product-category");
  async function load(){
    grid.innerHTML='<div class="empty-state">Loading products…</div>';
    try {
      const params=new URLSearchParams(); if(q?.value)params.set("q",q.value);if(cat?.value)params.set("category",cat.value);
      const items=await api("/api/products?"+params.toString());
      if(!items.length){grid.innerHTML='<div class="empty-state">No products match your search just yet. Contact us and we will help you find what you need.</div>';return;}
      grid.innerHTML=items.map(p=>{
        const sold=Number(p.quantity)<=0, img=p.image?`<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">`:'<span class="image-placeholder">✳</span>';
        return `<article class="product-card ${sold?'sold-out':''}"><div class="product-image">${img}${sold?'<span class="sold-badge">Sold out</span>':''}</div><div class="product-content"><span class="product-category">${escapeHTML(p.category)}</span><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.description||"Contact us for more details.")}</p><div class="product-price">${money(p.price)}</div><div class="product-meta">${escapeHTML(p.size||"Size on request")} · ${sold?'Currently unavailable':`${p.quantity} available`}</div><a class="button ${sold?'button-secondary':'button-primary'}" href="/contact.html?topic=${encodeURIComponent(p.name)}">${sold?'Ask about restock':(Number(p.price)>0?'Enquire / order':'Request a quote')}</a></div></article>`;
      }).join("");
    }catch(e){grid.innerHTML=`<div class="empty-state">${escapeHTML(e.message)}</div>`;}
  }
  q?.addEventListener("input",load);cat?.addEventListener("change",load);load();
});
