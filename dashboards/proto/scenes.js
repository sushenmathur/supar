const sc=new URLSearchParams(location.search).get('scene')||'day';
const st=document.getElementById('stage');
const say=(h)=>{const d=document.createElement('div');d.innerHTML=h;st.appendChild(d.firstElementChild);};
const hi=document.querySelector('.hi>div'); const garage=document.querySelectorAll('.rm')[2]; const dd=document.querySelectorAll('.d1');
const pill=(t,c='')=>`<span class="pill ${c}"><i></i>${t}</span>`;
let g=pill('All secure')+pill('1 light on')+pill('Off-peak 14¢');
document.querySelector('.hi h1').textContent=(sc==='alert'||sc==='confirm')?'Good evening':'Good morning';
if(sc==='alert'||sc==='confirm'){document.querySelector('.hi .t').innerHTML='11:42<small>PM</small>';document.querySelector('.hi .lbl').textContent='Wednesday, 7 October';}
// glance strip
const strip=document.createElement('div');strip.className='glance';hi.appendChild(strip);
// tariff tip in energy card
const en=document.querySelector('.en');const tip=document.createElement('div');tip.className='tip';tip.innerHTML='<span style="font-size:18px">💡</span><span><b>Off-peak until 4 pm</b> · good time to run the dishwasher</span>';en.insertBefore(tip,en.querySelector('.link'));en.querySelector('.link').style.display='none';
if(sc==='warning'){
  g=pill('Front door open · 4 min','warn')+pill('1 light on')+pill('Peak 31¢');
  dd[1].classList.add('warn');dd[1].querySelector('span').textContent='Open · 4 min';dd[1].querySelector('.ok')?.classList.remove('ok');
  tip.innerHTML='<span style="font-size:18px">⚠️</span><span><b style="color:var(--warn)">Peak rate from 4 pm</b> · 31¢/kWh</span>';tip.style.background='rgba(245,158,11,.2)';tip.style.borderColor='rgba(245,158,11,.5)';
}
if(sc==='alert'||sc==='confirm'){
  g=pill('Garage open · 38 min','bad')+pill('Alarm disarmed','warn')+pill('Night 11¢');
  garage.classList.add('alert');garage.querySelector('span').textContent='Door open · 38 min';
  dd[0].classList.add('alert');dd[0].querySelector('span').textContent='Open · 38 min';
  document.getElementById('hd').style.visibility='hidden';
  say(`<div id="banner" style="display:flex"><div class="ico">${ic('garage',34)}</div><div><h2>Garage door open</h2><p>Open for 38 minutes · after dark · nobody has been in the garage</p></div><div class="btn"><div class="btn2">Snooze 30 min</div><div class="btn2 pri">Close door</div></div></div><div class="vig" style="display:block"></div>`);
  tip.style.display='none';
}
strip.innerHTML=g;
if(sc==='confirm'){
  say(`<div id="scrim" style="display:grid"><div class="g dlg"><div class="ib">${ic('garage',44)}</div><h3>Close the garage door?</h3><p>The door will start closing straight away. Make sure nothing is in the way.</p><div class="row2"><div>Cancel</div><div class="hold"><span>Hold to close</span></div></div></div></div>`);
}
if(sc==='announce'){
  say(`<div id="scrim" style="display:grid"><div class="g pop"><h3>${ic('mega',28)} Announce</h3>
  <div class="fld"><small>Speakers</small><div class="chips"><span class="on">Home speakers</span><span>Kitchen</span><span>Kids room</span><span>Garage</span></div></div>
  <div class="fld"><small>Message</small><div class="v">Dinner is ready, come to the table<span class="caret"></span></div></div>
  <div class="fld"><small>Volume · 75%</small><div class="slider"><i></i><u></u></div></div>
  <div class="row2" style="margin-top:22px"><div>Cancel</div><div class="hold" style="background:linear-gradient(135deg,#7dd3fc,#818cf8)"><span>Announce</span></div></div></div></div>`);
  document.querySelector('.hold:before');
}
if(sc==='saver'){
  say(`<div id="saver" style="display:block"><div class="drift"><div class="clock">9:49</div><div class="date">Wednesday, 7 October</div><div class="row3">
   <div class="gl">${ic('cloudsun',44)}<div><b>24.5°</b><span>Partly cloudy · feels 26°</span></div></div>
   <div class="gl">${ic('lock',36)}<div><b>All secure</b><span>Doors locked · alarm disarmed</span></div></div>
   <div class="gl">${ic('smile',36)}<div><b>Dentist, 3:30 pm</b><span>Next event</span></div></div></div></div>
   <div class="hint">Touch anywhere to wake</div></div>`);
}
if(sc==='night'){
  document.body.classList.add('night');
  document.querySelector('.hi h1').textContent='Good night';document.querySelector('.hi .t').innerHTML='10:15<small>PM</small>';
  g=pill('All secure')+pill('Night 11¢')+pill('Screen dimmed');strip.innerHTML=g;tip.style.display='none';
}
