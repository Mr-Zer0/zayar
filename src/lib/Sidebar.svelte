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
    <span class="text-lg font-bold text-slate-800">Zayar</span>
  </div>

  <!-- Search box -->
  <div class="shrink-0 px-4 pt-8 pb-2">
    <div class="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200">
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

  <!-- Nav items -->
  <div class="shrink-0 mt-8">
    <button
      class="flex items-center gap-3.5 w-full px-5 py-3 text-slate-600 hover:bg-slate-50"
      onclick={onGoHome}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
      Home
    </button>
    <button
      class="flex items-center gap-3.5 w-full px-5 py-3 text-slate-600 hover:bg-slate-50"
      onclick={onNewProject}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Add Project
    </button>
  </div>

  <!-- Project list -->
  <ul class="flex-1 overflow-y-auto py-2 mt-2 list-none">
    {#if filteredProjects.length === 0 && searchQuery}
      <li class="px-5 py-3 text-sm text-slate-400">No projects found</li>
    {/if}
    {#each filteredProjects as project (project.id)}
      <li class="border-l-[3px] {project.id === currentProjectId ? 'border-l-blue-500 bg-blue-50' : 'border-l-transparent'}">
        <button
          class="flex items-center w-full px-5 py-2.5 gap-2 hover:bg-slate-100 text-left"
          onclick={() => onSelectProject(project.id)}
        >
          <span
            class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium {project.id === currentProjectId ? 'text-blue-700' : 'text-slate-700'}"
            ondblclick={(e) => {
              e.stopPropagation()
              handleRename(project, e.currentTarget, 'Untitled project', (name) => onRenameProject(project.id, name))
            }}
          >{project.name}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5 shrink-0 {project.id === currentProjectId ? 'text-blue-400' : 'text-slate-300'}">
            <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </li>
    {/each}
  </ul>

  <div class="shrink-0">
    <button
      class="flex items-center gap-3 px-8 py-3 mb-3 text-slate-700 font-semibold"
      onclick={onSignOut}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-slate-500">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
      </svg>
      Log out
    </button>
  </div>
</aside>
