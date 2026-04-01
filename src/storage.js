import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

function chartsRef(uid) {
  return collection(db, 'users', uid, 'charts')
}

export async function loadCharts(uid) {
  const q = query(chartsRef(uid), orderBy('updatedAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function saveChart(uid, chart) {
  const ref = doc(chartsRef(uid), chart.id)
  await setDoc(ref, { ...chart, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteChart(uid, chartId) {
  await deleteDoc(doc(chartsRef(uid), chartId))
}

export function subscribeCharts(uid, onChange) {
  const q = query(chartsRef(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const charts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    onChange(charts)
  })
}
