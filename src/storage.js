import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase.js'

function projectsRef(uid) {
  return collection(db, 'users', uid, 'projects')
}

function chartsRef(uid, projectId) {
  return collection(db, 'users', uid, 'projects', projectId, 'charts')
}

function withTimestamps(data) {
  const result = { ...data, updatedAt: serverTimestamp() }
  if (!result.createdAt) result.createdAt = serverTimestamp()
  return result
}

// Reuse live chart subscriptions so the same Firestore query is only opened once.
const chartSubscriptionPool = new Map()

// ── Projects ──────────────────────────────────────────────────────────────────

export function subscribeProjects(uid, onChange, onError) {
  const q = query(projectsRef(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    onChange(projects)
  }, onError)
}

export async function saveProject(uid, project) {
  await setDoc(doc(projectsRef(uid), project.id), withTimestamps(project), { merge: true })
}

export async function deleteProject(uid, projectId) {
  const snap = await getDocs(chartsRef(uid, projectId))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  await deleteDoc(doc(projectsRef(uid), projectId))
}

// ── Charts ────────────────────────────────────────────────────────────────────

export function subscribeCharts(uid, projectId, onChange, onError) {
  const key = `${uid}:${projectId}`
  let entry = chartSubscriptionPool.get(key)

  if (!entry) {
    entry = {
      listeners: new Set(),
      errorListeners: new Set(),
      lastCharts: null,
      unsubscribe: null,
    }
    const q = query(chartsRef(uid, projectId), orderBy('updatedAt', 'desc'))
    entry.unsubscribe = onSnapshot(q, (snap) => {
      const charts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      entry.lastCharts = charts
      for (const listener of entry.listeners) listener(charts)
    }, (error) => {
      for (const listener of entry.errorListeners) listener(error)
    })
    chartSubscriptionPool.set(key, entry)
  }

  entry.listeners.add(onChange)
  if (typeof onError === 'function') entry.errorListeners.add(onError)
  if (entry.lastCharts) onChange(entry.lastCharts)

  return () => {
    const existing = chartSubscriptionPool.get(key)
    if (!existing) return
    existing.listeners.delete(onChange)
    if (typeof onError === 'function') existing.errorListeners.delete(onError)
    if (existing.listeners.size === 0 && existing.errorListeners.size === 0) {
      existing.unsubscribe?.()
      chartSubscriptionPool.delete(key)
    }
  }
}

export async function saveChart(uid, projectId, chart) {
  await setDoc(doc(chartsRef(uid, projectId), chart.id), withTimestamps(chart), { merge: true })
}

export async function deleteChart(uid, projectId, chartId) {
  await deleteDoc(doc(chartsRef(uid, projectId), chartId))
}
