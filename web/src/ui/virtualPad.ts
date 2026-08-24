/**
 * virtualPad.ts
 * On-screen touch D-Pad, Run modifier, and multi-category action palettes for mobile / tablet / web play.
 */

import { InputQueue } from '../engine/inputQueue';

export class VirtualPad {
  private container: HTMLElement;
  private inputQueue: InputQueue;
  private isFastRun = false;
  private runToggleBtn: HTMLButtonElement | null = null;

  constructor(inputQueue: InputQueue) {
    this.container = document.getElementById('virtual-pad')!;
    this.inputQueue = inputQueue;
    this.runToggleBtn = document.getElementById('vpad-toggle-run') as HTMLButtonElement | null;

    this.setupTabs();
    this.setupFastRunToggle();
    this.setupButtonEvents();
  }

  public setVisible(visible: boolean) {
    if (visible) {
      this.container.classList.remove('hidden');
      this.container.style.display = 'flex';
    } else {
      this.container.classList.add('hidden');
      this.container.style.display = 'none';
    }
  }

  private setupTabs() {
    const tabs = this.container.querySelectorAll<HTMLButtonElement>('.vpad-tab');
    const panels = this.container.querySelectorAll<HTMLElement>('.vpad-panel');

    tabs.forEach((tab) => {
      const targetPanelId = tab.dataset.panel;
      if (!targetPanelId) return;

      const activateTab = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        // Update tabs styling
        tabs.forEach((t) => {
          t.classList.remove('bg-indigo-600', 'text-white');
          t.classList.add('bg-gray-800', 'text-gray-300');
        });
        tab.classList.remove('bg-gray-800', 'text-gray-300');
        tab.classList.add('bg-indigo-600', 'text-white');

        // Show target panel
        panels.forEach((p) => {
          if (p.id === targetPanelId) {
            p.classList.remove('hidden');
            p.classList.add('grid');
          } else {
            p.classList.remove('grid');
            p.classList.add('hidden');
          }
        });
      };

      tab.addEventListener('touchstart', activateTab, { passive: false });
      tab.addEventListener('click', activateTab);
    });
  }

  private setupFastRunToggle() {
    if (!this.runToggleBtn) return;

    const toggle = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();

      this.isFastRun = !this.isFastRun;

      if (this.isFastRun) {
        this.runToggleBtn!.textContent = '走る (ON)';
        this.runToggleBtn!.classList.remove('bg-gray-800', 'text-gray-300', 'border-gray-700');
        this.runToggleBtn!.classList.add('bg-amber-600', 'text-gray-950', 'border-amber-400');
      } else {
        this.runToggleBtn!.textContent = '走る (OFF)';
        this.runToggleBtn!.classList.remove('bg-amber-600', 'text-gray-950', 'border-amber-400');
        this.runToggleBtn!.classList.add('bg-gray-800', 'text-gray-300', 'border-gray-700');
      }
    };

    this.runToggleBtn.addEventListener('touchstart', toggle, { passive: false });
    this.runToggleBtn.addEventListener('click', toggle);
  }

  private setupButtonEvents() {
    // 1. D-Pad Direction Buttons (support normal / run keys)
    const dirButtons = this.container.querySelectorAll<HTMLButtonElement>('.vpad-dir-btn');
    dirButtons.forEach((btn) => {
      const normalKey = btn.dataset.key;
      const runKey = btn.dataset.runKey || normalKey;
      if (!normalKey) return;

      const trigger = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const keyToSend = this.isFastRun ? runKey! : normalKey;
        this.inputQueue.pushKey(keyToSend);
      };

      btn.addEventListener('touchstart', trigger, { passive: false });
      btn.addEventListener('mousedown', trigger);
    });

    // 2. Generic Action Buttons
    const buttons = this.container.querySelectorAll<HTMLButtonElement>('.vpad-btn');
    buttons.forEach((btn) => {
      const rawKey = btn.dataset.key;
      if (!rawKey) return;

      const trigger = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        if (rawKey === '0o33' || rawKey === '27') {
          this.inputQueue.pushByte(27);
        } else if (rawKey === '13' || rawKey === 'Enter') {
          this.inputQueue.pushByte(13);
        } else {
          this.inputQueue.pushKey(rawKey);
        }
      };

      btn.addEventListener('touchstart', trigger, { passive: false });
      btn.addEventListener('mousedown', trigger);
    });
  }
}

