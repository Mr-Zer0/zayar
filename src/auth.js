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
      callback(null, 'Your account is not authorised to use this app.')
      return
    }
    callback(user || null)
  })
}
