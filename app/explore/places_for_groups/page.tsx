'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../lib/supabase'
import React from 'react'
import Link from 'next/link'

type WeekRow = { week: number; label_long: string | null; expected_species: number }

export default function GroupsSearch() {
  const [groups, setGroups] = useState<any[]>([])
  const [states, setStates] = useState<any[]>([])
  const [weeks, setWeeks] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])

  const [groupSet, setGroupSet] = useState('major')
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])

  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [fromWeek, setFromWeek] = useState(1)
  const [toWeek, setToWeek] = useState(52)

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const [expandedSiteIds, setExpandedSiteIds] = useState<number[]>([])
  const [weeksDataStore, setWeeksDataStore] = useState<Record<number, WeekRow[]>>({})
  const [weeksLoading, setWeeksLoading] = useState<Record<number, boolean>>({})
  const [weeksSortMode, setWeeksSortMode] = useState<'best' | 'calendar'>('best')
  const [sortBy, setSortBy] = useState<'avg' | 'integrity' | 'optimal'>('avg')

  const badgeStyle = {
    display: 'inline-block',
    width: '48px',
    height: '24px',
    lineHeight: '24px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    textAlign: 'center' as const
  }

  const parseRawScore = (val: any): number | null => {
    if (val === null || val === undefined) return null
    const n = parseFloat(val)
    return isNaN(n) ? null : n
  }

  const calculateIntegrity = (footprint: number | null): number | null => {
    if (footprint === null) return null
    return Math.max(0, Math.min(100, 100 - footprint * 100))
  }

  const getIntegrityColor = (integrityScore: number | null) => {
    if (integrityScore === null) return '#9e9e9e'
    if (integrityScore >= 90) return '#1b5e20'
    if (integrityScore >= 80) return '#4caf50'
    if (integrityScore >= 66.6) return '#fbc02d'
    return '#d32f2f'
  }

  const sortedResults = useMemo(() => {
    if (!results.length) return []
    return [...results].sort((a, b) => {
      const aAvg = parseRawScore(a.expected_species) || 0
      const bAvg = parseRawScore(b.expected_species) || 0
      const aInt = calculateIntegrity(parseRawScore(a.footprint_mean)) || 0
      const bInt = calculateIntegrity(parseRawScore(b.footprint_mean)) || 0
      if (sortBy === 'avg') return bAvg - aAvg
      if (sortBy === 'integrity') return bInt - aInt
      return sortBy === 'optimal' ? (bInt / 100) * bAvg - (aInt / 100) * aAvg : 0
    })
  }, [results, sortBy])

  useEffect(() => {
    async function loadInitialData() {
      // Honors your manual 'is_active' override for the state list
      const { data: sData } = await supabase
        .from('dropdown_states')
        .select('state')
        .eq('is_active', true)
        .order('state')
      
      const { data: wData } = await supabase.from('weeks_months').select('week, label_long').order('week')
      
      if (sData) setStates(sData)
      if (wData) setWeeks(wData)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function fetchGroups() {
      setSelectedGroups([])
      const { data } = await supabase.from(`v_dropdown_${groupSet}_group`).select('*')
      if (data) setGroups(groupSet === 'user' ? data.filter((g) => (Object.values(g)[0] as string) !== 'Landbirds') : data)
    }
    fetchGroups()
  }, [groupSet])

  const toggleGroup = (val: string) => setSelectedGroups((prev) => (prev.includes(val) ? prev.filter((g) => g !== val) : [...prev, val]))
  const toggleState = (val: string) => setSelectedStates((prev) => (prev.includes(val) ? prev.filter((s) => s !== val) : [...prev, val]))

  const runPowerQuery = async () => {
    if (fromWeek > toWeek && toWeek !== 1) {
      alert("DATE ERROR: Your 'From' week is later than your 'To' week. The database cannot search backwards!")
      return
    }

    setLoading(true)
    setHasSearched(false)

    // Note: The RPC 'rpc_explore_groups' should be updated in Postgres 
    // to filter 'site_catalog' by status IN ('protected', 'candidate')
    const { data, error } = await supabase.rpc('rpc_explore_groups', {
      p_group_system: groupSet,
      p_group_values: selectedGroups.length > 0 ? selectedGroups : null,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_states: selectedStates.length > 0 ? selectedStates : null,
      p_limit: 50
    })

    setLoading(false)
    setHasSearched(true)
    if (!error) setResults(data || [])
  }

  const fetchWeeksForSite = async (siteId: number, sortMode: 'best' | 'calendar') => {
    setWeeksLoading((prev) => ({ ...prev, [siteId]: true }))
    setWeeksSortMode(sortMode)

    const { data, error } = await supabase.rpc('rpc_group_weeks_at_place', {
      p_group_system: groupSet,
      p_group_values: selectedGroups.length > 0 ? selectedGroups : null,
      p_site_id: siteId,
      p_week_from: fromWeek,
      p_week_to: toWeek,
      p_sort_mode: sortMode
    })

    setWeeksLoading((prev) => ({ ...prev, [siteId]: false }))
    if (!error) setWeeksDataStore((prev) => ({ ...prev, [siteId]: (data || []) as WeekRow[] }))
  }

  const toggleSiteWeeks = async (siteId: number) => {
    if (expandedSiteIds.includes(siteId)) setExpandedSiteIds((prev) => prev.filter((id) => id !== siteId))
    else {
      setExpandedSiteIds((prev) => [...prev, siteId])
      await fetchWeeksForSite(siteId, 'best')
    }
  }

  return (
    <div style={{ padding: '12px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2e4a31', fontSize: '1.0rem', marginBottom: '14px', fontWeight: 'bold' }}>
        Best Places for Bird Groups
      </h1>

      {/* 1. Group Type */}
      <div style={{ background: '#f4f4f4', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
        <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>1. Select Group Type:</label>
        <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
          <label style={{ fontSize: '0.8rem' }}>
            <input type="radio" checked={groupSet === 'major'} onChange={() => setGroupSet('major')} /> Land/Water
          </label>
          <label style={{ fontSize: '0.8rem' }}>
            <input type="radio" checked={groupSet === 'user'} onChange={() => setGroupSet('user')} /> Wetlands/Coastal
          </label>
          <label style={{ fontSize: '0.8rem' }}>
            <input type="radio" checked={groupSet === 'species'} onChange={() => setGroupSet('species')} /> Families
          </label>
        </div>
      </div>

      {/* 2. Select Groups */}
      <div style={{ background: '#f4f4f4', padding: '10px', borderRadius: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>2. Select Groups</label>
          <button
            type="button"
            onClick={() => setSelectedGroups([])}
            style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
          {groups.map((g, i) => {
            const val = Object.values(g)[0] as string
            const isActive = selectedGroups.includes(val)
            return (
              <button
                key={i}
                onClick={() => toggleGroup(val)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid #ccc',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#4a7c59' : 'white',
                  color: isActive ? 'white' : '#333'
                }}
              >
                {val}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Region & Date Range */}
      <div style={{ background: '#f4f4f4', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', fontSize: '0.85rem' }}>3. Region & Date Range</label>
          <button
            type="button"
            onClick={() => {
              setSelectedStates([])
              setFromWeek(1)
              setToWeek(52)
            }}
            style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>

        <div
          style={{
            height: '80px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '6px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr'
          }}
        >
          <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
            <input type="checkbox" checked={selectedStates.length === 0} onChange={() => setSelectedStates([])} /> All Active States
          </label>
          {states.map((s) => (
            <label key={s.state} style={{ fontSize: '0.75rem' }}>
              <input type="checkbox" checked={selectedStates.includes(s.state)} onChange={() => toggleState(s.state)} /> {s.state}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>From</label>
            <select
              value={fromWeek}
              onChange={(e) => setFromWeek(Number(e.target.value))}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
            >
              {weeks.map((w) => (
                <option key={w.week} value={w.week}>
                  {w.label_long}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>To</label>
            <select
              value={toWeek}
              onChange={(e) => setToWeek(Number(e.target.value))}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '12px' }}
            >
              {weeks.map((w) => (
                <option key={w.week} value={w.week}>
                  {w.label_long}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={runPowerQuery}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#2e4a31',
          color: 'white',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          border: 'none',
          fontSize: '0.9rem'
        }}
      >
        {loading ? 'CALCULATING...' : 'SEARCH SIGHTINGS'}
      </button>

      {hasSearched &&
        (results.length === 0 ? (
          <div style={{ marginTop: '20px', padding: '15px', textAlign: 'center', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', fontSize: '0.9rem' }}>
            No locations found for this selection.
          </div>
        ) : (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#555' }}>Sort:</span>
              <div style={{ display: 'flex', background: '#eee', padding: '2px', borderRadius: '6px', flex: 1 }}>
                {['avg', 'integrity', 'optimal'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortBy(mode as any)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      borderRadius: '5px',
                      border: 'none',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      color: sortBy === mode ? '#007bff' : '#666',
                      backgroundColor: sortBy === mode ? 'white' : 'transparent'
                    }}
                  >
                    {mode === 'avg' ? 'Avg #' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#2e4a31', color: 'white', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px', width: '20px' }}>#</th>
                  <th style={{ padding: '8px 4px' }}>Click on Place for Best Weeks</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '50px' }}>Avg #</th>
                  <th style={{ padding: '8px 4px', textAlign: 'center', width: '50px' }}>Integrity</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r, idx) => {
                  const siteId = Number(r.site_id)
                  const isOpen = expandedSiteIds.includes(siteId)
                  const integrityScore = calculateIntegrity(parseRawScore(r.footprint_mean))

                  return (
                    <React.Fragment key={siteId}>
                      <tr
                        onClick={() => toggleSiteWeeks(siteId)}
                        style={{ borderBottom: '1px solid #eee', cursor: 'pointer', backgroundColor: isOpen ? '#f9f9f9' : 'white' }}
                      >
                        <td style={{ padding: '10px 4px', color: '#999' }}>{idx + 1}</td>

                        <td style={{ padding: '10px 4px', fontWeight: 'bold', color: '#333' }}>
                          <span>{r.place}</span>

                          <Link
                            href={`/places?site_id=${siteId}`}
                            onClick={(e) => e.stopPropagation()} 
                            style={{
                              display: 'inline-block',
                              marginLeft: '6px',
                              fontSize: '14px',
                              lineHeight: '14px',
                              fontWeight: '700',
                              color: '#2e4a31',
                              textDecoration: 'none',
                              border: '1px solid #cfcfcf',
                              borderRadius: '10px',
                              padding: '0px 5px'
                            }}
                            title="Open this place in Places"
                            aria-label="Open this place in Places"
                          >
                            ⓘ
                          </Link>

                          <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '6px' }}>{r.state}</span>
                        </td>

                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                          <span style={{ ...badgeStyle, backgroundColor: '#eeeeee', color: '#333' }}>{Number(r.expected_species).toFixed(1)}</span>
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                          <span style={{ ...badgeStyle, backgroundColor: getIntegrityColor(integrityScore), color: 'white' }}>
                            {integrityScore !== null ? Math.round(integrityScore) : '--'}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr>
                          <td colSpan={4} style={{ padding: '8px', backgroundColor: '#f3f7f4' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Weekly Breakdown</span>
                              <div style={{ display: 'flex', gap: '3px' }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    fetchWeeksForSite(siteId, 'best')
                                  }}
                                  style={{
                                    padding: '3px 6px',
                                    fontSize: '9px',
                                    borderRadius: '3px',
                                    border: '1px solid #2e4a31',
                                    backgroundColor: weeksSortMode === 'best' ? '#2e4a31' : 'white',
                                    color: weeksSortMode === 'best' ? 'white' : '#2e4a31'
                                  }}
                                >
                                  Best
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    fetchWeeksForSite(siteId, 'calendar')
                                  }}
                                  style={{
                                    padding: '3px 6px',
                                    fontSize: '9px',
                                    borderRadius: '3px',
                                    border: '1px solid #2e4a31',
                                    backgroundColor: weeksSortMode === 'calendar' ? '#2e4a31' : 'white',
                                    color: weeksSortMode === 'calendar' ? 'white' : '#2e4a31'
                                  }}
                                >
                                  Calendar
                                </button>
                              </div>
                            </div>

                            <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>
                              {weeksLoading[siteId] ? (
                                <div style={{ padding: '10px', textAlign: 'center' }}>Loading...</div>
                              ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem' }}>
                                  <tbody>
                                    {(weeksDataStore[siteId] || []).map((w) => (
                                      <tr key={w.week} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '6px' }}>{w.label_long}</td>
                                        <td style={{ paddingRight: '6px', textAlign: 'right', fontWeight: 'bold', color: '#2e4a31' }}>{w.expected_species} spp</td>
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

            <div style={{ marginTop: '16px', padding: '10px', fontSize: '0.7rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
              Minimum 20% likelihood for reporting.
            </div>
          </div>
        ))}
    </div>
  )
}