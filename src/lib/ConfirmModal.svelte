<script>
  let { title, message, confirmLabel = 'Confirm', onConfirm, onCancel } = $props()

  function portal(el) {
    document.body.appendChild(el)
    return { destroy() { el.remove() } }
  }
</script>

<div
  use:portal
  class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
  role="presentation"
  onclick={onCancel}
  onkeydown={(e) => { if (e.key === 'Escape') onCancel() }}
>
  <div
    class="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="flex items-center gap-3 mb-4">
      <div class="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5 text-red-600">
          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </div>
      <div>
        <h3 class="text-base font-semibold text-slate-800">{title}</h3>
        <p class="text-sm text-slate-500 mt-0.5">This cannot be undone.</p>
      </div>
    </div>
    <p class="text-sm text-slate-600 mb-6">{@html message}</p>
    <div class="flex gap-3 justify-end">
      <button
        class="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        onclick={onCancel}
      >Cancel</button>
      <button
        class="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        onclick={onConfirm}
      >{confirmLabel}</button>
    </div>
  </div>
</div>
