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

  // Parameters confirmed from your GitHub history
  const [minLikelihood] = useState(0.05)
  const [limit] = useState(50)
  const [loading, setLoading] = useState(false)

  // 1. Initial Data Load (States and Weeks)
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

  // 2. Fetch Places - Methodically handles "XX - StateName" for all states
  useEffect(() => {
    async function fetchPlaces() {
      if (!selectedState) {
        setPlaces([])
        return
      }
      
      // Methodical Fix: This ensures "TX - Texas" becomes "TX" 
      // and "CA - California" becomes "CA", matching your DB shorthand.
      const stateCode = selectedState.split(' - ')[0].trim()

      const { data, error } = await supabase
        .from('site_species_week_likelihood')
        .select('site_name, site_id')
        .eq('state', stateCode) 
        .order('site_name')
      
      if (error) {
        console.error("Place fetch error:", error)
        return
      }

      if (data) {
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

  // 3. Search Execution - Using confirmed rpc_species_at_place
  const runSearch = async () => {
    if (!selectedPlaceId) return
    setLoading(true)

    // Build array of weeks for ANY(p_weeks) logic
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
      console.error("RPC Error:", error)
      alert("Query error: " + error.message)
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
    <div style={{ padding: '15px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31', marginBottom: '20px', fontSize: '1.5rem' }}>
        What You're Likely to See
      </h1>

      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>
          1. Choose a State & Place
        </label>

        {/* State Selection Grid */}
        <div style={{ 
          height: '110px', 
          overflowY: 'auto', 
          background: 'white', 
          border: '1px solid #ddd', 
          borderRadius: '6px', 
          padding: '10px', 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px',
          marginBottom: '15px'
        }}>
          {states.map(s => (
            <label key={s.state} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="stateGroup"
                checked={selectedState === s.state} 
                onChange={() => {
                  setSelectedState(s.state)
                  setSelectedPlaceId('') 
                }} 
                style={{ marginRight: '8px' }} 
              />
              {s.state}
            </label>
          ))}
        </div>

        {/* Place Dropdown */}
        <select 
          value={selectedPlaceId} 
          onChange={(e) => setSelectedPlaceId(Number(e.target.value))}
          disabled={!selectedState}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}
        >
          <option value="">
            {selectedState ? `-- Select from ${places.length} Places --` : "-- Choose State First --"}
          </option>
          {places.map((p) => (
            <option key={p.site_id} value={p.site_id}>{p.site_name}</option>
          ))}
        </select>
      </div>

      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold' }}>2. Choose Start & End Weeks</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
          <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
            {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
          </select>
        </div>
      </div>

      <button onClick={runSearch} disabled={loading || !selectedPlaceId}
        style={{ width: '100%', padding: '16px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1.1rem' }}>
        {loading ? 'ANALYZING...' : 'VIEW LIKELY BIRDS'}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: '25px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Rank</th>
                <th>Species</th>
                <th style={{ textAlign: 'center' }}>Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{r.rank}</td>
                  <td style={{ fontWeight: 'bold' }}>{r.species || r.common_name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: getLikelihoodColor(Number(r.avg_likelihood_see || r.avg_likelihood)), 
                      color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' 
                    }}>
                      {Math.round((r.avg_likelihood_see || r.avg_likelihood) * 100)}%
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