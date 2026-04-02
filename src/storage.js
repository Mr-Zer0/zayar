import {
  collection,
  doc,
  setDoc,
  deleteDoc,
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

// ── Projects ──────────────────────────────────────────────────────────────────

export function subscribeProjects(uid, onChange) {
  const q = query(projectsRef(uid), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    onChange(projects)
  })
}

export async function saveProject(uid, project) {
  const ref = doc(projectsRef(uid), project.id)
  await setDoc(ref, { ...project, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteProject(uid, projectId) {
  await deleteDoc(doc(projectsRef(uid), projectId))
}

// ── Charts ────────────────────────────────────────────────────────────────────

export function subscribeCharts(uid, projectId, onChange) {
  const q = query(chartsRef(uid, projectId), orderBy('updatedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const charts = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    onChange(charts)
  })
}

export async function saveChart(uid, projectId, chart) {
  const ref = doc(chartsRef(uid, projectId), chart.id)
  await setDoc(ref, { ...chart, updatedAt: serverTimestamp() }, { merge: true })
}

export async function deleteChart(uid, projectId, chartId) {
  await deleteDoc(doc(chartsRef(uid, projectId), chartId))
}
