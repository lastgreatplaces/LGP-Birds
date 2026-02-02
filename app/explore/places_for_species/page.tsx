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
  const [toWeek, setToWeek] = useState(48) 

  const [expandedSiteId, setExpandedSiteId] = useState<number | null>(null)
  const [weeksRows, setWeeksRows] = useState<WeekRow[]>([])
  const [weeksLoading, setWeeksLoading] = useState(false)
  const [weeksSortMode, setWeeksSortMode] = useState<'best' | 'calendar'>('best')

  useEffect(() => {
    setExpandedSiteId(null)
    setWeeksRows([])
  }, [selectedSpecies, selectedState, fromWeek, toWeek])

  useEffect(() => {
    async function loadInitialData() {
      const { data: sData } = await supabase.from('dropdown_states').select('state').eq('is_active', true).order('state')
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      const { data: spData } = await supabase.from('species_groups').select('species_name').order('species_name')

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
    const { data, error } = await supabase.rpc('rpc_best_places_for_species', {
      p_species: selectedSpecies,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: selectedState ? [selectedState] : null,
      p_limit: 50
    })
    if (error) {
      alert('Query error: ' + error.message)
      return
    }
    setResults((data || []) as PlaceRow[])
  }

  const fetchWeeksForSite = async (siteId: number, sortMode: 'best' | 'calendar') => {
    setWeeksLoading(true)
    setWeeksRows([])
    const { data, error } = await supabase.rpc('rpc_species_weeks_at_place', {
      p_species: selectedSpecies,
      p_site_id: siteId,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_min_likelihood: 0.20,
      p_sort_mode: sortMode,
      p_limit: 52 // Increased limit to ensure Calendar view is complete
    })
    setWeeksLoading(false)
    if (error) return
    setWeeksRows((data || []) as WeekRow[])
  }

  const toggleSiteWeeks = async (siteId: number) => {
    if (expandedSiteId === siteId) {
      setExpandedSiteId(null)
      return
    }
    setExpandedSiteId(siteId)
    await fetchWeeksForSite(siteId, weeksSortMode)
  }

  const changeWeeksSortMode = async (mode: 'best' | 'calendar') => {
    setWeeksSortMode(mode)
    if (expandedSiteId) await fetchWeeksForSite(expandedSiteId, mode)
  }

  // Helper to determine the color of the bar
  const getLikelihoodColor = (val: number) => {
    if (val >= 0.80) return '#2e7d32' // Dark Green
    if (val >= 0.50) return '#fbc02d' // Yellow/Gold
    return '#d32f2f' // Red
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1100px', fontFamily: 'sans-serif', margin: '0 auto' }}>
      <h1 style={{ color: '#2e4a31', textAlign: 'center' }}>Find the Best Places for a Species</h1>

      <div style={{ marginBottom: '20px', background: '#f4f4f4', padding: '20px', borderRadius: '8px' }}>
        <label><strong>1. Select Bird Species:</strong></label>
        <select value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)} style={{ width: '100%', padding: '12px', marginTop: '10px' }}>
          <option value="">-- Select a bird --</option>
          {allSpecies.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
          <div>
            <label><strong>2. Filter by State</strong></label>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={{ width: '100%', padding: '10px' }}>
              <option value="">-- All Active States --</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
             <div style={{ flex: 1 }}>
                <label>From Week</label>
                <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
                  {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
                </select>
             </div>
             <div style={{ flex: 1 }}>
                <label>To Week</label>
                <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
                  {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>

      <button onClick={runPowerQuery} style={{ width: '100%', padding: '15px', backgroundColor: '#2e4a31', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
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
              <th style={{ textAlign: 'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const isOpen = expandedSiteId === r.site_id
              return (
                <React.Fragment key={r.site_id}>
                  <tr onClick={() => toggleSiteWeeks(r.site_id)} style={{ borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: isOpen ? '#f9f9f9' : 'white' }}>
                    <td style={{ padding: '12px' }}>{r.rank}</td>
                    <td>{r.site_name}</td>
                    <td style={{ textAlign: 'center' }}>{r.state}</td>
                    <td style={{ textAlign: 'center' }}>{Math.round(r.avg_likelihood_see * 100)}%</td>
                    <td style={{ textAlign: 'center' }}>{Math.round(r.avg_weekly_checklists)}</td>
                    <td style={{ textAlign: 'center', color: '#2e4a31', fontWeight: 'bold' }}>{isOpen ? '▼' : '▶'}</td>
                  </tr>
                  {isOpen && (
                    <tr style={{ backgroundColor: '#f3f7f4' }}>
                      <td colSpan={6} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold' }}>Seasonal Activity for {selectedSpecies}</span>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button onClick={() => changeWeeksSortMode('best')} style={{ padding: '5px 10px', backgroundColor: weeksSortMode === 'best' ? '#2e4a31' : 'white', color: weeksSortMode === 'best' ? 'white' : '#2e4a31', border: '1px solid #2e4a31', cursor: 'pointer', borderRadius: '4px' }}>Best first</button>
                            <button onClick={() => changeWeeksSortMode('calendar')} style={{ padding: '5px 10px', backgroundColor: weeksSortMode === 'calendar' ? '#2e4a31' : 'white', color: weeksSortMode === 'calendar' ? 'white' : '#2e4a31', border: '1px solid #2e4a31', cursor: 'pointer', borderRadius: '4px' }}>Calendar</button>
                          </div>
                        </div>
                        {weeksLoading ? <p>Loading weeks...</p> : (
                          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
                              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#dfe9e2' }}>
                                <tr>
                                  <th style={{ padding: '8px', textAlign: 'left' }}>Week</th>
                                  <th style={{ textAlign: 'left' }}>Label</th>
                                  <th style={{ textAlign: 'left', width: '250px' }}>Likelihood Probability</th>
                                  <th style={{ textAlign: 'center' }}>Checklists</th>
                                </tr>
                              </thead>
                              <tbody>
                                {weeksRows.map(w => (
                                  <tr key={w.week} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>{w.week}</td>
                                    <td>{w.label_long}</td>
                                    <td style={{ padding: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ flex: 1, backgroundColor: '#eee', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                                          <div style={{ 
                                            width: `${w.likelihood_see * 100}%`, 
                                            backgroundColor: getLikelihoodColor(w.likelihood_see), 
                                            height: '100%' 
                                          }} />
                                        </div>
                                        <span style={{ fontSize: '12px', minWidth: '35px' }}>{Math.round(w.likelihood_see * 100)}%</span>
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{w.num_checklists}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
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