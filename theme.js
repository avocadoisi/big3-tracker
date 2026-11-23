// テーマ(dark / light)。html[data-theme] を切り替え、選択を localStorage に保存する。
// head で同期読み込みして描画前にテーマを決める(ちらつき防止)。ボタンの配線は DOM 構築後。
(() => {
  const KEY = "big3-theme";
  const root = document.documentElement;
  const system = window.matchMedia("(prefers-color-scheme: light)");
  const ICON = {
    light: '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7"/></svg>',
    dark: '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>',
  };
  const read = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  const save = (theme) => { try { localStorage.setItem(KEY, theme); } catch { /* 保存できない環境ではその場だけ切り替える */ } };

  // 未選択なら OS の設定に従う。
  const stored = read();
  const initial = stored === "light" || stored === "dark" ? stored : system.matches ? "light" : "dark";
  root.dataset.theme = initial;

  function apply(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const next = theme === "light" ? "dark" : "light";
      button.innerHTML = `${ICON[next]}<span>${next.toUpperCase()}</span>`;
      button.setAttribute("aria-label", next === "light" ? "ライトテーマに切り替える" : "ダークテーマに切り替える");
      button.title = button.getAttribute("aria-label");
      button.setAttribute("aria-pressed", String(theme === "light"));
    });
  }

  function wire() {
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = root.dataset.theme === "light" ? "dark" : "light";
        save(next);
        apply(next);
      });
    });
    apply(root.dataset.theme);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();

  // 手動で選ぶまでは OS の変更に追従する。
  system.addEventListener("change", (event) => { if (!read()) apply(event.matches ? "light" : "dark"); });
})();
