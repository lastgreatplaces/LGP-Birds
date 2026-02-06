'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesAtPlacesSearch() {
  const [places, setPlaces] = useState<any[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('')
  const [selectedState, setSelectedState] = useState('')
  const [searchTerm, setSearchTerm] = useState('') 
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(2)

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [minLikelihood] = useState(0.10)
  const [limit] = useState(50)

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
      setSearchTerm('') 
      let q = supabase.from('site_catalog').select('site_id, site_name, state').order('site_name')
      q = q.eq('state', selectedState)
      const { data } = await q
      setPlaces(data || [])
    }
    loadPlaces()
  }, [selectedState])

  const filteredPlaces = useMemo(() => {
    if (!searchTerm) return places
    return places.filter(p => 
      p.site_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [places, searchTerm])

  const runPowerQuery = async () => {
    if (!selectedPlaceId) { alert('Please select a place.'); return; }
    setLoading(true)
    setHasSearched(false)
    const weekArray = Array.from({ length: toWeek - fromWeek + 1 }, (_, i) => fromWeek + i)

    const { data, error } = await supabase.rpc('rpc_species_at_place', {
      p_site_id: Number(selectedPlaceId),
      p_weeks: weekArray,
      p_min_avg_likelihood: minLikelihood,
      p_limit: limit
    })

    setLoading(false)
    setHasSearched(true)
    if (error) alert('Query error: ' + error.message)
    else setResults(data || [])
  }

  return (
    <div style={{ padding: '10px 12px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      {/* Reduced Title size to fit one line */}
      <h1 style={{ color: '#2e4a31', fontSize: '1.25rem', marginBottom: '12px', fontWeight: 'bold' }}>
        What you're likely to see
      </h1>

      {/* 1. Choose a Place Section - Tightened */}
      <div style={{ marginBottom: '10px', backgroundColor: '#f4f4f4', padding: '10px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#444', display: 'block', marginBottom: '2px' }}>1. State & Hotspot Search</span>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '8px' }}>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <input 
              type="text" 
              placeholder="Search hotspots..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '6px 6px 0 0', border: '1px solid #ccc', borderBottom: 'none', boxSizing: 'border-box' }}
            />
            <select 
              value={selectedPlaceId} 
              onChange={(e) => setSelectedPlaceId(e.target.value)} 
              size={4} 
              style={{ width: '100%', padding: '4px', fontSize: '14px', borderRadius: '0 0 6px 6px', border: '1px solid #ccc' }}
            >
              {/* Removed the "xx places found" informative line for clarity */}
              {filteredPlaces.map(p => (
                <option key={p.site_id} value={p.site_id}>{p.site_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Choose Weeks (To & From) - Compacted */}
      <div style={{ marginBottom: '12px', backgroundColor: '#f4f4f4', padding: '10px', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#444', display: 'block', marginBottom: '6px' }}>2. Choose Weeks (To & From)</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '6px', border: '1px solid #ccc' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
          <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '6px', border: '1px solid #ccc' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '14px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '0.95rem' }}>
        {loading ? 'ANALYZING...' : 'REVEAL SPECIES'}
      </button>

      {/* Results / Empty Message */}
      {hasSearched && results.length === 0 && !loading && (
        <div style={{ marginTop: '20px', padding: '15px', textAlign: 'center', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', color: '#616161', fontSize: '0.85rem' }}>
          No species were identified at this place and time frame; perhaps choose another place or date range.
        </div>
      )}

      {results.length > 0 && (
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
              <th style={{ padding: '8px 4px', width: '30px' }}>#</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Species</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Likelihood</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 4px', textAlign: 'center', color: '#888' }}>{r.rank}</td>
                <td style={{ padding: '8px', fontWeight: 'bold', color: '#333' }}>{r.species}</td>
                <td style={{ textAlign: 'center', padding: '8px' }}>
                    <span style={{ 
                      backgroundColor: getLikelihoodColor(r.avg_likelihood_see), 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      fontSize: '0.75rem',
                      display: 'inline-block',
                      width: '40px'
                    }}>
                      {Math.round(r.avg_likelihood_see * 100)}%
                    </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}