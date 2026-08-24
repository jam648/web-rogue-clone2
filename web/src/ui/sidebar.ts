/**
 * sidebar.ts
 * Manages right-click drawer menu, authentic Jun Ohta original documentation modal with tabs, and concise quick guide
 */

import { CanvasRenderer } from '../renderer/canvasRenderer';
import { VirtualPad } from './virtualPad';
import { SaveManager } from '../storage/saveManager';
import { ScoreModal } from './scoreModal';

export class Sidebar {
  private sidebar: HTMLElement;
  private overlay: HTMLElement;
  private ohtaDocModal: HTMLElement | null;
  private historyModal: HTMLElement | null;
  private manualModal: HTMLElement | null;
  private renderer: CanvasRenderer;
  private vpad: VirtualPad;
  private scoreModal: ScoreModal;

  constructor(renderer: CanvasRenderer, vpad: VirtualPad) {
    this.sidebar = document.getElementById('sidebar')!;
    this.overlay = document.getElementById('sidebar-overlay')!;
    this.ohtaDocModal = document.getElementById('ohta-doc-modal');
    this.historyModal = document.getElementById('history-modal');
    this.manualModal = document.getElementById('manual-modal');
    this.renderer = renderer;
    this.vpad = vpad;
    this.scoreModal = new ScoreModal();

    this.setupEvents();
    this.setupOhtaTabs();
    this.applyInitialSettings();
  }

  private setupEvents() {
    // Open / Close events
    document.getElementById('btn-open-sidebar')?.addEventListener('click', () => this.open());
    document.getElementById('btn-close-sidebar')?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', () => this.close());

    // Right-click contextmenu event on window/canvas
    window.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.open();
    });

    // Toggle render mode (Top header button)
    const btnToggleRender = document.getElementById('btn-toggle-render-mode');
    btnToggleRender?.addEventListener('click', () => this.toggleRenderMode());

    // Toggle render mode (Sidebar button)
    const sidebarToggleRender = document.getElementById('sidebar-toggle-render-mode');
    sidebarToggleRender?.addEventListener('click', () => this.toggleRenderMode());

    // Toggle Virtual Pad (Top header button)
    const btnToggleVPad = document.getElementById('btn-toggle-vpad');
    btnToggleVPad?.addEventListener('click', () => this.toggleVPad());

    // Toggle Virtual Pad (Sidebar checkbox)
    const sidebarCheckVpad = document.getElementById('sidebar-check-vpad') as HTMLInputElement | null;
    sidebarCheckVpad?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      this.setVPadVisible(checked);
    });

    // Ohta Original Doc Modal triggers
    document.getElementById('btn-open-ohta-doc')?.addEventListener('click', () => this.openOhtaDoc());
    document.getElementById('btn-sidebar-open-ohta-doc')?.addEventListener('click', () => {
      this.close();
      this.openOhtaDoc();
    });
    document.getElementById('btn-close-ohta-doc')?.addEventListener('click', () => this.closeOhtaDoc());
    document.getElementById('btn-close-ohta-doc-bottom')?.addEventListener('click', () => this.closeOhtaDoc());

    // History Modal triggers
    document.getElementById('btn-sidebar-open-history')?.addEventListener('click', () => {
      this.close();
      this.openHistory();
    });
    document.getElementById('btn-close-history')?.addEventListener('click', () => this.closeHistory());
    document.getElementById('btn-close-history-bottom')?.addEventListener('click', () => this.closeHistory());

    // Concise Manual Modal triggers
    document.getElementById('btn-open-manual-top')?.addEventListener('click', () => this.openManual());
    document.getElementById('btn-sidebar-open-manual')?.addEventListener('click', () => {
      this.close();
      this.openManual();
    });
    document.getElementById('btn-close-manual')?.addEventListener('click', () => this.closeManual());
    document.getElementById('btn-close-manual-bottom')?.addEventListener('click', () => this.closeManual());

    // High Scores Modal trigger
    document.getElementById('btn-view-scores')?.addEventListener('click', () => {
      this.close();
      this.scoreModal.show();
    });
  }

  private setupOhtaTabs() {
    const tabButtons = document.querySelectorAll<HTMLButtonElement>('.ohta-tab-btn');
    const tabContents = document.querySelectorAll<HTMLElement>('.ohta-tab-content');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        if (!targetTabId) return;

        // Toggle active button style
        tabButtons.forEach((b) => {
          b.classList.remove('bg-amber-600', 'text-gray-950', 'active-tab');
          b.classList.add('bg-gray-800', 'text-gray-300');
        });
        btn.classList.remove('bg-gray-800', 'text-gray-300');
        btn.classList.add('bg-amber-600', 'text-gray-950', 'active-tab');

        // Toggle visible content
        tabContents.forEach((c) => {
          if (c.id === targetTabId) {
            c.classList.remove('hidden');
          } else {
            c.classList.add('hidden');
          }
        });
      });
    });
  }

  public openOhtaDoc() {
    this.ohtaDocModal?.classList.remove('hidden');
  }

  public closeOhtaDoc() {
    this.ohtaDocModal?.classList.add('hidden');
  }

  public openHistory() {
    this.historyModal?.classList.remove('hidden');
  }

  public closeHistory() {
    this.historyModal?.classList.add('hidden');
  }

  public openManual() {
    this.manualModal?.classList.remove('hidden');
  }

  public closeManual() {
    this.manualModal?.classList.add('hidden');
  }

  public open() {
    this.sidebar.classList.remove('translate-x-full');
    this.overlay.classList.remove('opacity-0', 'pointer-events-none');
    this.overlay.classList.add('opacity-100');
  }

  public close() {
    this.sidebar.classList.add('translate-x-full');
    this.overlay.classList.remove('opacity-100');
    this.overlay.classList.add('opacity-0', 'pointer-events-none');
  }

  public toggleRenderMode() {
    const current = this.renderer.getRenderMode();
    const next = current === 'tile' ? 'ascii' : 'tile';
    this.renderer.setRenderMode(next);

    const settings = SaveManager.getSettings();
    settings.renderMode = next;
    SaveManager.saveSettings(settings);

    this.updateRenderModeUI(next);
  }

  private updateRenderModeUI(mode: 'tile' | 'ascii') {
    const icon = document.getElementById('render-mode-icon');
    const text = document.getElementById('render-mode-text');
    const sidebarBtn = document.getElementById('sidebar-toggle-render-mode');

    if (mode === 'tile') {
      if (icon) icon.innerText = '';
      if (text) text.innerText = 'モダンタイル';
      if (sidebarBtn) sidebarBtn.innerText = 'モダンタイル';
    } else {
      if (icon) icon.innerText = '';
      if (text) text.innerText = 'クラシックASCII';
      if (sidebarBtn) sidebarBtn.innerText = 'クラシックASCII';
    }
  }

  public toggleVPad() {
    const settings = SaveManager.getSettings();
    const next = !settings.showVPad;
    this.setVPadVisible(next);
  }

  private setVPadVisible(visible: boolean) {
    this.vpad.setVisible(visible);

    const check = document.getElementById('sidebar-check-vpad') as HTMLInputElement | null;
    if (check) check.checked = visible;

    const settings = SaveManager.getSettings();
    settings.showVPad = visible;
    SaveManager.saveSettings(settings);
  }

  private applyInitialSettings() {
    const settings = SaveManager.getSettings();
    this.renderer.setRenderMode(settings.renderMode);
    this.updateRenderModeUI(settings.renderMode);
    this.setVPadVisible(settings.showVPad);
  }
}
