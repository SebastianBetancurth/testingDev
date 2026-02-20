// assets/header-mega-hover.js
(() => {
  const MQ = window.matchMedia('(min-width: 990px)');

  const closeAll = (except) => {
    document.querySelectorAll('header-menu details.mega-menu[open]').forEach((d) => {
      if (except && d === except) return;
      d.removeAttribute('open');
    });
  };

  const bind = () => {
    document.querySelectorAll('header-menu details.mega-menu').forEach((details) => {
      let t;

      const open = () => {
        if (!MQ.matches) return;
        clearTimeout(t);
        closeAll(details);
        details.setAttribute('open', '');
      };

      const close = () => {
        if (!MQ.matches) return;
        clearTimeout(t);
        t = setTimeout(() => details.removeAttribute('open'), 120);
      };

      // Hover open/close
      details.addEventListener('mouseenter', open);
      details.addEventListener('mouseleave', close);

      // Si el mouse entra al contenido, mantenelo abierto
      const content = details.querySelector('.mega-menu__content');
      if (content) {
        content.addEventListener('mouseenter', open);
        content.addEventListener('mouseleave', close);
      }

      // Click en summary: prevenir “toggle” raro en desktop (opcional)
      const summary = details.querySelector('summary');
      if (summary) {
        summary.addEventListener('click', (e) => {
          if (MQ.matches) e.preventDefault(); // desktop: no click, solo hover
        });
      }
    });

    // Cerrar si haces click fuera
    document.addEventListener('click', (e) => {
      const inside = e.target.closest('header-menu details.mega-menu');
      if (!inside) closeAll();
    });
  };

  const init = () => bind();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
