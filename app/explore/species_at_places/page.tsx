'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function SpeciesAtPlacesSearch() {
  const [places, setPlaces] = useState<any[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('')
  const [selectedState, setSelectedState] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(2)

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [minLikelihood] = useState(0.10)
  const [limit] = useState(50)

  const COLORS = { primary: '#2e4a31', bg: '#f4f4f4', border: '#ccc', text: '#333' }

  const getLikelihoodColor = (val: number) => {
    if (val >= 0.80) return '#1b5e20'
    if (val >= 0.60) return '#4caf50'
    if (val >= 0.33) return '#fbc02d'
    return '#d32f2f'
  }

  useEffect(() => {
    async function loadInitialData() {
      const { data: sData } = await supabase.from('dropdown_states').select('state').eq('is_active', true).order('state')
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      if (sData) {
        const stateList = sData.map(s => s.state)
        setStates(stateList)
        if (stateList.length > 0) setSelectedState(stateList[0])
      }
      if (wData) setWeeks(wData)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function loadPlaces() {
      if (!selectedState) return
      setSelectedPlaceId('') 
      let q = supabase.from('site_catalog').select('site_id, site_name, state').order('site_name')
      q = q.eq('state', selectedState)
      const { data } = await q
      setPlaces(data || [])
    }
    loadPlaces()
  }, [selectedState])

  const runPowerQuery = async () => {
    if (!selectedPlaceId) { alert('Please select a place.'); return; }
    
    if (toWeek < fromWeek) {
      alert('Search Error: The "To" week cannot precede the "From" week.');
      return;
    }

    setLoading(true); setHasSearched(false)
    const weekArray = Array.from({ length: toWeek - fromWeek + 1 }, (_, i) => fromWeek + i)
    const { data, error } = await supabase.rpc('rpc_species_at_place', {
      p_site_id: Number(selectedPlaceId), p_weeks: weekArray, p_min_avg_likelihood: minLikelihood, p_limit: limit
    })
    setLoading(false); setHasSearched(true)
    if (error) console.error(error); else setResults(data || [])
  }

  return (
    <div style={{ padding: '12px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: COLORS.text }}>
      <Link href="/explore" style={{ display: 'inline-block', backgroundColor: '#2e4a31', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none', marginBottom: '10px' }}>
        EXPLORE
      </Link>

      <h1 style={{ color: COLORS.primary, fontSize: '1.5rem', marginBottom: '16px', fontWeight: 'bold' }}>
        What you're likely to see
      </h1>

      {/* 1. Select a State & Place */}
      <div style={{ marginBottom: '12px', backgroundColor: COLORS.bg, padding: '12px', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>1. Select a State & Place</span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} 
            style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <div style={{ fontSize: '0.75rem', color: '#666', paddingLeft: '4px', fontStyle: 'italic' }}>
            {places.length} Places in {selectedState || 'this state'}
          </div>
          
          <select value={selectedPlaceId} onChange={(e) => setSelectedPlaceId(e.target.value)} 
            style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
            <option value="">-- Choose a Place --</option>
            {places.map(p => (
              <option key={p.site_id} value={p.site_id}>{p.site_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Choose Weeks */}
      <div style={{ marginBottom: '16px', backgroundColor: COLORS.bg, padding: '12px', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>2. Choose Weeks</span>
        
        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '4px' }}>From</label>
        <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} 
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: `1px solid ${COLORS.border}`, marginBottom: '10px' }}>
          {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
        </select>

        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '4px' }}>To</label>
        <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} 
          style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
          {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
        </select>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '15px', backgroundColor: COLORS.primary, color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>
        {loading ? 'ANALYZING...' : 'REVEAL SPECIES'}
      </button>

      {/* Results Table */}
      {hasSearched && (
        <div style={{ marginTop: '24px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', fontSize: '0.9rem' }}>
              No species were identified at this place and time frame; perhaps choose another place or date range.
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.primary, color: 'white' }}>
                    <th style={{ padding: '10px 4px', width: '30px' }}>#</th>
                    <th style={{ textAlign: 'left', padding: '10px' }}>Species Name</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Likelihood</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px 4px', textAlign: 'center', color: '#888' }}>{r.rank}</td>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{r.species}</td>
                      <td style={{ textAlign: 'center', padding: '10px' }}>
                          <span style={{ 
                            backgroundColor: getLikelihoodColor(r.avg_likelihood_see), 
                            color: 'white', 
                            padding: '5px 8px', 
                            borderRadius: '6px', 
                            fontWeight: 'bold', 
                            fontSize: '0.8rem',
                            display: 'inline-block',
                            minWidth: '45px'
                          }}>
                            {Math.round(r.avg_likelihood_see * 100)}%
                          </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '16px', fontSize: '0.7rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                Minimum 20% likelihood for reporting.
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}