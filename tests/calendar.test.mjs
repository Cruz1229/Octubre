import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { zonedDate, unlockLimit, canReveal, normalizeState, readState, writeState, storageKey } from '../src/calendar.js';
import { movies } from '../src/movies.js';
import { movieArt } from '../src/art.js';

test('Octubre empieza en medianoche de Ciudad de México, no UTC', () => {
  assert.equal(unlockLimit(new Date('2026-10-01T05:59:59Z'), config), 0);
  assert.equal(unlockLimit(new Date('2026-10-01T06:00:00Z'), config), 2);
  assert.deepEqual(zonedDate(new Date('2026-10-02T05:59:59Z'), config.timeZone), { year: 2026, month: 10, day: 1 });
  assert.equal(unlockLimit(new Date('2026-10-02T06:00:00Z'), config), 3);
});

test('Cada día permite hoy, mañana y días anteriores, nunca días posteriores', () => {
  for (let day = 1; day <= 31; day++) {
    const now = new Date(`2026-10-${String(day).padStart(2, '0')}T18:00:00Z`);
    for (let candidate = 1; candidate <= 31; candidate++) {
      assert.equal(canReveal(candidate, now, config), candidate <= day + 1, `hoy ${day}, casilla ${candidate}`);
    }
  }
});

test('Límites de mes y año; después de octubre se conserva toda la edición', () => {
  for (const time of ['2026-09-01T18:00:00Z', '2025-12-31T18:00:00Z']) assert.equal(unlockLimit(new Date(time), config), 0);
  for (const time of ['2026-10-30T18:00:00Z', '2026-10-31T18:00:00Z', '2026-11-01T06:00:00Z', '2027-01-01T18:00:00Z']) assert.equal(unlockLimit(new Date(time), config), 31);
  for (const day of [0, -1, 32, 1.5, NaN, '1']) assert.equal(canReveal(day, new Date('2026-10-31T18:00:00Z'), config), false);
});

test('Cambiar año crea una edición independiente', () => {
  const next = { ...config, year: 2027 };
  assert.equal(unlockLimit(new Date('2026-10-15T18:00:00Z'), next), 0);
  assert.equal(unlockLimit(new Date('2027-10-15T18:00:00Z'), next), 16);
  assert.notEqual(storageKey(config), storageKey(next));
});

test('Guardar, recargar y desmarcar películas conserva el estado correcto', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  assert.deepEqual(readState(storage, config), { revealed: [], watched: [] });
  assert.equal(writeState(storage, config, { revealed: [1, 2], watched: [1] }), true);
  assert.deepEqual(readState(storage, config), { revealed: [1, 2], watched: [1] });
  writeState(storage, config, { revealed: [1, 2], watched: [] });
  assert.deepEqual(readState(storage, config), { revealed: [1, 2], watched: [] });
  assert.deepEqual(readState(storage, { ...config, year: 2027 }), { revealed: [], watched: [] });
});

test('Datos dañados y almacenamiento bloqueado no rompen el calendario', () => {
  assert.deepEqual(normalizeState({ revealed: [1, 1, 31, 32, '3', null], watched: [1, 5, 31, 31] }), { revealed: [1, 31], watched: [1, 31] });
  assert.deepEqual(normalizeState({ revealed: {}, watched: 'x' }), { revealed: [], watched: [] });
  assert.deepEqual(readState({ getItem: () => '{error' }, config), { revealed: [], watched: [] });
  assert.deepEqual(readState(undefined, config), { revealed: [], watched: [] });
  assert.equal(writeState(undefined, config, { revealed: [1], watched: [] }), false);
});

test('Lista exacta de 31 películas en el orden solicitado, con arte individual', () => {
  const expected = ['The Nightmare Before Christmas', 'Hocus Pocus 2', 'Coraline', 'Ghostbusters', 'Halloweentown', 'Hocus Pocus', 'Monster House', 'The Haunted Mansion', 'Edward Scissorhands', 'ParaNorman', 'Twitches Too', 'Van Helsing', 'The Spiderwick Chronicles', 'Frankenstein', 'Girl vs. Monster', 'Scooby-Doo', 'The Phantom of the Opera', 'Frankenweenie', 'Corpse Bride', 'Hubie Halloween', 'Sleepy Hollow', 'Casper', 'Miss Peregrine’s Home for Peculiar Children', 'Scream', 'Pan’s Labyrinth', 'Jennifer’s Body', 'Beetlejuice', 'The Addams Family', 'Halloweentown High', 'Ghostbusters: Afterlife', 'Coco'];
  assert.deepEqual(movies.map(movie => movie.title), expected);
  assert.equal(new Set(movies.map(movie => movie.motif)).size, 31);
  assert.equal(new Set(movies.map(movie => movieArt(movie.motif))).size, 31);
  movies.forEach((movie, index) => assert.equal(movie.day, index + 1));
});
