import { config } from './config.js';
import { zonedDate, unlockLimit, canReveal, readState, writeState, storageKey } from './calendar.js';
import { movies } from './movies.js';
import { movieArt } from './art.js';
import { posters } from './posters.js';

const $ = selector => document.querySelector(selector);
const dialog = $('#movie-dialog');
let storage;
try { storage = window.localStorage; } catch { /* La interfaz funciona también sin almacenamiento. */ }
let state = readState(storage, config);
let openedDay = null;
let lastDateStamp = '';
let toastTimer;
const escapeHTML = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const lock = '<svg class="lock-icon" viewBox="0 0 12 14" fill="none" aria-hidden="true"><rect x="1.5" y="6" width="9" height="7" rx="1.5" stroke="currentColor"/><path d="M3.5 6V3.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor"/><path d="M6 9v2" stroke="currentColor"/></svg>';

function notify(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 4500);
}

function persist() {
  if (!writeState(storage, config, state)) notify('Tu navegador no permite guardar. Tu progreso se conservará mientras esta página siga abierta.');
}

function palette(movie) {
  return `--film-bg:${movie.background};--film-accent:${movie.accent};--film-secondary:${movie.secondary}`;
}

function renderCalendar(now = new Date()) {
  const local = zonedDate(now, config.timeZone);
  const inEdition = local.year === config.year && local.month === config.month;
  const today = inEdition ? local.day : null;
  const limit = unlockLimit(now, config);
  lastDateStamp = `${local.year}-${local.month}-${local.day}`;
  document.querySelectorAll('.edition-year').forEach(el => { el.textContent = config.year; });
  $('#current-date').textContent = new Intl.DateTimeFormat('es-MX', { timeZone: config.timeZone, day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  const offset = (new Date(Date.UTC(config.year, config.month - 1, 1)).getUTCDay() + 6) % 7;
  let html = '<span class="empty-day" aria-hidden="true"></span>'.repeat(offset);
  for (let day = 1; day <= 31; day++) {
    const available = day <= limit;
    const revealed = available && state.revealed.includes(day);
    const watched = revealed && state.watched.includes(day);
    const isToday = day === today;
    const movie = revealed ? movies[day - 1] : null;
    const label = revealed ? movie.title : isToday ? 'Hoy' : day === today + 1 && today !== null ? 'Mañana' : available ? 'Abrir' : 'Sorpresa';
    const accessible = `${day} de octubre${isToday ? ', hoy' : ''}: ${revealed ? `${movie.title}${watched ? ', ya la vimos' : ', revelada'}` : available ? 'revelar película' : 'sorpresa bloqueada'}`;
    html += `<button class="day-cell${available ? ' is-available' : ''}${isToday ? ' is-today' : ''}${revealed ? ' is-revealed' : ''}" data-day="${day}" ${available ? '' : 'disabled'} ${movie ? `style="${palette(movie)}"` : ''} aria-label="${escapeHTML(accessible)}"${isToday ? ' aria-current="date"' : ''}><span class="day-number">${String(day).padStart(2, '0')}</span>${!available ? lock : ''}<span class="day-status">${escapeHTML(label)}</span>${watched ? '<span class="watched-badge" aria-hidden="true">✓</span>' : ''}</button>`;
  }
  $('#calendar-grid').innerHTML = html;
  const visibleRevealed = state.revealed.filter(day => day <= limit).length;
  const visibleWatched = state.watched.filter(day => day <= limit).length;
  $('#revealed-count').textContent = `${visibleRevealed} / 31 reveladas`;
  $('#watched-count').textContent = `${visibleWatched} de 31`;
  $('#progress-fill').style.width = `${visibleWatched / 31 * 100}%`;
  $('#progress-message').textContent = visibleWatched === 31 ? '31 historias. Mi favorita sigue siendo la nuestra. ♡' : visibleWatched ? `${visibleWatched} ${visibleWatched === 1 ? 'noche compartida' : 'noches compartidas'}. Y tantos recuerdos por crear.` : 'La primera noche empieza contigo.';
  $('#today-button').disabled = limit === 0;
  $('#today-button').innerHTML = limit === 0 ? `Nuestra primera cita: 1 de octubre` : `${inEdition ? 'Descubrir nuestra película' : 'Volver a nuestras películas'} <span aria-hidden="true">↗</span>`;
}

function renderMovie(day) {
  const movie = movies[day - 1];
  const watched = state.watched.includes(day);
  const next = canReveal(day + 1, new Date(), config);
  const poster = posters[day];
  dialog.setAttribute('style', palette(movie));
  $('#movie-content').innerHTML = `<article class="movie-inner cinema-ticket" data-motif="${movie.motif}">
    <header class="ticket-header"><span class="cinema-wordmark">Nuestro cine<span>♡</span></span><span class="ticket-edition">OCTUBRE ${config.year}</span></header>
    <div class="screening-layout">
      <div class="poster-stage">
        <span class="poster-orbit orbit-one" aria-hidden="true"></span><span class="poster-orbit orbit-two" aria-hidden="true"></span>
        <span class="poster-spark poster-spark-one" aria-hidden="true">✦</span><span class="poster-spark poster-spark-two" aria-hidden="true">✧</span>
        <div class="poster-frame"><div class="poster-fallback">${movieArt(movie.motif)}<span>${escapeHTML(movie.title)}</span></div>${poster ? `<img class="movie-poster" src="${escapeHTML(poster.src)}" alt="Cartel de ${escapeHTML(movie.title)} (${poster.year})" decoding="async" width="300" height="450" />` : ''}</div>
        <div class="movie-sticker" aria-hidden="true">${movieArt(movie.motif)}</div>
        <span class="poster-caption">Una cita contigo, por favor.</span>
      </div>
      <div class="movie-copy"><p class="movie-day">NOCHE ${String(day).padStart(2, '0')} DE 31 ${poster ? ` · ${poster.year}` : ''}</p><h2 id="movie-title" class="movie-title">${escapeHTML(movie.title)}</h2><p class="movie-tagline">${escapeHTML(movie.tagline)}</p><p class="movie-description">${escapeHTML(movie.description)}</p><div class="snack-card"><span aria-hidden="true">✧</span><div><small>EL COMBO DE ESTA NOCHE</small><p>${escapeHTML(movie.snack)}</p></div></div><div class="love-note-card"><span aria-hidden="true">♡</span><p class="movie-love-note">${escapeHTML(movie.loveNote)}</p></div><button class="button movie-watch" aria-pressed="${watched}">${watched ? '✓ Ya la vimos juntos' : '♡ Marcar como vista juntos'}</button></div>
    </div>
    <footer class="ticket-stub"><div class="ticket-seat"><small>ENTRADA PARA</small><strong>Tú + yo</strong></div><div class="ticket-seat"><small>EL MEJOR LUGAR</small><strong>A tu lado</strong></div><div class="ticket-number" aria-hidden="true"><span class="ticket-barcode"></span><span>OCT · ${String(day).padStart(2, '0')} · ♡</span></div></footer>
  </article>`;
  $('.movie-poster')?.addEventListener('error', event => { event.target.hidden = true; }, { once: true });
  $('.movie-watch').addEventListener('click', () => {
    if (!canReveal(day, new Date(), config)) { dialog.close(); renderCalendar(); return; }
    const isWatched = state.watched.includes(day);
    state.watched = isWatched ? state.watched.filter(d => d !== day) : [...state.watched, day];
    persist();
    renderCalendar();
    const button = $('.movie-watch');
    button.setAttribute('aria-pressed', String(!isWatched));
    button.textContent = isWatched ? '♡ Marcar como vista juntos' : '✓ Ya la vimos juntos';
  });
  $('.next-movie')?.addEventListener('click', () => openMovie(day + 1));
}

function openMovie(day) {
  if (!canReveal(day, new Date(), config)) { notify('Esta sorpresa todavía está guardando su magia.'); renderCalendar(); return; }
  openedDay = day;
  if (!state.revealed.includes(day)) { state.revealed.push(day); persist(); }
  renderCalendar();
  renderMovie(day);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  $('.dialog-close').focus({ preventScroll: true });
}

$('#calendar-grid').addEventListener('click', event => {
  const cell = event.target.closest('button[data-day]');
  if (cell) openMovie(Number(cell.dataset.day));
});
$('#today-button').addEventListener('click', () => {
  const today = zonedDate(new Date(), config.timeZone);
  openMovie(today.year === config.year && today.month === config.month ? today.day : 31);
});
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  $('#movie-content').replaceChildren();
  const day = openedDay;
  openedDay = null;
  $(`[data-day="${day}"]`)?.focus({ preventScroll: true });
});

function refreshDate() {
  const now = new Date();
  const date = zonedDate(now, config.timeZone);
  const stamp = `${date.year}-${date.month}-${date.day}`;
  if (stamp !== lastDateStamp) {
    renderCalendar(now);
    if (dialog.open && openedDay) {
      if (!canReveal(openedDay, now, config)) dialog.close();
      else renderMovie(openedDay);
    }
  }
}
setInterval(refreshDate, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDate(); });
window.addEventListener('focus', refreshDate);
window.addEventListener('storage', event => {
  if (event.key === storageKey(config) || event.key === null) {
    state = readState(storage, config);
    renderCalendar();
    if (dialog.open && openedDay) {
      if (state.revealed.includes(openedDay) && canReveal(openedDay, new Date(), config)) renderMovie(openedDay);
      else dialog.close();
    }
  }
});
renderCalendar();
