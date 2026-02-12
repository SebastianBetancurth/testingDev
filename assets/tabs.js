class Tabs extends HTMLElement {
  constructor() {
    super();
    this.titles = this.querySelectorAll("tab-title");
    this.contents = this.querySelectorAll("tab-content");

    // Link "Ver más" (opcional)
    this.moreLink = this.querySelector("[data-more-link]");
  }

  connectedCallback() {
    // Inicializa sliders de cada panel
    this.contents.forEach((panel) => this.setupPanelSlider(panel));

    // Deja el "Ver más" apuntando a la colección activa (si existe)
    this.syncMoreLinkToActive();
  }

  removeTitlesActive() {
    this.titles.forEach((t) => {
      t.removeAttribute("active");
      t.setAttribute("aria-selected", "false");
    });
  }

  removeContentActive() {
    this.contents.forEach((c) => c.removeAttribute("active"));
  }

  getActiveIndex() {
    const activeTitle = this.querySelector('tab-title[active]');
    return activeTitle ? activeTitle.getAttribute("index") : "1";
  }

  syncMoreLinkToActive() {
    if (!this.moreLink) return;

    // Buscamos el panel activo y, si hay productos/colección, ponemos un link real.
    const idx = this.getActiveIndex();
    const panel = this.querySelector(`tab-content[index="${idx}"]`);
    if (!panel) return;

    // En esta implementación, no guardamos la URL de colección en HTML.
    // Si querés que funcione igual que Adidas (ver más de esa colección),
    // lo ideal es imprimirla en Liquid como data-collection-url.
    // (Te lo dejo listo por si querés activarlo)
    const url = panel.getAttribute("data-collection-url");
    if (url) this.moreLink.href = url;
  }

setupPanelSlider(panel) {
  const slider = panel.querySelector("[data-slider]");
  const nextBtn = panel.querySelector("[data-next]");
  const scrollbar = panel.querySelector("[data-scrollbar]");
  const thumb = panel.querySelector("[data-thumb]");

  if (!slider || !scrollbar || !thumb) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const updateThumb = () => {
    const maxScroll = slider.scrollWidth - slider.clientWidth;

    // Si no hay scroll, thumb ocupa todo
    if (maxScroll <= 0) {
      thumb.style.width = "100%";
      thumb.style.transform = "translateX(0px)";
      return;
    }

    // Tamaño del thumb: proporcional a lo visible
    const visibleRatio = slider.clientWidth / slider.scrollWidth;
    const thumbWidth = Math.max(80, scrollbar.clientWidth * visibleRatio); // mínimo 80px
    thumb.style.width = `${thumbWidth}px`;

    // Posición: proporcional al scroll
    const trackMax = scrollbar.clientWidth - thumbWidth;
    const progress = slider.scrollLeft / maxScroll;
    thumb.style.transform = `translateX(${trackMax * progress}px)`;
  };

  // Botón next (opcional)
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      slider.scrollBy({ left: slider.clientWidth * 0.9, behavior: "smooth" });
    });
  }

  // Actualizar thumb al scrollear
  slider.addEventListener("scroll", updateThumb, { passive: true });

  // ✅ CLICK EN LA BARRA: salto al punto clickeado
  scrollbar.addEventListener("pointerdown", (e) => {
    // si justo clickeaste el thumb, el drag lo maneja el thumb
    if (e.target === thumb) return;

    const maxScroll = slider.scrollWidth - slider.clientWidth;
    if (maxScroll <= 0) return;

    const barRect = scrollbar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();

    const thumbWidth = thumbRect.width;
    const trackMax = barRect.width - thumbWidth;

    // x dentro de la barra, centrado para el thumb
    const x = e.clientX - barRect.left - thumbWidth / 2;
    const thumbX = clamp(x, 0, trackMax);

    // convertir thumbX → scrollLeft
    const progress = thumbX / trackMax;
    slider.scrollLeft = progress * maxScroll;

    updateThumb();
  });

  // ✅ DRAG REAL DEL THUMB
  let dragging = false;
  let startX = 0;
  let startThumbX = 0;

  const getThumbX = () => {
    // extrae el translateX actual (por si venía ya movido)
    const m = new DOMMatrixReadOnly(getComputedStyle(thumb).transform);
    return m.m41 || 0;
  };

  const onMove = (e) => {
    if (!dragging) return;

    const maxScroll = slider.scrollWidth - slider.clientWidth;
    if (maxScroll <= 0) return;

    const barRect = scrollbar.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();

    const thumbWidth = thumbRect.width;
    const trackMax = barRect.width - thumbWidth;

    const dx = e.clientX - startX;
    const newThumbX = clamp(startThumbX + dx, 0, trackMax);

    // thumbX → scrollLeft
    const progress = newThumbX / trackMax;
    slider.scrollLeft = progress * maxScroll;

    // updateThumb lo mueve visualmente
    updateThumb();
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    thumb.releasePointerCapture?.();
  };

  thumb.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;

    thumb.setPointerCapture?.(e.pointerId);

    startX = e.clientX;
    startThumbX = getThumbX();

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  });

  // Resize
  const onResize = () => updateThumb();
  window.addEventListener("resize", onResize);

  // Inicial
  updateThumb();


  // Guardar para refrescar al cambiar tab
  panel._tabsSlider = { slider, updateThumb };
  panel.querySelectorAll("img").forEach((img) => {
  if (img.complete) return;
  img.addEventListener("load", () => updateThumb(), { once: true });
});

// ✅ Recalcular si cambian tamaños (ResizeObserver)
const ro = new ResizeObserver(() => updateThumb());
ro.observe(slider);
ro.observe(scrollbar);
}


  resetActivePanelScroll(index) {
     const panel = this.querySelector(`tab-content[index="${index}"]`);
        if (!panel || !panel._tabsSlider) return;

         panel._tabsSlider.slider.scrollTo({ left: 0, behavior: "auto" });

            requestAnimationFrame(() => {
             panel._tabsSlider.updateThumb();
  });
  }
}

class TabTitle extends HTMLElement {
  constructor() {
    super();
    this.tabsContainer = this.closest("tabs-container");
  }

  connectedCallback() {
    this.addEventListener("click", () => {
      // 1) Activar título
      this.tabsContainer.removeTitlesActive();
      this.setAttribute("active", "");
      this.setAttribute("aria-selected", "true");

      // 2) Activar panel correspondiente
      this.tabsContainer.removeContentActive();
      const idx = this.getAttribute("index");
      const activeContent = this.tabsContainer.querySelector(`tab-content[index="${idx}"]`);
      if (activeContent) activeContent.setAttribute("active", "");

      // 3) Como en el video: al cambiar tab, arrancás desde el inicio del carrusel
      this.tabsContainer.resetActivePanelScroll(idx);

      // 4) Actualiza el “Ver más” si lo usás
      this.tabsContainer.syncMoreLinkToActive();
    });
  }
}

class TabContent extends HTMLElement {}

customElements.define("tabs-container", Tabs);
customElements.define("tab-title", TabTitle);
customElements.define("tab-content", TabContent);
