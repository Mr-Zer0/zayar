<script>
  import { onMount, onDestroy } from 'svelte'
  import { onAuthReady, signOut } from './auth.js'
  import { subscribeProjects, saveProject, deleteProject, subscribeCharts, saveChart, deleteChart } from './storage.js'
  import { initMermaid } from './preview.js'
  import SignIn from './lib/SignIn.svelte'
  import Sidebar from './lib/Sidebar.svelte'
  import Preview from './lib/Preview.svelte'
  import Editor from './lib/Editor.svelte'

  const DEFAULT_CODE = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`

  let loading = $state(true)
  let currentUser = $state(null)
  let authError = $state('')
  let currentProjectId = $state(null)
  let currentChartId = $state(null)
  let projects = $state([])
  let charts = $state([])
  let editorCode = $state(DEFAULT_CODE)
  let shareCode = $state(null)
  let copyLinkLabel = $state('Copy link')

  let currentChart = $derived(charts.find((c) => c.id === currentChartId) ?? null)

  let projectsUnsubscribe = null
  let chartsUnsubscribe = null
  let saveDebounce = null

  initMermaid()

  onMount(() => {
    if (window.location.hash) {
      try {
        shareCode = decodeURIComponent(atob(window.location.hash.slice(1)))
        loading = false
        return
      } catch {
        window.location.hash = ''
      }
    }

    onAuthReady((user, error = '') => {
      loading = false
      if (projectsUnsubscribe) { projectsUnsubscribe(); projectsUnsubscribe = null }
      clearChartsSubscription()
      if (!user) {
        currentUser = null
        authError = error
        return
      }
      currentUser = user
      authError = ''
      projectsUnsubscribe = subscribeProjects(user.uid, (updated) => {
        projects = updated
      })
    })
  })

  onDestroy(() => {
    if (projectsUnsubscribe) projectsUnsubscribe()
    clearChartsSubscription()
    clearTimeout(saveDebounce)
  })

  function clearChartsSubscription() {
    if (chartsUnsubscribe) { chartsUnsubscribe(); chartsUnsubscribe = null }
  }

  function toggleProject(id) {
    clearChartsSubscription()
    if (currentProjectId === id) {
      currentProjectId = null
      currentChartId = null
      charts = []
    } else {
      currentProjectId = id
      currentChartId = null
      charts = []
      chartsUnsubscribe = subscribeCharts(currentUser.uid, id, (updated) => {
        charts = updated
        if (!currentChartId && charts.length > 0) openChart(charts[0].id)
      })
    }
  }

  async function handleNewProject() {
    if (!currentUser) return
    const project = { id: crypto.randomUUID(), name: 'Untitled project', description: '', createdAt: null, updatedAt: null }
    await saveProject(currentUser.uid, project)
    toggleProject(project.id)
  }

  async function handleDeleteProject(id) {
    if (!currentUser || !confirm('Delete this project and all its charts?')) return
    if (currentProjectId === id) {
      currentProjectId = null
      currentChartId = null
      charts = []
      clearChartsSubscription()
    }
    await deleteProject(currentUser.uid, id)
  }

  function openChart(id) {
    const chart = charts.find((c) => c.id === id)
    if (!chart) return
    currentChartId = id
    editorCode = chart.code || DEFAULT_CODE
  }

  function handleEditorChange(code) {
    editorCode = code
    clearTimeout(saveDebounce)
    saveDebounce = setTimeout(() => {
      if (!currentUser || !currentProjectId || !currentChartId || !currentChart) return
      saveChart(currentUser.uid, currentProjectId, { ...currentChart, code }).catch(console.error)
    }, 1500)
  }

  async function handleNewChart() {
    if (!currentUser || !currentProjectId) return
    const chart = { id: crypto.randomUUID(), name: 'Untitled chart', code: DEFAULT_CODE, theme: 'default', createdAt: null, updatedAt: null }
    await saveChart(currentUser.uid, currentProjectId, chart)
    openChart(chart.id)
  }

  async function handleDeleteChart(id) {
    if (!currentUser || !currentProjectId || !confirm('Delete this chart?')) return
    await deleteChart(currentUser.uid, currentProjectId, id)
    if (currentChartId === id) {
      const next = charts.find((c) => c.id !== id)
      if (next) openChart(next.id)
      else { currentChartId = null; editorCode = DEFAULT_CODE }
    }
  }

  async function handleRename(items, id, name, save) {
    const item = items.find((i) => i.id === id)
    if (!item) return
    await save({ ...item, name })
  }

  async function handleThemeSwitch(theme) {
    if (!currentUser || !currentProjectId || !currentChartId || !currentChart) return
    saveChart(currentUser.uid, currentProjectId, { ...currentChart, theme }).catch(console.error)
  }

  function handleCopyLink() {
    if (!currentChart) return
    const hash = btoa(encodeURIComponent(currentChart.code))
    const url = `${window.location.origin}${window.location.pathname}#${hash}`
    navigator.clipboard.writeText(url).then(() => {
      copyLinkLabel = 'Copied!'
      setTimeout(() => { copyLinkLabel = 'Copy link' }, 2000)
    })
  }
</script>

{#if loading}
  <!-- blank while Firebase checks auth -->
{:else if shareCode !== null}
  <div class="flex flex-col h-screen">
    <div class="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
      <span class="text-lg font-bold text-blue-600 flex-1">FlowDraft</span>
      <span class="text-xs text-gray-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Read-only preview</span>
    </div>
    <div class="flex-1 flex flex-col bg-white overflow-auto">
      <Preview code={shareCode} theme="default" readonly={true} />
    </div>
  </div>
{:else if !currentUser}
  <SignIn error={authError} />
{:else}
  <div class="flex flex-col h-screen">
    <div class="h-12 bg-white border-b border-slate-200 flex items-center px-4 gap-3 shrink-0">
      <span class="text-lg font-bold text-blue-600 flex-1">FlowDraft</span>
      <div class="flex gap-2">
        <button onclick={handleCopyLink}>{copyLinkLabel}</button>
        <button
          class="bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
          onclick={handleNewProject}
        >+ New project</button>
      </div>
    </div>

    <div class="grid grid-cols-[260px_1fr_1fr] flex-1 overflow-hidden">
      <Sidebar
        {projects}
        {charts}
        {currentProjectId}
        {currentChartId}
        onToggleProject={toggleProject}
        onNewChart={handleNewChart}
        onDeleteChart={handleDeleteChart}
        onDeleteProject={handleDeleteProject}
        onOpenChart={openChart}
        onRenameProject={(id, name) => handleRename(projects, id, name, (item) => saveProject(currentUser.uid, item))}
        onRenameChart={(id, name) => handleRename(charts, id, name, (item) => saveChart(currentUser.uid, currentProjectId, item))}
        onSignOut={signOut}
      />

      <Preview
        code={editorCode}
        theme={currentChart?.theme || 'default'}
        onThemeSwitch={handleThemeSwitch}
      />

      <Editor
        code={editorCode}
        onchange={handleEditorChange}
      />
    </div>
  </div>
{/if}
