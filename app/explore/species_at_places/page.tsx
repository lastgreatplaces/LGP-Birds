'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesAtPlacesSearch() {
  const [places, setPlaces] = useState<any[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('')
  const [selectedState, setSelectedState] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(2)

  const [minLikelihood, setMinLikelihood] = useState(0.10) // Lowered default to catch more birds
  const [limit, setLimit] = useState(50)
  const [loading, setLoading] = useState(false)

  // 4-Color Logic for visual representation
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
      if (sData) setStates(sData.map(s => s.state))
      if (wData) setWeeks(wData)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function loadPlaces() {
      setSelectedPlaceId('') 
      let q = supabase.from('site_catalog').select('site_id, site_name, state').order('site_name')
      if (selectedState) q = q.eq('state', selectedState)
      const { data } = await q
      setPlaces(data || [])
    }
    loadPlaces()
  }, [selectedState])

  const runPowerQuery = async () => {
    if (!selectedPlaceId) { alert('Please select a place.'); return; }
    
    setLoading(true)
    
    // Convert range into the array the RPC expects: [5, 6, 7]
    const weekArray = Array.from(
        { length: toWeek - fromWeek + 1 }, 
        (_, i) => fromWeek + i
    )

    const { data, error } = await supabase.rpc('rpc_species_at_place', {
      p_site_id: Number(selectedPlaceId),
      p_weeks: weekArray,
      p_min_avg_likelihood: minLikelihood,
      p_limit: limit
    })

    setLoading(false)

    if (error) {
      console.error(error)
      alert('Query error: ' + error.message)
    } else {
      setResults(data || [])
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31' }}>What you’re likely to see</h1>

      <div style={{ marginBottom: '25px' }}>
        <label><strong>1. Choose a Place</strong></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginTop: '10px' }}>
          <div>
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)} style={{ width: '100%', padding: '10px' }}>
              <option value="">-- All Active States --</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <select value={selectedPlaceId} onChange={(e) => setSelectedPlaceId(e.target.value)} style={{ width: '100%', padding: '10px' }}>
              <option value="">-- Select a Place --</option>
              {places.map(p => (
                <option key={p.site_id} value={p.site_id}>{p.site_name} ({p.state})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label><strong>2. Choose Weeks</strong></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
          <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
          <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ width: '100%', padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
      </div>

      <button onClick={runPowerQuery} disabled={loading}
        style={{ width: '100%', padding: '15px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
        {loading ? 'ANALYZING HOTSPOT...' : 'REVEAL SPECIES'}
      </button>

      {results.length > 0 && (
        <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
              <th style={{ padding: '12px' }}>Rank</th>
              <th style={{ textAlign: 'left' }}>Species</th>
              <th>Likelihood</th>
              <th>Avg Weekly Reports</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px', textAlign: 'center' }}>{r.rank}</td>
                <td style={{ fontWeight: 'bold' }}>{r.species}</td>
                <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: getLikelihoodColor(r.avg_likelihood_see), 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {Math.round(r.avg_likelihood_see * 100)}%
                    </span>
                </td>
                <td style={{ textAlign: 'center' }}>{r.avg_weekly_checklists}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}