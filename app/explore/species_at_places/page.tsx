'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesAtPlacesSearch() {
  // --- FOUNDATION: Your original state variables ---
  const [places, setPlaces] = useState<any[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('')
  const [selectedState, setSelectedState] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(2)

  // --- ENHANCEMENT: New states for search and UX ---
  const [searchTerm, setSearchTerm] = useState('') 
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [minLikelihood] = useState(0.10) // Keeping your default
  const [limit] = useState(50)

  // --- FOUNDATION: Your 4-Color Logic ---
  const getLikelihoodColor = (val: number) => {
    if (val >= 0.80) return '#1b5e20' // Dark Green
    if (val >= 0.60) return '#4caf50' // Light Green
    if (val >= 0.33) return '#fbc02d' // Gold
    return '#d32f2f' // Red
  }

  useEffect(() => {
    async function loadInitialData() {
      const { data: sData } = await supabase.from('dropdown_states').select('state').eq('is_active', true).order('state')
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      if (sData) {
        const stateList = sData.map(s => s.state)
        setStates(stateList)
        // ENHANCEMENT: Default to first state, no "All" option
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
      // FOUNDATION: Your site_catalog query
      let q = supabase.from('site_catalog').select('site_id, site_name, state').order('site_name')
      q = q.eq('state', selectedState)
      const { data } = await q
      setPlaces(data || [])
    }
    loadPlaces()
  }, [selectedState])

  // --- ENHANCEMENT: Search filtering logic ---
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
    
    // FOUNDATION: Your week array logic
    const weekArray = Array.from(
        { length: toWeek - fromWeek + 1 }, 
        (_, i) => fromWeek + i
    )

    // FOUNDATION: Your RPC call
    const { data, error } = await supabase.rpc('rpc_species_at_place', {
      p_site_id: Number(selectedPlaceId),
      p_weeks: weekArray,
      p_min_avg_likelihood: minLikelihood,
      p_limit: limit
    })

    setLoading(false)
    setHasSearched(true)

    if (error) {
      console.error(error)
      alert('Query error: ' + error.message)
    } else {
      setResults(data || [])
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31', fontSize: '1.5rem', marginBottom: '20px' }}>What you’re likely to see</h1>

      {/* 1. Choose a Place (Vertical Layout for iPhone) */}
      <div style={{ marginBottom: '20px', backgroundColor: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}><strong>1. Choose a Place</strong></label>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>State</span>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>Search & Select Hotspot</span>
            <input 
              type="text" 
              placeholder="Type to search places..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '14px', borderRadius: '6px 6px 0 0', border: '1px solid #ccc', borderBottom: 'none', boxSizing: 'border-box' }}
            />
            <select 
              value={selectedPlaceId} 
              onChange={(e) => setSelectedPlaceId(e.target.value)} 
              size={5} 
              style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '0 0 6px 6px', border: '1px solid #ccc' }}
            >
              <option value="">-- {filteredPlaces.length} places found --</option>
              {filteredPlaces.map(p => (
                <option key={p.site_id} value={p.site_id}>{p.site_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Choose Weeks (To & From) */}
      <div style={{ marginBottom: '25px', backgroundColor: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}><strong>2. Choose Weeks (From & To)</strong></label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>From</span>
            <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#666', display: 'block', marginBottom: '4px' }}>To</span>
            <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '16px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1rem' }}>
        {loading ? 'ANALYZING HOTSPOT...' : 'REVEAL SPECIES'}
      </button>

      {/* 3. Empty Message Enhancement */}
      {hasSearched && results.length === 0 && !loading && (
        <div style={{ marginTop: '30px', padding: '20px', textAlign: 'center', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', color: '#616161' }}>
          No species were identified at this place and time frame; perhaps choose another place or date range.
        </div>
      )}

      {/* FOUNDATION: Your Results Table with 4-Color Logic */}
      {results.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
                <th style={{ padding: '12px 4px', width: '40px' }}>Rank</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Species</th>
                <th style={{ padding: '12px' }}>Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '12px 4px', textAlign: 'center', color: '#666' }}>{r.rank}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{r.species}</td>
                  <td style={{ textAlign: 'center', padding: '12px' }}>
                      <span style={{ 
                        backgroundColor: getLikelihoodColor(r.avg_likelihood_see), 
                        color: 'white', 
                        padding: '6px 10px', 
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem'
                      }}>
                        {Math.round(r.avg_likelihood_see * 100)}%
                      </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}