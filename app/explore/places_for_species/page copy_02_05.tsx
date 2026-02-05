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
  
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

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
    if (!selectedSpecies) {
      alert('Please select a bird species.')
      return
    }
    if (toWeek < fromWeek) {
      alert('The "To" week cannot be earlier than the "From" week. Please adjust your range.')
      return
    }

    setLoading(true)
    setHasSearched(false)

    // Using your exact RPC approach
    const { data, error } = await supabase.rpc('rpc_best_places_for_species', {
      p_species: selectedSpecies,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: selectedState ? [selectedState] : null,
      p_limit: 50
    })

    setLoading(false)
    setHasSearched(true)

    if (error) {
      console.error(error)
      alert("Query error: " + error.message)
    } else {
      setResults((data || []) as PlaceRow[])
    }
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
    if (val >= 0.80) return '#1b5e20'
    if (val >= 0.60) return '#4caf50'
    if (val >= 0.33) return '#fbc02d'
    return '#d32f2f'
  }

  return (
    <div style={{ padding: '15px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* Reduced size heading with proper casing */}
      <h1 style={{ color: '#2e4a31', fontSize: '1.5rem', marginBottom: '20px' }}>
        Find Best Places & Weeks for a Species
      </h1>

      <div style={{ marginBottom: '20px', background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>1. Select Bird Species:</label>
        <select value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)} 
                style={{ width: '100%', padding: '12px', marginTop: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
          <option value="">-- Select a bird --</option>
          {allSpecies.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>

        {/* 2. State selection using the new 2x2 grid approach */}
        <div style={{ marginTop: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>2. Choose a State & Place</label>
          <div style={{ 
            height: '85px', 
            overflowY: 'auto', 
            background: 'white', 
            border: '1px solid #ddd', 
            borderRadius: '6px', 
            padding: '10px', 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            marginTop: '10px'
          }}>
            {states.map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="stateFilter"
                  checked={selectedState === s} 
                  onChange={() => setSelectedState(s)} 
                  style={{ marginRight: '8px', width: '18px', height: '18px' }} 
                />
                {s}
              </label>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="stateFilter"
                checked={selectedState === ''} 
                onChange={() => setSelectedState('')} 
                style={{ marginRight: '8px', width: '18px', height: '18px' }} 
              />
              All States
            </label>
          </div>
        </div>

        {/* 3. Week selection with Bold labels and larger dropdowns */}
        <div style={{ marginTop: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>3. Choose Start & End Weeks</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
             <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>From Week</label>
                <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} 
                        style={{ width: '100%', padding: '12px', marginTop: '4px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
                  {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
                </select>
             </div>
             <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>To Week</label>
                <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} 
                        style={{ width: '100%', padding: '12px', marginTop: '4px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
                  {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
                </select>
             </div>
          </div>
        </div>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '16px', backgroundColor: '#2e4a31', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'ANALYZING SIGHTINGS...' : 'FIND BEST PLACES'}
      </button>

      {hasSearched && results.length === 0 && !loading && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff4f4', border: '1px solid #facaca', borderRadius: '8px', color: '#d32f2f', fontWeight: 'bold' }}>
          No records found for this species in the selected area/time.
        </div>
      )}

      {results.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            {expandedSiteIds.length > 0 && (
              <button onClick={() => setExpandedSiteIds([])} 
                style={{ background: 'white', border: '1px solid #d32f2f', color: '#d32f2f', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Clear Comparisons
              </button>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Rank</th>
                <th style={{ textAlign: 'left' }}>Site Name</th>
                <th style={{ textAlign: 'center' }}>State</th>
                <th style={{ textAlign: 'center' }}>Avg Likelihood</th>
                <th style={{ textAlign: 'center' }}>Checklists</th>
                <th style={{ textAlign: 'center' }}>Weeks</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const isOpen = expandedSiteIds.includes(r.site_id)
                const badgeColor = getLikelihoodColor(r.avg_likelihood_see)
                return (
                  <React.Fragment key={r.site_id}>
                    <tr onClick={() => toggleSiteWeeks(r.site_id)} style={{ borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: isOpen ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '10px' }}>{r.rank}</td>
                      <td style={{ fontWeight: 'bold' }}>{r.site_name}</td>
                      <td style={{ textAlign: 'center' }}>{r.state}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ backgroundColor: badgeColor, color: 'white', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {Math.round(r.avg_likelihood_see * 100)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{Math.round(r.avg_weekly_checklists)}</td>
                      <td style={{ textAlign: 'center', color: '#2e4a31' }}>{isOpen ? '▼' : '▶'}</td>
                    </tr>
                    {isOpen && (
                      <tr style={{ backgroundColor: '#f3f7f4' }}>
                        <td colSpan={6} style={{ padding: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Trend: {r.site_name}</span>
                            <div style={{ display: 'flex', gap: '5px' }}>
                               <button onClick={(e) => { e.stopPropagation(); changeWeeksSortMode('best'); }} 
                                 style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2e4a31', backgroundColor: weeksSortMode === 'best' ? '#2e4a31' : 'white', color: weeksSortMode === 'best' ? 'white' : '#2e4a31' }}>
                                 Best First
                               </button>
                               <button onClick={(e) => { e.stopPropagation(); changeWeeksSortMode('calendar'); }} 
                                 style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid #2e4a31', backgroundColor: weeksSortMode === 'calendar' ? '#2e4a31' : 'white', color: weeksSortMode === 'calendar' ? 'white' : '#2e4a31' }}>
                                 Calendar
                               </button>
                            </div>
                          </div>
                          <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #ddd', background: 'white' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                              <thead style={{ position: 'sticky', top: 0, background: '#eee' }}>
                                <tr>
                                  <th style={{ padding: '6px' }}>Wk</th>
                                  <th style={{ textAlign: 'left' }}>Label</th>
                                  <th style={{ textAlign: 'left' }}>Probability</th>
                                  <th style={{ textAlign: 'center' }}>Lists</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(weeksDataStore[r.site_id] || []).map(w => (
                                  <tr key={w.week} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '6px', textAlign: 'center' }}>{w.week}</td>
                                    <td>{w.label_long}</td>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ flex: 1, backgroundColor: '#eee', height: '6px', borderRadius: '3px' }}>
                                          <div style={{ width: `${w.likelihood_see * 100}%`, backgroundColor: getLikelihoodColor(w.likelihood_see), height: '100%', borderRadius: '3px' }} />
                                        </div>
                                        <span>{Math.round(w.likelihood_see * 100)}%</span>
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{w.num_checklists}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}