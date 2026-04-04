<script>
  import { signIn } from '../auth.js'

  let { error = '' } = $props()

  let signInError = $state('')

  async function handleSignIn() {
    signInError = ''
    try {
      await signIn()
    } catch (err) {
      signInError = err.message
    }
  }
</script>

<div class="flex items-center justify-center h-screen bg-[#f5f5f5]">
  <div class="text-center p-10 bg-white rounded-xl border border-slate-200 min-w-[300px]">
    <h1 class="text-3xl mb-2 text-blue-600">FlowDraft</h1>
    <p class="text-gray-500 mb-4">A personal Mermaid flowchart editor</p>
    <p class="text-[#ff6b6b] text-[13px] min-h-[18px]">{error || signInError}</p>
    <button onclick={handleSignIn}>Sign in with Google</button>
  </div>
</div>
