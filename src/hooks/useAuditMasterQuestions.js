import { useEffect, useState } from 'react'
import { fetchAuditQuestions } from '../services/auditMasterService.js'

function normalizeFallbackQuestion(question) {
  return {
    id: question.id,
    questionKey: question.questionKey || question.id,
    standardCodes: question.standardCode ? [question.standardCode] : [],
    standardCode: question.standardCode || '',
    themeCode: question.themeCode || '',
    systemDomain: question.systemDomain || question.clauseTitle || '',
    objective: question.objective || question.clauseTitle || '',
    applicableFunction: question.applicableFunction || question.pic || '',
    whatToVerify: question.whatToVerify || question.recommendation || '',
    auditQuestion: question.auditQuestion || '',
    requiredEvidence: question.requiredEvidence || '',
    kpiReview: question.kpiReview || '',
    riskReview: question.riskReview || '',
    auditorGuideline: question.auditorGuideline || question.recommendation || '',
    referenceSop: question.referenceSop || question.recommendation || '',
    pic: question.pic || question.applicableFunction || 'Function Owner',
    status: question.status || 'Not Started',
    auditorCheck: question.auditorCheck || 'Not Checked',
    auditorNotes: question.auditorNotes || '',
    recommendation: question.recommendation || question.requiredEvidence || '',
    clause: question.clause || '',
  }
}

export default function useAuditMasterQuestions(fallbackQuestions = []) {
  const [fallback] = useState(() => fallbackQuestions.map(normalizeFallbackQuestion))
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    let active = true

    async function loadQuestions() {
      try {
        setLoading(true)
        setMessage('')
        const rows = await fetchAuditQuestions()
        if (!active) return

        if (rows.length) {
          setQuestions(rows)
          setUsingFallback(false)
          return
        }

        setQuestions(fallback)
        setUsingFallback(true)
        setMessage(
          fallback.length
            ? 'No audit master questions found. Showing fallback readiness content.'
            : 'No audit master questions found.',
        )
      } catch (error) {
        console.error('Unable to load audit master questions:', error)
        if (!active) return
        setQuestions(fallback)
        setUsingFallback(true)
        setMessage(
          fallback.length
            ? 'Unable to load audit master data. Showing fallback readiness content.'
            : 'Unable to load audit master data.',
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    loadQuestions()
    return () => {
      active = false
    }
  }, [fallback])

  return { questions, loading, message, usingFallback }
}
