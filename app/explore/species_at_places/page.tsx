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

  const [minLikelihood, setMinLikelihood] = useState(0.10)
  const [limit, setLimit] = useState(50)
  const [loading, setLoading] = useState(false)

  // 4-Color Logic requested in your "colors" version
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
    async function fetchPlaces() {
      if (!selectedState) {
        setPlaces([])
        return
      }

      // THE CRITICAL FIX: This splits "FL - Florida" to just "FL"
      const stateCode = selectedState.split(' - ')[0].trim()

      const { data, error } = await supabase
        .from('site_species_week_likelihood')
        .select('site_name, site_id')
        .eq('state', stateCode) // Now it correctly looks for "FL"
        .order('site_name')

      if (error) {
        console.error("Error fetching places:", error)
        return
      }

      if (data) {
        const uniqueMap = new Map()
        data.forEach(item => {
          if (!uniqueMap.has(item.site_name)) {
            uniqueMap.set(item.site_name, item)
          }
        })
        setPlaces(Array.from(uniqueMap.values()))
      }
    }
    fetchPlaces()
  }, [selectedState])

  const runSearch = async () => {
    if (!selectedPlaceId) {
      alert("Please select a place first.")
      return
    }
    setLoading(true)
    
    const { data, error } = await supabase.rpc('rpc_species_at_place', {
      p_site_name: selectedPlaceId,
      p_week_from: fromWeek,
      p_week_to: toWeek
    })

    setLoading(false)
    if (error) {
      console.error(error)
      alert("Query error: " + error.message)
    } else {
      setResults(data || [])
    }
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

        <div style={{ 
          height: '120px', 
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
            <label key={s} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="stateGroup"
                checked={selectedState === s} 
                onChange={() => {
                  setSelectedState(s)
                  setSelectedPlaceId('') 
                }} 
                style={{ marginRight: '8px', width: '18px', height: '18px' }} 
              />
              {s}
            </label>
          ))}
        </div>

        <select 
          value={selectedPlaceId} 
          onChange={(e) => setSelectedPlaceId(e.target.value)}
          disabled={!selectedState}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}
        >
          <option value="">
            {selectedState ? `-- Select from ${places.length} Places --` : "-- Choose State First --"}
          </option>
          {places.map((p, i) => (
            <option key={i} value={p.site_name}>{p.site_name}</option>
          ))}
        </select>
      </div>

      <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <label style={{ fontWeight: 'bold' }}>2. Choose Start & End Weeks</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>From Week</label>
            <select value={fromWeek} onChange={(e) => setFromWeek(Number(e.target.value))} 
              style={{ width: '100%', padding: '12px', marginTop: '4px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>To Week</label>
            <select value={toWeek} onChange={(e) => setToWeek(Number(e.target.value))} 
              style={{ width: '100%', padding: '12px', marginTop: '4px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}>
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={runSearch} disabled={loading || !selectedPlaceId}
        style={{ width: '100%', padding: '16px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1.1rem', opacity: (loading || !selectedPlaceId) ? 0.7 : 1 }}>
        {loading ? 'ANALYZING...' : 'VIEW LIKELY BIRDS'}
      </button>

      {results.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '25px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#2e4a31', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Common Name</th>
                <th style={{ textAlign: 'center' }}>Likelihood</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ fontWeight: '600', padding: '10px' }}>{r.common_name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      backgroundColor: getLikelihoodColor(Number(r.avg_likelihood)), 
                      color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' 
                    }}>
                      {(Number(r.avg_likelihood) * 100).toFixed(1)}%
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