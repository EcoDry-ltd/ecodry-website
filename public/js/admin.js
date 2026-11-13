document.addEventListener("DOMContentLoaded",()=>{
 const login=$("#login-form"), app=$("#admin-app"), loginBox=$("#login-box"), msg=$("#login-message");
 let currentProducts=[],currentPosts=[];
 async function check(){try{const s=await api("/api/admin/session");if(s.authenticated){loginBox.classList.add("hidden");app.classList.remove("hidden");await refresh();}}catch{}}
 function message(el,text,error=false){el.textContent=text;el.className=`${error?"error":"success"} show`;}
 login?.addEventListener("submit",async e=>{e.preventDefault();msg.className="";try{await api("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:login.username.value,password:login.password.value})});login.reset();loginBox.classList.add("hidden");app.classList.remove("hidden");await refresh();}catch(err){message(msg,err.message,true);}});
 $$(".admin-tabs button").forEach(b=>b.addEventListener("click",()=>{$$(".admin-tabs button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$$(".admin-panel").forEach(p=>p.classList.remove("active"));$("#panel-"+b.dataset.panel).classList.add("active");}));
 async function refresh(){
  const d=await api("/api/admin/overview");currentProducts=d.products;currentPosts=d.posts;
  $("#count-products").textContent=d.products.length;$("#count-bookings").textContent=d.bookings.filter(x=>x.status==="New").length;$("#count-inquiries").textContent=d.inquiries.filter(x=>x.status==="New").length;$("#count-subs").textContent=d.subscribers.length;
  $("#products-table").innerHTML=d.products.map(p=>`<tr><td>${escapeHTML(p.name)}</td><td>${escapeHTML(p.category)}</td><td>${money(p.price)}</td><td>${p.quantity}</td><td>${p.quantity<=0?"Sold out":p.active?"Live":"Hidden"}</td><td><button class="button-secondary small-btn" data-edit-product="${p.id}">Edit</button> <button class="button-secondary small-btn" data-delete-product="${p.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="6">No products yet.</td></tr>';
  $("#posts-table").innerHTML=d.posts.map(p=>`<tr><td>${escapeHTML(p.title)}</td><td>${escapeHTML(p.category)}</td><td>${p.published?"Published":"Draft"}</td><td>${new Date(p.createdAt).toLocaleDateString()}</td><td><button class="button-secondary small-btn" data-edit-post="${p.id}">Edit</button> <button class="button-secondary small-btn" data-delete-post="${p.id}">Delete</button></td></tr>`).join("")||'<tr><td colspan="5">No posts yet.</td></tr>';
  renderRecords("#bookings-table",d.bookings,"bookings");renderRecords("#inquiries-table",d.inquiries,"inquiries");
  $("#subscribers-table").innerHTML=d.subscribers.map(s=>`<tr><td>${escapeHTML(s.email)}</td><td>${new Date(s.createdAt).toLocaleDateString()}</td></tr>`).join("")||'<tr><td colspan="2">No subscribers yet.</td></tr>';
 }
 function renderRecords(sel,items,type){$(sel).innerHTML=items.map(r=>`<tr><td>${escapeHTML(r.name||"—")}</td><td>${escapeHTML(r.crop||r.topic||"—")}</td><td>${escapeHTML(r.phone||r.email||"—")}</td><td>${escapeHTML(r.status||"New")}</td><td><select data-status-type="${type}" data-status-id="${r.id}"><option ${r.status==="New"?"selected":""}>New</option><option ${r.status==="Contacted"?"selected":""}>Contacted</option><option ${r.status==="Completed"?"selected":""}>Completed</option><option ${r.status==="Closed"?"selected":""}>Closed</option></select></td></tr>`).join("")||'<tr><td colspan="5">Nothing here yet.</td></tr>';}
 document.addEventListener("click",async e=>{
  const t=e.target;
  try{
   if(t.dataset.editProduct){const p=currentProducts.find(x=>x.id===t.dataset.editProduct);fillProduct(p);}
   if(t.dataset.deleteProduct&&confirm("Delete this product?")){await api("/api/admin/products/"+t.dataset.deleteProduct,{method:"DELETE"});await refresh();}
   if(t.dataset.editPost){const p=currentPosts.find(x=>x.id===t.dataset.editPost);fillPost(p);}
   if(t.dataset.deletePost&&confirm("Delete this post?")){await api("/api/admin/posts/"+t.dataset.deletePost,{method:"DELETE"});await refresh();}
  }catch(err){alert(err.message);}
 });
 document.addEventListener("change",async e=>{const t=e.target;if(t.dataset.statusType){try{await api(`/api/admin/records/${t.dataset.statusType}/${t.dataset.statusId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:t.value})});}catch(err){alert(err.message);}}});
 function fillProduct(p){const f=$("#product-form");f.reset();f.dataset.id=p.id;for(const k of ["name","category","size","price","quantity","description"])if(f.elements[k])f.elements[k].value=p[k]??"";f.elements.active.value=String(p.active!==false);$("#product-form-title").textContent="Edit product";f.scrollIntoView({behavior:"smooth",block:"start"});}
 function fillPost(p){const f=$("#post-form");f.reset();f.dataset.id=p.id;for(const k of ["title","category","excerpt","body"])if(f.elements[k])f.elements[k].value=p[k]??"";f.elements.published.value=String(Boolean(p.published));$("#post-form-title").textContent="Edit post";f.scrollIntoView({behavior:"smooth",block:"start"});}
 $("#product-reset")?.addEventListener("click",()=>{const f=$("#product-form");f.reset();delete f.dataset.id;$("#product-form-title").textContent="Add product";});
 $("#post-reset")?.addEventListener("click",()=>{const f=$("#post-form");f.reset();delete f.dataset.id;$("#post-form-title").textContent="Write a post";});
 $("#product-form")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;const fd=new FormData(f);try{const url=f.dataset.id?"/api/admin/products/"+f.dataset.id:"/api/admin/products";await api(url,{method:f.dataset.id?"PUT":"POST",body:fd});f.reset();delete f.dataset.id;$("#product-form-title").textContent="Add product";await refresh();alert("Product saved.");}catch(err){alert(err.message);}});
 $("#post-form")?.addEventListener("submit",async e=>{e.preventDefault();const f=e.currentTarget;const d=Object.fromEntries(new FormData(f).entries());d.published=d.published==="true";try{await api(f.dataset.id?"/api/admin/posts/"+f.dataset.id:"/api/admin/posts",{method:f.dataset.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});f.reset();delete f.dataset.id;$("#post-form-title").textContent="Write a post";await refresh();alert("Post saved.");}catch(err){alert(err.message);}});
 $("#logout")?.addEventListener("click",async()=>{try{await api("/api/admin/logout",{method:"POST"});location.reload();}catch(err){alert(err.message);}});
 check();
});
