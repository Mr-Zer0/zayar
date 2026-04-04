<script>
  let { projects, recentCharts = [], onSelectProject, onNewProject, onOpenRecentChart } = $props()

  function formatDate(timestamp) {
    if (!timestamp) return null
    try {
      return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return null
    }
  }
</script>

<div class="flex-1 overflow-auto p-8">
  {#if recentCharts.length > 0}
    <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent charts</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-10">
      {#each recentCharts as recent (recent.chartId)}
        <button
          class="group text-left bg-white border border-slate-200 rounded-lg px-4 py-3 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
          onclick={() => onOpenRecentChart(recent.projectId, recent.chartId)}
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-[14px] font-medium text-slate-800 truncate">{recent.chartName}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-slate-300 group-hover:text-blue-400 shrink-0 transition-colors">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <p class="text-[12px] text-slate-400 mt-0.5 truncate">{recent.projectName}</p>
        </button>
      {/each}
    </div>
  {/if}

  <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Projects</h2>

  {#if projects.length === 0}
    <div class="flex flex-col items-center justify-center py-24 text-center">
      <p class="text-slate-400 text-[15px] mb-4">No projects yet.</p>
      <button
        class="bg-blue-600 border-blue-600 text-white hover:bg-blue-700"
        onclick={onNewProject}
      >+ New project</button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each projects as project (project.id)}
        {@const date = formatDate(project.updatedAt)}
        <button
          class="group text-left bg-white border border-slate-200 rounded-lg p-5 cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all"
          onclick={() => onSelectProject(project.id)}
        >
          <div class="flex items-start justify-between gap-2 mb-3">
            <span class="text-[15px] font-semibold text-slate-800 leading-snug break-words">{project.name}</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-slate-300 group-hover:text-blue-400 shrink-0 mt-0.5 transition-colors">
              <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          {#if date}
            <p class="text-[12px] text-slate-400">Updated {date}</p>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
