import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase.js'

export const ALLOWED_EMAILS = [
  'tannaing@gmail.com'
]

const provider = new GoogleAuthProvider()

export function signIn() {
  return signInWithPopup(auth, provider)
}

export function signOut() {
  return firebaseSignOut(auth)
}

export function onAuthReady(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user && ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(user.email)) {
      firebaseSignOut(auth)
      showSignInScreen('Your account is not authorised to use this app.')
      return
    }
    if (user) {
      hideSignInScreen()
      callback(user)
    } else {
      showSignInScreen()
    }
  })
}

function showSignInScreen(message = '') {
  let screen = document.getElementById('sign-in-screen')
  if (!screen) {
    screen = document.createElement('div')
    screen.id = 'sign-in-screen'
    screen.innerHTML = `
      <div class="sign-in-box">
        <h1>FlowDraft</h1>
        <p>A personal Mermaid flowchart editor</p>
        <p id="sign-in-error" class="sign-in-error"></p>
        <button id="sign-in-btn">Sign in with Google</button>
      </div>
    `
    document.body.appendChild(screen)
    document.getElementById('sign-in-btn').addEventListener('click', () => {
      signIn().catch((err) => {
        document.getElementById('sign-in-error').textContent = err.message
      })
    })
  }
  const errEl = screen.querySelector('#sign-in-error')
  if (errEl) errEl.textContent = message
  screen.style.display = 'flex'
  const appEl = document.getElementById('app')
  if (appEl) appEl.style.display = 'none'
}

function hideSignInScreen() {
  const screen = document.getElementById('sign-in-screen')
  if (screen) screen.style.display = 'none'
  const appEl = document.getElementById('app')
  if (appEl) appEl.style.display = ''
}
