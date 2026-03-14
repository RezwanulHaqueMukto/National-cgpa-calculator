const GRADES = [
  { lg: 'A+', gp: 4.00, color: '#2ea043' },
  { lg: 'A',  gp: 3.75, color: '#3fb950' },
  { lg: 'A-', gp: 3.50, color: '#56d364' },
  { lg: 'B+', gp: 3.25, color: '#58a6ff' },
  { lg: 'B',  gp: 3.00, color: '#79c0ff' },
  { lg: 'B-', gp: 2.75, color: '#d4a017' },
  { lg: 'C+', gp: 2.50, color: '#e3b341' },
  { lg: 'C',  gp: 2.25, color: '#f0883e' },
  { lg: 'D',  gp: 2.00, color: '#ffa657' },
  { lg: 'F',  gp: 0.00, color: '#f85149' },
];

const CREDITS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

const YEAR_COLORS = ['#2ea043', '#58a6ff', '#d4a017', '#f0883e', '#a371f7', '#f78166'];

let years = [], yCounter = 0, cCounter = 0;

/* ── Helpers ── */

function byLg(lg) {
  return GRADES.find(g => g.lg === lg);
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getDivision(gpa, hasFail, hasData) {
  if (!hasData) return { label: '—', color: 'var(--muted)' };
  if (hasFail)       return { label: 'Failed',       color: '#f85149' };
  if (gpa >= 3.00)   return { label: '1st Division', color: '#2ea043' };
  if (gpa >= 2.25)   return { label: '2nd Division', color: '#d4a017' };
  if (gpa >= 2.00)   return { label: '3rd Division', color: '#f0883e' };
  return               { label: 'Fail',           color: '#f85149' };
}

/* ── Per-year GPA calc ── */

function calcYearGPA(y) {
  let pts = 0, cr = 0;
  y.courses.forEach(c => {
    const g = byLg(c.grade);
    const cv = parseFloat(c.credit) || 0;
    if (g) { pts += g.gp * cv; cr += cv; }
  });
  return { gpa: cr > 0 ? pts / cr : 0, credits: cr, courses: y.courses.length };
}

/* ── Full render ── */

function render() {
  const container = document.getElementById('yearsContainer');
  container.innerHTML = '';

  years.forEach((y, yi) => {
    const { gpa, credits, courses: cCount } = calcYearGPA(y);
    const yColor = YEAR_COLORS[yi % YEAR_COLORS.length];
    const hasFail = y.courses.some(c => c.grade === 'F');
    const div = getDivision(gpa, hasFail, credits > 0);

    // Build course rows HTML
    let coursesHTML = '';
    if (y.courses.length === 0) {
      coursesHTML = `<div class="empty-year">No courses yet. Click <strong>＋ Course</strong> above.</div>`;
    } else {
      y.courses.forEach(c => {
        const g = byLg(c.grade);
        const gc = g ? g.color : 'var(--muted)';
        coursesHTML += `
          <div class="course-row" id="crow_${c.id}">
            <div>
              <label class="field-label">Course Name</label>
              <input class="inp" type="text" placeholder="e.g. Mathematics" value="${esc(c.name)}"
                oninput="updC(${y.id}, ${c.id}, 'name', this.value)"/>
            </div>
            <div>
              <label class="field-label">Credit Hours</label>
              <select class="inp" onchange="updC(${y.id}, ${c.id}, 'credit', this.value)">
                ${CREDITS.map(v => `<option value="${v}"${c.credit == v ? ' selected' : ''}>${v} Cr</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label">Letter Grade</label>
              <select class="inp" id="gsel_${c.id}" onchange="updC(${y.id}, ${c.id}, 'grade', this.value)"
                style="border-color:${gc}99; color:${gc}; font-weight:700; font-size:.9rem;">
                ${GRADES.map(gr => `<option value="${gr.lg}"${c.grade === gr.lg ? ' selected' : ''}>${gr.lg} — GP ${gr.gp.toFixed(2)}</option>`).join('')}
              </select>
            </div>
            <button class="btn-remove" onclick="removeCourse(${y.id}, ${c.id})">✕</button>
          </div>`;
      });
    }

    const block = document.createElement('div');
    block.className = 'year-block';
    block.id = 'year_' + y.id;
    block.innerHTML = `
      <div class="year-header" onclick="toggleYear(${y.id}, event)">
        <div class="year-title-wrap">
          <div class="year-badge" style="background:${yColor}22; color:${yColor}; border:1px solid ${yColor}44">Y${yi + 1}</div>
          <input class="year-name-inp" type="text" placeholder="Year ${yi + 1} / Semester"
            value="${esc(y.name)}" onclick="event.stopPropagation()"
            oninput="updY(${y.id}, 'name', this.value)"/>
        </div>
        <div style="display:flex; align-items:center; gap:.6rem; flex-wrap:wrap;">
          <span class="year-gpa-chip"
            style="color:${credits > 0 ? div.color : 'var(--muted)'};
                   background:${credits > 0 ? div.color + '18' : 'rgba(255,255,255,.04)'};
                   border-color:${credits > 0 ? div.color + '44' : 'var(--border)'}">
            GPA ${gpa.toFixed(2)}
          </span>
          <div class="year-actions" onclick="event.stopPropagation()">
            <button class="btn btn-toggle" id="toggle_${y.id}">${y.collapsed ? '▸' : '▾'}</button>
            <button class="btn btn-remove-year" onclick="removeYear(${y.id})">🗑</button>
          </div>
        </div>
      </div>
      <div class="year-body${y.collapsed ? ' collapsed' : ''}" id="body_${y.id}">
        ${coursesHTML}
        <button class="btn btn-add-course" onclick="addCourse(${y.id})" style="width:100%;justify-content:center;margin-top:.2rem;">＋ Add Subject</button>
      </div>
      <div class="year-summary">
        <span>Courses: <b>${cCount}</b></span>
        <span>Credits: <b>${credits % 1 === 0 ? credits : credits.toFixed(1)}</b></span>
        <span>GPA: <b style="color:${credits > 0 ? div.color : 'var(--muted)'}">${gpa.toFixed(2)}</b></span>
        ${credits > 0 ? `<span>Division: <b style="color:${div.color}">${div.label}</b></span>` : ''}
      </div>
    `;
    container.appendChild(block);
  });

  calcOverall();
}

/* ── Overall CGPA ── */

function calcOverall() {
  let totalPts = 0, totalCr = 0, totalC = 0;
  years.forEach(y => {
    y.courses.forEach(c => {
      const g = byLg(c.grade);
      const cr = parseFloat(c.credit) || 0;
      if (g) { totalPts += g.gp * cr; totalCr += cr; }
      totalC++;
    });
  });

  const cgpa = totalCr > 0 ? totalPts / totalCr : 0;
  const hasFail = years.flatMap(y => y.courses).some(c => c.grade === 'F');
  const div = getDivision(cgpa, hasFail, totalCr > 0);

  const el = document.getElementById('cgpaVal');
  el.textContent = cgpa.toFixed(2);
  el.style.color = totalCr > 0 ? div.color : 'var(--accent)';

  document.getElementById('totalCredit').textContent = totalCr % 1 === 0 ? totalCr : totalCr.toFixed(1);
  document.getElementById('totalCourses').textContent = totalC;
  document.getElementById('totalYears').textContent = years.length;
  document.getElementById('creditInfo').textContent = totalCr > 0
    ? `${totalC} course${totalC !== 1 ? 's' : ''} across ${years.length} year${years.length !== 1 ? 's' : ''} · ${totalCr} credits`
    : 'Add courses to calculate';

  const badge = document.getElementById('divisionBadge');
  badge.textContent = div.label;
  badge.style.color = div.color;
  badge.style.background = div.color + '18';
  badge.style.borderColor = div.color + '44';

  const pct = (cgpa / 4) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = pct.toFixed(1) + '%';
  document.getElementById('resultCard').classList.toggle('glow', totalCr > 0);
}

/* ── Actions ── */

function addYear() {
  const n = years.length + 1;
  years.push({ id: ++yCounter, name: `Year ${n}`, collapsed: false, courses: [] });
  render();
  const y = years[years.length - 1];
  addCourse(y.id);
  addCourse(y.id);
  addCourse(y.id);
}

function removeYear(yid) {
  if (!confirm('Remove this year and all its courses?')) return;
  years = years.filter(y => y.id !== yid);
  render();
}

function toggleYear(yid) {
  const y = years.find(y => y.id === yid);
  if (!y) return;
  y.collapsed = !y.collapsed;
  const body = document.getElementById('body_' + yid);
  const btn  = document.getElementById('toggle_' + yid);
  if (body) body.classList.toggle('collapsed', y.collapsed);
  if (btn)  btn.textContent = y.collapsed ? '▸' : '▾';
}

function updY(yid, field, val) {
  const y = years.find(y => y.id === yid);
  if (y) y[field] = val;
}

function addCourse(yid) {
  const y = years.find(y => y.id === yid);
  if (!y) return;
  y.courses.push({ id: ++cCounter, name: '', credit: 4, grade: 'A+' });
  render();
  setTimeout(() => {
    const rows = document.querySelectorAll(`#body_${yid} .course-row`);
    const last = rows[rows.length - 1];
    if (last) { const inp = last.querySelector('input'); if (inp) inp.focus(); }
  }, 40);
}

function removeCourse(yid, cid) {
  const y = years.find(y => y.id === yid);
  if (!y) return;
  y.courses = y.courses.filter(c => c.id !== cid);
  render();
}

function updC(yid, cid, field, val) {
  const y = years.find(y => y.id === yid);
  if (!y) return;
  const c = years.find(y => y.id === yid)?.courses.find(c => c.id === cid);
  if (!c) return;
  c[field] = val;
  if (field === 'grade') {
    const sel = document.getElementById('gsel_' + cid);
    const g = byLg(val);
    if (sel && g) { sel.style.borderColor = g.color + '99'; sel.style.color = g.color; }
  }
  calcOverall();
  updateYearUI(y);
}

function updateYearUI(y) {
  const { gpa, credits } = calcYearGPA(y);
  const hasFail = y.courses.some(c => c.grade === 'F');
  const div = getDivision(gpa, hasFail, credits > 0);
  const block = document.getElementById('year_' + y.id);
  if (!block) return;

  const chip = block.querySelector('.year-gpa-chip');
  if (chip) {
    chip.textContent = `GPA ${gpa.toFixed(2)}`;
    chip.style.color = credits > 0 ? div.color : 'var(--muted)';
    chip.style.background = credits > 0 ? div.color + '18' : 'rgba(255,255,255,.04)';
    chip.style.borderColor = credits > 0 ? div.color + '44' : 'var(--border)';
  }

  const summary = block.querySelector('.year-summary');
  if (summary) {
    summary.innerHTML =
      `<span>Courses: <b>${y.courses.length}</b></span>` +
      `<span>Credits: <b>${credits % 1 === 0 ? credits : credits.toFixed(1)}</b></span>` +
      `<span>GPA: <b style="color:${credits > 0 ? div.color : 'var(--muted)'}">${gpa.toFixed(2)}</b></span>` +
      (credits > 0 ? `<span>Division: <b style="color:${div.color}">${div.label}</b></span>` : '');
  }
}

function resetAll() {
  if (!years.length) return;
  if (!confirm('Reset everything?')) return;
  years = []; yCounter = 0; cCounter = 0;
  render();
}

/* ── Init ── */
addYear();
