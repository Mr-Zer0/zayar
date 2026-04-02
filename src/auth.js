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
      callback(null)
      showSignInScreen()
    }
  })
}

document.getElementById('sign-in-btn')?.addEventListener('click', () => {
  signIn().catch((err) => {
    document.getElementById('sign-in-error').textContent = err.message
  })
})

function showSignInScreen(message = '') {
  document.getElementById('sign-in-screen').style.display = 'flex'
  document.getElementById('app').style.display = 'none'
  document.getElementById('sign-in-error').textContent = message
}

function hideSignInScreen() {
  document.getElementById('sign-in-screen').style.display = 'none'
  document.getElementById('app').style.display = ''
}
