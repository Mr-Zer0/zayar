<script>
  let { onGoHome } = $props()
</script>

<div class="flex flex-col items-center justify-center h-screen bg-slate-50 text-center px-4">
  <div class="mb-6 relative">
    <div class="text-[140px] font-extrabold text-slate-200 leading-none select-none">404</div>
    <div class="absolute inset-0 flex items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 text-blue-600">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    </div>
  </div>
  <h1 class="text-3xl font-bold text-slate-800 mb-3">Page not found</h1>
  <p class="text-slate-500 mb-8 max-w-sm text-lg">The project, chart, or page you are looking for doesn't exist or has been removed.</p>
  <button
    onclick={onGoHome}
    class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
  >
    Go back home
  </button>
</div>
