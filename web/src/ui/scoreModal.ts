/**
 * scoreModal.ts
 * Retro Terminal Modal displaying high scores and latest run results.
 */

import { SaveManager, ScoreRecord } from '../storage/saveManager';

export class ScoreModal {
  private modal: HTMLElement;
  private resultContainer: HTMLElement;
  private listContainer: HTMLElement;

  constructor() {
    this.modal = document.getElementById('score-modal')!;
    this.resultContainer = document.getElementById('latest-run-box')!;
    this.listContainer = document.getElementById('scores-list')!;

    document.getElementById('btn-close-scores')?.addEventListener('click', () => this.hide());
    document.getElementById('btn-close-scores-bottom')?.addEventListener('click', () => this.hide());
    document.getElementById('btn-view-scores')?.addEventListener('click', () => {
      this.show();
    });
  }

  public show(latestRun?: ScoreRecord) {
    this.renderLatestRun(latestRun);
    this.renderScores(latestRun);
    this.modal.classList.remove('hidden');
  }

  public hide() {
    this.modal.classList.add('hidden');
  }

  private renderLatestRun(latest?: ScoreRecord) {
    if (!this.resultContainer) return;

    if (!latest) {
      this.resultContainer.classList.add('hidden');
      this.resultContainer.innerHTML = '';
      return;
    }

    this.resultContainer.classList.remove('hidden');
    this.resultContainer.innerHTML = `
      <div class="retro-frame-inner p-3.5 rounded border border-amber-900/80 bg-amber-950/30 space-y-2">
        <div class="flex items-center justify-between border-b border-amber-900/60 pb-1 text-xs">
          <span class="text-amber-400 font-bold tracking-wider">── 冒険の結末 ──</span>
          <span class="text-gray-400 text-[11px]">${this.escapeHtml(latest.date)}</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div>
            <span class="text-gray-400 block text-[11px]">冒険者:</span>
            <span class="text-gray-100 font-bold">${this.escapeHtml(latest.name)}</span>
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">到達階層:</span>
            <span class="text-amber-300 font-bold">地下 ${latest.level} 階</span>
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">獲得金塊:</span>
            <span class="text-amber-300 font-bold">${latest.gold.toLocaleString()}</span>
          </div>
          <div>
            <span class="text-gray-400 block text-[11px]">最終得点:</span>
            <span class="text-amber-400 font-bold text-sm">${latest.score.toLocaleString()} 点</span>
          </div>
        </div>
        <div class="text-xs pt-1 border-t border-amber-900/40 flex items-start gap-1.5">
          <span class="text-red-400 font-bold whitespace-nowrap">死因:</span>
          <span class="text-gray-200">${this.escapeHtml(latest.reason || '運命の洞窟で力尽きた。')}</span>
        </div>
      </div>
    `;
  }

  private renderScores(latest?: ScoreRecord) {
    const scores = SaveManager.getScores();
    if (scores.length === 0) {
      this.listContainer.innerHTML = `
        <div class="p-6 text-center text-gray-500 retro-frame-inner rounded">
          まだ記録された冒険はありません。
        </div>
      `;
      return;
    }

    this.listContainer.innerHTML = scores
      .slice(0, 20)
      .map((s, idx) => {
        const isCurrent =
          latest &&
          latest.score === s.score &&
          latest.gold === s.gold &&
          latest.level === s.level &&
          latest.name === s.name;

        const rankBadge =
          idx === 0
            ? '<span class="text-amber-400 font-bold">#1</span>'
            : idx === 1
            ? '<span class="text-gray-300 font-bold">#2</span>'
            : idx === 2
            ? '<span class="text-amber-600 font-bold">#3</span>'
            : `<span class="text-gray-500 font-mono">#${idx + 1}</span>`;

        return `
          <div class="retro-frame-inner p-2.5 rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
            isCurrent ? 'border-amber-500/80 bg-amber-950/40' : 'border-gray-800'
          }">
            <div class="flex items-center gap-2.5">
              <div class="w-6 text-center">${rankBadge}</div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-100">${this.escapeHtml(s.name)}</span>
                  <span class="text-amber-400 font-mono font-bold">${s.score.toLocaleString()} 点</span>
                </div>
                <div class="text-[11px] text-gray-400">
                  地下${s.level}階 | 金塊: ${s.gold.toLocaleString()} | 死因: <span class="text-red-300">${this.escapeHtml(
          s.reason
        )}</span>
                </div>
              </div>
            </div>
            <div class="text-[10px] text-gray-500 text-right font-mono">
              ${this.escapeHtml(s.date)}
            </div>
          </div>
        `;
      })
      .join('');
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
