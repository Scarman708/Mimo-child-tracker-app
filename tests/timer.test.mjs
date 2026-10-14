const t = await import('../src/lib/timer.ts');
const min = 60000; const T0 = Date.UTC(2026, 9, 14, 10, 0, 0);
let ok = true; const eq = (name, a, b) => { const pass = JSON.stringify(a) === JSON.stringify(b); if (!pass) ok = false; console.log(pass ? 'PASS' : 'FAIL', name, pass ? '' : `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`); };

// 1. Spec example: left 12 min + right 7 min = 19 min, switching doesn't double count
let left = t.resumeSegs([], T0);                       // left starts 10:00
left = t.pauseSegs(left, T0 + 12 * min);               // switch side at 10:12
let right = t.resumeSegs([], T0 + 12 * min);           // right starts 10:12
right = t.pauseSegs(right, T0 + 19 * min);             // finish 10:19
eq('left 12 min', t.durationMs(left, T0 + 99 * min), 12 * min);
eq('right 7 min', t.durationMs(right, T0 + 99 * min), 7 * min);
eq('total 19 min', t.durationMs(left, 0) + t.durationMs(right, 0), 19 * min);

// 2. Pause excluded: run 5, pause 10, run 5 => 10 min
let s = t.resumeSegs([], T0); s = t.pauseSegs(s, T0 + 5 * min); s = t.resumeSegs(s, T0 + 15 * min);
eq('pause excluded (running)', t.durationMs(s, T0 + 20 * min), 10 * min);
eq('isRunning', t.isRunning(s), true);

// 3. Process death / restart: serialise, parse, still correct 30 min later
const revived = JSON.parse(JSON.stringify(s));
eq('survives restart', t.durationMs(revived, T0 + 45 * min), 5 * min + 30 * min);

// 4. Spec example nap 10:45 -> 12:00 = 1 h 15 min
const nap = [{ start: T0 + 45 * min, end: T0 + 120 * min }];
eq('nap 1h15', t.formatDuration(t.durationMs(nap, 0)), '1 h 15 min');

// 5. Crosses midnight (local midnight irrelevant: epoch math)
const night = [{ start: Date.UTC(2026, 9, 14, 21, 30), end: Date.UTC(2026, 9, 15, 6, 15) }];
eq('night crosses midnight', t.formatDuration(t.durationMs(night, 0)), '8 h 45 min');

// 6. Clock moved backwards never yields negative time
eq('negative clamp', t.durationMs([{ start: T0 + 10 * min, end: null }], T0), 0);

// 7. Idempotent pause/resume
eq('pause twice', t.pauseSegs(t.pauseSegs(s, T0 + 30 * min), T0 + 40 * min).length, 2);
eq('resume twice', t.resumeSegs(t.resumeSegs([], T0), T0 + min).length, 1);

// 8. Formatting
eq('clock 83s', t.formatClock(83000), '01:23'); eq('clock 1:02:05', t.formatClock(3725000), '1:02:05');
eq('dur 40s', t.formatDuration(40000), '40 s'); eq('dur 2h', t.formatDuration(120 * min), '2 h'); eq('dur 59.6 min', t.formatDuration(59.6 * min), '1 h');
console.log(ok ? '\nALL PASSED' : '\nSOME FAILED');
