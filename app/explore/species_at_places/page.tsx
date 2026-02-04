'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesAtPlaces() {
  const [states, setStates] = useState<any[]>([])
  const [places, setPlaces] = useState<any[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedState, setSelectedState] = useState('')
  const [selectedPlace, setSelectedPlace] = useState('')
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(1)

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Load initial states and weeks
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

  // Fetch places when a state is selected
  useEffect(() => {
    async function fetchPlaces() {
      if (!selectedState) {
        setPlaces([])
        return
      }

      // Extract the 2-letter code (e.g., "FL") from "FL - Florida"
      const stateCode = selectedState.split(' - ')[0]
      
      const { data, error } = await supabase
        .from('site_species_week_likelihood')
        .select('site_name, site_id')
        .eq('state', stateCode)
        .order('site_name')
      
      if (error) {
        console.error("Error fetching places:", error)
        return
      }

      // Filter for unique site names
      const uniquePlaces = Array.from(new Set(data?.map(a => a.site_name)))
        .map(name => data?.find(a => a.site_name === name))

      setPlaces(uniquePlaces || [])
    }
    fetchPlaces()
  }, [selectedState])

  const runSearch = async () => {
    if (!selectedPlace) {
      alert("Please select a place first.")
      return
    }
    setLoading(true)
    setHasSearched(false)

    // Using the RPC call based on the error message in your screenshot
    const { data, error } = await supabase.rpc('rpc_species_at_place', {
      p_site_name: selectedPlace,
      p_week_from: fromWeek,
      p_week_to: toWeek
    })

    setLoading(false)
    setHasSearched(true)

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

        {/* State Radio Grid */}
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
            <label key={s.state} style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="stateGroup"
                checked={selectedState === s.state} 
                onChange={() => {
                  setSelectedState(s.state)
                  setSelectedPlace('') 
                }} 
                style={{ marginRight: '8px', width: '18px', height: '18px' }} 
              />
              {s.state}
            </label>
          ))}
        </div>

        {/* Place Dropdown */}
        <select 
          value={selectedPlace} 
          onChange={(e) => setSelectedPlace(e.target.value)}
          disabled={!selectedState}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '16px', backgroundColor: 'white' }}
        >
          <option value="">{selectedState ? "-- Select a Place --" : "-- Choose State First --"}</option>
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

      <button onClick={runSearch} disabled={loading || !selectedPlace}
        style={{ width: '100%', padding: '16px', backgroundColor: '#2e4a31', color: 'white', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', border: 'none', fontSize: '1.1rem', opacity: (loading || !selectedPlace) ? 0.7 : 1 }}>
        {loading ? 'ANALYZING...' : 'VIEW LIKELY BIRDS'}
      </button>

      {hasSearched && (
        <div style={{ marginTop: '25px' }}>
          {results.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No sightings found for this selection.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ textAlign: 'center', color: '#2e4a31', fontWeight: 'bold' }}>
                        {(Number(r.avg_likelihood) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}