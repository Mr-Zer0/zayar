<script>
  let { projects, onSelectProject, onNewProject } = $props()

  function formatDate(timestamp) {
    if (!timestamp) return null
    try {
      return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return null
    }
  }
</script>

<div class="flex-1 overflow-auto p-8 bg-slate-50">
  <h1 class="text-2xl font-bold text-slate-800 mb-6">Your projects</h1>

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
