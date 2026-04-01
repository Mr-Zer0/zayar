import './style.css'
import { onAuthReady, signOut } from './auth.js'
import { saveChart, deleteChart, subscribeCharts } from './storage.js'
import { createEditor, setEditorCode } from './editor.js'
import { initMermaid, renderPreview, exportSVG, exportPNG, setTheme } from './preview.js'

const DEFAULT_CODE = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`

let currentUser = null
let currentChartId = null
let charts = []
let editorView = null
let unsubscribe = null
let previewDebounce = null
let saveDebounce = null

// ── Bootstrap ────────────────────────────────────────────────────────────────

initMermaid()

// Handle shareable link (no auth required)
if (window.location.hash) {
  try {
    const code = decodeURIComponent(atob(window.location.hash.slice(1)))
    document.getElementById('app').innerHTML = buildShareLayout()
    renderPreview(code, 'default')
  } catch {
    window.location.hash = ''
    boot()
  }
} else {
  boot()
}

function boot() {
  document.getElementById('app').innerHTML = buildAppLayout()
  wireStaticEvents()
  onAuthReady((user) => {
    currentUser = user
    if (unsubscribe) unsubscribe()
    unsubscribe = subscribeCharts(user.uid, (updated) => {
      charts = updated
      renderSidebar()
      if (!currentChartId && charts.length > 0) openChart(charts[0].id)
      else if (!currentChartId) openBlankState()
    })
  })
}

// ── Layout builders ───────────────────────────────────────────────────────────

function buildAppLayout() {
  return `
    <div id="topbar">
      <span class="app-title">FlowDraft</span>
      <div class="topbar-actions">
        <button id="copy-link-btn">Copy link</button>
        <button id="new-chart-btn">+ New chart</button>
        <button id="sign-out-btn">Sign out</button>
      </div>
    </div>
    <div id="main-layout">
      <aside id="sidebar">
        <ul id="chart-list"></ul>
      </aside>
      <section id="preview-pane">
        <div id="preview-container"></div>
        <div id="preview-error" style="display:none"></div>
        <div id="preview-controls">
          <div class="theme-btns">
            <button class="theme-btn" data-theme="default">Default</button>
            <button class="theme-btn" data-theme="forest">Forest</button>
            <button class="theme-btn" data-theme="dark">Dark</button>
            <button class="theme-btn" data-theme="neutral">Neutral</button>
          </div>
          <div class="export-btns">
            <button id="export-svg-btn">Export SVG</button>
            <button id="export-png-btn">Export PNG</button>
          </div>
        </div>
      </section>
      <section id="editor-pane">
        <div id="editor-container"></div>
      </section>
    </div>
  `
}

function buildShareLayout() {
  return `
    <div id="topbar">
      <span class="app-title">FlowDraft</span>
      <span class="share-badge">Read-only preview</span>
    </div>
    <div id="share-layout">
      <div id="preview-container"></div>
      <div id="preview-error" style="display:none"></div>
    </div>
  `
}

// ── Static event wiring ───────────────────────────────────────────────────────

function wireStaticEvents() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button')
    if (!btn) return

    if (btn.id === 'new-chart-btn') handleNewChart()
    else if (btn.id === 'copy-link-btn') handleCopyLink()
    else if (btn.id === 'sign-out-btn') signOut()
    else if (btn.id === 'export-svg-btn') exportSVG()
    else if (btn.id === 'export-png-btn') exportPNG()
    else if (btn.classList.contains('theme-btn')) handleThemeSwitch(btn.dataset.theme)
    else if (btn.classList.contains('chart-delete-btn')) handleDeleteChart(btn.dataset.id)
  })
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function renderSidebar() {
  const list = document.getElementById('chart-list')
  if (!list) return
  list.innerHTML = charts.map((c) => `
    <li class="chart-item ${c.id === currentChartId ? 'active' : ''}" data-id="${c.id}">
      <span class="chart-name" data-id="${c.id}">${escapeHtml(c.name)}</span>
      <button class="chart-delete-btn" data-id="${c.id}" title="Delete">×</button>
    </li>
  `).join('')

  list.querySelectorAll('.chart-name').forEach((el) => {
    el.addEventListener('click', () => openChart(el.dataset.id))
    el.addEventListener('dblclick', () => handleRename(el.dataset.id, el))
  })
}

// ── Chart operations ──────────────────────────────────────────────────────────

function openChart(id) {
  const chart = charts.find((c) => c.id === id)
  if (!chart) return
  currentChartId = id
  renderSidebar()

  const code = chart.code || DEFAULT_CODE
  if (!editorView) {
    editorView = createEditor(document.getElementById('editor-container'), code, onEditorChange)
  } else {
    setEditorCode(editorView, code)
  }
  renderPreview(code, chart.theme || 'default')
  highlightThemeBtn(chart.theme || 'default')
}

function openBlankState() {
  const container = document.getElementById('editor-container')
  if (!container) return
  container.innerHTML = '<p class="blank-state">No charts yet. Create one to get started.</p>'
  document.getElementById('preview-container').innerHTML = ''
}

function onEditorChange(code) {
  clearTimeout(previewDebounce)
  clearTimeout(saveDebounce)
  previewDebounce = setTimeout(() => {
    const chart = charts.find((c) => c.id === currentChartId)
    renderPreview(code, chart?.theme || 'default')
  }, 300)
  saveDebounce = setTimeout(() => {
    if (!currentUser || !currentChartId) return
    const chart = charts.find((c) => c.id === currentChartId)
    if (!chart) return
    saveChart(currentUser.uid, { ...chart, code }).catch(console.error)
  }, 1500)
}

async function handleNewChart() {
  if (!currentUser) return
  const chart = {
    id: crypto.randomUUID(),
    name: 'Untitled chart',
    code: DEFAULT_CODE,
    theme: 'default',
    createdAt: null,
    updatedAt: null,
  }
  await saveChart(currentUser.uid, chart)
  // subscribeCharts will update `charts` and trigger renderSidebar
  currentChartId = chart.id
}

async function handleDeleteChart(id) {
  if (!currentUser) return
  if (!confirm('Delete this chart?')) return
  await deleteChart(currentUser.uid, id)
  if (currentChartId === id) {
    currentChartId = null
    const next = charts.find((c) => c.id !== id)
    if (next) openChart(next.id)
    else openBlankState()
  }
}

function handleRename(id, el) {
  const chart = charts.find((c) => c.id === id)
  if (!chart) return
  el.contentEditable = 'true'
  el.focus()
  const finish = async () => {
    el.contentEditable = 'false'
    const name = el.textContent.trim() || 'Untitled chart'
    el.textContent = name
    await saveChart(currentUser.uid, { ...chart, name })
  }
  el.addEventListener('blur', finish, { once: true })
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur() } }, { once: true })
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function handleThemeSwitch(theme) {
  if (!currentUser || !currentChartId) return
  const chart = charts.find((c) => c.id === currentChartId)
  if (!chart) return
  setTheme(theme)
  highlightThemeBtn(theme)
  saveChart(currentUser.uid, { ...chart, theme }).catch(console.error)
}

function highlightThemeBtn(theme) {
  document.querySelectorAll('.theme-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.theme === theme)
  })
}

// ── Share link ────────────────────────────────────────────────────────────────

function handleCopyLink() {
  if (!currentChartId) return
  const chart = charts.find((c) => c.id === currentChartId)
  if (!chart) return
  const hash = btoa(encodeURIComponent(chart.code))
  const url = `${window.location.origin}${window.location.pathname}#${hash}`
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('copy-link-btn')
    const orig = btn.textContent
    btn.textContent = 'Copied!'
    setTimeout(() => { btn.textContent = orig }, 2000)
  })
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
