/* Atajos de presentador. No intercepta teclas mientras se escribe en un campo. */

export function initKeyboard({ director, menu, presenter, notesPanel, blackout, extraHandlers }) {
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    const typing = t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (typing) { if (e.key === 'Escape') t.blur(); return; }

    for (const h of extraHandlers) if (h(e) === true) { e.preventDefault(); return; }

    const onControl = t instanceof HTMLElement && /^(BUTTON|A|SUMMARY)$/.test(t.tagName);

    if (e.key === 'Escape') { if (menu.closeAll()) e.preventDefault(); return; }
    if (menu.isOpen()) return;

    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': case 'PageDown':
        e.preventDefault(); director.next(); break;
      case 'ArrowUp': case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); director.prev(); break;
      case ' ':
        if (onControl) return;
        e.preventDefault(); e.shiftKey ? director.prev() : director.next(); break;
      case 'Home': e.preventDefault(); director.home(); break;
      case 'End': e.preventDefault(); director.end(); break;
      case 'm': case 'M': e.preventDefault(); menu.toggleMenu(); break;
      case 'n': e.preventDefault(); presenter.openNotes(); break;
      case 'N': e.preventDefault(); notesPanel.toggle(); break;
      case 'f': case 'F': e.preventDefault(); toggleFullscreen(); break;
      case 'b': case 'B': e.preventDefault(); blackout(); break;
      case '?': e.preventDefault(); menu.toggleHelp(); break;
      default:
    }
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  else document.exitFullscreen?.();
}
