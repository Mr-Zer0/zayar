<script>
  import Sidebar from '../lib/Sidebar.svelte'
  import { formatDate } from '../utils.js'

  let {
    // sidebar
    projects, allCharts, currentProjectId,
    onGoHome, onNewProject, onSelectProject, onSelectChart, onSignOut,
    // content
    recentCharts, onOpenRecentChart,
  } = $props()
</script>

<div class="flex h-screen">
  <Sidebar
    {projects}
    {allCharts}
    {currentProjectId}
    {onSelectProject}
    {onSelectChart}
    {onSignOut}
    {onGoHome}
    {onNewProject}
  />

  <div class="flex-1 overflow-auto p-10 bg-slate-50/50">
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold tracking-tight text-slate-800">Welcome back</h1>
        {#if projects.length > 0}
          <button
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-all duration-200 ease-out bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:from-blue-500 hover:to-indigo-500 hover:shadow active:scale-95 gap-1.5"
            onclick={onNewProject}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New project
          </button>
        {/if}
      </div>

      {#if recentCharts.length > 0}
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Recent charts</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-12">
          {#each recentCharts as recent (recent.chartId)}
            <button
              class="group text-left bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
              onclick={() => onOpenRecentChart(recent.projectId, recent.chartId)}
            >
              <div class="flex items-center justify-between gap-2 relative z-10">
                <span class="text-[15px] font-semibold text-slate-800 truncate">{recent.chartName}</span>
                <div class="bg-slate-50 group-hover:bg-blue-50 rounded-full p-1.5 transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3.5 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
              <p class="text-[13px] text-slate-500 mt-1 truncate relative z-10">{recent.projectName}</p>
            </button>
          {/each}
        </div>
      {/if}

      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Projects</h2>
      </div>

      {#if projects.length === 0}
        <div class="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
          <div class="bg-indigo-50 text-indigo-500 rounded-full p-5 mb-5 shadow-sm border border-indigo-100/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-10 h-10">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2 tracking-tight">Create your first project</h3>
          <p class="text-slate-500 text-sm mb-8 max-w-sm leading-relaxed">Projects help you organize your charts and dashboards neatly. Set up a new workspace to get started.</p>
          <button
            class="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white transition-all duration-200 ease-out bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-500 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 gap-2"
            onclick={onNewProject}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            New project
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each projects as project (project.id)}
            {@const date = formatDate(project.updatedAt)}
            <button
              class="group text-left bg-white border border-slate-200 rounded-xl p-6 cursor-pointer hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
              onclick={() => onSelectProject(project.id)}
            >
              <div class="flex flex-col h-full relative z-10">
                <div class="flex items-start justify-between gap-3 mb-4">
                  <span class="text-[17px] font-bold text-slate-800 leading-snug break-words group-hover:text-blue-600 transition-colors">{project.name}</span>
                  <div class="bg-slate-50 group-hover:bg-blue-50 rounded-full p-1.5 transition-colors shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition-colors">
                      <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </div>
                <div class="mt-auto pt-2">
                  {#if date}
                    <p class="text-[13px] font-medium text-slate-400">Updated {date}</p>
                  {/if}
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
