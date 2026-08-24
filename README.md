# Web版 Rogue Clone II (日本語版 運命の洞窟)

[![Deploy to GitHub Pages](https://github.com/jam648/web-rogue-clone2/actions/workflows/deploy.yml/badge.svg)](https://github.com/jam648/web-rogue-clone2/actions/workflows/deploy.yml)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](COPYING)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebAssembly](https://img.shields.io/badge/WebAssembly-Asyncify-654FF0.svg?logo=webassembly&logoColor=white)](https://webassembly.org/)

```text
 ____                         ____ _                  ___ ___ 
|  _ \ ___   __ _ _   _  ___ / ___| | ___  _ __   ___  |_ _|_ _|
| |_) / _ \ / _` | | | |/ _ \ |   | |/ _ \| '_ \ / _ \  | | | | 
|  _ < (_) | (_| | |_| |  __/ |___| | (_) | | | |  __/  | | | | 
|_| \_\___/ \__, |\__,_|\___|\____|_|\___/|_| |_|\___| |___|___|
            |___/      - 日本語版 運命の洞窟 -
```

世界三大ローグライクゲームの金字塔『**Rogue Clone II (5.4.4J)**』のC言語公式コアエンジンを、WebAssembly (Asyncify) と TypeScript によりブラウザ向けに完全移植した Web アプリケーションです。

PC・スマートフォン・タブレットのブラウザから、インストール不要でいつでも本格的なローグの世界を冒険できます。

---

## 🎮 オンラインで遊ぶ (Live Demo)

👉 **[https://jam648.github.io/web-rogue-clone2/](https://jam648.github.io/web-rogue-clone2/)**

---

## ✨ 主な特徴

* **🎨 2つの描画モード（シームレス切り替え）**
  * **クラシック ASCII**: 伝統的なターミナル表示（ピクセルパーフェクトな文字配置）。
  * **モダンタイル**: 部屋や通路、モンスター（アニメーション差分対応）、アイテムがグラフィカルに描画されるモダンモード。
* **🇯🇵 公式原典文書の完全収録**
  * 出典：太田純 氏による名著『運命の洞窟への招待』の全6章（シナリオ、画面配置、全38種コマンドの完全解説、怪物と戦闘、全品物の魔力、オプション、スコア）をアプリ内に無省略で完全収録。
* **⚡ 快適なアイテム使用（自動一覧ポップアップ）**
  * `r`（巻物を読む）や `w`（武器を手に持つ）などのコマンドを押した瞬間、袋の中にある対象アイテム一覧が画面右側に自動でポップアップ表示されます。
* **📱 スマホ・タブレット完全対応**
  * 8方向オンスクリーン仮想パッド（D-Pad）およびプレイヤー周囲タップによる移動に対応。
* **💾 パーマデス & LocalStorage オートセーブ**
  * ターン毎の非同期オートセーブおよびブラウザ終了時の保存を完備。セーブ再開時には探索済みエリアの視界（Fog of War）を完全再現。
* **🏆 冒険の殿堂（ハイスコア & 死因ログ）**
  * 歴代の最高得点、到達階層、獲得金塊、および死因の記録を保存・表示。
* **🧩 拡張性（カスタムタイル対応）**
  * `タイル設定.md` に従い、スプライトシートやタイルマップの差し替えが自由に行えます。

---

## ⌨️ 基本操作早見表

### 移動・高速移動
* **移動**: 矢印キー (`←` `↓` `↑` `→`)、テンキー (`1`〜`9`)、Viキー (`h`, `j`, `k`, `l`, `y`, `u`, `b`, `n`)
* **走る（高速移動）**: `Ctrl + 矢印キー` / `Cmd + 矢印キー` / 大文字 Viキー (`H`, `J`, `K`, `L`, `Y`, `U`, `B`, `N`)
* **足踏み・休む**: `.` (ピリオド) またはテンキー `5`

### 小文字（通常行動）
| キー | コマンド | 説明 |
| :---: | :--- | :--- |
| `w` | 武器装備 (wield) | 武器を持ち換える（一覧が自動表示） |
| `r` | 巻物を読む (read) | 魔法の巻き物を読む（一覧が自動表示） |
| `q` | 薬を飲む (quaff) | 魔法の水薬を飲む（一覧が自動表示） |
| `z` | 杖を振る (zap) | 指定方角へ杖の魔力を発射 |
| `e` | 食料を食べる (eat) | 食糧を食べる |
| `s` | 探索 (search) | 周囲の隠し扉や罠を調べる |
| `d` | 置く (drop) | 足元に持ち物を置く |
| `,` | 拾う | 足元の品物を袋に拾い上げる |
| `>` | 階段を降りる | 下の階へ進む |
| `i` | 持ち物 (inventory) | 袋の中の持ち物一覧を表示 |
| `o` | オプション設定 | カラーや移動設定の変更 |

### 大文字（重大・特殊操作）
| キー | コマンド | 説明 |
| :---: | :--- | :--- |
| `<` | 階段を登る (Shift+.) | イェンダーの魔除け入手後、地上へ脱出する |
| `W` | 鎧を着る (Shift+w) | 防具を身につける |
| `T` | 鎧を脱ぐ (Shift+t) | 防具を脱ぐ |
| `P` | 指輪をはめる (Shift+p) | 左右どちらかの手に指輪を装着 |
| `R` | 指輪を外す (Shift+r) | 装着中の指輪を外す |
| `S` | セーブ中断 (Shift+s) | ゲームを保存して中断 |
| `Q` | 冒険終了 (Shift+q) | ゲームを途中で放棄する |
| `D` | 識別一覧 (Shift+d) | 判明した巻物・薬・杖の効果一覧 |
| `F` | 決死戦闘 (Shift+f) | どちらかが倒れるまで連続攻撃 |

---

## 🛠 ローカル環境での開発・ビルド

### 動作要件
* Node.js (v18 以上推奨)
* Emscripten SDK (C言語コアを再コンパイルする場合のみ)

### 1. リポジトリのクローン & フロントエンド起動
```bash
git clone https://github.com/jam648/web-rogue-clone2.git
cd web-rogue-clone2/web
npm install
npm run dev
```
ブラウザで `http://localhost:3000` を開きます。

### 2. C言語コアエンジン (Wasm) のビルド (任意)
`src/*.c` を編集した場合は、Emscripten 環境で以下を実行します：
```bash
make -f Makefile.emscripten
```
`web/public/rogue.js` および `web/public/rogue.wasm` が再生成されます。

### 3. プロダクションビルド
```bash
npm --prefix web run build
```
`web/dist/` に公開用の静的ファイルが出力されます。

---

## 🚀 無料Web公開手順

GitHub Pages、Cloudflare Pages、Vercel 等への公開手順の詳細は、[手順.md](手順.md) をご覧ください。

---

## ☕ 開発・支援 (Support)

本プロジェクトの活動を応援していただける方は、Ko-fi にてサポートいただけますと幸いです！

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-72a4f2.svg?logo=kofi&logoColor=white)](https://ko-fi.com/V7V81VUNQV)

---

## 📜 クレジット & ライセンス

* **Rogue (Original)**: Michael Toy, Kenneth Arnold, Glenn Wichman
* **Rogue Clone II (日本語版 1.3 / 5.4.4J)**: 太田純 氏
* **データ分離版・メンテナンス・UTF-8版**: 伊藤康史 氏, FUNABARA Masao 氏, Naohiro Aota 氏, 鈴木維一郎 氏
* **WebAssembly Edition**: Wasm + TypeScript by [jam648](https://github.com/jam648)
* **ライセンス**: 本ソフトウェアは [BSD-3-Clause ライセンス](COPYING) のもとで公開されています。
