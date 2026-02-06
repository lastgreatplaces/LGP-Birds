'use client'

import React, { useEffect, useState, useMemo } from 'react'
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
  avg_expected_checklists: number
  footprint_mean: number | null
}

export default function SpeciesSearch() {
  const [allSpecies, setAllSpecies] = useState<string[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<Array<{ week: number; label_long: string }>>([])
  const [results, setResults] = useState<PlaceRow[]>([])

  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(52) 

  const [expandedSiteIds, setExpandedSiteIds] = useState<number[]>([])
  const [weeksDataStore, setWeeksDataStore] = useState<Record<number, WeekRow[]>>({})
  const [weeksLoading, setWeeksLoading] = useState<Record<number, boolean>>({})
  const [weeksSortMode, setWeeksSortMode] = useState<'best' | 'calendar'>('best')
  
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [sortBy, setSortBy] = useState<'avg' | 'integrity' | 'optimal'>('avg')

  // --- Integrity Logic (Inverted 0-100) ---
  const calculateIntegrity = (foot: number | null) => {
    if (foot === null) return null;
    return Math.round(Math.max(0, Math.min(100, 100 - (foot * 100))));
  }

  const getLikelihoodColor = (val: number) => {
    if (val >= 0.80) return '#1b5e20'
    if (val >= 0.60) return '#4caf50'
    if (val >= 0.33) return '#fbc02d'
    return '#d32f2f'
  }

  const getIntegrityColor = (score: number | null) => {
    if (score === null) return '#9e9e9e'; 
    if (score >= 90) return '#1b5e20'; 
    if (score >= 80) return '#4caf50'; 
    if (score >= 67) return '#fbc02d'; 
    return '#d32f2f'; 
  }

  // --- Sorting Logic with your NEW "Optimal" Formula ---
  const sortedResults = useMemo(() => {
    if (!results.length) return [];
    return [...results].sort((a, b) => {
      if (sortBy === 'avg') return b.avg_likelihood_see - a.avg_likelihood_see;
      
      const aInt = calculateIntegrity(a.footprint_mean) || 0;
      const bInt = calculateIntegrity(b.footprint_mean) || 0;
      
      if (sortBy === 'integrity') return bInt - aInt;
      
      if (sortBy === 'optimal') {
        // Optimal formula: (Integrity/100) * Probability
        const aScore = (aInt / 100) * (a.avg_likelihood_see * 100);
        const bScore = (bInt / 100) * (b.avg_likelihood_see * 100);
        return bScore - aScore;
      }
      return 0;
    });
  }, [results, sortBy, calculateIntegrity]);

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
    if (!selectedSpecies) { alert('Please select a bird species.'); return; }
    setLoading(true); setHasSearched(false);
    const { data, error } = await supabase.rpc('rpc_best_places_for_species', {
      p_species: selectedSpecies,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: selectedState ? [selectedState] : null,
      p_limit: 50
    })
    setLoading(false); setHasSearched(true);
    if (!error) setResults((data || []) as PlaceRow[])
  }

  const fetchWeeksForSite = async (siteId: number, sortMode: 'best' | 'calendar') => {
    setWeeksLoading(prev => ({ ...prev, [siteId]: true }))
    setWeeksSortMode(sortMode)
    const { data, error } = await supabase.rpc('rpc_species_weeks_at_place', {
      p_species: selectedSpecies, 
      p_site_id: siteId, 
      p_week_from: fromWeek, 
      p_week_to: toWeek, 
      p_min_likelihood: 0.001, 
      p_sort_mode: sortMode, 
      p_limit: 52 
    })
    setWeeksLoading(prev => ({ ...prev, [siteId]: false }))
    if (!error) setWeeksDataStore(prev => ({ ...prev, [siteId]: (data || []) as WeekRow[] }))
  }

  const toggleSiteWeeks = async (siteId: number) => {
    if (expandedSiteIds.includes(siteId)) {
      setExpandedSiteIds(prev => prev.filter(id => id !== siteId))
    } else {
      setExpandedSiteIds(prev => [...prev, siteId])
      await fetchWeeksForSite(siteId, 'best')
    }
  }

  return (
    <div style={{ padding: '10px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fff' }}>
      <h1 style={{ color: '#2e4a31', fontSize: '1.1rem', marginBottom: '15px', textAlign: 'center', whiteSpace: 'nowrap' }}>
        Best Places for Species
      </h1>

      <div style={{ marginBottom: '10px', background: '#f8f8f8', padding: '12px', borderRadius: '8px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>1. Bird Species</label>
        <select value={selectedSpecies} onChange={(e) => setSelectedSpecies(e.target.value)} 
                style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px' }}>
          <option value="">-- Choose Bird --</option>
          {allSpecies.map(sp => <option key={sp} value={sp}>{sp}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '15px', background: '#eef4ef', border: '1px solid #d0ddd1', padding: '12px', borderRadius: '10px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#2e4a31', display: 'block', marginBottom: '8px' }}>2. Region & Timing</label>
        
        <div style={{ height: '80px', overflowY: 'auto', background: 'white', border: '1px solid #ccc', borderRadius: '6px', padding: '8px', marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer', color: '#2e4a31', fontWeight: 'bold', paddingBottom: '4px' }}>
            <input type="radio" name="state" checked={selectedState === ''} onChange={() => setSelectedState('')} style={{ marginRight: '8px' }} /> All States
          </label>
          {states.map(s => (
            <label key={s} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', padding: '2px 0' }}>
              <input type="radio" name="state" checked={selectedState === s} onChange={() => setSelectedState(s)} style={{ marginRight: '8px' }} /> {s}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
               {weeks.map(w => <option key={w.week} value={w.week}>From: {w.label_long}</option>)}
             </select>
             <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}>
               {weeks.map(w => <option key={w.week} value={w.week}>To: {w.label_long}</option>)}
             </select>
        </div>
      </div>

      <button onClick={runPowerQuery} disabled={loading} style={{ width: '100%', padding: '15px', backgroundColor: '#2e4a31', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', fontSize: '0.9rem' }}>
        {loading ? 'ANALYZING...' : 'FIND BEST PLACES'}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#666' }}>Sort:</span>
          <div style={{ display: 'flex', background: '#eee', padding: '2px', borderRadius: '6px', flex: 1 }}>
            <button onClick={() => setSortBy('avg')} style={{ flex: 1, padding: '8px 0', borderRadius: '5px', border: 'none', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: sortBy === 'avg' ? 'white' : 'transparent' }}>Probability</button>
            <button onClick={() => setSortBy('integrity')} style={{ flex: 1, padding: '8px 0', borderRadius: '5px', border: 'none', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: sortBy === 'integrity' ? 'white' : 'transparent' }}>Integrity</button>
            <button onClick={() => setSortBy('optimal')} style={{ flex: 1, padding: '8px 0', borderRadius: '5px', border: 'none', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: sortBy === 'optimal' ? 'white' : 'transparent' }}>Optimal</button>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '8px 4px', width: '20px' }}>#</th>
                <th style={{ padding: '8px 4px' }}>Click on a Place to see Best Weeks or Calendar</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', width: '10px' }}> </th>
                <th style={{ padding: '8px 4px', textAlign: 'center', width: '35px' }}>Avg %</th>
                <th style={{ padding: '8px 4px', textAlign: 'center', width: '45px' }}>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r, idx) => {
                const isOpen = expandedSiteIds.includes(r.site_id)
                const intScore = calculateIntegrity(r.footprint_mean)
                return (
                  <React.Fragment key={r.site_id}>
                    <tr onClick={() => toggleSiteWeeks(r.site_id)} style={{ borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: isOpen ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '10px 4px', color: '#999' }}>{idx + 1}</td>
                      <td style={{ fontWeight: 'bold', color: '#333' }}>{r.site_name}</td>
                      <td style={{ textAlign: 'center' }}>{r.state}</td>
                      <td style={{ textAlign: 'center' }}>
                         <span style={{ backgroundColor: getLikelihoodColor(r.avg_likelihood_see), color: 'white', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.6rem' }}>
                          {Math.round(r.avg_likelihood_see * 100)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ backgroundColor: getIntegrityColor(intScore), color: 'white', padding: '2px 4px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.6rem' }}>
                          {intScore ?? '--'}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={5} style={{ padding: '10px', backgroundColor: '#f3f7f4' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                             <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Weekly Availability</span>
                             <div style={{ display: 'flex', gap: '4px' }}>
                               <button onClick={(e) => { e.stopPropagation(); fetchWeeksForSite(r.site_id, 'best'); }} 
                                 style={{ padding: '4px 6px', fontSize: '9px', borderRadius: '4px', border: '1px solid #2e4a31', backgroundColor: weeksSortMode === 'best' ? '#2e4a31' : 'white', color: weeksSortMode === 'best' ? 'white' : '#2e4a31' }}>Best</button>
                               <button onClick={(e) => { e.stopPropagation(); fetchWeeksForSite(r.site_id, 'calendar'); }} 
                                 style={{ padding: '4px 6px', fontSize: '9px', borderRadius: '4px', border: '1px solid #2e4a31', backgroundColor: weeksSortMode === 'calendar' ? '#2e4a31' : 'white', color: weeksSortMode === 'calendar' ? 'white' : '#2e4a31' }}>Calendar</button>
                             </div>
                           </div>
                           <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                             {weeksLoading[r.site_id] ? (
                               <div style={{ padding: '15px', textAlign: 'center', fontSize: '0.75rem' }}>Loading weeks...</div>
                             ) : (
                               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                                 <tbody>
                                   {(weeksDataStore[r.site_id] || []).map(w => (
                                     <tr key={w.week} style={{ borderBottom: '1px solid #eee' }}>
                                       <td style={{padding: '6px', width: '40%'}}>{w.label_long}</td>
                                       <td style={{paddingRight: '6px'}}>
                                         <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                           <div style={{ flex: 1, backgroundColor: '#eee', height: '5px', borderRadius: '2px' }}>
                                             <div style={{ width: `${w.likelihood_see * 100}%`, backgroundColor: getLikelihoodColor(w.likelihood_see), height: '100%', borderRadius: '2px' }} />
                                           </div>
                                           <span style={{ minWidth: '22px', textAlign: 'right' }}>{Math.round(w.likelihood_see * 100)}%</span>
                                         </div>
                                       </td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             )}
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