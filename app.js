// SierraMaría — la galleta en vivo, la tira del hero y las entradas.
// Sin script la página se lee completa y los botones abren WhatsApp con un mensaje general.

const WA = "573107929595";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- entradas: una vez, nunca dejan contenido escondido ---------- */
(() => {
  const els = document.querySelectorAll("[data-reveal], [data-watch]");
  const show = (el) => el.classList.add("is-in");
  if (!("IntersectionObserver" in window)) { els.forEach(show); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
  els.forEach((el) => io.observe(el));
  addEventListener("load", () => setTimeout(() => {
    els.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) show(el); });
  }, 2500));
})();

/* ---------- la tira de fotos dentro de la frase: cada pedido entra con un barrido ---------- */
(() => {
  const frames = [...document.querySelectorAll(".hero .strip-frame")];
  if (frames.length < 2 || reduce) return;
  let i = 0, timer = null, visible = true;
  const next = () => {
    frames.forEach((f) => f.classList.remove("was-on"));
    frames[i].classList.remove("is-on");
    frames[i].classList.add("was-on");
    i = (i + 1) % frames.length;
    frames[i].querySelector("img").loading = "eager";
    frames[i].classList.add("is-on");
  };
  const start = () => { if (!timer && visible && !document.hidden) timer = setInterval(next, 3200); };
  const stop = () => { clearInterval(timer); timer = null; };
  setTimeout(start, 1800);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(document.querySelector(".hero"));
  }
})();

/* ---------- la barra acompaña el scroll: se compacta y marca la sección ---------- */
(() => {
  const bar = document.getElementById("topbar");
  if (!bar) return;
  const onScroll = () => bar.classList.toggle("is-scrolled", scrollY > 16);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const links = [...bar.querySelectorAll("[data-spy]")];
  const ink = bar.querySelector(".nav-ink");
  const nav = bar.querySelector(".top-nav");
  const place = (a) => {
    if (!ink) return;
    if (!a || !a.offsetParent) { ink.style.opacity = "0"; return; }
    const n = nav.getBoundingClientRect(), r = a.getBoundingClientRect();
    ink.style.opacity = "1";
    ink.style.transform = `translateX(${r.left - n.left}px) scaleX(${r.width})`;
  };
  let active = null;
  const setActive = (id) => {
    active = links.find((l) => l.dataset.spy === id) || null;
    links.forEach((l) => l.classList.toggle("is-active", l === active));
    if (active) active.setAttribute("aria-current", "true");
    links.filter((l) => l !== active).forEach((l) => l.removeAttribute("aria-current"));
    place(active);
  };
  if ("IntersectionObserver" in window) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
      const hit = links.map((l) => l.dataset.spy).find((id) => seen.get(id));
      setActive(hit || null);
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((l) => { const s = document.getElementById(l.dataset.spy); if (s) io.observe(s); });
  }
  addEventListener("resize", () => place(active));
  document.fonts && document.fonts.ready.then(() => place(active));
})();

/* ---------- la vitrina corre más rápido cuando bajas, y retrocede cuando subes ---------- */
(() => {
  const track = document.querySelector(".vitrina-track");
  if (!track || reduce || !track.getAnimations) return;
  let anim = null, rate = 1, target = 1, last = scrollY, running = false, visible = true;
  const loop = () => {
    if (!anim) anim = track.getAnimations()[0] || null;
    target += (1 - target) * 0.06;
    rate += (target - rate) * 0.12;
    if (anim) anim.playbackRate = rate;
    if (visible || Math.abs(rate - 1) > 0.02) requestAnimationFrame(loop); else running = false;
  };
  addEventListener("scroll", () => {
    const dy = scrollY - last; last = scrollY;
    target = Math.max(-5, Math.min(7, 1 + dy * 0.22));
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });
  if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(track);
})();

