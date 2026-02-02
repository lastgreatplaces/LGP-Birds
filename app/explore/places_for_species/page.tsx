'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type WeekRow = {
  week: number
  label_long: string | null
  likelihood_see: number
  num_checklists: number
}

type PlaceRow = {
  rank: number
  site_id: number
  site_name: string
  state: string
  avg_likelihood_see: number
  avg_weekly_checklists: number
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

  const [expandedSiteIds, setExpandedSiteIds] = useState<number[]>([])
  const [weeksDataStore, setWeeksDataStore] = useState<Record<number, WeekRow[]>>({})
  const [weeksLoading, setWeeksLoading] = useState<Record<number, boolean>>({})
  const [weeksSortMode, setWeeksSortMode] = useState<'best' | 'calendar'>('best')

  useEffect(() => {
    setExpandedSiteIds([])
    setWeeksDataStore({})
  }, [selectedSpecies, selectedState, fromWeek, toWeek])

  useEffect(() => {
    async function loadInitialData() {
      const { data: sData } = await supabase.from('dropdown_states').select('state').eq('is_active', true).order('state')
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      const { data: spData } = await supabase.from('species_groups').select('species_name').order('species_name')
      if (sData) setStates((sData as any[]).map(x => x.state))
      if (wData) setWeeks(wData as any[])
      if (spData) setAllSpecies((spData as any[]).map(x => x.species_name))
    }
    loadInitialData()
  }, [])

  const runPowerQuery = async () => {
    if (!selectedSpecies) return
    const { data, error } = await supabase.rpc('rpc_best_places_for_species', {
      p_species: selectedSpecies,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: selectedState ? [selectedState] : null,
      p_limit: 50
    })
    if (!error) setResults((data || []) as PlaceRow[])
  }

  const fetchWeeksForSite = async (siteId: number, sortMode: 'best' | 'calendar') => {
    setWeeksLoading(prev => ({ ...prev, [siteId]: true }))
    const { data, error } = await supabase.rpc('rpc_species_weeks_at_place', {
      p_species: selectedSpecies,
      p_site_id: siteId,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_min_likelihood: 0.20,
      p_sort_mode: sortMode,
      p_limit: 52 
    })
    setWeeksLoading(prev => ({ ...prev, [siteId]: false }))
    if (!error) {
      setWeeksDataStore(prev => ({ ...prev, [siteId]: (data || []) as WeekRow[] }))
    }
  }

  const toggleSiteWeeks = async (siteId: number) => {
    if (expandedSiteIds.includes(siteId)) {
      setExpandedSiteIds(prev => prev.filter(id => id !== siteId))
    } else {
      setExpandedSiteIds(prev => [...prev, siteId])
      await fetchWeeksForSite(siteId, weeksSortMode)
    }
  }

  const changeWeeksSortMode = async (mode: 'best' | 'calendar') => {
    setWeeksSortMode(mode)
    for (const siteId of expandedSiteIds) {
      await fetchWeeksForSite(siteId, mode)
    }
  }

  const getLikelihoodColor = (val: number) => {
    if (val >= 0.80) return '#1b5e20' // Dark Green
    if (val >= 0.60) return '#4caf50' // Light Green
    if (val >= 0.40) return '#fbc02d' // Gold
    return '#d32f2f' // Red
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', fontFamily: 'sans-serif', textAlign: 'left' }}>
      <h1 style={{ color: '#2e4a31' }}>Find Best Places & Weeks for a Species</h1>

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
        FIND BEST PLACES
      </button>

      {results.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            {expandedSiteIds.length > 0 && (
              <button 
                onClick={() => setExpandedSiteIds([])} 
                style={{ 
                  background: 'white', 
                  border: '1px solid #d32f2f', 
                  color: '#d32f2f', 
                  padding: '6px 12px', 
                  borderRadius: '4px', 
                  cursor: 'pointer', 
                  fontWeight: 'bold' 
                }}
              >
                Clear Comparisons
              </button>
            )}
          </div>

          <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Rank</th>
                <th style={{ textAlign: 'left' }}>Site Name</th>
                <th style={{ textAlign: 'center' }}>State</th>
                <th style={{ textAlign: 'center' }}>Avg Likelihood</th>
                <th style={{ textAlign: 'center' }}>Avg Checklists</th>
                <th style={{ textAlign: 'center' }}>Best Weeks</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const isOpen = expandedSiteIds.includes(r.site_id)
                const badgeColor = getLikelihoodColor(r.avg_likelihood_see)
                return (
                  <React.Fragment key={r.site_id}>
                    <tr onClick={() => toggleSiteWeeks(r.site_id)} style={{ borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: isOpen ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '12px' }}>{r.rank}</td>
                      <td>{r.site_name}</td>
                      <td style={{ textAlign: 'center' }}>{r.state}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ backgroundColor: badgeColor, color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '13px', display: 'inline-block', minWidth: '45px' }}>
                          {Math.round(r.avg_likelihood_see * 100)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{Math.round(r.avg_weekly_checklists)}</td>
                      <td style={{ textAlign: 'center', color: '#2e4a31' }}>{isOpen ? '▼' : '▶'}</td>
                    </tr>
                    {isOpen && (
                      <tr style={{ backgroundColor: '#f3f7f4' }}>
                        <td colSpan={6} style={{ padding: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <strong>Seasonal Trend: {r.site_name}</strong>
                            <div style={{ display: 'flex', gap: '8px' }}>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); changeWeeksSortMode('best'); }} 
                                 style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #2e4a31', backgroundColor: weeksSortMode === 'best' ? '#2e4a31' : 'white', color: weeksSortMode === 'best' ? 'white' : '#2e4a31' }}
                               >
                                 Best First
                               </button>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); changeWeeksSortMode('calendar'); }} 
                                 style={{ padding: '5px 10px', fontSize: '12px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #2e4a31', backgroundColor: weeksSortMode === 'calendar' ? '#2e4a31' : 'white', color: weeksSortMode === 'calendar' ? 'white' : '#2e4a31' }}
                               >
                                 Calendar
                               </button>
                            </div>
                          </div>
                          {weeksLoading[r.site_id] ? <p>Loading weeks...</p> : (
                            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #ddd', background: 'white' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#eee', fontSize: '13px' }}>
                                  <tr>
                                    <th style={{ padding: '8px', textAlign: 'left' }}>Week</th>
                                    <th style={{ textAlign: 'left' }}>Label</th>
                                    <th style={{ textAlign: 'left' }}>Probability Bar</th>
                                    <th style={{ textAlign: 'center' }}>Checklists</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(weeksDataStore[r.site_id] || []).map(w => (
                                    <tr key={w.week} style={{ borderBottom: '1px solid #eee', fontSize: '13px' }}>
                                      <td style={{ padding: '8px' }}>{w.week}</td>
                                      <td>{w.label_long}</td>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ flex: 1, backgroundColor: '#eee', height: '8px', borderRadius: '4px' }}>
                                            <div style={{ width: `${w.likelihood_see * 100}%`, backgroundColor: getLikelihoodColor(w.likelihood_see), height: '100%', borderRadius: '4px' }} />
                                          </div>
                                          <span style={{ minWidth: '30px' }}>{Math.round(w.likelihood_see * 100)}%</span>
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
        </>
      )}
    </div>
  )
}