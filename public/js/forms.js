document.addEventListener("DOMContentLoaded",()=>{
 const booking=$("#booking-form");
 if(booking)booking.addEventListener("submit",async e=>{
  e.preventDefault();const data=Object.fromEntries(new FormData(booking).entries());
  try{const r=await api("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});showMessage(booking,r.message);booking.reset();}
  catch(err){showMessage(booking,err.message,true);}
 });
 const inquiry=$("#inquiry-form");
 if(inquiry){
  const topic=new URLSearchParams(location.search).get("topic");if(topic&&$('input[name="topic"]',inquiry))$('input[name="topic"]',inquiry).value=topic;
  inquiry.addEventListener("submit",async e=>{
   e.preventDefault();const data=Object.fromEntries(new FormData(inquiry).entries());
   try{const r=await api("/api/inquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});showMessage(inquiry,r.message);inquiry.reset();}
   catch(err){showMessage(inquiry,err.message,true);}
  });
 }
});
