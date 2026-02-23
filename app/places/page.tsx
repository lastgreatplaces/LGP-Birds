'use client'

export const dynamic = 'force-dynamic'

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

type PlaceRow = {
  site_id: number
  site_name: string
  state: string
  bird_region: string | null
  acres: number | null
  priority: string | null
  site_slug: string | null
  iba_link: string | null
  ebird_link: string | null
  status: string | null
}

function PlacesPageInner() {
  const COLORS = { primary: '#2e4a31', bg: '#f4f4f4', border: '#ccc', text: '#333' }

  const searchParams = useSearchParams()
  const urlSiteIdRaw = searchParams.get('site_id')
  const urlSiteId = urlSiteIdRaw ? Number(urlSiteIdRaw) : null

  const [allRows, setAllRows] = useState<PlaceRow[]>([])
  const [states, setStates] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])

  const [selectedStates, setSelectedStates] = useState<string[]>([])
  const [selectedRegions, setSelectedRegions] = useState<string[]>([])
  const [showActiveOnly, setShowActiveOnly] = useState(true)

  const [searchText, setSearchText] = useState('')

  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const [sortField, setSortField] = useState<'name' | 'state' | 'region' | 'acres' | 'priority'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [targetSiteId, setTargetSiteId] = useState<number | null>(urlSiteId)
  const [highlightSiteId, setHighlightSiteId] = useState<number | null>(null)

  const [showTopBtn, setShowTopBtn] = useState(false)

  const rowRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 250)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    async function loadPlaces() {
      setLoading(true)

      const pageSize = 1000
      let from = 0
      let rowsAll: PlaceRow[] = []

      while (true) {
        // Updated to use exact column names from your site_catalog screenshot: 
        // bcr_name, ebird_url, iba_url
        const { data, error } = await supabase
          .from('site_catalog')
          .select('site_id, site_name, state, bcr_name, acres, priority, site_slug, iba_url, ebird_url, status')
          .order('site_name', { ascending: true })
          .range(from, from + pageSize - 1)

        if (error) {
          setLoading(false)
          setHasLoaded(true)
          console.error(error)
          alert('Error loading Places from the database.')
          return
        }

        // Map database fields to your preferred code variable names
        const chunk = (data || []).map((r: any) => ({
          ...r,
          bird_region: r.bcr_name,
          iba_link: r.iba_url,
          ebird_link: r.ebird_url
        })) as PlaceRow[]
        
        rowsAll = rowsAll.concat(chunk)

        if (chunk.length < pageSize) break
        from += pageSize
      }

      setLoading(false)
      setHasLoaded(true)
      setAllRows(rowsAll)

      const uniqStates = Array.from(new Set(rowsAll.map(r => (r.state || '').trim()).filter(Boolean))).sort()
      const uniqRegions = Array.from(new Set(rowsAll.map(r => (r.bird_region || '').trim()).filter(Boolean))).sort()

      setStates(uniqStates)
      setRegions(uniqRegions)
    }

    loadPlaces()
  }, [])

  useEffect(() => {
    if (!urlSiteId) return
    if (!Number.isFinite(urlSiteId)) return

    setTargetSiteId(urlSiteId)
    setSelectedStates([])
    setSelectedRegions([])
    setSearchText('')
    setSortField('name')
    setSortDir('asc')
    setShowActiveOnly(false)
  }, [urlSiteId])

  const toggleState = (val: string) => {
    setSelectedStates(prev => (prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]))
  }

  const toggleRegion = (val: string) => {
    setSelectedRegions(prev => (prev.includes(val) ? prev.filter(r => r !== val) : [...prev, val]))
  }

  const clearStates = () => setSelectedStates([])
  const clearRegions = () => setSelectedRegions([])
  const clearAllFilters = () => {
    setSelectedStates([])
    setSelectedRegions([])
    setSearchText('')
    setSortField('name')
    setSortDir('asc')
    setShowActiveOnly(true)
  }

  const filteredRows = useMemo(() => {
    const stFilterOn = selectedStates.length > 0
    const regFilterOn = selectedRegions.length > 0
    const q = searchText.trim().toLowerCase()

    return allRows.filter(r => {
      if (showActiveOnly) {
        const s = (r.status || '').toLowerCase()
        if (s !== 'protected' && s !== 'candidate') return false
      }

      if (stFilterOn && !selectedStates.includes(r.state)) return false
      if (regFilterOn) {
        const br = (r.bird_region || '').trim()
        if (!selectedRegions.includes(br)) return false
      }
      if (q) {
        const nm = (r.site_name || '').toLowerCase()
        if (!nm.includes(q)) return false
      }
      return true
    })
  }, [allRows, selectedStates, selectedRegions, searchText, showActiveOnly])

  const sortedRows = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1

    const key = (r: PlaceRow) => {
      if (sortField === 'name') return (r.site_name || '').toLowerCase()
      if (sortField === 'state') return (r.state || '').toLowerCase()
      if (sortField === 'region') return ((r.bird_region || '') as string).toLowerCase()
      if (sortField === 'priority') return ((r.priority || '') as string).toLowerCase()
      return r.acres ?? -1
    }

    return [...filteredRows].sort((a, b) => {
      const ka: any = key(a)
      const kb: any = key(b)

      if (sortField === 'acres') return (Number(ka) - Number(kb)) * dir
      if (ka < kb) return -1 * dir
      if (ka > kb) return 1 * dir
      return 0
    })
  }, [filteredRows, sortField, sortDir])

  useEffect(() => {
    if (!targetSiteId) return
    if (!hasLoaded) return
    if (loading) return

    const el = rowRefs.current[targetSiteId]
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })

    setHighlightSiteId(targetSiteId)
    const t = window.setTimeout(() => setHighlightSiteId(null), 1800)
    return () => window.clearTimeout(t)
  }, [targetSiteId, hasLoaded, loading, sortedRows.length])

  const sortButtonStyle = (active: boolean) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
    color: active ? '#007bff' : '#666',
    backgroundColor: active ? 'white' : 'transparent',
    cursor: 'pointer'
  })

  const linkPillStyle = {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    border: `1px solid ${COLORS.border}`,
    background: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
    color: COLORS.primary,
    textDecoration: 'none'
  }

  return (
    <div style={{ padding: '0 12px 12px 12px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif', color: COLORS.text }}>
      
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'white',
          paddingTop: '12px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${COLORS.border}`,
          marginBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: COLORS.primary, fontSize: '1.4rem', fontWeight: 'bold' }}>Places</div>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `1px solid ${showTopBtn ? COLORS.primary : COLORS.border}`,
              background: showTopBtn ? COLORS.primary : '#f9f9f9',
              color: showTopBtn ? 'white' : '#ccc',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              cursor: showTopBtn ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              opacity: showTopBtn ? 1 : 0.5,
              pointerEvents: showTopBtn ? 'auto' : 'none'
            }}
          >
            ↑ Top
          </button>
        </div>
      </div>

      <div style={{ background: COLORS.bg, padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Filters</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'white', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${COLORS.border}` }}>
              <input type="checkbox" checked={showActiveOnly} onChange={() => setShowActiveOnly(!showActiveOnly)} />
              Active Only
            </label>
            <button
              type="button"
              onClick={clearAllFilters}
              style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: 'white', cursor: 'pointer' }}
            >
              Clear All
            </button>
          </div>
        </div>

        <div style={{ marginTop: '10px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', display: 'block', marginBottom: '4px' }}>
            Search by place name
          </label>
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Type a place name..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px',
              fontSize: '16px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.border}`
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>States</label>
              <button
                type="button"
                onClick={clearStates}
                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: 'white', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
            <div style={{ height: '120px', overflowY: 'auto', background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer', color: COLORS.primary, fontWeight: 'bold', paddingBottom: '4px' }}>
                <input type="checkbox" checked={selectedStates.length === 0} onChange={() => setSelectedStates([])} style={{ marginRight: '8px' }} /> All States
              </label>
              {states.map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', padding: '2px 0' }}>
                  <input type="checkbox" checked={selectedStates.includes(s)} onChange={() => toggleState(s)} style={{ marginRight: '8px' }} /> {s}
                </label>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>Bird Regions</label>
              <button
                type="button"
                onClick={clearRegions}
                style={{ padding: '2px 8px', fontSize: '0.7rem', borderRadius: '6px', border: `1px solid ${COLORS.border}`, background: 'white', cursor: 'pointer' }}
              >
                Clear
              </button>
            </div>
            <div style={{ height: '120px', overflowY: 'auto', background: 'white', border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px', marginTop: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', cursor: 'pointer', color: COLORS.primary, fontWeight: 'bold', paddingBottom: '4px' }}>
                <input type="checkbox" checked={selectedRegions.length === 0} onChange={() => setSelectedRegions([])} style={{ marginRight: '8px' }} /> All Regions
              </label>
              {regions.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', padding: '2px 0' }}>
                  <input type="checkbox" checked={selectedRegions.includes(r)} onChange={() => toggleRegion(r)} style={{ marginRight: '8px' }} /> {r}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#666' }}>
          Showing <b>{sortedRows.length}</b> of <b>{allRows.length}</b> places
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Sort:</span>
        <div style={{ display: 'flex', background: '#eee', padding: '2px', borderRadius: '8px', flex: 1 }}>
          <button onClick={() => setSortField('name')} style={sortButtonStyle(sortField === 'name')}>Name</button>
          <button onClick={() => setSortField('state')} style={sortButtonStyle(sortField === 'state')}>State</button>
          <button onClick={() => setSortField('region')} style={sortButtonStyle(sortField === 'region')}>Region</button>
          <button onClick={() => setSortField('acres')} style={sortButtonStyle(sortField === 'acres')}>Acres</button>
          <button onClick={() => setSortField('priority')} style={sortButtonStyle(sortField === 'priority')}>Priority</button>
        </div>
        <button
          type="button"
          onClick={() => setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'))}
          style={{
            padding: '8px 10px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.border}`,
            background: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.75rem',
            color: COLORS.primary,
            minWidth: '64px'
          }}
        >
          {sortDir === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>

      {loading && (
        <div style={{ padding: '14px', textAlign: 'center', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', fontSize: '0.9rem' }}>
          Loading places...
        </div>
      )}

      {hasLoaded && !loading && sortedRows.length === 0 && (
        <div style={{ padding: '14px', textAlign: 'center', backgroundColor: '#fff9c4', borderRadius: '8px', border: '1px solid #fbc02d', fontSize: '0.9rem' }}>
          No places match your filters. Try clearing filters or broadening your search.
        </div>
      )}

      {!loading && sortedRows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sortedRows.map((r) => {
            const isHighlighted = highlightSiteId === r.site_id
            return (
              <div
                key={r.site_id}
                ref={(el) => { rowRefs.current[r.site_id] = el }}
                style={{
                  background: isHighlighted ? '#fff9c4' : 'white',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '10px',
                  padding: '12px',
                  boxShadow: isHighlighted ? '0 0 0 2px rgba(251, 192, 45, 0.6)' : 'none',
                  transition: 'background 250ms ease, box-shadow 250ms ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#222', marginBottom: '4px' }}>
                    {r.site_name}
                  </div>
                  {r.status && !['protected', 'candidate'].includes(r.status.toLowerCase()) && (
                    <span style={{ fontSize: '0.6rem', color: '#999', background: '#eee', padding: '2px 5px', borderRadius: '4px' }}>{r.status}</span>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', color: COLORS.primary }}>{r.state}</span>
                  {r.bird_region ? <span> • {r.bird_region}</span> : null}
                  {typeof r.acres === 'number' ? <span> • {r.acres.toLocaleString()} acres</span> : null}
                  {r.priority ? <span> • Priority: {r.priority}</span> : null}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {r.iba_link && <a href={r.iba_link} target="_blank" rel="noreferrer" style={linkPillStyle}>IBA</a>}
                  {r.ebird_link && <a href={r.ebird_link} target="_blank" rel="noreferrer" style={linkPillStyle}>eBird</a>}
                  {r.site_slug && (
                    <span style={{ fontSize: '0.75rem', color: '#999', marginLeft: '2px' }}>{r.site_slug}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '10px', fontSize: '0.7rem', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
        Data source: site_catalog
      </div>
    </div>
  )
}

export default function PlacesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '12px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>Loading…</div>}>
      <PlacesPageInner />
    </Suspense>
  )
}