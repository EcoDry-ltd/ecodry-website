const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
function money(value) {
  const n = Number(value || 0);
  return n === 0 ? "Price on request" : new Intl.NumberFormat("en-NG", {style:"currency",currency:"NGN",maximumFractionDigits:0}).format(n);
}
function escapeHTML(s="") { return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
async function api(url, options={}) {
  const res = await fetch(url, options);
  const type = res.headers.get("content-type") || "";
  const body = type.includes("application/json") ? await res.json() : {error: await res.text()};
  if (!res.ok) throw new Error(body.error || "Request failed. Please try again.");
  return body;
}
function showMessage(form, text, isError=false) {
  const box = $(".form-message", form);
  if (!box) return;
  box.textContent = text; box.className = `form-message ${isError ? "error" : "success"} show`;
}
document.addEventListener("DOMContentLoaded", () => {
  const toggle = $(".nav-toggle"), nav = $(".nav-links");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));
  const path = location.pathname.replace(/\/$/, "") || "/";
  $$(".nav-links a").forEach(a => { if (a.getAttribute("href") === path || (path === "/" && a.getAttribute("href") === "/home.html")) a.classList.add("active"); });
  const year = $("#year"); if (year) year.textContent = new Date().getFullYear();
  loadContactBits();
  setupChat();
  $$(".newsletter-form").forEach(form => form.addEventListener("submit", async e => {
    e.preventDefault();
    try { const out = await api("/api/newsletter", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:$('input[name="email"]',form).value})}); showMessage(form,out.message); form.reset(); }
    catch(err){showMessage(form,err.message,true);}
  }));
});
async function loadContactBits(){
  try {
    const c = await api("/api/config");
    $$("[data-contact-email]").forEach(el=>{if(c.email){el.href=`mailto:${c.email}`;el.textContent=c.email;}});
    $$("[data-contact-phone]").forEach(el=>{if(c.phone){el.href=`tel:${c.phone.replace(/\s/g,"")}`;el.textContent=c.phone;}});
    $$("[data-whatsapp]").forEach(el=>{if(c.whatsapp){el.href=`https://wa.me/${c.whatsapp.replace(/\D/g,"")}`;el.classList.remove("hidden");}});
    $$("[data-social]").forEach(el=>{const u=c.social?.[el.dataset.social];if(u){el.href=u;el.classList.remove("hidden");}});
  } catch {}
}

function setupChat(){
 const launcher=$('#chat-launcher'),panel=$('#chat-panel'),close=$('#chat-close'),messages=$('#chat-messages'),form=$('#chat-form'),input=$('#chat-input');
 if(!launcher||!panel||!messages||!form)return;
 const add=(text,who='bot')=>{const el=document.createElement('div');el.className='chat-msg '+(who==='user'?'user':'');el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;};
 const reply=(raw)=>{const q=raw.toLowerCase();
  if(/price|cost|buy|purchase|order|product/.test(q))return 'You can browse dryers and dried products on our Products page. For a quote or order, open the product and send an inquiry. Our team will confirm availability and final pricing.';
  if(/drying service|book|booking|crop|tomato|pepper|cassava/.test(q))return 'To request drying-as-a-service, use the Book drying service page and tell us your crop, approximate quantity, location and preferred date. Your request is confirmed only after our team follows up.';
  if(/delivery|shipping|payment|bachs|pay/.test(q))return 'Delivery costs and timing are confirmed before dispatch. BACHS online checkout is planned but is not active yet; please contact EcoDry for verified payment instructions.';
  if(/dryer|connect|technical|capacity|machine/.test(q))return 'For dryer details, capacity, support or partnership questions, visit Connect Dryer and send us a message. We will follow up with you.';
  if(/human|person|contact|phone|whatsapp|email|team/.test(q))return 'Of course. Visit the Contact page to use the contact form and see EcoDry email, phone, social and WhatsApp links once configured.';
  if(/blog|newsletter|article|learn/.test(q))return 'Visit the Blog & Newsletter page for educational posts and sign up to receive new updates by email.';
  return 'I can help with products, dryer inquiries, drying-service bookings, delivery and payment, or blog updates. Try one of the quick questions below, or use the Contact page to reach our team.';
 };
 const send=(text)=>{const t=text.trim();if(!t)return;add(t,'user');input.value='';setTimeout(()=>add(reply(t)),120);};
 launcher.addEventListener('click',()=>{panel.classList.toggle('open');if(panel.classList.contains('open')&&!messages.dataset.started){add('Hello! Welcome to EcoDry. What would you like help with today?');messages.dataset.started='1';}if(panel.classList.contains('open'))input.focus();});
 close?.addEventListener('click',()=>panel.classList.remove('open'));
 form.addEventListener('submit',e=>{e.preventDefault();send(input.value);});
 $$('.chat-quick button').forEach(b=>b.addEventListener('click',()=>send(b.textContent)));
}
