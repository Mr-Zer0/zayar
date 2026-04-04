import './style.css'
import mermaid from 'mermaid'
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
    document.getElementById('share-view').style.display = ''
    renderSharePreview(code)
  } catch {
    window.location.hash = ''
    boot()
  }
} else {
  boot()
}

function boot() {
  wireStaticEvents()
  onAuthReady((user) => {
    if (projectsUnsubscribe) { projectsUnsubscribe(); projectsUnsubscribe = null }
    clearChartsSubscription()
    if (!user) { currentUser = null; return }
    currentUser = user
    // document.getElementById('user-name').textContent = user.displayName || user.email
    projectsUnsubscribe = subscribeProjects(user.uid, (updated) => {
      projects = updated
      renderSidebar()
    })
  })
}

async function renderSharePreview(code) {
  const container = document.getElementById('share-preview-container')
  const errorBar = document.getElementById('share-preview-error')
  try {
    const { svg } = await mermaid.render('share-mermaid', code)
    container.innerHTML = svg
  } catch (err) {
    if (errorBar) {
      errorBar.textContent = err.message || 'Mermaid parse error'
      errorBar.style.display = 'block'
    }
  }
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
      <ul class="list-none">
        ${charts.map((c) => `
          <li class="chart-item flex items-center py-1.5 pl-7 pr-3 cursor-pointer gap-1.5 hover:bg-slate-100 border-l-[3px] border-l-transparent ${c.id === currentChartId ? 'active' : ''}" data-id="${c.id}">
            <span class="chart-name flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px]" data-id="${c.id}">${escapeHtml(c.name)}</span>
            <button class="chart-delete-btn text-gray-500 cursor-pointer text-base leading-none opacity-0 hover:text-red-500" data-id="${c.id}" title="Delete">×</button>
          </li>
        `).join('')}
        <li class="py-1 pl-7 pr-3 pb-2">
          <button class="new-chart-btn-inline text-blue-600 text-xs cursor-pointer rounded hover:bg-slate-100">+ New chart</button>
        </li>
      </ul>
    ` : ''

    return `
      <li class="border-l-[3px] border-l-transparent" data-id="${p.id}">
        <div class="project-header flex items-center px-5 py-2 cursor-pointer gap-1.5 hover:bg-slate-100" data-id="${p.id}">
          <span class="project-toggle text-[10px] text-gray-500 shrink-0 w-3">${toggle}</span>
          <span class="project-name flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold" data-id="${p.id}">${escapeHtml(p.name)}</span>
          <button class="project-delete-btn text-gray-500 cursor-pointer text-base leading-none opacity-0 hover:text-red-500" data-id="${p.id}" title="Delete project">×</button>
        </div>
        ${chartsHtml}
      </li>
    `
  }).join('')

  list.querySelectorAll('.project-header').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('project-delete-btn')) return
      toggleProject(el.dataset.id)
    })
  })

  list.querySelectorAll('.project-name').forEach((el) => {
    el.addEventListener('dblclick', (e) => {
      e.stopPropagation()
      const p = projects.find((p) => p.id === el.dataset.id)
      handleRename(p, el, 'Untitled project', (updated) => saveProject(currentUser.uid, updated))
    })
  })

  list.querySelectorAll('.chart-name').forEach((el) => {
    el.addEventListener('click', () => openChart(el.dataset.id))
    el.addEventListener('dblclick', () => {
      const c = charts.find((c) => c.id === el.dataset.id)
      handleRename(c, el, 'Untitled chart', (updated) => saveChart(currentUser.uid, currentProjectId, updated))
    })
  })
}

// ── Project operations ────────────────────────────────────────────────────────

function clearChartsSubscription() {
  if (chartsUnsubscribe) { chartsUnsubscribe(); chartsUnsubscribe = null }
}

function toggleProject(id) {
  clearChartsSubscription()
  if (currentProjectId === id) {
    currentProjectId = null
    currentChartId = null
    charts = []
    openBlankState()
    renderSidebar()
  } else {
    currentProjectId = id
    currentChartId = null
    charts = []
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
  toggleProject(project.id)
}

async function handleDeleteProject(id) {
  if (!currentUser) return
  if (!confirm('Delete this project and all its charts?')) return
  if (currentProjectId === id) {
    currentProjectId = null
    currentChartId = null
    charts = []
    clearChartsSubscription()
    openBlankState()
  }
  await deleteProject(currentUser.uid, id)
}

// ── Chart operations ──────────────────────────────────────────────────────────

function openChart(id) {
  const chart = charts.find((c) => c.id === id)
  if (!chart) return
  currentChartId = id
  document.querySelectorAll('.chart-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.id === id)
  })

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
  container.innerHTML = '<p class="text-gray-500 p-6 text-[13px]">No charts yet. Create one to get started.</p>'
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

function handleRename(item, el, defaultName, onSave) {
  if (!item) return
  el.contentEditable = 'true'
  el.focus()
  const finish = async () => {
    el.contentEditable = 'false'
    const name = el.textContent.trim() || defaultName
    el.textContent = name
    await onSave({ ...item, name })
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
