const app = document.querySelector("#app");
const NAV = [
  ["chronicle", "Хронология", "рейс → день 21"],
  ["death", "Катастрофа", "последние минуты"],
  ["deadworld", "Мир мёртвых", "ощущения Уильяма"],
  ["archive", "Извлечение", "работа Архива"],
  ["protocol", "Уничтожение", "Последняя страница"]
];
let archive = null;
let view = "chronicle";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const fromBase64 = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

async function decrypt(password) {
  const response = await fetch("secure/archive.enc.json", { cache: "no-store" });
  if (!response.ok) throw new Error("ARCHIVE_UNAVAILABLE");
  const payload = await response.json();
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: fromBase64(payload.salt), iterations: payload.iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(payload.iv) }, key, fromBase64(payload.ciphertext));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function renderLock(error = false) {
  app.className = "lock-shell";
  app.innerHTML = `<div class="noise"></div><section class="lock-card" aria-labelledby="lock-title">
    <div class="lock-mark" aria-hidden="true"><span>SFI</span></div><p class="kicker">SFI // SECURE ARCHIVE</p>
    <h1 id="lock-title">BLACK<br>CHRONICLE</h1><p class="lock-object">OBJECT №12 // WILLIAM ███████</p><div class="lock-divider"><span></span></div>
    <p class="lock-copy">Посмертный контур. Доступ разрешён только сотрудникам с уровнем допуска Ω.</p>
    <form class="lock-form"><label for="archive-password">КЛЮЧ ДОСТУПА</label><div class="password-row"><input id="archive-password" type="password" autocomplete="current-password" placeholder="••••••••••••••••" aria-describedby="access-status" autofocus><button type="submit" disabled aria-label="Открыть архив">→</button></div>
    <p id="access-status" class="access-status ${error ? "error" : ""}" aria-live="polite">${error ? "КЛЮЧ ОТКЛОНЁН // ДОСТУП НЕ ПРЕДОСТАВЛЕН" : "AES-256 // ЛОКАЛЬНАЯ РАСШИФРОВКА"}</p></form>
    <div class="lock-footer"><span>RECORD SFI-BC/12-21</span><span class="pulse">ENCRYPTED</span></div></section>`;
  const form = app.querySelector("form"); const input = app.querySelector("input"); const button = app.querySelector("button");
  input.addEventListener("input", () => { button.disabled = !input.value; if (error) app.querySelector("#access-status").textContent = "AES-256 // ЛОКАЛЬНАЯ РАСШИФРОВКА"; });
  form.addEventListener("submit", async (event) => { event.preventDefault(); if (!input.value) return; button.disabled = true; button.textContent = "···"; try { archive = await decrypt(input.value); renderArchive(); } catch { renderLock(true); } });
}

