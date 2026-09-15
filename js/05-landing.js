/* ============================================================
   PAMUNGKAS — LANDING PAGE PREMIUM (Animasi & Countdown)
   Bagian dari refactor modular (dipisah dari index.html monolitik)
   Dimuat sebagai: js/05-landing.js
   ============================================================ */

/* ========== LANDING PAGE PREMIUM ========== */
(function(){
  try{
  /* Particles */
  var pc=document.getElementById('lpParticles');
  if(pc){for(var i=0;i<35;i++){var p=document.createElement('div');p.className='lp-particle';p.style.left=Math.random()*100+'%';p.style.bottom='-10px';p.style.animationDuration=(4+Math.random()*6)+'s';p.style.animationDelay=(Math.random()*5)+'s';p.style.width=p.style.height=(1+Math.random()*3)+'px';p.style.background='rgba('+(Math.random()>.5?'13,110,253':'6,182,212')+','+(0.3+Math.random()*0.5)+')';pc.appendChild(p);}}
  /* Countdown */
  var cdEl=document.getElementById('lpCountdown'),fill=document.getElementById('lpProgressFill'),landing=document.getElementById('landing-page'),app=document.getElementById('app-wrapper'),whiteOut=document.getElementById('lpWhiteOut');
  var totalDur=3000,startTime=Date.now();
  var cdArea=cdEl?cdEl.parentElement:null;
  function showCountdown(num){if(!cdEl)return;cdEl.innerHTML='<span class="cd-num">'+num+'</span>';if(!cdArea)return;var flash=document.createElement('div');flash.className='lp-flash';cdArea.appendChild(flash);setTimeout(function(){if(flash.parentNode)flash.remove();},500);}
  showCountdown(3);
  var cdIv=setInterval(function(){var elapsed=Date.now()-startTime;if(elapsed<1000)return;var sec=Math.floor(elapsed/1000);if(sec>=1&&sec<2)showCountdown(2);if(sec>=2&&sec<3)showCountdown(1);if(sec>=3)clearInterval(cdIv);},100);
  var progIv=setInterval(function(){if(!fill)return;var e=Date.now()-startTime,p=Math.min(e/totalDur*100,100);fill.style.width=p+'%';},40);

  /* Fallback: force-show app after 5s regardless */
  var fallbackTimer=setTimeout(function(){try{if(app&&!app.classList.contains('visible')){if(landing)landing.classList.add('hidden');app.classList.add('visible');app.style.display='flex';app.style.opacity='1';}clearInterval(cdIv);clearInterval(progIv);}catch(e){}},5000);

  setTimeout(function(){
    try{
    clearInterval(cdIv);clearInterval(progIv);if(fill)fill.style.width='100%';
    var content=document.querySelector('.lp-content');if(content){content.style.transition='opacity .6s ease, transform .6s ease';content.style.opacity='0';content.style.transform='translateY(-30px) scale(.98)';}
    var bg=document.querySelector('.lp-bg');if(bg){bg.style.transition='transform 1s ease, opacity 1s ease';bg.style.transform='scale(1.3)';bg.style.opacity='0';}
    setTimeout(function(){
      if(whiteOut)whiteOut.classList.add('active');
    },600);
    setTimeout(function(){
      clearTimeout(fallbackTimer);
      if(whiteOut)whiteOut.classList.remove('active');
      if(landing)landing.classList.add('hidden');
      if(app){app.classList.add('visible');}
      /* Load dashboard separately to avoid blocking transition */
      setTimeout(function(){try{loadDashboard();}catch(e){console.error('Dashboard load error:',e);}},100);
    },1100);
    }catch(e){console.error('Landing transition error:',e);clearTimeout(fallbackTimer);if(landing)landing.classList.add('hidden');if(app){app.classList.add('visible');}}
  },totalDur);
  }catch(e){console.error('Landing init error:',e);if(landing)landing.classList.add('hidden');if(app){app.classList.add('visible');}}
})();
