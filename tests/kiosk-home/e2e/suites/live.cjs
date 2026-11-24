
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', PAGE = BASE + (process.env.SINGLE ? '/local/' + (process.env.NAME || 'kiosk-home') + '.html' : '/local/' + (process.env.NAME || 'kiosk-home') + '/index.html');
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} ${n}${x ? ' (' + x + ')' : ''}`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream'] });
  // The "camera": a page that answers WebRTC offers relayed by the mock, sending a canvas video.
  const cam = await b.newPage();
  await cam.goto(BASE + '/local/kiosk-home/config.js');
  await cam.evaluate(() => new Promise((ready) => {
    const ws = new WebSocket(location.origin.replace(/^http/, 'ws') + '/api/websocket');
    const canvas = Object.assign(document.createElement('canvas'), { width: 320, height: 180 });
    const g = canvas.getContext('2d'); let n = 0; setInterval(() => { g.fillStyle = `hsl(${(n += 7) % 360} 70% 50%)`; g.fillRect(0, 0, 320, 180); }, 50);
    const track = canvas.captureStream(20).getVideoTracks()[0];
    let pc = null;
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'camera-peer' })); ready(); };
    ws.onmessage = async (e) => {
      const m = JSON.parse(e.data);
      if (m.offer) {
        pc = new RTCPeerConnection();
        pc.onicecandidate = (ev) => { if (ev.candidate) ws.send(JSON.stringify({ candidate: ev.candidate.toJSON() })); };
        await pc.setRemoteDescription({ type: 'offer', sdp: m.offer });
        pc.getTransceivers().forEach((t) => { if (t.receiver.track.kind === 'video') { t.direction = 'sendonly'; t.sender.replaceTrack(track); } });
        const ans = await pc.createAnswer(); await pc.setLocalDescription(ans);
        ws.send(JSON.stringify({ answer: ans.sdp }));
      } else if (m.candidate && pc) await pc.addIceCandidate(m.candidate);
    };
  }));
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text()));
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE + '#security'); await sleep(1300);
  const playing = () => p.waitForFunction(() => { const v = document.querySelector('#sheet #live video'); return v && v.currentTime > 0.3 && v.videoWidth > 0; }, null, { timeout: 20000 }).then(() => true, () => false);
  // WebRTC camera (patio)
  await p.locator('#subview [data-arg="camera.patio_live_view"]').click();
  const w = await playing();
  const wv = await p.evaluate(() => { const v = document.querySelector('#sheet #live video'); return { w: v?.videoWidth, src: !!v?.srcObject, status: document.querySelector('#sheet #live').dataset.status }; });
  check('WebRTC camera plays live video', w && wv.src && wv.w === 320 && wv.status === '', JSON.stringify(wv));
  await p.keyboard.press('Escape'); await sleep(400);
  check('peer connection closed with the pop-up', await p.evaluate(() => !document.querySelector('#sheet').open));
  // HLS camera (front door)
  await p.locator('#subview [data-arg="camera.front_door_live_view_2"]').click();
  const h = await playing();
  check('HLS camera plays live video', h, await p.evaluate(() => document.querySelector('#sheet #live')?.dataset.status));
  await p.keyboard.press('Escape'); await sleep(400);
  // Camera whose stream HA refuses: falls back with the reason on screen
  await p.locator('#subview [data-arg="camera.garage_live_view"]').click(); await sleep(1500);
  const st = await p.evaluate(() => document.querySelector('#sheet #live').dataset.status);
  check('refused stream shows HA\'s reason', /start_stream_failed: Arlo did not return a stream URL/.test(st), st);
  await p.keyboard.press('Escape');
  console.log(R.join('\n'));
  await b.close();
})();