/* ---------- ocasiones: el índice cambia la foto grande ---------- */
(() => {
  const items = [...document.querySelectorAll(".occ-item")];
  const stage = document.querySelector(".occ-stage");
  if (!items.length || !stage) return;
  const imgs = [...stage.querySelectorAll(".occ-img")];
  const word = document.getElementById("occ-word");
  const go = document.getElementById("occ-go");
  const phone = matchMedia("(max-width: 47.99em)");
  let current = items[0], top = imgs[0], token = 0;

  const showPhoto = (src, alt) => {
    const t = ++token;
    if (reduce) { top.src = src; top.alt = alt; return; }
    const next = imgs.find((im) => im !== top);
    const swap = () => {
      if (t !== token) return;
      next.alt = alt;
      const old = imgs.find((im) => im !== next);
      old.classList.remove("is-in"); old.classList.add("is-on");
      next.classList.remove("is-on", "is-in"); void next.offsetWidth;
      next.classList.add("is-in");
      top = next;
      const settle = () => {
        if (t !== token || next.classList.contains("is-on")) return;
        next.classList.add("is-on"); next.classList.remove("is-in");
        old.classList.remove("is-on"); old.alt = "";
      };
      next.addEventListener("animationend", settle, { once: true });
      setTimeout(settle, 1000);
    };
    if (next.getAttribute("src") === src && next.complete) swap();
    else { next.onload = swap; next.src = src; }
  };

  const select = (item) => {
    if (item === current) return;
    current.setAttribute("aria-pressed", "false");
    item.setAttribute("aria-pressed", "true");
    current = item;
    const label = item.dataset.label;
    showPhoto(item.dataset.src, `Galletas y cupcakes personalizados para ${label}.`);
    word.textContent = label;
    if (!reduce) { word.classList.remove("is-in"); void word.offsetWidth; word.classList.add("is-in"); }
    go.dataset.occasion = item.dataset.occasion;
  };

  items.forEach((item) => {
    item.addEventListener("click", () => {
      select(item);
    });
    item.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse" && !phone.matches) select(item); });
    item.addEventListener("focus", () => { if (!phone.matches) select(item); });
  });

  if ("IntersectionObserver" in window) {
    // al bajar por la lista, la ocasión que cruza el centro de la pantalla toma la foto
    const io = new IntersectionObserver((entries) => {
      if (phone.matches) return;
      const hit = entries.filter((e) => e.isIntersecting).pop();
      if (hit) select(hit.target);
    }, { rootMargin: "-46% 0px -46% 0px" });
    items.forEach((i) => io.observe(i));
    // precarga las fotos cuando la sección se acerca
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      items.forEach((i) => { const im = new Image(); im.src = i.dataset.src; });
      o.disconnect();
    }, { rootMargin: "600px 0px" }).observe(stage);
  }
})();

/* ---------- el video solo corre cuando se ve ---------- */
(() => {
  const vids = document.querySelectorAll("video.step-media");
  if (!vids.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting && !reduce) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
    }
  }, { threshold: 0.15 });
  vids.forEach((v) => { if (reduce) v.removeAttribute("autoplay"); io.observe(v); });
})();

