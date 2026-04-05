<script>
  import { onMount, onDestroy } from 'svelte'
  import { onAuthReady, signOut } from './auth.js'
  import { subscribeProjects, saveProject, deleteProject, subscribeCharts, saveChart, deleteChart, migrateFlatCharts } from './storage.js'
  import { initMermaid } from './preview.js'
  import SignIn from './lib/SignIn.svelte'
  import Landing from './lib/Landing.svelte'
  import ProjectPage from './lib/ProjectPage.svelte'
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
  let recentCharts = $state([])

  let currentChart = $derived(charts.find((c) => c.id === currentChartId) ?? null)
  let currentProject = $derived(projects.find((p) => p.id === currentProjectId) ?? null)

  let projectsUnsubscribe = null
  let chartsUnsubscribe = null
  let saveDebounce = null
  let pendingChartId = null

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
      migrateFlatCharts(user.uid).catch(console.error)
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

  function goHome() {
    clearChartsSubscription()
    currentProjectId = null
    currentChartId = null
    charts = []
  }

  function selectProject(id) {
    if (currentProjectId === id && !currentChartId) return
    clearChartsSubscription()
    currentProjectId = id
    currentChartId = null
    charts = []
    chartsUnsubscribe = subscribeCharts(currentUser.uid, id, (updated) => {
      charts = updated
      if (pendingChartId) {
        const target = charts.find((c) => c.id === pendingChartId)
        if (target) { pendingChartId = null; openChart(target.id) }
      }
    })
  }

  async function handleNewProject() {
    if (!currentUser) return
    const project = { id: crypto.randomUUID(), name: 'Untitled project', description: '', createdAt: null, updatedAt: null }
    await saveProject(currentUser.uid, project)
    selectProject(project.id)
  }

  async function handleDeleteProject(id) {
    if (!currentUser || !confirm('Delete this project and all its charts?')) return
    if (currentProjectId === id) goHome()
    await deleteProject(currentUser.uid, id)
  }

  function openChart(id) {
    const chart = charts.find((c) => c.id === id)
    if (!chart) return
    currentChartId = id
    editorCode = chart.code || DEFAULT_CODE
    const project = projects.find((p) => p.id === currentProjectId)
    const entry = { chartId: id, projectId: currentProjectId, chartName: chart.name, projectName: project?.name ?? '' }
    recentCharts = [entry, ...recentCharts.filter((r) => r.chartId !== id)].slice(0, 6)
  }

  function openRecentChart(projectId, chartId) {
    if (currentProjectId === projectId) {
      openChart(chartId)
    } else {
      pendingChartId = chartId
      selectProject(projectId)
    }
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
    if (currentChartId === id) currentChartId = null
  }

  async function handleRenameProject(id, name) {
    const project = projects.find((p) => p.id === id)
    if (!project) return
    await saveProject(currentUser.uid, { ...project, name })
  }

  async function handleRenameChart(id, name) {
    const chart = charts.find((c) => c.id === id)
    if (!chart) return
    await saveChart(currentUser.uid, currentProjectId, { ...chart, name })
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
      <span class="text-lg font-bold text-blue-600 flex-1">Zayar</span>
      <span class="text-xs text-gray-500 bg-slate-100 px-2.5 py-0.5 rounded-full">Read-only preview</span>
    </div>
    <div class="flex-1 flex flex-col bg-white overflow-auto">
      <Preview code={shareCode} theme="default" readonly={true} />
    </div>
  </div>
{:else if !currentUser}
  <SignIn error={authError} />
{:else}
  <div class="flex h-screen">
    <!-- Sidebar -->
    <Sidebar
      {projects}
      {currentProjectId}
      onSelectProject={selectProject}
      onRenameProject={handleRenameProject}
      onSignOut={signOut}
      onGoHome={goHome}
      onNewProject={handleNewProject}
    />

    <!-- Main column -->
    <div class="flex flex-col flex-1 overflow-hidden">
      <!-- Topbar -->
      <div class="h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-2 shrink-0">
        {#if currentChartId}
          <button
            class="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm font-medium shrink-0"
            onclick={() => currentChartId = null}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            {currentProject?.name ?? 'Project'}
          </button>
          <span class="text-slate-300">/</span>
          <span class="text-sm font-semibold text-slate-700 flex-1 truncate">{currentChart?.name ?? ''}</span>
          <div class="flex gap-2 shrink-0">
            <button onclick={handleCopyLink}>{copyLinkLabel}</button>
            <button
              class="bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
              onclick={handleNewChart}
            >+ New chart</button>
          </div>
        {:else if currentProjectId}
          <button
            class="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm font-medium shrink-0"
            onclick={goHome}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Home
          </button>
          <span class="text-slate-300">/</span>
          <span class="text-sm font-semibold text-slate-700 flex-1 truncate">{currentProject?.name ?? ''}</span>
        {:else}
          <span class="text-xl font-semibold text-slate-800 flex-1">Home</span>
        {/if}
      </div>

      <!-- Content -->
      {#if !currentProjectId}
        <Landing
          {projects}
          {recentCharts}
          onSelectProject={selectProject}
          onNewProject={handleNewProject}
          onOpenRecentChart={openRecentChart}
        />
      {:else if !currentChartId}
        <ProjectPage
          project={currentProject}
          {charts}
          onNewChart={handleNewChart}
          onOpenChart={openChart}
          onDeleteChart={handleDeleteChart}
          onDeleteProject={handleDeleteProject}
          onRenameChart={handleRenameChart}
        />
      {:else}
        <div class="flex flex-1 overflow-hidden">
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
      {/if}
    </div>
  </div>
{/if}
