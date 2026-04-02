import './style.css'
import { onAuthReady, signOut } from './auth.js'
import { subscribeProjects, saveProject, deleteProject, subscribeCharts, saveChart, deleteChart } from './storage.js'
import { createEditor, setEditorCode } from './editor.js'
import { initMermaid, renderPreview, exportSVG, exportPNG, setTheme } from './preview.js'

const DEFAULT_CODE = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`

let currentUser = null
let currentProjectId = null
let currentChartId = null
let projects = []
let charts = []
let editorView = null
let projectsUnsubscribe = null
let chartsUnsubscribe = null
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
    if (projectsUnsubscribe) projectsUnsubscribe()
    projectsUnsubscribe = subscribeProjects(user.uid, (updated) => {
      projects = updated
      renderSidebar()
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
        <button id="new-project-btn">+ New project</button>
        <button id="sign-out-btn">Sign out</button>
      </div>
    </div>
    <div id="main-layout">
      <aside id="sidebar">
        <ul id="project-list"></ul>
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

    if (btn.id === 'new-project-btn') handleNewProject()
    else if (btn.id === 'copy-link-btn') handleCopyLink()
    else if (btn.id === 'sign-out-btn') signOut()
    else if (btn.id === 'export-svg-btn') exportSVG()
    else if (btn.id === 'export-png-btn') exportPNG()
    else if (btn.classList.contains('theme-btn')) handleThemeSwitch(btn.dataset.theme)
    else if (btn.classList.contains('project-delete-btn')) handleDeleteProject(btn.dataset.id)
    else if (btn.classList.contains('chart-delete-btn')) handleDeleteChart(btn.dataset.id)
    else if (btn.classList.contains('new-chart-btn-inline')) handleNewChart()
  })
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function renderSidebar() {
  const list = document.getElementById('project-list')
  if (!list) return

  list.innerHTML = projects.map((p) => {
    const isExpanded = p.id === currentProjectId
    const toggle = isExpanded ? '▼' : '▶'

    const chartsHtml = isExpanded ? `
      <ul class="project-charts">
        ${charts.map((c) => `
          <li class="chart-item ${c.id === currentChartId ? 'active' : ''}" data-id="${c.id}">
            <span class="chart-name" data-id="${c.id}">${escapeHtml(c.name)}</span>
            <button class="chart-delete-btn" data-id="${c.id}" title="Delete">×</button>
          </li>
        `).join('')}
        <li class="new-chart-item">
          <button class="new-chart-btn-inline">+ New chart</button>
        </li>
      </ul>
    ` : ''

    return `
      <li class="project-item" data-id="${p.id}">
        <div class="project-header" data-id="${p.id}">
          <span class="project-toggle">${toggle}</span>
          <span class="project-name" data-id="${p.id}">${escapeHtml(p.name)}</span>
          <button class="project-delete-btn" data-id="${p.id}" title="Delete project">×</button>
        </div>
        ${chartsHtml}
      </li>
    `
  }).join('')

  // Project header clicks: toggle expand/collapse
  list.querySelectorAll('.project-header').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('project-delete-btn')) return
      toggleProject(el.dataset.id)
    })
  })

  // Project name double-click: rename
  list.querySelectorAll('.project-name').forEach((el) => {
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation()
      handleRenameProject(el.dataset.id, el)
    })
  })

  // Chart name clicks
  list.querySelectorAll('.chart-name').forEach((el) => {
    el.addEventListener('click', () => openChart(el.dataset.id))
    el.addEventListener('dblclick', () => handleRenameChart(el.dataset.id, el))
  })
}

// ── Project operations ────────────────────────────────────────────────────────

function toggleProject(id) {
  if (currentProjectId === id) {
    // Collapse
    currentProjectId = null
    currentChartId = null
    charts = []
    if (chartsUnsubscribe) { chartsUnsubscribe(); chartsUnsubscribe = null }
    openBlankState()
    renderSidebar()
  } else {
    // Expand and subscribe to charts
    currentProjectId = id
    currentChartId = null
    charts = []
    if (chartsUnsubscribe) { chartsUnsubscribe(); chartsUnsubscribe = null }
    chartsUnsubscribe = subscribeCharts(currentUser.uid, id, (updated) => {
      charts = updated
      renderSidebar()
      if (!currentChartId && charts.length > 0) openChart(charts[0].id)
      else if (!currentChartId) openBlankState()
    })
  }
}

async function handleNewProject() {
  if (!currentUser) return
  const project = {
    id: crypto.randomUUID(),
    name: 'Untitled project',
    description: '',
    createdAt: null,
    updatedAt: null,
  }
  await saveProject(currentUser.uid, project)
  // Auto-expand the new project
  toggleProject(project.id)
}

async function handleDeleteProject(id) {
  if (!currentUser) return
  if (!confirm('Delete this project and all its charts?')) return
  if (currentProjectId === id) {
    currentProjectId = null
    currentChartId = null
    charts = []
    if (chartsUnsubscribe) { chartsUnsubscribe(); chartsUnsubscribe = null }
    openBlankState()
  }
  await deleteProject(currentUser.uid, id)
}

function handleRenameProject(id, el) {
  const project = projects.find((p) => p.id === id)
  if (!project) return
  el.contentEditable = 'true'
  el.focus()
  const finish = async () => {
    el.contentEditable = 'false'
    const name = el.textContent.trim() || 'Untitled project'
    el.textContent = name
    await saveProject(currentUser.uid, { ...project, name })
  }
  el.addEventListener('blur', finish, { once: true })
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur() } }, { once: true })
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
  editorView = null
  const preview = document.getElementById('preview-container')
  if (preview) preview.innerHTML = ''
}

function onEditorChange(code) {
  clearTimeout(previewDebounce)
  clearTimeout(saveDebounce)
  previewDebounce = setTimeout(() => {
    const chart = charts.find((c) => c.id === currentChartId)
    renderPreview(code, chart?.theme || 'default')
  }, 300)
  saveDebounce = setTimeout(() => {
    if (!currentUser || !currentProjectId || !currentChartId) return
    const chart = charts.find((c) => c.id === currentChartId)
    if (!chart) return
    saveChart(currentUser.uid, currentProjectId, { ...chart, code }).catch(console.error)
  }, 1500)
}

async function handleNewChart() {
  if (!currentUser || !currentProjectId) return
  const chart = {
    id: crypto.randomUUID(),
    name: 'Untitled chart',
    code: DEFAULT_CODE,
    theme: 'default',
    createdAt: null,
    updatedAt: null,
  }
  await saveChart(currentUser.uid, currentProjectId, chart)
  currentChartId = chart.id
}

async function handleDeleteChart(id) {
  if (!currentUser || !currentProjectId) return
  if (!confirm('Delete this chart?')) return
  await deleteChart(currentUser.uid, currentProjectId, id)
  if (currentChartId === id) {
    currentChartId = null
    const next = charts.find((c) => c.id !== id)
    if (next) openChart(next.id)
    else openBlankState()
  }
}

function handleRenameChart(id, el) {
  const chart = charts.find((c) => c.id === id)
  if (!chart) return
  el.contentEditable = 'true'
  el.focus()
  const finish = async () => {
    el.contentEditable = 'false'
    const name = el.textContent.trim() || 'Untitled chart'
    el.textContent = name
    await saveChart(currentUser.uid, currentProjectId, { ...chart, name })
  }
  el.addEventListener('blur', finish, { once: true })
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el.blur() } }, { once: true })
}

// ── Theme ─────────────────────────────────────────────────────────────────────

function handleThemeSwitch(theme) {
  if (!currentUser || !currentProjectId || !currentChartId) return
  const chart = charts.find((c) => c.id === currentChartId)
  if (!chart) return
  setTheme(theme)
  highlightThemeBtn(theme)
  saveChart(currentUser.uid, currentProjectId, { ...chart, theme }).catch(console.error)
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
