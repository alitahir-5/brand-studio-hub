/* Runs inside the sandboxed preview frame. Plays window.video and exports it as MP4.
   Talks to the parent page only through postMessage. */
(function () {
  "use strict";
  const send = (m, transfer) => parent.postMessage(m, "*", transfer || []);
  const V = window.video;
  if (!V || typeof V.render !== "function") { send({ type: "error", message: "The generated code did not define `video` with a render(ctx, t) function." }); return; }
  const W = Math.round(V.width || 1920), H = Math.round(V.height || 1080), D = Math.max(1, Number(V.duration) || 10), FPS = 30;
  const canvas = document.getElementById("c"); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  let errored = false;
  function draw(t) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
    try { V.render(ctx, t); }
    catch (e) { if (!errored) { errored = true; send({ type: "error", message: String(e && e.message || e), at: t.toFixed(2) }); } }
    ctx.restore();
  }

  // ---- preview playback ----
  let playing = false, t = 0, t0 = 0, p0 = 0, raf = 0;
  function tick() {
    if (!playing) return;
    t = p0 + (performance.now() - t0) / 1000;
    if (t >= D) { t = D; playing = false; draw(D - 1e-3); send({ type: "time", t, playing: false }); return; }
    draw(t); send({ type: "time", t, playing: true }); raf = requestAnimationFrame(tick);
  }
  function play(from) { p0 = from ?? (t >= D - 0.05 ? 0 : t); t0 = performance.now(); playing = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  function pause() { if (playing) { t = p0 + (performance.now() - t0) / 1000; } playing = false; cancelAnimationFrame(raf); send({ type: "time", t, playing: false }); }
  function seek(x) { const was = playing; pause(); t = Math.max(0, Math.min(D - 1e-3, x)); draw(t); send({ type: "time", t, playing: false }); if (was) play(t); }

  // ---- export ----
  async function pickVideoCodec() {
    if (!("VideoEncoder" in window)) return null;
    const cands = [["avc", "avc1.640033"], ["avc", "avc1.640028"], ["avc", "avc1.4d0033"], ["avc", "avc1.42e033"], ["vp9", "vp09.00.41.08"]];
    for (const [mux, codec] of cands) {
      try { const s = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 14e6, framerate: FPS }); if (s.supported) return { mux, codec }; } catch (e) {}
    }
    return null;
  }
  async function pickAudioCodec(sr) {
    if (!("AudioEncoder" in window)) return null;
    for (const [mux, codec] of [["aac", "mp4a.40.2"], ["opus", "opus"]]) {
      try { const s = await AudioEncoder.isConfigSupported({ codec, sampleRate: sr, numberOfChannels: 2, bitrate: 192000 }); if (s.supported) return { mux, codec }; } catch (e) {}
    }
    return null;
  }
  async function exportMp4(audio) {
    pause();
    const vc = await pickVideoCodec();
    if (!vc || !window.Mp4Muxer) return exportRealtime();
    const ac = audio ? await pickAudioCodec(audio.sampleRate) : null;
    const target = new Mp4Muxer.ArrayBufferTarget();
    const muxer = new Mp4Muxer.Muxer({
      target, fastStart: "in-memory", firstTimestampBehavior: "offset",
      video: { codec: vc.mux, width: W, height: H, frameRate: FPS },
      audio: ac ? { codec: ac.mux, numberOfChannels: 2, sampleRate: audio.sampleRate } : undefined,
    });
    let fail = null;
    const venc = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => { fail = e; } });
    venc.configure({ codec: vc.codec, width: W, height: H, bitrate: 14e6, framerate: FPS, latencyMode: "quality" });
    const frames = Math.round(D * FPS);
    for (let i = 0; i < frames; i++) {
      if (fail) break;
      draw(i / FPS);
      const vf = new VideoFrame(canvas, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
      venc.encode(vf, { keyFrame: i % 60 === 0 }); vf.close();
      if (venc.encodeQueueSize > 6) await new Promise(r => { const chk = () => venc.encodeQueueSize > 2 ? setTimeout(chk, 4) : r(); chk(); });
      if (i % 15 === 0) send({ type: "progress", p: i / frames * 0.92 });
    }
    await venc.flush(); venc.close();
    if (fail) { send({ type: "exportError", message: String(fail.message || fail) }); return; }
    if (ac && audio) {
      const aenc = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: e => { fail = e; } });
      aenc.configure({ codec: ac.codec, sampleRate: audio.sampleRate, numberOfChannels: 2, bitrate: 192000 });
      const [L, Rr] = audio.channels, total = Math.min(L.length, Math.round(D * audio.sampleRate)), step = 4800;
      for (let s = 0; s < total; s += step) {
        const n = Math.min(step, total - s), data = new Float32Array(n * 2);
        data.set(L.subarray(s, s + n), 0); data.set(Rr.subarray(s, s + n), n);
        const ad = new AudioData({ format: "f32-planar", sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(s / audio.sampleRate * 1e6), data });
        aenc.encode(ad); ad.close();
      }
      await aenc.flush(); aenc.close();
    }
    muxer.finalize();
    send({ type: "progress", p: 1 });
    const note = vc.mux === "avc" ? "" : "Saved with VP9 video because this browser can't encode H.264. It plays in Chrome, Edge and Firefox; use Chrome or Edge for the most compatible MP4.";
    send({ type: "exported", blob: new Blob([target.buffer], { type: "video/mp4" }), ext: "mp4", note: (audio && !ac ? "This browser couldn't encode audio, so the video is silent. " : "") + note });
    seek(0);
  }
  async function exportRealtime() {
    if (!canvas.captureStream || !window.MediaRecorder) { send({ type: "exportError", message: "This browser can't export video. Use Chrome or Edge on a computer." }); return; }
    const mime = ["video/webm;codecs=vp9", "video/webm"].find(m => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(canvas.captureStream(FPS), { mimeType: mime, videoBitsPerSecond: 12e6 }), chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(r => rec.onstop = r);
    rec.start(250); const s = performance.now();
    await new Promise(res => { const loop = () => { const tt = (performance.now() - s) / 1000; if (tt >= D) { draw(D - 1e-3); res(); return; } draw(tt); send({ type: "progress", p: tt / D }); requestAnimationFrame(loop); }; loop(); });
    rec.stop(); await done;
    send({ type: "exported", blob: new Blob(chunks, { type: "video/webm" }), ext: "webm", note: "This browser can't make MP4 files, so this is a silent WebM recorded in real time. Use Chrome or Edge for MP4 with sound." });
    seek(0);
  }

  window.addEventListener("message", e => {
    const m = e.data || {};
    if (m.type === "play") play(m.t);
    else if (m.type === "pause") pause();
    else if (m.type === "seek") seek(m.t);
    else if (m.type === "export") exportMp4(m.audio).catch(err => send({ type: "exportError", message: String(err && err.message || err) }));
  });

  const fonts = ['400 20px "Arimo"', '700 20px "Arimo"', '400 20px "Cousine"', '700 20px "Cousine"', '400 20px "Noto Sans Arabic"', '400 20px "Noto Sans Bengali"'];
  const waits = fonts.map(f => document.fonts.load(f));
  if (window.FRAME && window.FRAME.decode) waits.push(window.FRAME.decode().catch(() => {}));
  Promise.race([Promise.all(waits), new Promise(r => setTimeout(r, 5000))]).finally(() => {
    draw(Math.min(D * 0.45, 8));
    const s = V.sound && (V.sound.cues || V.sound.pad) ? { cues: (V.sound.cues || []).map(c => ({ ...c })), pad: V.sound.pad || null, padGain: V.sound.padGain } : null;
    let safeSound = null; try { safeSound = s ? JSON.parse(JSON.stringify(s)) : null; } catch (e) {}
    send({ type: "ready", width: W, height: H, duration: D, title: V.title || "", sound: safeSound });
  });
})();
