'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function SpeciesAtPlacesSearch() {
  const [places, setPlaces] = useState<any[]>([])
  const [states, setStates] = useState<string[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('') // keep as string for <select>
  const [selectedState, setSelectedState] = useState('')            // optional filter for place list
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(2)

  const [minLikelihood, setMinLikelihood] = useState(0.20)
  const [limit, setLimit] = useState(50)

  // Load States + Weeks once
  useEffect(() => {
    async function loadInitialData() {
      const { data: sData, error: sErr } = await supabase
        .from('dropdown_states')
        .select('state')
        .eq('is_active', true)
        .order('state')

      const { data: wData, error: wErr } = await supabase
        .from('weeks_months')
        .select('week, label_long')
        .order('week')

      if (sErr) console.error(sErr)
      if (wErr) console.error(wErr)

      if (sData) setStates(sData.map(s => s.state))
      if (wData) setWeeks(wData)
    }
    loadInitialData()
  }, [])

  // Load Places whenever selectedState changes
  useEffect(() => {
    async function loadPlaces() {
      setSelectedPlaceId('') // reset place when state filter changes

      // We assume site_catalog has: site_id, site_name, state, (maybe priority)
      let q = supabase
        .from('site_catalog')
        .select('site_id, site_name, state')
        .order('site_name')

      if (selectedState) q = q.eq('state', selectedState)

      const { data, error } = await q
      if (error) {
        console.error(error)
        alert('Error loading places: ' + error.message)
        return
      }
      setPlaces(data || [])
    }
    loadPlaces()
  }, [selectedState])

  const runPowerQuery = async () => {
    if (!selectedPlaceId) {
      alert('Please select a place.')
      return
    }
    if (toWeek < fromWeek) {
      alert('"To Week" must be the same or later than "From Week".')
      return
    }

    const { data, error } = await supabase.rpc('rpc_likely_species_at_place', {
      p_site_id: Number(selectedPlaceId),
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_min_avg_likelihood: minLikelihood,
      p_limit: limit
    })

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

      <p style={{ marginTop: '6px', color: '#444' }}>
        Choose a place and week range to see the birds you’re most likely to encounter.
      </p>

      {/* 1. Place selection */}
      <div style={{ marginBottom: '25px' }}>
        <label><strong>1. Choose a Place</strong></label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px', marginTop: '10px' }}>
          <div>
            <label style={{ fontSize: '14px', color: '#444' }}>Filter places by State (optional)</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            >
              <option value="">-- All Active States --</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#444' }}>Place</label>
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px' }}
            >
              <option value="">-- Select a Place --</option>
              {places.map(p => (
                <option key={p.site_id} value={p.site_id}>
                  {p.site_name} ({p.state})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Week selection */}
      <div style={{ marginBottom: '25px' }}>
        <label><strong>2. Choose Weeks</strong></label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
          <div>
            <label>From Week</label>
            <select
              value={fromWeek}
              onChange={(e) => setFromWeek(Number(e.target.value))}
              style={{ width: '100%', padding: '10px' }}
            >
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>

          <div>
            <label>To Week</label>
            <select
              value={toWeek}
              onChange={(e) => setToWeek(Number(e.target.value))}
              style={{ width: '100%', padding: '10px' }}
            >
              {weeks.map(w => <option key={w.week} value={w.week}>{w.label_long}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Options */}
      <div style={{ marginBottom: '25px' }}>
        <label><strong>3. Options</strong></label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
          <div>
            <label>Minimum likelihood (default 0.20)</label>
            <select
              value={minLikelihood}
              onChange={(e) => setMinLikelihood(Number(e.target.value))}
              style={{ width: '100%', padding: '10px' }}
            >
              <option value={0.20}>0.20 (Recommended)</option>
              <option value={0.25}>0.25</option>
              <option value={0.30}>0.30</option>
              <option value={0.40}>0.40</option>
            </select>
          </div>

          <div>
            <label>Show top</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{ width: '100%', padding: '10px' }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={runPowerQuery}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: '#2e4a31',
          color: 'white',
          borderRadius: '5px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        SEARCH SPECIES
      </button>

      {/* Results */}
      {results.length > 0 && (
        <table style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2e4a31', color: 'white' }}>
              <th style={{ padding: '10px' }}>Rank</th>
              <th>Species</th>
              <th style={{ textAlign: 'center' }}>Avg Likelihood</th>
              <th style={{ textAlign: 'center' }}>Weeks Used</th>
              <th style={{ textAlign: 'center' }}>Avg Checklists</th>
              <th style={{ textAlign: 'center' }}>Avg Exp. Checklists</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px', textAlign: 'center' }}>{r.rank}</td>
                <td>{r.species}</td>
                <td style={{ textAlign: 'center' }}>
                  {typeof r.avg_likelihood_see === 'number'
                    ? r.avg_likelihood_see.toFixed(2)
                    : r.avg_likelihood_see}
                </td>
                <td style={{ textAlign: 'center' }}>{r.weeks_used}</td>
                <td style={{ textAlign: 'center' }}>
                  {typeof r.avg_weekly_checklists === 'number'
                    ? r.avg_weekly_checklists.toFixed(0)
                    : r.avg_weekly_checklists}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {typeof r.avg_expected_checklists === 'number'
                    ? r.avg_expected_checklists.toFixed(0)
                    : r.avg_expected_checklists}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {results.length === 0 && (
        <div style={{ marginTop: '20px', color: '#666' }}>
          (No results yet — choose a place and weeks, then search.)
        </div>
      )}
    </div>
  )
}
