/* ==========================================================
   KaRAKuLE — Hüsnü Atik
   Bilingual Engine (EN Default / TR Switch), Behance Portfolio,
   Deep-Linking, Fullscreen Lightbox & 3D Watchtower
   ========================================================== */
(() => {
  "use strict";

  const CATS = window.KRKL_CATS || {};
  const PROJECTS = window.KRKL_PROJECTS || [];
  const I18N = window.KRKL_I18N || { en: {}, tr: {} };

  // Varsayılan dil İngilizce ("en"); ?lang= parametresi veya kayıtlı tercih önceliği alır.
  const LANG_KEY = "krkl-lang";

  function readInitialLang() {
    try {
      const fromQuery = new URLSearchParams(location.search).get("lang");
      if (fromQuery === "tr" || fromQuery === "en") return fromQuery;
      const stored = localStorage.getItem(LANG_KEY);
      if (stored === "tr" || stored === "en") return stored;
    } catch { /* localStorage kapalı olabilir */ }
    return "en";
  }

  let currentLang = readInitialLang();
  let currentCat = "all";
  let currentIdx = 0;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad2 = n => String(n).padStart(2, "0");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const t = key => (I18N[currentLang] && I18N[currentLang][key]) || (I18N.en && I18N.en[key]) || key;
  const catLabel = key => {
    const c = CATS[key];
    if (!c) return key;
    return typeof c === "object" ? (c[currentLang] || c.en || key) : c;
  };
  const projField = (p, field) => {
    if (currentLang === "en" && p[`${field}_en`] !== undefined) {
      return p[`${field}_en`];
    }
    return p[field];
  };

  // Görsel ölçüleri (js/dims.js) — yükleme sırasında zıplamayı (CLS) azaltır.
  const DIMS = window.KRKL_DIMS || {};
  const dimAttrs = src => {
    const d = DIMS[src];
    return d ? ` width="${d[0]}" height="${d[1]}"` : "";
  };

  /* ---------- Focus utilities (drawer / lightbox) ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';
  const focusables = root => $$(FOCUSABLE, root).filter(el => el.getClientRects().length > 0);

  function trapFocus(e, root) {
    if (e.key !== "Tab") return;
    const items = focusables(root);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const restoreFocus = el => {
    if (el && typeof el.focus === "function" && document.contains(el)) {
      try { el.focus({ preventScroll: true }); } catch { el.focus(); }
    }
  };

  function renderVisual(p, idx) {
    const title = projField(p, "title");
    const client = projField(p, "client");
    if (p.image) {
      return `<img src="${p.image}" alt="${title}" loading="lazy" decoding="async"${dimAttrs(p.image)}>`;
    }
    const n = pad2(idx + 1);
    return `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
      <rect width="800" height="600" fill="#151512"/>
      <g stroke="#ebe6da" stroke-opacity=".14" fill="none">
        <path d="M40 40h720v520H40zM40 300h720M400 40v520"/>
      </g>
      <rect x="384" y="284" width="32" height="32" fill="#ff4d17"/>
      <g fill="#8a877d" font-family="JetBrains Mono,monospace" font-size="14" letter-spacing="1.5">
        <text x="56" y="68">KRKL / ${n}</text>
        <text x="744" y="68" text-anchor="end">${p.year}</text>
        <text x="56" y="544">${client.toUpperCase()}</text>
      </g>
    </svg>`;
  }

  /* ---------- Loader ---------- */
  const loader = $("#loader");
  const loaderCount = $("#loaderCount");
  if (loader && loaderCount && !reducedMotion) {
    const t0 = performance.now();
    const dur = 850;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      loaderCount.textContent = String(Math.round(e * 100)).padStart(3, "0");
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        loader.classList.add("done");
        document.body.classList.remove("is-loading");
        document.body.classList.add("is-ready");
        setTimeout(() => loader.remove(), 1050);
      }
    };
    requestAnimationFrame(step);
  } else {
    loader?.remove();
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
  }

  /* ---------- Live Clock (TR) ---------- */
  const clock1 = $("#clock");
  const clock2 = $("#clock2");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function tickClock() {
    try {
      const d = new Date();
      const full = new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(d);
      if (clock1) clock1.textContent = `TR ${full}`;
      if (clock2) clock2.textContent = full.slice(0, 5);
    } catch {
      /* ignore */
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- Header & Mobile Menu ---------- */
  const hdr = $("#hdr");
  const menuBtn = $("#menuBtn");
  const navLinks = $$("#nav a");

  window.addEventListener("scroll", () => {
    hdr?.classList.toggle("scrolled", window.scrollY > 24);
  }, { passive: true });

  menuBtn?.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    document.body.classList.toggle("lock", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach(a => a.addEventListener("click", () => {
    document.body.classList.remove("menu-open", "lock");
    menuBtn?.setAttribute("aria-expanded", "false");
  }));

  /* ---------- Hero: Variable Font Pointer Interaction ---------- */
  const heroWord = $("#heroWord");
  const chars = $$(".ch", heroWord);
  if (heroWord && finePointer && !reducedMotion) {
    let targetX = 0.5;
    let curX = 0.5;
    let active = false;
    let raf = 0;

    const renderChars = () => {
      curX += (targetX - curX) * 0.12;
      const n = chars.length;
      chars.forEach((ch, i) => {
        const pos = i / (n - 1);
        const d = Math.abs(curX - pos);
        const f = active ? Math.max(0, 1 - d * 2.1) : 0;
        const wdth = Math.round(78 + f * 47);
        const wght = Math.round(680 + f * 220);
        ch.style.fontVariationSettings = `"wdth" ${wdth}, "wght" ${wght}`;
      });
      if (active || Math.abs(targetX - curX) > 0.002) {
        raf = requestAnimationFrame(renderChars);
      } else {
        chars.forEach(ch => { ch.style.fontVariationSettings = ""; });
        raf = 0;
      }
    };

    heroWord.addEventListener("pointermove", e => {
      const r = heroWord.getBoundingClientRect();
      targetX = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      active = true;
      if (!raf) raf = requestAnimationFrame(renderChars);
    });
    heroWord.addEventListener("pointerleave", () => {
      active = false;
      targetX = 0.5;
      if (!raf) raf = requestAnimationFrame(renderChars);
    });
  }

  /* ---------- Hero: 3D Signal Watchtower (Three.js — tembel yükleme) ---------- */
  const heroCanvas = $("#heroCanvas");
  const hero3DWrap = $("#hero3DWrap");

  function initWatchtower() {
    if (!heroCanvas || !window.THREE) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 1.8, 9.2);

    const renderer = new THREE.WebGLRenderer({
      canvas: heroCanvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const towerGroup = new THREE.Group();
    scene.add(towerGroup);

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x161613,
      roughness: 0.55,
      metalness: 0.45
    });
    const wireMat = new THREE.LineBasicMaterial({
      color: 0xebe6da,
      transparent: true,
      opacity: 0.16
    });
    const signalMat = new THREE.MeshBasicMaterial({
      color: 0xff4d17
    });

    const tiers = [
      { w: 1.65, h: 1.8, d: 1.65, y: -1.8 },
      { w: 1.32, h: 1.7, d: 1.32, y: -0.05 },
      { w: 1.02, h: 1.5, d: 1.02, y: 1.55 }
    ];

    tiers.forEach(tier => {
      const geo = new THREE.BoxGeometry(tier.w, tier.h, tier.d);
      const mesh = new THREE.Mesh(geo, darkMat);
      mesh.position.y = tier.y;
      towerGroup.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(edges, wireMat);
      line.position.y = tier.y;
      towerGroup.add(line);
    });

    [-0.34, 0, 0.34].forEach(xOffset => {
      const cGeo = new THREE.BoxGeometry(0.22, 0.28, 1.02);
      const cMesh = new THREE.Mesh(cGeo, darkMat);
      cMesh.position.set(xOffset, 2.44, 0);
      towerGroup.add(cMesh);

      const cLine = new THREE.LineSegments(new THREE.EdgesGeometry(cGeo), wireMat);
      cLine.position.set(xOffset, 2.44, 0);
      towerGroup.add(cLine);
    });

    const beaconGeo = new THREE.OctahedronGeometry(0.24, 0);
    const beacon = new THREE.Mesh(beaconGeo, signalMat);
    beacon.position.set(0, 2.95, 0);
    towerGroup.add(beacon);

    const ringGeo = new THREE.RingGeometry(1.45, 1.47, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff4d17,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.32
    });
    const signalRing = new THREE.Mesh(ringGeo, ringMat);
    signalRing.rotation.x = Math.PI / 2;
    signalRing.position.y = 2.95;
    towerGroup.add(signalRing);

    const ambient = new THREE.AmbientLight(0xebe6da, 0.75);
    scene.add(ambient);

    const pointLight = new THREE.PointLight(0xff4d17, 2.8, 14);
    pointLight.position.set(2.2, 3.2, 3.0);
    scene.add(pointLight);

    const rimLight = new THREE.DirectionalLight(0xebe6da, 0.9);
    rimLight.position.set(-4, 5, -3);
    scene.add(rimLight);

    const resize3D = () => {
      const wrap = $("#hero3DWrap");
      if (!wrap) return;
      const w = wrap.clientWidth || window.innerWidth;
      const h = wrap.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize3D();
    window.addEventListener("resize", resize3D);

    let mouseX = 0;
    let mouseY = 0;
    window.addEventListener("pointermove", e => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    let time = 0;
    let running = false;
    let frame = 0;

    const animate3D = () => {
      if (!running) return;
      time += 0.012;
      towerGroup.rotation.y += (mouseX * 0.55 + time * 0.35 - towerGroup.rotation.y) * 0.05;
      towerGroup.rotation.x += (mouseY * 0.18 - towerGroup.rotation.x) * 0.05;
      beacon.rotation.y = -time * 2.2;
      beacon.position.y = 2.95 + Math.sin(time * 2.5) * 0.08;
      const s = 1 + (Math.sin(time * 2) * 0.5 + 0.5) * 0.65;
      signalRing.scale.set(s, s, 1);
      ringMat.opacity = 0.38 * (1 - (s - 1) / 0.75);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate3D);
    };

    const start = () => {
      if (running) return;
      running = true;
      renderer.render(scene, camera);
      animate3D();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const heroInView = () => {
      if (!hero3DWrap) return true;
      const r = hero3DWrap.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    };

    // Hero ekran dışındayken render döngüsünü durdur (pil/CPU tasarrufu).
    if ("IntersectionObserver" in window && hero3DWrap) {
      new IntersectionObserver(entries => {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.01 }).observe(hero3DWrap);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (heroInView()) start();
    });
  }

  function towerWanted() {
    if (!heroCanvas || reducedMotion) return false;
    const conn = navigator.connection;
    if (conn && (conn.saveData || /2g$/.test(conn.effectiveType || ""))) return false;
    return true;
  }

  function loadWatchtower() {
    if (window.THREE) { initWatchtower(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    s.async = true;
    s.onload = initWatchtower;
    document.head.appendChild(s);
  }

  if (towerWanted()) {
    if ("requestIdleCallback" in window) requestIdleCallback(loadWatchtower, { timeout: 2200 });
    else setTimeout(loadWatchtower, 900);
  }

  /* ---------- Works: Filters, Showcase/Index & Hover Preview ---------- */
  const filtersEl = $("#filters");
  const worksList = $("#worksList");
  const preview = $("#preview");
  const previewIn = $("#previewIn");
  const viewBtns = $$(".view-btn");

  function renderWorksSection() {
    if (!filtersEl || !worksList) return;

    const counts = { all: PROJECTS.length };
    Object.keys(CATS).forEach(k => {
      counts[k] = PROJECTS.filter(p => p.cats.includes(k)).length;
    });

    const filterItems = [["all", t("filterAll")], ...Object.keys(CATS).filter(k => counts[k] > 0).map(k => [k, catLabel(k)])];
    filtersEl.innerHTML = filterItems
      .map(([k, label]) =>
        `<button class="filter${k === currentCat ? " on" : ""}" data-cat="${k}" type="button">${label}<sup>${pad2(counts[k])}</sup></button>`
      )
      .join("");

    worksList.innerHTML = PROJECTS.map((p, i) => {
      const catNames = p.cats.map(c => catLabel(c)).join(" · ");
      const galleryCount = Array.isArray(p.gallery) && p.gallery.length ? p.gallery.length : 1;
      const title = projField(p, "title");
      const client = projField(p, "client");
      const hidden = !(currentCat === "all" || p.cats.includes(currentCat));
      return `<li class="work rv in${hidden ? " is-hidden" : ""}" data-cats="${p.cats.join(",")}" data-idx="${i}">
        <button class="work__btn" type="button" data-cursor="${t("cursorInspect")}">
          <div class="work__thumb">
            ${renderVisual(p, i)}
            <span class="work__badge mono">${pad2(galleryCount)} ${t("badgeBoards")}</span>
          </div>
          <div class="work__info">
            <div class="work__topmeta">
              <span class="work__no mono">${pad2(i + 1)}</span>
              <span class="work__year mono">${p.year}</span>
            </div>
            <span class="work__title">${title}</span>
            <div class="work__submeta">
              <span class="work__cat mono">${catNames}</span>
              <span class="work__client mono">${client}</span>
            </div>
          </div>
        </button>
      </li>`;
    }).join("");

    if (finePointer && preview && previewIn) {
      $$(".work", worksList).forEach(li => {
        li.addEventListener("pointerenter", () => {
          if (worksList.classList.contains("is-grid")) return;
          const idx = Number(li.dataset.idx);
          previewIn.innerHTML = renderVisual(PROJECTS[idx], idx);
          preview.classList.add("on");
        });
      });
    }
  }

  if (filtersEl && worksList) {
    renderWorksSection();

    filtersEl.addEventListener("click", e => {
      const b = e.target.closest(".filter");
      if (!b) return;
      currentCat = b.dataset.cat;
      $$(".filter", filtersEl).forEach(x => x.classList.toggle("on", x === b));
      $$(".work", worksList).forEach(li => {
        const list = li.dataset.cats.split(",");
        li.classList.toggle("is-hidden", !(currentCat === "all" || list.includes(currentCat)));
      });
    });

    viewBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        viewBtns.forEach(b => {
          const active = b === btn;
          b.classList.toggle("on", active);
          b.setAttribute("aria-pressed", String(active));
        });
        worksList.classList.toggle("is-grid", view === "grid");
        preview?.classList.remove("on");
      });
    });

    if (finePointer && preview && previewIn) {
      let px = 0, py = 0, tx = 0, ty = 0, pRaf = 0;
      const movePreview = () => {
        px += (tx - px) * 0.18;
        py += (ty - py) * 0.18;
        preview.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        if (preview.classList.contains("on") || Math.hypot(tx - px, ty - py) > 0.5) {
          pRaf = requestAnimationFrame(movePreview);
        } else {
          pRaf = 0;
        }
      };

      worksList.addEventListener("pointermove", e => {
        if (worksList.classList.contains("is-grid")) {
          preview.classList.remove("on");
          return;
        }
        tx = e.clientX + 28;
        ty = e.clientY - 120;
        if (!pRaf) {
          px = tx;
          py = ty;
          pRaf = requestAnimationFrame(movePreview);
        }
      });

      worksList.addEventListener("pointerleave", () => preview.classList.remove("on"));
    }

    worksList.addEventListener("click", e => {
      const li = e.target.closest(".work");
      if (!li) return;
      openDrawer(Number(li.dataset.idx), true, li.querySelector(".work__btn"));
    });
  }

  /* ---------- Project Drawer & Deep Linking ---------- */
  const drawer = $("#drawer");
  const overlay = $("#overlay");
  const dCode = $("#dCode");
  const dTitle = $("#dTitle");
  const dBehanceLink = $("#dBehanceLink");
  const dMeta = $("#dMeta");
  const dDesc = $("#dDesc");
  const dTags = $("#dTags");
  const dGalleryCount = $("#dGalleryCount");
  const dGallery = $("#dGallery");
  const dNext = $("#dNext");
  const dNextTitle = $("#dNextTitle");
  const dPrevBtn = $("#dPrevBtn");
  const dNextBtn = $("#dNextBtn");
  const dShareBtn = $("#dShareBtn");
  const dClose = $("#dClose");
  let drawerReturnFocus = null;
  let lightboxReturnFocus = null;

  function populateDrawer(idx) {
    if (!PROJECTS.length || !drawer) return;
    currentIdx = (idx + PROJECTS.length) % PROJECTS.length;
    const p = PROJECTS[currentIdx];
    const next = PROJECTS[(currentIdx + 1) % PROJECTS.length];
    const title = projField(p, "title");
    const client = projField(p, "client");
    const role = projField(p, "role");
    const descList = projField(p, "desc") || [];
    const tagList = projField(p, "tags") || [];

    if (dCode) dCode.textContent = `KRKL / ${pad2(currentIdx + 1)} — ${p.year}`;
    if (dTitle) dTitle.textContent = title;

    if (dBehanceLink) {
      if (p.link && p.link !== "#") {
        dBehanceLink.href = p.link;
        dBehanceLink.style.display = "inline-flex";
      } else {
        dBehanceLink.style.display = "none";
      }
    }

    if (dMeta) {
      dMeta.innerHTML = `
        <div><dt class="mono">${t("metaClient")}</dt><dd>${client}</dd></div>
        <div><dt class="mono">${t("metaYear")}</dt><dd>${p.year}</dd></div>
        <div><dt class="mono">${t("metaRole")}</dt><dd>${role}</dd></div>
        <div><dt class="mono">${t("metaCat")}</dt><dd>${p.cats.map(c => catLabel(c)).join(", ")}</dd></div>
      `;
    }

    if (dDesc) {
      dDesc.innerHTML = descList.map(par => `<p>${par}</p>`).join("");
    }

    if (dTags) {
      dTags.innerHTML = tagList.map(tag => `<li>${tag}</li>`).join("");
    }

    const imgs = Array.isArray(p.gallery) && p.gallery.length
      ? p.gallery
      : (p.image ? [p.image] : []);

    if (dGalleryCount) {
      dGalleryCount.textContent = `${pad2(imgs.length)} ${t("galleryUnit")}`;
    }

    if (dGallery) {
      dGallery.innerHTML = imgs.map((src, k) => `
        <figure class="drawer__fig" data-lb-idx="${k}" data-cursor="${t("cursorZoom")}" tabindex="-1">
          <img src="${src}" alt="${title} — ${k + 1}" loading="lazy" decoding="async"${dimAttrs(src)}>
          <figcaption class="drawer__figcap mono">
            <span>${title}</span>
            <span>${t("boardWord")} ${pad2(k + 1)} / ${pad2(imgs.length)} ↗</span>
          </figcaption>
        </figure>
      `).join("");
    }

    if (dNextTitle && next) {
      dNextTitle.textContent = projField(next, "title");
    }
  }

  function openDrawer(idx, updateHash = true, trigger = null) {
    if (!PROJECTS.length || !drawer) return;
    if (!drawer.classList.contains("open")) drawerReturnFocus = trigger || document.activeElement;
    populateDrawer(idx);
    const p = PROJECTS[currentIdx];

    drawer.classList.add("open");
    overlay?.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.removeAttribute("inert");
    document.body.classList.add("lock");
    drawer.scrollTop = 0;
    dClose?.focus({ preventScroll: true });

    if (updateHash && p && p.id) {
      try {
        history.replaceState(null, "", `#work=${p.id}`);
      } catch {
        /* ignore */
      }
    }
  }

  function closeDrawer() {
    const wasOpen = Boolean(drawer?.classList.contains("open"));
    drawer?.classList.remove("open");
    overlay?.classList.remove("open");
    drawer?.setAttribute("aria-hidden", "true");
    drawer?.setAttribute("inert", "");
    document.body.classList.remove("lock");
    if (wasOpen) restoreFocus(drawerReturnFocus);
    drawerReturnFocus = null;
    if (location.hash.startsWith("#work=") || location.hash.startsWith("#is=")) {
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch {
        /* ignore */
      }
    }
  }

  dClose?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", closeDrawer);
  dNext?.addEventListener("click", () => openDrawer(currentIdx + 1));
  dNextBtn?.addEventListener("click", () => openDrawer(currentIdx + 1));
  dPrevBtn?.addEventListener("click", () => openDrawer(currentIdx - 1));

  dShareBtn?.addEventListener("click", async () => {
    const p = PROJECTS[currentIdx];
    if (!p) return;
    const shareUrl = `${location.origin}${location.pathname}#work=${p.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(t("linkCopiedToast"));
    } catch {
      showToast(shareUrl);
    }
  });

  // Check URL hash for deep-linked project (#work=slug or #is=slug)
  function checkHashDeepLink() {
    const h = location.hash || "";
    const m = h.match(/^#(?:work|is)=([a-z0-9-_]+)$/i);
    if (!m) return;
    const slug = m[1].toLowerCase();
    const foundIdx = PROJECTS.findIndex(p => p.id === slug);
    if (foundIdx !== -1) {
      openDrawer(foundIdx, false);
    }
  }
  window.addEventListener("hashchange", checkHashDeepLink);
  setTimeout(checkHashDeepLink, 150);

  /* ---------- Full-Screen Image Lightbox (Zoom) ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCaption = $("#lbCaption");
  const lbZoomBtn = $("#lbZoomBtn");
  const lbPrev = $("#lbPrev");
  const lbNext = $("#lbNext");
  const lbClose = $("#lbClose");
  const lbStage = $("#lbStage");
  let lbIdx = 0;

  function openLightbox(imgIndex) {
    const p = PROJECTS[currentIdx];
    if (!p || !lightbox || !lbImg) return;
    const imgs = Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [p.image];
    lbIdx = (imgIndex + imgs.length) % imgs.length;
    const title = projField(p, "title");
    lbImg.src = imgs[lbIdx];
    lbImg.alt = `${title} — ${lbIdx + 1}`;
    if (lbCaption) {
      lbCaption.textContent = `${title} · ${t("boardWord")} ${pad2(lbIdx + 1)} / ${pad2(imgs.length)}`;
    }
    lightbox.classList.remove("is-actual");
    if (lbZoomBtn) lbZoomBtn.textContent = "100% Zoom";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.removeAttribute("inert");
    lbClose?.focus({ preventScroll: true });
  }

  function closeLightbox() {
    const wasOpen = Boolean(lightbox?.classList.contains("open"));
    lightbox?.classList.remove("open", "is-actual");
    lightbox?.setAttribute("aria-hidden", "true");
    lightbox?.setAttribute("inert", "");
    if (wasOpen) restoreFocus(lightboxReturnFocus);
    lightboxReturnFocus = null;
  }

  dGallery?.addEventListener("click", e => {
    const fig = e.target.closest(".drawer__fig");
    if (!fig) return;
    if (!lightbox?.classList.contains("open")) lightboxReturnFocus = fig;
    openLightbox(Number(fig.dataset.lbIdx) || 0);
  });

  lbZoomBtn?.addEventListener("click", () => {
    if (!lightbox) return;
    const actual = lightbox.classList.toggle("is-actual");
    lbZoomBtn.textContent = actual ? "Fit Screen" : "100% Zoom";
  });
  lbImg?.addEventListener("click", () => lbZoomBtn?.click());
  lbPrev?.addEventListener("click", () => openLightbox(lbIdx - 1));
  lbNext?.addEventListener("click", () => openLightbox(lbIdx + 1));
  lbClose?.addEventListener("click", closeLightbox);
  lbStage?.addEventListener("click", e => {
    if (e.target === lbStage) closeLightbox();
  });

  window.addEventListener("keydown", e => {
    if (lightbox?.classList.contains("open")) {
      trapFocus(e, lightbox);
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") openLightbox(lbIdx + 1);
      if (e.key === "ArrowLeft") openLightbox(lbIdx - 1);
      return;
    }
    if (!drawer?.classList.contains("open")) return;
    trapFocus(e, drawer);
    if (e.key === "Escape") closeDrawer();
    if (e.key === "ArrowRight") openDrawer(currentIdx + 1);
    if (e.key === "ArrowLeft") openDrawer(currentIdx - 1);
  });

  /* ---------- Identity: Construction Grid & Variable Specimen ---------- */
  const guideBtn = $("#guideBtn");
  const idLogo = $("#idLogo");
  guideBtn?.addEventListener("click", () => {
    const off = idLogo.classList.toggle("guides-off");
    guideBtn.setAttribute("aria-pressed", String(!off));
    guideBtn.textContent = off ? t("idGuideOff") : t("idGuideOn");
  });

  const spec = $("#spec");
  const sW = $("#sW"), sG = $("#sG"), vW = $("#vW"), vG = $("#vG");
  const updateSpec = () => {
    if (!spec || !sW || !sG) return;
    vW.textContent = sW.value;
    vG.textContent = sG.value;
    spec.style.fontVariationSettings = `"wdth" ${sW.value}, "wght" ${sG.value}`;
  };
  sW?.addEventListener("input", updateSpec);
  sG?.addEventListener("input", updateSpec);

  /* ---------- Quick Signal / Project Brief Builder ---------- */
  const briefChips = $("#briefChips");
  const briefNote = $("#briefNote");
  const briefWaBtn = $("#briefWaBtn");
  const briefMailBtn = $("#briefMailBtn");

  briefChips?.addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    chip.classList.toggle("on");
  });

  function buildBriefMessage() {
    const selected = $$(".chip.on", briefChips).map(c => c.textContent.trim());
    const scopeStr = selected.length ? selected.join(", ") : (currentLang === "tr" ? "Genel Tasarım / Danışmanlık" : "General Design Inquiry");
    const note = briefNote?.value.trim() || "";
    if (currentLang === "tr") {
      return `Merhaba Hüsnü, KaRAKuLE portfolyo sitenden ulaşıyorum.\n\n• Kapsam: ${scopeStr}${note ? `\n• Not: ${note}` : ""}`;
    }
    return `Hello Hüsnü, reaching out via your KaRAKuLE portfolio.\n\n• Scope: ${scopeStr}${note ? `\n• Note: ${note}` : ""}`;
  }

  briefWaBtn?.addEventListener("click", () => {
    const msg = encodeURIComponent(buildBriefMessage());
    window.open(`https://wa.me/905436596634?text=${msg}`, "_blank", "noopener");
  });

  briefMailBtn?.addEventListener("click", () => {
    const subj = encodeURIComponent(currentLang === "tr" ? "KaRAKuLE — Yeni Proje Sinyali" : "KaRAKuLE — New Project Signal");
    const body = encodeURIComponent(buildBriefMessage());
    window.location.href = `mailto:husnuatik@yandex.com?subject=${subj}&body=${body}`;
  });

  /* ---------- Language Switcher (EN Default / TR Switch) ---------- */
  const langBtns = $$(".lang-btn");

  function setLanguage(lang) {
    if (!I18N[lang]) return;
    currentLang = lang;
    document.documentElement.lang = lang;
    document.title = t("pageTitle");
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* yoksay */ }

    langBtns.forEach(btn => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("on", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    $$("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (key === "idGuideOn" && idLogo?.classList.contains("guides-off")) {
        el.textContent = t("idGuideOff");
      } else {
        el.textContent = t(key);
      }
    });

    $$("[data-i18n-html]").forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });

    $$("[data-i18n-list]").forEach(ul => {
      const arr = t(ul.dataset.i18nList);
      if (Array.isArray(arr)) {
        ul.innerHTML = arr.map(item => `<li>${item}</li>`).join("");
      }
    });

    $$("[data-i18n-placeholder]").forEach(inp => {
      inp.placeholder = t(inp.dataset.i18nPlaceholder);
    });

    const mailLink = $(".contact__mail");
    if (mailLink) mailLink.dataset.cursor = t("cursorWrite");

    renderWorksSection();

    if (drawer?.classList.contains("open")) {
      populateDrawer(currentIdx);
    }
  }

  langBtns.forEach(btn => {
    btn.addEventListener("click", () => setLanguage(btn.dataset.lang));
  });

  // Kayıtlı/bağlantıdan gelen dil İngilizce değilse arayüzü o dile çevir.
  if (currentLang !== "en") setLanguage(currentLang);

  /* ---------- Copy + Toast ---------- */
  const toast = $("#toast");
  let toastTimer = 0;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("on"), 1800);
  }

  $$("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const val = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(val);
        showToast(`${val} ${t("copiedToast")}`);
      } catch {
        showToast(val);
      }
    });
  });

  /* ---------- Scroll Reveal & Stat Counters ---------- */
  const rvEls = $$(".rv");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    rvEls.forEach(el => io.observe(el));

    const countIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const target = Number(el.dataset.count) || 0;
        const t0 = performance.now();
        const step = now => {
          const p = Math.min(1, (now - t0) / 1100);
          el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    }, { threshold: 0.4 });
    $$("[data-count]").forEach(el => countIO.observe(el));
  } else {
    rvEls.forEach(el => el.classList.add("in"));
    $$("[data-count]").forEach(el => { el.textContent = el.dataset.count; });
  }

  /* ---------- Custom Cursor ---------- */
  const cursor = $("#cursor");
  const cursorLabel = $(".cursor__label", cursor);
  if (cursor && finePointer) {
    document.documentElement.classList.add("has-cursor");
    let cx = -100, cy = -100, tx = -100, ty = -100;
    window.addEventListener("pointermove", e => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });

    const loop = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    document.addEventListener("pointerover", e => {
      const labeled = e.target.closest("[data-cursor]");
      if (labeled) {
        cursorLabel.textContent = labeled.dataset.cursor;
        cursor.classList.add("big");
        cursor.classList.remove("hover");
        return;
      }
      if (e.target.closest("a, button, .sw")) {
        cursor.classList.add("hover");
        cursor.classList.remove("big");
      }
    });

    document.addEventListener("pointerout", e => {
      if (e.target.closest("[data-cursor], a, button, .sw")) {
        cursor.classList.remove("hover", "big");
      }
    });
  }
})();
