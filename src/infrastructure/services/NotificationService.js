import { INotificationService } from '../../application/ports/INotificationService.js';

/**
 * @implements {INotificationService}
 * Toast UI + Web Audio API
 */
export class NotificationService extends INotificationService {
  #audioCtx = null;
  #toastContainer = null;

  // ── Toast ─────────────────────────────────────────────────────────────────
  notify(message, type = 'info') {
    this.#ensureContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span class="toast__icon">${this.#icon(type)}</span><span>${message}</span>`;
    this.#toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast--visible'));
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3500);
  }

  // ── Audio ─────────────────────────────────────────────────────────────────
  playSound(event) {
    try {
      this.#audioCtx ??= new AudioContext();
      const sounds = {
        newOrder:   { freq: 523, duration: 0.3, type: 'sine' },
        orderReady: { freq: 659, duration: 0.5, type: 'triangle' },
        addToCart:  { freq: 440, duration: 0.15, type: 'sine' },
        success:    { freq: 784, duration: 0.4, type: 'sine' },
      };
      const cfg = sounds[event];
      if (!cfg) return;

      const osc   = this.#audioCtx.createOscillator();
      const gain  = this.#audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.#audioCtx.destination);
      osc.type           = cfg.type;
      osc.frequency.value = cfg.freq;
      gain.gain.setValueAtTime(0.3, this.#audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.#audioCtx.currentTime + cfg.duration);
      osc.start();
      osc.stop(this.#audioCtx.currentTime + cfg.duration);
    } catch {
      // Audio not critical — fail silently
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────
  #ensureContainer() {
    if (this.#toastContainer) return;
    this.#toastContainer = document.createElement('div');
    this.#toastContainer.className = 'toast-container';
    document.body.appendChild(this.#toastContainer);
  }

  #icon(type) {
    return { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' }[type] ?? 'ℹ️';
  }
}
