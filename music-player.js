(() => {
  if (window.__siteMusicPlayerLoaded) return;
  window.__siteMusicPlayerLoaded = true;

  const PLAYLIST_ID = 'PLTmtAeNORLyNsvdIKwPuwNoeN0rLiiMq0';
  const css = `
    .site-music-player{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:min(460px,calc(100% - 24px));padding:14px 16px;border-radius:20px;background:rgba(12,12,13,.9);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);box-shadow:0 18px 55px rgba(0,0,0,.45);z-index:9999;color:#fff;font-family:inherit}
    .site-music-player .mp-title{text-align:center;font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.site-music-player .mp-track{text-align:center;font-size:10px;opacity:.58;margin-top:3px}
    .site-music-player input[type=range]{display:block;width:100%;height:5px;margin:11px 0 0;appearance:none;-webkit-appearance:none;border-radius:20px;background:rgba(255,255,255,.2);outline:0;cursor:pointer}.site-music-player input[type=range]::-webkit-slider-thumb{appearance:none;width:12px;height:12px;border:0;border-radius:50%;background:#fff}.site-music-player input[type=range]::-moz-range-thumb{width:12px;height:12px;border:0;border-radius:50%;background:#fff}
    .site-music-player .mp-time{display:flex;justify-content:space-between;margin-top:5px;font-size:9px;opacity:.55}.site-music-player .mp-controls{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:10px}.site-music-player button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:#fff;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s,background .2s}.site-music-player button:hover{background:rgba(255,255,255,.18);transform:translateY(-2px)}.site-music-player button:disabled{opacity:.4;cursor:not-allowed;transform:none}.site-music-player #mp-play{width:44px;height:44px;font-size:16px;background:rgba(255,255,255,.16)}.site-music-player .mp-status{text-align:center;margin-top:6px;font-size:9px;opacity:.55;min-height:11px}.site-music-player .mp-youtube{position:absolute;width:1px;height:1px;left:-9999px;top:-9999px;opacity:0;pointer-events:none}
    @media(max-width:480px){.site-music-player{bottom:9px;width:calc(100% - 16px);padding:11px 12px;border-radius:17px}.site-music-player .mp-controls{gap:12px}.site-music-player button{width:33px;height:33px}.site-music-player #mp-play{width:41px;height:41px}.site-music-player .mp-title{font-size:12px}}
    @media(prefers-reduced-motion:reduce){.site-music-player button{transition:none}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const box = document.createElement('div');
  box.className = 'site-music-player';
  box.innerHTML = `<div class="mp-title" id="mp-title">Loading music…</div><div class="mp-track" id="mp-track">Connecting to playlist…</div><input id="mp-progress" type="range" min="0" max="100" step="0.1" value="0" aria-label="Music progress"><div class="mp-time"><span id="mp-current">0:00</span><span id="mp-duration">0:00</span></div><div class="mp-controls"><button id="mp-prev" title="Previous track" aria-label="Previous track">⏮</button><button id="mp-play" title="Play or pause" aria-label="Play or pause">▶</button><button id="mp-next" title="Next track" aria-label="Next track">⏭</button></div><div class="mp-status" id="mp-status">Preparing player…</div><div class="mp-youtube" id="mp-youtube"></div>`;
  document.body.appendChild(box);

  const $ = id => document.getElementById(id);
  let player = null, timer = null, ready = false;
  const setStatus = text => { $('mp-status').textContent = text; };
  const formatTime = value => { const s=Math.max(0,Math.floor(value||0)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };

  function updateSong(){
    if(!player || !ready) return;
    const data = player.getVideoData ? player.getVideoData() : null;
    const list = player.getPlaylist ? player.getPlaylist() : null;
    const index = player.getPlaylistIndex ? player.getPlaylistIndex() : 0;
    if(data && data.title) $('mp-title').textContent = data.title;
    if(list && list.length) $('mp-track').textContent = `Track ${Math.max(0,index+1)} of ${list.length}`;
  }

  function stopTimer(){ if(timer){clearInterval(timer);timer=null;} }
  function startTimer(){
    stopTimer();
    timer=setInterval(()=>{
      if(!player || !ready) return;
      const current=player.getCurrentTime(), duration=player.getDuration();
      if(!duration || !isFinite(duration)) return;
      $('mp-progress').value=(current/duration)*100;
      $('mp-current').textContent=formatTime(current);
      $('mp-duration').textContent=formatTime(duration);
    },500);
  }

  function onReady(){
    ready=true; setStatus('Loading playlist…');
    player.cuePlaylist({listType:'playlist',list:PLAYLIST_ID,index:0});
    let tries=0;
    const check=setInterval(()=>{
      if(!player) return;
      const list=player.getPlaylist ? player.getPlaylist() : null;
      if(list && list.length){
        clearInterval(check);
        try { player.setShuffle(true); player.setLoop(true); } catch(e) {}
        updateSong();
        setStatus(`${list.length} songs • Shuffle ready`);
      } else if(++tries>=20){ clearInterval(check); setStatus('Playlist unavailable'); }
    },500);
  }

  function onStateChange(e){
    if(e.data===YT.PlayerState.PLAYING){ $('mp-play').textContent='⏸'; updateSong(); setStatus('Playing • Shuffle'); startTimer(); }
    else if(e.data===YT.PlayerState.PAUSED){ $('mp-play').textContent='▶'; stopTimer(); setStatus('Paused'); }
    else if(e.data===YT.PlayerState.BUFFERING){ setStatus('Buffering…'); }
    else if(e.data===YT.PlayerState.ENDED){ $('mp-play').textContent='▶'; player.nextVideo(); }
    else if(e.data===YT.PlayerState.CUED){ $('mp-play').textContent='▶'; updateSong(); }
  }
  function onError(e){ setStatus('YouTube player error'); console.warn('Music player error:', e && e.data); }

  window.onYouTubeIframeAPIReady = () => {
    if(player) return;
    player = new YT.Player('mp-youtube',{width:'1',height:'1',playerVars:{controls:0,playsinline:1,rel:0,origin:location.origin},events:{onReady,onStateChange,onError}});
  };

  $('mp-play').onclick=()=>{ if(!player || !ready) return; const state=player.getPlayerState(); state===YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo(); };
  $('mp-next').onclick=()=>{ if(player && ready) player.nextVideo(); };
  $('mp-prev').onclick=()=>{ if(!player || !ready) return; player.getCurrentTime()>5 ? player.seekTo(0,true) : player.previousVideo(); };
  $('mp-progress').oninput=()=>{ if(player && ready){ const d=player.getDuration(); if(d) player.seekTo((+$('mp-progress').value/100)*d,true); } };

  const existing=document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
  if(!existing){ const s=document.createElement('script'); s.src='https://www.youtube.com/iframe_api'; s.async=true; document.head.appendChild(s); }
  else if(window.YT && window.YT.Player) window.onYouTubeIframeAPIReady();
})();