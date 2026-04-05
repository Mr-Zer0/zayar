<script>
  let {
    projects,
    currentProjectId,
    onSelectProject,
    onRenameProject,
    onSignOut,
    onGoHome,
    onNewProject,
  } = $props()

  let searchQuery = $state('')

  let filteredProjects = $derived(
    searchQuery.trim()
      ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : projects
  )

  function handleRename(item, el, defaultName, onSave) {
    if (!item) return
    el.contentEditable = 'true'
    el.focus()
    const finish = () => {
      el.contentEditable = 'false'
      const name = el.textContent.trim() || defaultName
      el.textContent = name
      onSave(name)
    }
    el.addEventListener('blur', finish, { once: true })
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur() }
    }, { once: true })
  }
</script>

<aside class="w-[260px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
  <!-- App name -->
  <div class="shrink-0 px-5 h-16 flex items-center">
    <button class="text-lg font-bold text-slate-800 cursor-pointer" onclick={onGoHome}>Zayar</button>
  </div>

  <!-- Projects label + add button -->
  <div class="shrink-0 flex items-center justify-between px-5 pt-8 pb-2">
    <span class="font-semibold text-slate-700 tracking-wide">Projects</span>
    <button 
      onclick={onNewProject} 
      class="text-white bg-rose-500 rounded-md transition-colors cursor-pointer flex items-center gap-1 px-2 py-1 text-sm"
      title="Add project"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>

      New
    </button>
  </div>

  <!-- Search box -->
  <div class="shrink-0 px-4 pb-2">
    <div class="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-100 border border-slate-200">
      <input
        type="text"
        placeholder="Search projects..."
        bind:value={searchQuery}
        class="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none min-w-0"
      />
      {#if searchQuery}
        <button onclick={() => searchQuery = ''} class="text-slate-400 hover:text-slate-600 leading-none shrink-0">×</button>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4 text-slate-400 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      {/if}
    </div>
  </div>

  <!-- Project list -->
  <ul class="flex-1 overflow-y-auto py-2 list-none">
    {#if filteredProjects.length === 0 && searchQuery}
      <li class="px-5 py-3 text-sm text-slate-400">No projects found</li>
    {/if}
    {#each filteredProjects as project (project.id)}
      <li>
        <button
          class="flex items-center w-full px-5 py-2.5 gap-2 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors {project.id === currentProjectId ? 'font-semibold text-slate-700' : 'font-normal' }"
          onclick={() => onSelectProject(project.id)}
        >
          {project.name}
        </button>
      </li>
    {/each}
  </ul>

  <div class="shrink-0">
    <button
      class="flex items-center gap-3 px-6 py-3 mb-3 text-slate-700 font-semibold"
      onclick={onSignOut}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-slate-500">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
      </svg>
      Log out
    </button>
  </div>
</aside>
