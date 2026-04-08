<script>
  import { onMount, onDestroy } from 'svelte'
  import { onAuthReady, signOut } from './auth.js'
  import { subscribeProjects, saveProject, deleteProject, subscribeCharts, saveChart, deleteChart, migrateFlatCharts } from './storage.js'
  import { initMermaid } from './preview.js'
  import { parseRoute, navigate } from './router.js'
  import LoginPage from './pages/LoginPage.svelte'
  import LandingPage from './pages/LandingPage.svelte'
  import ProjectPage from './pages/ProjectPage.svelte'
  import ChartPage from './pages/ChartPage.svelte'
  import Preview from './lib/Preview.svelte'

  const DEFAULT_CODE = `flowchart TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B`

  // ── Reactive state ────────────────────────────────────────────────────────────

  let loading = $state(true)
  let currentUser = $state(null)
  let authError = $state('')

  let projects = $state([])
  let charts = $state([])
  let allCharts = $state([])

  let dataLoaded = $state(false)
  let chartsLoaded = $state(false)

  let currentProjectId = $state(null)
  let currentChartId = $state(null)
  let editorCode = $state(DEFAULT_CODE)
  let shareCode = $state(null)
  let recentCharts = $state([])

  let currentChart = $derived(charts.find((c) => c.id === currentChartId) ?? null)
  let currentProject = $derived(projects.find((p) => p.id === currentProjectId) ?? null)

  // ── Internal refs (non-reactive) ──────────────────────────────────────────────

  let projectsUnsubscribe = null
  let chartsUnsubscribe = null
  let allChartsUnsubscribes = []
  let saveDebounce = null
  let pendingChartId = null

  // ── Subscriptions ─────────────────────────────────────────────────────────────

  // Subscribe to charts for every project so the sidebar search has all data.
  // Uses a plain Map (non-reactive) so Firestore callbacks never read $state,
  // preventing infinite update loops.
  $effect(() => {
    if (!currentUser) {
      allChartsUnsubscribes.forEach(fn => fn())
      allChartsUnsubscribes = []
      allCharts = []
      return
    }
    allChartsUnsubscribes.forEach(fn => fn())
    allChartsUnsubscribes = []
    const chartsMap = new Map(projects.map(p => [p.id, []]))
    for (const project of projects) {
      const pid = project.id
      const unsub = subscribeCharts(currentUser.uid, pid, (projectCharts) => {
        chartsMap.set(pid, projectCharts.map(c => ({ ...c, projectId: pid })))
        allCharts = [...chartsMap.values()].flat()
      })
      allChartsUnsubscribes.push(unsub)
    }
    return () => {
      allChartsUnsubscribes.forEach(fn => fn())
      allChartsUnsubscribes = []
    }
  })

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  onMount(() => {
    initMermaid()

    // Share link via URL hash — no auth needed
    if (window.location.hash) {
      try {
        shareCode = decodeURIComponent(atob(window.location.hash.slice(1)))
        loading = false
        return
      } catch {
        window.location.hash = ''
      }
    }

    const initialRoute = parseRoute(window.location.pathname)

    const onPopState = () => {
      const route = parseRoute(window.location.pathname)
      if (!route.projectId) {
        clearChartsSubscription()
        currentProjectId = null
        currentChartId = null
        charts = []
        chartsLoaded = false
      } else if (!route.chartId) {
        selectProject(route.projectId)
      } else {
        if (currentProjectId === route.projectId) {
          openChart(route.chartId)
        } else {
          pendingChartId = route.chartId
          selectProject(route.projectId)
        }
      }
    }
    window.addEventListener('popstate', onPopState)

    onAuthReady((user, error = '') => {
      loading = false
      if (projectsUnsubscribe) { projectsUnsubscribe(); projectsUnsubscribe = null }
      clearChartsSubscription()
      if (!user) {
        currentUser = null
        authError = error
        dataLoaded = true
        return
      }
      currentUser = user
      authError = ''
      dataLoaded = false
      migrateFlatCharts(user.uid).catch(console.error)
      projectsUnsubscribe = subscribeProjects(user.uid, (updated) => {
        projects = updated
        dataLoaded = true
      })
      if (initialRoute.projectId) {
        if (initialRoute.chartId) pendingChartId = initialRoute.chartId
        selectProject(initialRoute.projectId)
      }
    })

    return () => window.removeEventListener('popstate', onPopState)
  })

  onDestroy(() => {
    if (projectsUnsubscribe) projectsUnsubscribe()
    clearChartsSubscription()
    allChartsUnsubscribes.forEach(fn => fn())
    clearTimeout(saveDebounce)
  })

  // ── Helpers ───────────────────────────────────────────────────────────────────

  function clearChartsSubscription() {
    if (chartsUnsubscribe) { chartsUnsubscribe(); chartsUnsubscribe = null }
  }

  // ── Navigation ────────────────────────────────────────────────────────────────

  function goHome() {
    navigate('/')
    clearChartsSubscription()
    currentProjectId = null
    currentChartId = null
    charts = []
    chartsLoaded = false
  }

  function selectProject(id) {
    navigate('/project/' + id)
    if (currentProjectId === id && !currentChartId) return
    clearChartsSubscription()
    currentProjectId = id
    currentChartId = null
    charts = []
    chartsLoaded = false
    chartsUnsubscribe = subscribeCharts(currentUser.uid, id, (updated) => {
      charts = updated
      chartsLoaded = true
      if (pendingChartId) {
        const target = charts.find((c) => c.id === pendingChartId)
        if (target) { pendingChartId = null; openChart(target.id) }
      }
    })
  }

  function openChart(id) {
    const chart = charts.find((c) => c.id === id)
    if (!chart) return
    navigate('/project/' + currentProjectId + '/chart/' + id)
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

  // ── Event handlers ────────────────────────────────────────────────────────────

  async function handleNewProject() {
    if (!currentUser) return
    const project = { id: crypto.randomUUID(), name: 'Untitled project', description: '', createdAt: null, updatedAt: null }
    await saveProject(currentUser.uid, project)
    selectProject(project.id)
  }

  async function handleDeleteProject(id) {
    if (!currentUser) return
    if (currentProjectId === id) goHome()
    await deleteProject(currentUser.uid, id)
  }

  async function handleNewChart() {
    if (!currentUser || !currentProjectId) return
    const chart = { id: crypto.randomUUID(), name: 'Untitled chart', code: DEFAULT_CODE, theme: 'default', createdAt: null, updatedAt: null }
    await saveChart(currentUser.uid, currentProjectId, chart)
    openChart(chart.id)
  }

  async function handleDeleteChart(id) {
    if (!currentUser || !currentProjectId) return
    await deleteChart(currentUser.uid, currentProjectId, id)
    if (currentChartId === id) {
      currentChartId = null
      navigate('/project/' + currentProjectId)
    }
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

  function handleEditorChange(code) {
    editorCode = code
    clearTimeout(saveDebounce)
    saveDebounce = setTimeout(() => {
      if (!currentUser || !currentProjectId || !currentChartId || !currentChart) return
      saveChart(currentUser.uid, currentProjectId, { ...currentChart, code }).catch(console.error)
    }, 1500)
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
      <Preview code={shareCode} readonly={true} />
    </div>
  </div>
{:else if !currentUser}
  <LoginPage error={authError} />
{:else if !dataLoaded || (currentProjectId && !chartsLoaded)}
  <div class="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
    <div class="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
    <span class="text-sm font-medium text-slate-500 animate-pulse">Loading workspace...</span>
  </div>
{:else if currentChart}
  <ChartPage
    code={editorCode}
    onchange={handleEditorChange}
    projectName={currentProject?.name ?? ''}
    chartName={currentChart?.name ?? ''}
    onrenamechart={(name) => handleRenameChart(currentChartId, name)}
    ongoback={() => selectProject(currentProjectId)}
    ongohome={goHome}
  />
{:else if currentProject}
  <ProjectPage
    {projects}
    {allCharts}
    {currentProjectId}
    onGoHome={goHome}
    onNewProject={handleNewProject}
    onSelectProject={selectProject}
    onSelectChart={openRecentChart}
    onSignOut={signOut}
    project={currentProject}
    {charts}
    onNewChart={handleNewChart}
    onOpenChart={openChart}
    onDeleteChart={handleDeleteChart}
    onDeleteProject={handleDeleteProject}
    onUpdateProject={(p) => saveProject(currentUser.uid, p).catch(console.error)}
  />
{:else}
  <LandingPage
    {projects}
    {allCharts}
    {currentProjectId}
    {recentCharts}
    onGoHome={goHome}
    onNewProject={handleNewProject}
    onSelectProject={selectProject}
    onSelectChart={openRecentChart}
    onSignOut={signOut}
    onOpenRecentChart={openRecentChart}
  />
{/if}