/* ---------- tu logo, en galleta ---------- */
(() => {
  const form = document.getElementById("builder");
  const cookie = document.getElementById("cookie");
  if (!form || !cookie) return;
  const $ = (id) => document.getElementById(id);
  const name = $("f-name"), file = $("f-logo"), occ = $("f-occ"), qty = $("f-qty"), date = $("f-date");
  const send = $("send"), ribbonName = $("ribbon-name"), hint = $("ribbon-hint"), fileName = $("h-logo");
  const text = $("print-text"), img = $("print-img"), bow = $("bow"), desc = $("cookie-desc");
  const radios = [...form.querySelectorAll('input[name="cinta"]')];
  let logo = null;

  // hoy en Bogotá, para que no se pueda pedir para ayer
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  date.min = today;

  const hexToRgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const rgbToHex = (rgb) => "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
  const darken = (h, f) => rgbToHex(hexToRgb(h).map((v) => v * (1 - f)));
  const lum = (h) => { const [r, g, b] = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const current = () => radios.find((r) => r.checked) || radios[0];

  // el nombre en la cubierta: una o dos líneas, del tamaño que quepa
  const NS = "http://www.w3.org/2000/svg";
  const setPrintText = (value) => {
    const words = (value.trim() || "Tu marca").split(/\s+/);
    text.textContent = "";
    text.setAttribute("font-size", 60);
    const lines = [];
    if (words.length > 1 && words.join(" ").length > 11) {
      let best = 1, diff = Infinity;
      for (let k = 1; k < words.length; k++) {
        const d = Math.abs(words.slice(0, k).join(" ").length - words.slice(k).join(" ").length);
        if (d < diff) { diff = d; best = k; }
      }
      lines.push(words.slice(0, best).join(" "), words.slice(best).join(" "));
    } else lines.push(words.join(" "));
    lines.forEach((l, n) => {
      const t = document.createElementNS(NS, "tspan");
      t.setAttribute("x", 300);
      t.setAttribute("dy", lines.length === 1 ? 0 : n === 0 ? "-0.55em" : "1.1em");
      t.textContent = l;
      text.appendChild(t);
    });
    let widest = 0;
    text.querySelectorAll("tspan").forEach((t) => { try { widest = Math.max(widest, t.getComputedTextLength()); } catch (e) {} });
    const max = lines.length === 1 ? 250 : 236;
    const size = widest ? Math.max(22, Math.min(lines.length === 1 ? 74 : 56, (60 * max) / widest)) : 60;
    text.setAttribute("font-size", size.toFixed(1));
  };

  const fmtDate = (v) => {
    if (!v) return "por definir";
    const [y, m, d] = v.split("-").map(Number);
    return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
  };

  const message = () => {
    const r = current();
    const n = Math.max(1, parseInt(qty.value, 10) || 0);
    return [
      "Hola SierraMaría, quiero cotizar galletas personalizadas.",
      `Empresa o evento: ${name.value.trim() || "por confirmar"}`,
      `Ocasión: ${occ.value}`,
      `Cantidad: ${qty.value ? n : "por definir"} galletas`,
      `Color de la cinta: ${r.value}`,
      `Fecha: ${fmtDate(date.value)}`,
      logo ? "Ya tengo el logo listo, te lo envío por aquí." : "Te envío el logo por aquí.",
    ].join("\n");
  };

  const update = () => {
    const r = current();
    const hex = r.dataset.hex;
    cookie.style.setProperty("--ribbon", hex);
    cookie.style.setProperty("--ribbon-dark", darken(hex, 0.22));
    cookie.style.setProperty("--print", lum(hex) > 0.36 ? "#2b1720" : hex);
    ribbonName.textContent = r.value;
    send.href = `https://wa.me/${WA}?text=${encodeURIComponent(message())}`;
    desc.textContent = `Galleta redonda con ${logo ? "tu logo" : `el nombre «${name.value.trim() || "Tu marca"}»`} impreso, en bolsa transparente cerrada con moño ${r.value}.`;
  };

  const tie = () => { if (reduce) return; bow.classList.remove("tie"); void bow.getBBox(); bow.classList.add("tie"); };
  const pop = (el) => { if (reduce) return; el.classList.remove("pop"); void el.getBBox(); el.classList.add("pop"); };

  // el color dominante del logo, para sugerir la cinta
  const suggestRibbon = (src) => new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = c.height = 64;
        const g = c.getContext("2d", { willReadFrequently: true });
        g.drawImage(im, 0, 0, 64, 64);
        const px = g.getImageData(0, 0, 64, 64).data;
        const buckets = new Map();
        for (let i = 0; i < px.length; i += 4) {
          const [r, gg, b, a] = [px[i], px[i + 1], px[i + 2], px[i + 3]];
          if (a < 200) continue;
          const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 510, s = mx === mn ? 0 : (mx - mn) / 255 / (1 - Math.abs(2 * l - 1));
          if (l > 0.9 || (s < 0.22 && l > 0.25)) continue; // fondo blanco y grises claros no cuentan
          const key = s < 0.22 ? "dark" : Math.round(((Math.atan2(Math.sqrt(3) * (gg - b), 2 * r - gg - b) * 180) / Math.PI + 360) % 360 / 24);
          const k = buckets.get(key) || { n: 0, r: 0, g: 0, b: 0 };
          k.n++; k.r += r; k.g += gg; k.b += b; buckets.set(key, k);
        }
        const top = [...buckets.values()].sort((a, b) => b.n - a.n)[0];
        if (!top || top.n < 12) return resolve(null);
        const avg = [top.r / top.n, top.g / top.n, top.b / top.n];
        let best = null, bd = Infinity;
        for (const rd of radios) {
          const [r, g2, b] = hexToRgb(rd.dataset.hex);
          const d = 2 * (r - avg[0]) ** 2 + 4 * (g2 - avg[1]) ** 2 + 3 * (b - avg[2]) ** 2;
          if (d < bd) { bd = d; best = rd; }
        }
        resolve(best);
      } catch (e) { resolve(null); }
    };
    im.onerror = () => resolve(null);
    im.src = src;
  });

  name.addEventListener("input", () => { if (!logo) setPrintText(name.value); update(); });
  [occ, qty, date].forEach((el) => el.addEventListener("input", update));
  radios.forEach((r) => r.addEventListener("change", () => { hint.textContent = ""; update(); tie(); }));

  file.addEventListener("change", () => {
    const f = file.files && file.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { fileName.textContent = "Ese archivo no es una imagen. Prueba con PNG, JPG o SVG."; return; }
    const reader = new FileReader();
    reader.onload = async () => {
      logo = reader.result;
      img.setAttribute("href", logo);
      img.setAttribute("visibility", "visible");
      text.setAttribute("visibility", "hidden");
      fileName.textContent = f.name.length > 34 ? f.name.slice(0, 31) + "…" : f.name;
      pop(img);
      const pick = await suggestRibbon(logo);
      if (pick && !pick.checked) {
        pick.checked = true;
        hint.textContent = `Elegimos ${pick.value} por el color de tu logo. Cámbialo si quieres.`;
        tie();
      }
      update();
    };
    reader.readAsDataURL(f);
  });

  // tocar una ocasión la lleva a la galleta
  document.querySelectorAll("[data-occasion]").forEach((a) => a.addEventListener("click", () => {
    occ.value = a.dataset.occasion;
    update();
    pop(text.getAttribute("visibility") === "hidden" ? img : text);
  }));

  document.fonts && document.fonts.ready.then(() => setPrintText(name.value));
  setPrintText(name.value);
  update();
})();
