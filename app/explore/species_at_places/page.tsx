'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesAtPlaces() {
  const [states, setStates] = useState<any[]>([])
  const [places, setPlaces] = useState<any[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedState, setSelectedState] = useState('')
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | ''>('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(2)

  const [loading, setLoading] = useState(false)

  // 1. Initial Load: States (now 2-letter) and Weeks
  useEffect(() => {
    async function loadInitialData() {
      const { data: sData } = await supabase
        .from('dropdown_states')
        .select('state')
        .eq('is_active', true)
        .order('state')
      
      const { data: wData } = await supabase
        .from('weeks_months')
        .select('week, label_long')
        .order('week')

      if (sData) setStates(sData)
      if (wData) setWeeks(wData)
    }
    loadInitialData()
  }, [])

  // 2. Fetch Places: Direct match on the 2-letter state code
  useEffect(() => {
    async function fetchPlaces() {
      if (!selectedState) {
        setPlaces([])
        return
      }

      const { data, error } = await supabase
        .from('site_species_week_likelihood')
        .select('site_name, site_id')
        .eq('state', selectedState) 
        .order('site_name')
      
      if (error) {
        console.error("Place fetch error:", error)
        return
      }

      if (data) {
        // Unique sites filter
        const uniqueMap = new Map()
        data.forEach(item => {
          if (!uniqueMap.has(item.site_id)) {
            uniqueMap.set(item.site_id, item)
          }
        })
        setPlaces(Array.from(uniqueMap.values()))
      }
    }
    fetchPlaces()
  }, [selectedState])

  // 3. Search: Using confirmed RPC 'rpc_species_at_place'
  const runSearch = async () => {
    if (!selectedPlaceId) return
    setLoading(true)

    // Build week array [1, 2, 3...]
    const weekArray = Array.from(
      { length: toWeek - fromWeek + 1 }, 
      (_, i) => fromWeek + i
    )

    const { data, error } = await supabase.rpc('rpc_species_at_place', {
      p_site_id: Number(selectedPlaceId),
      p_weeks: weekArray,
      p_min_avg_likelihood: 0.05,
      p_limit: 50
    })

    setLoading(false)
    if (error) {
      alert("Search error: " + error.message)
    } else {
      setResults(data || [])
    }
  }

  const getLikelihoodColor = (val: number) => {
    if (val >= 0.80) return '#1b5e20'
    if (val >= 0.60) return '#4caf50'
    if (val >= 0.33) return '#fbc02d'
    return '#d32f2f'
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31' }}>Species at Place</h1>

      <div style={{ background: '#eee', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label><strong>1. Select State ({selectedState || 'None'})</strong></label>
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', 
          gap: '5px', background: 'white', padding: '10px', marginTop: '10px',
          maxHeight: '100px', overflowY: 'auto', border: '1px solid #ccc'
        }}>
          {states.map(s => (
            <label key={s.state} style={{ fontSize: '12px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="st" 
                checked={selectedState === s.state} 
                onChange={() => { setSelectedState(s.state); setSelectedPlaceId(''); }} 
              /> {s.state}
            </label>
          ))}
        </div>

        <label style={{ display: 'block', marginTop: '15px' }}><strong>2. Select Place</strong></label>
        <select 
          value={selectedPlaceId} 
          onChange={(e) => setSelectedPlaceId(Number(e.target.value))}
          style={{ width: '100%', padding: '10px', marginTop: '5px' }}
        >
          <option value="">-- {places.length} places found --</option>
          {places.map(p => <option key={p.site_id} value={p.site_id}>{p.site_name}</option>)}
        </select>
      </div>

      <div style={{ background: '#eee', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label><strong>3. Select Weeks</strong></label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
          <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} style={{ flex: 1, padding: '10px' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
      </div>

      <button 
        onClick={runSearch} 
        disabled={!selectedPlaceId || loading} 
        style={{ width: '100%', padding: '15px', background: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', border: 'none' }}
      >
        {loading ? 'LOADING...' : 'SHOW SPECIES'}
      </button>

      {results.length > 0 && (
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#2e4a31', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Species</th>
              <th style={{ padding: '10px' }}>Likelihood</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{r.species || r.common_name}</td>
                <td style={{ textAlign: 'center' }}>
                   <span style={{ backgroundColor: getLikelihoodColor(r.avg_likelihood_see || r.avg_likelihood), color: 'white', padding: '4px 8px', borderRadius: '4px' }}>
                    {Math.round((r.avg_likelihood_see || r.avg_likelihood) * 100)}%
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