function chapterTemplate(chapter) {
  return `<article id="${escapeHtml(chapter.id)}" class="chapter">
    ${chapter.image ? `<figure class="chapter-image"><img src="${escapeHtml(chapter.image)}" alt="${escapeHtml(chapter.imageAlt)}"><figcaption>${escapeHtml(chapter.eyebrow)} // ВИЗУАЛЬНАЯ РЕКОНСТРУКЦИЯ</figcaption></figure>` : ""}
    <p class="eyebrow">${escapeHtml(chapter.eyebrow)}</p><h2>${escapeHtml(chapter.title)}</h2>
    <div class="prose">${chapter.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>
    ${chapter.note ? `<aside class="archive-note"><span>АРХИВНАЯ ПОМЕТКА</span>${escapeHtml(chapter.note)}</aside>` : ""}
    ${(chapter.quotes || []).map((quote) => `<blockquote><p>«${escapeHtml(quote.text)}»</p><cite>${escapeHtml(quote.speaker)}</cite></blockquote>`).join("")}
  </article>`;
}

function conclusionTemplate() { return `<section class="conclusion"><p class="eyebrow">${escapeHtml(archive.conclusion.eyebrow)}</p><h2>${escapeHtml(archive.conclusion.title)}</h2>${archive.conclusion.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}<strong>${escapeHtml(archive.conclusion.finalLine)}</strong></section>`; }
function protocolTemplate() { const p = archive.protocol; return `<section class="protocol" id="protocol"><p class="eyebrow red">${escapeHtml(p.eyebrow)}</p><h2>${escapeHtml(p.title)}</h2><p class="protocol-warning"><strong>КРИТИЧЕСКОЕ УТОЧНЕНИЕ.</strong> ${escapeHtml(p.warning)}</p><div class="steps">${p.steps.map((step) => `<article class="step"><span>${escapeHtml(step.number)}</span><div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></div></article>`).join("")}</div><div class="protocol-grid"><section class="check-panel"><p class="panel-label">ПРИЗНАКИ ЗАВЕРШЕНИЯ</p><ul>${p.success.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><section class="failure-panel"><p class="panel-label">ЕСЛИ ПОРЯДОК НАРУШЕН</p>${p.failures.map((failure) => `<div><h3>${escapeHtml(failure.title)}</h3><p>${escapeHtml(failure.text)}</p></div>`).join("")}</section></div></section>`; }

function mainTemplate() {
  return `<section class="hero"><div class="hero-grid"></div><div class="hero-content"><p class="eyebrow">${escapeHtml(archive.meta.classification)}</p><h1><span>SFI //</span>${escapeHtml(archive.meta.title)}</h1><p class="object-line">${escapeHtml(archive.meta.subtitle)}</p><p class="lead">${escapeHtml(archive.meta.lead)}</p><div class="hero-actions"><button data-view="death">ЧИТАТЬ ХРОНИКУ <span>→</span></button><button class="outline" data-view="protocol">ПРОТОКОЛ УНИЧТОЖЕНИЯ</button></div></div><div class="hero-stamp"><span>СТАТУС</span><b>DECEASED</b><small>02:17:43 // CONFIRMED</small></div></section>
  <section class="facts">${archive.facts.map((fact) => `<article><span>${escapeHtml(fact.label)}</span><strong>${escapeHtml(fact.value)}</strong></article>`).join("")}</section>
  <section class="timeline-section"><p class="eyebrow">ХРОНОЛОГИЯ // ПОСЛЕДНИЙ РЕЙС</p><h2>От взлёта до двадцать первого дня</h2><div class="timeline">${archive.timeline.map((entry) => `<article><div class="time">${escapeHtml(entry.time)}</div><div><h3>${escapeHtml(entry.title)}</h3><p>${escapeHtml(entry.text)}</p></div></article>`).join("")}</div></section>
  <section class="route-cards"><button data-view="death"><span>01</span><h3>Катастрофа</h3><p>Почему Уильям остался на борту и что произошло в 02:17:43.</p><b>ОТКРЫТЬ →</b></button><button data-view="deadworld"><span>02</span><h3>Мир мёртвых</h3><p>Двадцать один день без тела, сна и обычного времени.</p><b>ОТКРЫТЬ →</b></button><button data-view="archive"><span>03</span><h3>Извлечение</h3><p>Почему Архив смог его вернуть и откуда появилась Тень.</p><b>ОТКРЫТЬ →</b></button></section>`;
}

function contentForView() {
  if (view === "chronicle") return mainTemplate();
  if (view === "protocol") return protocolTemplate() + conclusionTemplate();
  const ids = view === "death" ? ["flight", "impact"] : view === "deadworld" ? ["deadworld", "feelings"] : ["archive", "bond"];
  return `<section class="chapters-view">${archive.chapters.filter((chapter) => ids.includes(chapter.id)).map(chapterTemplate).join("")}</section>${conclusionTemplate()}`;
}

function searchResults(query) { const q = query.trim().toLocaleLowerCase("ru"); if (!q) { app.querySelector("#view-content").innerHTML = contentForView(); bindContent(); return; } const matches = archive.chapters.filter((chapter) => `${chapter.title} ${chapter.paragraphs.join(" ")}`.toLocaleLowerCase("ru").includes(q)); app.querySelector("#view-content").innerHTML = `<section class="search-results"><p class="eyebrow">РЕЗУЛЬТАТЫ ПОИСКА // ${matches.length}</p><h1>Найденные фрагменты</h1>${matches.length ? matches.map((chapter) => `<button data-chapter="${chapter.id}"><span>${escapeHtml(chapter.eyebrow)}</span><b>${escapeHtml(chapter.title)}</b><small>${escapeHtml(chapter.paragraphs[0].slice(0,190))}…</small></button>`).join("") : `<p class="no-results">Совпадений в расшифрованной части Архива нет.</p>`}</section>`; app.querySelectorAll("[data-chapter]").forEach((button) => button.addEventListener("click", () => { const id=button.dataset.chapter; changeView(["flight","impact"].includes(id)?"death":["deadworld","feelings"].includes(id)?"deadworld":"archive"); setTimeout(()=>document.querySelector(`#${id}`)?.scrollIntoView({behavior:"smooth"}),50); })); }

function changeView(next) { view = next; renderArchive(); window.scrollTo({top:0,behavior:"smooth"}); }
function bindContent() { app.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => changeView(button.dataset.view))); }

function renderArchive() {
  app.className = "archive-shell";
  app.innerHTML = `<header class="topbar"><button class="mobile-menu" aria-expanded="false" aria-controls="archive-nav">☰<span>РАЗДЕЛЫ</span></button><div class="brand" role="button" tabindex="0"><b>SFI</b><span>BLACK CHRONICLE</span></div><div class="header-status"><span class="status-dot"></span>Ω ACCESS</div><button class="lock-button">ЗАКРЫТЬ ×</button></header>
  <aside id="archive-nav" class="sidebar"><div class="side-record"><span>RECORD</span><b>${escapeHtml(archive.meta.record)}</b></div><nav aria-label="Разделы досье">${NAV.map((item,index)=>`<button data-view="${item[0]}" class="${view===item[0]?"active":""}"><span class="nav-index">0${index+1}</span><span><b>${item[1]}</b><small>${item[2]}</small></span></button>`).join("")}</nav><div class="side-bottom"><span>EXTENDED_CANON</span><strong>DEATH CONTINUITY</strong><small>Данные расшифрованы только в памяти этого устройства.</small></div></aside><div class="mobile-overlay"></div>
  <section class="content"><div class="content-tools"><label class="search-box"><span>⌕</span><input placeholder="ПОИСК ПО РАССЕКРЕЧЕННОМУ ТЕКСТУ"></label><span class="document-code">${escapeHtml(archive.meta.record)}</span></div><div id="view-content">${contentForView()}</div><footer><span>SFI // SECURE ARCHIVE</span><span>${escapeHtml(archive.meta.canon)}</span><span>END OF DECRYPTED RECORD</span></footer></section>`;
  bindContent();
  app.querySelector(".brand").addEventListener("click",()=>changeView("chronicle"));
  app.querySelector(".brand").addEventListener("keydown",(event)=>{if(event.key==="Enter")changeView("chronicle")});
  app.querySelector(".lock-button").addEventListener("click",()=>{archive=null;renderLock()});
  const side=app.querySelector(".sidebar"), overlay=app.querySelector(".mobile-overlay"), menu=app.querySelector(".mobile-menu");
  const closeMenu=()=>{side.classList.remove("open");overlay.classList.remove("show");menu.setAttribute("aria-expanded","false")};
  menu.addEventListener("click",()=>{const open=side.classList.toggle("open");overlay.classList.toggle("show",open);menu.setAttribute("aria-expanded",String(open))}); overlay.addEventListener("click",closeMenu);
  app.querySelectorAll(".sidebar [data-view]").forEach((button)=>button.addEventListener("click",closeMenu));
  app.querySelector(".search-box input").addEventListener("input",(event)=>searchResults(event.target.value));
}

renderLock();
