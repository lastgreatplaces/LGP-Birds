'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type WeekRow = {
  rank: number
  week: number
  label_long: string | null
  likelihood_see: number
  num_checklists: number
  expected_checklists?: number
}

type PlaceRow = {
  rank: number
  bcr_id: number
  site_id: number
  site_name: string
  state: string
  weeks_used: number
  avg_likelihood_see: number
  avg_weekly_checklists: number
  avg_expected_checklists: number
}

export default function SpeciesSearch() {
  const [allSpecies, setAllSpecies] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<Array<{ week: number; label_long: string }>>([])
  const [results, setResults] = useState<PlaceRow[]>([])

  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(48) // eBird bins are 1–48

  // Drill-down state
  const [expandedSiteId, setExpandedSiteId] = useState<number | null>(null)
  const [weeksRows, setWeeksRows] = useState<WeekRow[]>([])
  const [weeksLoading, setWeeksLoading] = useState(false)
  const [weeksSortMode, setWeeksSortMode] = useState<'best' | 'calendar'>('best')

  // Close drill-down if inputs change (prevents stale panel)
  useEffect(() => {
    setExpandedSiteId(null)
    setWeeksRows([])
  }, [selectedSpecies, selectedState, fromWeek, toWeek])

  useEffect(() => {
    async function loadInitialData() {
      const { data: sData, error: sErr } = await supabase
        .from('dropdown_states')
        .select('state')
        .eq('is_active', true)
        .order('state')

      const { data: wData, error: wErr } = await supabase
        .from('weeks_months')
        .select('week, label_long')
        .order('week')

      const { data: spData, error: spErr } = await supabase
        .from('species_groups')
        .select('species_name')
        .order('species_name')

      if (sErr) console.error(sErr)
      if (wErr) console.error(wErr)
      if (spErr) console.error(spErr)

      if (sData) setStates((sData as Array<{ state: string }>).map(x => x.state))
      if (wData) setWeeks(wData as Array<{ week: number; label_long: string }>)
      if (spData) setAllSpecies((spData as Array<{ species_name: string }>).map(x => x.species_name))
    }

    loadInitialData()
  }, [])

  const runPowerQuery = async () => {
    if (!selectedSpecies) {
      alert('Please select a species first!')
      return
    }
    if (toWeek < fromWeek) {
      alert('"To Week" must be the same or later than "From Week".')
      return
    }

    const { data, error } = await supabase.rpc('rpc_best_places_for_species', {
      p_species: selectedSpecies,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: selectedState ? [selectedState] : null,
      p_limit: 50
    })

    if (error) {
      console.error(error)
      alert('Query error: ' + error.message)
      return
    }

    setResults((data || []) as PlaceRow[])
  }

  // Fetch weeks for a specific site
  const fetchWeeksForSite = async (siteId: number, sortMode: 'best' | 'calendar') => {
    if (!selectedSpecies) return
    setWeeksLoading(true)
    setWeeksRows([])

    const { data, error } = await supabase.rpc('rpc_species_weeks_at_place', {
      p_species: selectedSpecies,
      p_site_id: siteId,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_min_likelihood: 0.20,
      p_sort_mode: sortMode,
      p_limit: 12
    })

    setWeeksLoading(false)

    if (error) {
      console.error(error)
      alert('Weeks query error: ' + error.message)
      return
    }

    setWeeksRows((data || []) as WeekRow[])
  }

  const toggleSiteWeeks = async (siteId: number) => {
    if (expandedSiteId === siteId) {
      setExpandedSiteId(null)
      setWeeksRows([])
      return
    }
    setExpandedSiteId(siteId)
    await fetchWeeksForSite(siteId, weeksSortMode)
  }

  const changeWeeksSortMode = async (mode: 'best' | 'calendar') => {
    setWeeksSortMode(mode)
    if (expandedSiteId !== null) {
      await fetchWeeksForSite(expandedSiteId, mode)
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31' }}>Find the Best Places for a Species</h1>

      <div style={{ marginBottom: '25px' }}>
        <label><strong>1. Select Bird Species:</strong></label>
        <select
          value={selectedSpecies}
          onChange={(e) => setSelectedSpecies(e.target.value)}
          style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="">-- Select a bird species --</option>
          {allSpecies.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label><strong>2. Filter by State</strong></label>
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
          >
            <option value="">-- All Active States --</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div>
          <label>From Week</label>
          <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
        <div>
          <label>To Week</label>
          <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={runPowerQuery}
        style={{ width: '100%', padding: '15px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
      >
        FIND BEST LOCATIONS
      </button>

      {results.length > 0 && (
        <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
              <th style={{ textAlign: 'left' }}>Site Name</th>
              <th style={{ textAlign: 'center' }}>State</th>
              <th style={{ textAlign: 'center' }}>Avg Likelihood</th>
              <th style={{ textAlign: 'center' }}>Avg Checklists</th>
            </tr>
          </thead>

          <tbody>
            {results.map((r) => {
              const isOpen = expandedSiteId === r.site_id
              return (
                <React.Fragment key={r.site_id}>
                  <tr
                    onClick={() => toggleSiteWeeks(r.site_id)}
                    style={{
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: isOpen ? '#f3f7f4' : 'white'
                    }}
                    title="Click to see the best weeks at this place"
                  >
                    <td style={{ padding: '12px', textAlign: 'left' }}>{r.rank}</td>
                    <td>{r.site_name}</td>
                    <td style={{ textAlign: 'center' }}>{r.state}</td>
                    <td style={{ textAlign: 'center' }}>{Math.round(r.avg_likelihood_see * 100)}%</td>
                    <td style={{ textAlign: 'center' }}>{Math.round(r.avg_weekly_checklists)}</td>
                  </tr>

                  {isOpen && (
                    <tr style={{ backgroundColor: '#f3f7f4' }}>
                      <td colSpan={5} style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                              Best weeks at {r.site_name} (within your selected range)
                            </div>
                            <div style={{ color: '#444', fontSize: '14px' }}>
                              Showing weeks with likelihood ≥ 20% (max 12 rows).
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Order:</span>

                            <button
                              onClick={(e) => { e.stopPropagation(); changeWeeksSortMode('best') }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid #2e4a31',
                                backgroundColor: weeksSortMode === 'best' ? '#2e4a31' : 'white',
                                color: weeksSortMode === 'best' ? 'white' : '#2e4a31',
                                cursor: 'pointer'
                              }}
                            >
                              Best first
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); changeWeeksSortMode('calendar') }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                border: '1px solid #2e4a31',
                                backgroundColor: weeksSortMode === 'calendar' ? '#2e4a31' : 'white',
                                color: weeksSortMode === 'calendar' ? 'white' : '#2e4a31',
                                cursor: 'pointer'
                              }}
                            >
                              Calendar
                            </button>
                          </div>
                        </div>

                        {weeksLoading && <div style={{ marginTop: '12px' }}>Loading weeks…</div>}

                        {!weeksLoading && weeksRows.length === 0 && (
                          <div style={{ marginTop: '12px', color: '#555' }}>
                            No weeks found above 20% likelihood in your selected range.
                          </div>
                        )}

                        {!weeksLoading && weeksRows.length > 0 && (
                          <table style={{ width: '100%', marginTop: '12px', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#dfe9e2' }}>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Week</th>
                                <th style={{ padding: '8px', textAlign: 'left' }}>Label</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Likelihood</th>
                                <th style={{ padding: '8px', textAlign: 'center' }}>Checklists</th>
                              </tr>
                            </thead>
                            <tbody>
                              {weeksRows.map((w) => (
                                <tr key={`${r.site_id}-${w.week}`} style={{ borderBottom: '1px solid #e6e6e6' }}>
                                  <td style={{ padding: '8px' }}>{w.week}</td>
                                  <td style={{ padding: '8px' }}>{w.label_long || ''}</td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>{Math.round(w.likelihood_see * 100)}%</td>
                                  <td style={{ padding: '8px', textAlign: 'center' }}>{w.num_checklists}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}