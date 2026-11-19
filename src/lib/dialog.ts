/**
 * Legacy-safe <dialog> helpers.
 *
 * Native dialogs (showModal/close, top layer, ::backdrop, focus trapping)
 * need Safari 15.4. On older WebKit the site still opens dialogs: the open
 * attribute plus the global dialog[open] CSS in global.css (fixed inset-0,
 * auto margins — the UA's own modal geometry) gives a usable overlay;
 * the backdrop dim and Esc handling simply don't exist there.
 *
 * closeModal() on the legacy path dispatches a synthetic `close` event so
 * each component's existing close listener (scroll unlock, src cleanup)
 * runs unchanged on both paths.
 */
export function dialogIsNative(dialog: HTMLDialogElement): boolean {
  return (
    typeof dialog.showModal === 'function' && typeof dialog.close === 'function'
  );
}

export function openModal(dialog: HTMLDialogElement): void {
  if (dialogIsNative(dialog)) dialog.showModal();
  else dialog.setAttribute('open', '');
}

export function closeModal(dialog: HTMLDialogElement): void {
  if (dialogIsNative(dialog)) {
    dialog.close();
  } else {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  }
}
