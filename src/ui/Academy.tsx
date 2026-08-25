import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LESSONS } from '../data/lessons'
import { MODEL_VERSION } from '../data/model'
import { progressStatus } from '../learn/progress'
import { useSim } from '../state/store'

export function Academy() {
  const progress = useSim((s) => s.lessonProgress)
  const reset = useSim((s) => s.resetLessonProgress)
  const [confirmReset, setConfirmReset] = useState(false)
  const complete = LESSONS.filter((lesson) => progressStatus(progress.records[lesson.id]) === 'completed').length
  return (
    <div className="academy-page min-h-screen bg-[#0c0d0f] text-[#d7d2c8]">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <Link to="/" className="text-lg text-[#f2eee6]">NukeSim Academy</Link>
        <Link to="/" className="font-mono text-[11px] text-amber-400">← sandbox</Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-teal-400">Four missions · ~5 minutes each</p>
        <h1 className="mt-2 text-3xl text-[#f2eee6]">Predict first. Then make the field prove it.</h1>
        <div className="academy-summary">
          <span>{complete}/4 current-model missions complete</span>
          <div className="academy-meter" role="progressbar" aria-label="Academy progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={complete}><i style={{ width: `${complete * 25}%` }} /></div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} disabled={Object.keys(progress.records).length === 0}>Reset progress</button>
          ) : (
            <div className="academy-reset" role="group" aria-label="Confirm progress reset">
              <span>Remove local lesson history?</span>
              <button onClick={() => { reset(); setConfirmReset(false) }}>Yes, reset</button>
              <button onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          )}
        </div>
        <div className="mt-8 space-y-4">{LESSONS.map((lesson) => <LessonCard key={lesson.id} id={lesson.id} />)}</div>
        <p className="mt-8 font-mono text-[10px] text-[#6a665c]">Progress stays in this browser. Current model: {MODEL_VERSION}.</p>
      </main>
    </div>
  )
}

function LessonCard({ id }: { id: string }) {
  const lesson = LESSONS.find((item) => item.id === id)!
  const nav = useNavigate()
  const begin = useSim((s) => s.beginLesson)
  const record = useSim((s) => s.lessonProgress.records[id])
  const status = progressStatus(record)
  const load = () => { begin(id); nav('/') }
  return (
    <article className="academy-lesson border border-white/10 bg-[#14161a] p-5">
      <div className="academy-lesson-title">
        <div><span className={`academy-status ${status}`}>{status === 'not-started' ? 'Not started' : status === 'revisit' ? 'Revisit for current model' : 'Completed'}</span><h2>{lesson.title}</h2></div>
        <span>{lesson.minutes} min</span>
      </div>
      <p>{lesson.hook}</p>
      <ol>{lesson.beats.map((beat) => <li key={beat}>{beat}</li>)}</ol>
      {record && <p className="academy-history">{record.attempts} completed {record.attempts === 1 ? 'run' : 'runs'} · prediction {record.predictionCorrect ? 'correct' : 'revised after observation'}</p>}
      <button onClick={load}>{status === 'completed' ? 'Run again' : status === 'revisit' ? 'Revisit mission' : 'Start mission'}</button>
    </article>
  )
}
