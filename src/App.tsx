import { useMemo, useState } from 'react'
import './App.css'

type Screen = 'login' | 'profile' | 'subscription' | 'home' | 'settings'

type BrandProfile = {
  brandName: string
  yearFounded: string
  industry: string
  audience: string
  tone: string
  hasPhotography: boolean
  hasVideo: boolean
  hasDesign: boolean
  companyDescription?: string
  brandCulture?: string
  contentGoals?: string
}

type PlanKey = 'free3' | 'd30'

type IdeaCard = { id: string; visual: string; copy: string; assignedDate?: string }

function fmtISO(d: Date) { return d.toISOString().slice(0,10) }
function endOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0) }
function lastDay(date: Date) { return endOfMonth(date).getDate() }

function planIdeaAllowance(plan: PlanKey) { if (plan==='free3') return 3; return 30 }

function ordinalSuffix(day: number) {
  const j = day % 10
  const k = day % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}

function generateIdea(profile: BrandProfile, notes: string) {
  const seed = Math.random().toString(36).slice(2,6)
  const base = `${profile.industry || 'Brand'} • ${profile.tone || 'Friendly'}`
  const caps = [profile.hasPhotography?'photo':undefined, profile.hasVideo?'video':undefined, profile.hasDesign?'graphic':undefined].filter(Boolean).join('/')
  return { visual: `Visual: ${caps || 'asset'} ${seed}`, copy: `Copy: ${base} — ${notes || 'engagement prompt'} (${seed})` }
}

export default function App() {
  const today = new Date()
  const todayISO = fmtISO(today)
  const LS_COMPLETED_PROFILE = 'phasee.completedProfile'
  const LS_SELECTED_PLAN = 'phasee.selectedPlan'
  const LS_PLAN_VALUE = 'phasee.plan'
  const hasCompletedProfile = () => localStorage.getItem(LS_COMPLETED_PROFILE) === '1'
  const hasSelectedPlan = () => localStorage.getItem(LS_SELECTED_PLAN) === '1'
  const [screen, setScreen] = useState<Screen>('login')
  const [profile, setProfile] = useState<BrandProfile>({ brandName:'', yearFounded:'', industry:'', audience:'', tone:'', hasPhotography:false, hasVideo:false, hasDesign:false, companyDescription:'', brandCulture:'', contentGoals:'' })
  const [plan, setPlan] = useState<PlanKey>('d30')
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<string>('')
  const [campaign, setCampaign] = useState<boolean>(false)

  const monthDays = useMemo(() => {
    const days: { day:number; iso:string }[] = []
    const base = new Date(today.getFullYear(), today.getMonth(), 1)
    const len = lastDay(base)
    for (let d = 1; d <= len; d++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), d)
      days.push({ day: d, iso: fmtISO(dt) })
    }
    return days
  }, [today])

  // Sunday-first offset for the first row padding
  const firstDayOffset = useMemo(() => {
    const base = new Date(today.getFullYear(), today.getMonth(), 1)
    return base.getDay() // 0=Sun..6=Sat
  }, [today])

  const weekdays = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(today.getFullYear(), today.getMonth(), 1))
  const assignedUniqueDates = useMemo(() => new Set(ideas.filter(i=>i.assignedDate).map(i=>i.assignedDate as string)).size, [ideas])
  const remainingDays = useMemo(() => Math.max(0, planIdeaAllowance(plan) - assignedUniqueDates), [plan, assignedUniqueDates])
  const canUseCampaign = plan === 'd30'

  function handleGenerate() {
    const selectedISOList = Array.from(selectedDates).sort()
    const count = Math.min(30, selectedISOList.length)
    const next: IdeaCard[] = selectedISOList.slice(0, count).map((iso) => {
      const g = generateIdea(profile, notes)
      return { id: crypto.randomUUID(), visual: g.visual, copy: g.copy, assignedDate: iso }
    })
    setIdeas(next)
  }
  function handleRegenerateOne(id: string) { setIdeas(prev => prev.map(it => it.id===id ? { ...it, ...generateIdea(profile, notes) } : it)) }
  function handleAssign(id: string, iso: string) { setIdeas(prev => prev.map(it => it.id===id ? { ...it, assignedDate: iso } : it)) }

  function handleLogin() {
    if (!hasCompletedProfile()) { setScreen('profile'); return }
    // Do not auto-open subscription anymore; go straight to Home
    setScreen('home')
  }

  if (screen === 'settings') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar">
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('home')}>←</button>
            <button className="logo-btn" aria-label="Home" onClick={()=>setScreen('home')}>
              <img src="/header-logo.png" alt="Header logo" className="brand-logo" />
            </button>
            <span />
          </div>
          <div className="card settings">
            <div className="settings-header">
              <span className="settings-icon" aria-hidden="true">⚙️</span>
              <span className="settings-title">Settings</span>
            </div>
            <div className="divider" />

            <div className="settings-list">
              <button className="settings-item" type="button">
                <span className="item-icon" aria-hidden="true">
                  {/* user */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span className="item-label">Personal Details</span>
              </button>

              <button className="settings-item" type="button">
                <span className="item-icon" aria-hidden="true">
                  {/* link */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.07 0l3.54-3.54a5 5 0 0 0-7.07-7.07L11 4"/><path d="M14 11a5 5 0 0 0-7.07 0L3.39 14.54a5 5 0 0 0 7.07 7.07L13 20"/></svg>
                </span>
                <span className="item-label">Integrations</span>
              </button>

              <button className="settings-item active" type="button" onClick={()=>setScreen('subscription')}>
                <span className="item-icon" aria-hidden="true">
                  {/* crown */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l5 4 4-6 4 6 5-4v11H3z"/></svg>
                </span>
                <span className="item-label">Subscription</span>
              </button>

              <button className="settings-item" type="button">
                <span className="item-icon" aria-hidden="true">
                  {/* shield */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
                <span className="item-label">Security</span>
              </button>

              <button className="settings-item" type="button">
                <span className="item-icon" aria-hidden="true">
                  {/* bell */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </span>
                <span className="item-label">Notifications</span>
              </button>

              <button className="settings-item" type="button">
                <span className="item-icon" aria-hidden="true">
                  {/* help */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"/><line x1="12" y1="17" x2="12" y2="17"/></svg>
                </span>
                <span className="item-label">Help</span>
              </button>
            </div>

            <div className="divider" />

            <button className="logout-row" type="button">
              <span className="logout-icon" aria-hidden="true">
                {/* logout */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
              <span className="logout-label">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'login') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar"><span />
            <div className="brand"><img src="/header-logo.png" alt="Header logo" className="brand-logo" /></div>
            <span />
          </div>
          <div className="card">
            <h2 className="title">Login</h2>
            <div className="stack">
              <input placeholder="Email" />
              <input placeholder="Password" type="password" />
              <div className="row split">
                <button className="ghost" onClick={() => { localStorage.setItem(LS_COMPLETED_PROFILE, '1'); setScreen('profile') }}>Create account</button>
                <button className="primary" onClick={handleLogin}>Log in</button>
              </div>
              <button className="text" type="button">Having issues logging in?</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'profile') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar">
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('home')}>←</button>
            <button className="logo-btn" aria-label="Home" onClick={()=>setScreen('home')}>
              <img src="/header-logo.png" alt="Header logo" className="brand-logo" />
            </button>
            <button className="icon-btn" aria-label="Settings" onClick={()=>setScreen('settings')}>
              <img src="/settings.svg" alt="Settings" />
            </button>
          </div>
          <div className="card">
            <div className="settings-header">
              <span className="settings-icon" aria-hidden="true">👤</span>
              <span className="settings-title">Profile</span>
            </div>
            <div className="stack">
              <div className="section">Brand Profile</div>
              <input placeholder="Brand Name" value={profile.brandName} onChange={e=>setProfile({ ...profile, brandName:e.target.value })} />
              <input placeholder="Year Founded" value={profile.yearFounded} onChange={e=>setProfile({ ...profile, yearFounded:e.target.value })} />
              <input placeholder="Industry" value={profile.industry} onChange={e=>setProfile({ ...profile, industry:e.target.value })} />
              <input placeholder="Tone" value={profile.tone} onChange={e=>setProfile({ ...profile, tone:e.target.value })} />

              <div className="section">Brand Strategy</div>
              <textarea placeholder="Company Description" value={profile.companyDescription} onChange={e=>setProfile({ ...profile, companyDescription:e.target.value })} />
              <textarea placeholder="Target Audience" value={profile.audience} onChange={e=>setProfile({ ...profile, audience:e.target.value })} />
              <textarea placeholder="Brand Culture" value={profile.brandCulture} onChange={e=>setProfile({ ...profile, brandCulture:e.target.value })} />
              <textarea placeholder="Content Goals" value={profile.contentGoals} onChange={e=>setProfile({ ...profile, contentGoals:e.target.value })} />

              <div className="section">Capabilities</div>
              <label className="check"><input type="checkbox" checked={profile.hasPhotography} onChange={e=>setProfile({ ...profile, hasPhotography:e.target.checked })} /> Photography</label>
              <label className="check"><input type="checkbox" checked={profile.hasVideo} onChange={e=>setProfile({ ...profile, hasVideo:e.target.checked })} /> Video</label>
              <label className="check"><input type="checkbox" checked={profile.hasDesign} onChange={e=>setProfile({ ...profile, hasDesign:e.target.checked })} /> Design</label>

              <div className="row split">
                <button className="ghost" onClick={() => setScreen('home')}>Cancel</button>
                <button className="primary" onClick={() => { localStorage.setItem(LS_COMPLETED_PROFILE, '1'); setScreen('subscription') }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'subscription') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar">
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('profile')}>←</button>
            <button className="logo-btn" aria-label="Home" onClick={()=>setScreen('home')}>
              <img src="/header-logo.png" alt="Header logo" className="brand-logo" />
            </button>
            <button className="icon-btn" aria-label="Settings" onClick={()=>setScreen('settings')}>
              <img src="/settings.svg" alt="Settings" />
            </button>
          </div>
          <div className="card">
            <h2 className="title">Subscription Plans</h2>
            <p className="muted">One plan. Full month. Unlimited ideas.</p>
            <div className="plans">
              <div className={'plan' + (plan==='free3'?' selected':'')} role="button" onClick={()=>setPlan('free3')}>
                <div className="plan-body">
                  <div className="plan-name">Free Trial</div>
                  <div className="plan-price">$0</div>
                  <ul className="plan-features">
                    <li>1 Week outlook</li>
                  </ul>
                </div>
              </div>

              <div className={'plan recommended' + (plan==='d30'?' selected':'')} role="button" onClick={()=>setPlan('d30')}>
                <div className="badge">Recommended</div>
                <div className="plan-body">
                  <div className="plan-name">Monthly Plan</div>
                  <div className="plan-price">$7.99/mo</div>
                  <ul className="plan-features">
                    <li>Full-month outlook</li>
                    <li>Unlimited posts</li>
                    <li>Campaign generating</li>
                  </ul>
                </div>
                <button className="upgrade-btn" onClick={(e)=>{ e.stopPropagation(); setPlan('d30'); localStorage.setItem(LS_SELECTED_PLAN, '1'); localStorage.setItem(LS_PLAN_VALUE, 'd30'); }}>{plan==='d30' ? 'Selected' : 'Upgrade'}</button>
              </div>
            </div>
            <div className="actions-right">
              <button className="primary" onClick={()=>setScreen('home')}>Continue</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="frame">
        <div className="header-bar">
          <button className="icon-btn" aria-label="Profile" onClick={()=>setScreen('profile')}>
            <img src="/profile.svg" alt="Profile" />
          </button>
          <div className="brand"><img src="/header-logo.png" alt="Header logo" className="brand-logo" /></div>
          <button className="icon-btn" aria-label="Settings" onClick={()=>setScreen('settings')}>
            <img src="/settings.svg" alt="Settings" />
          </button>
        </div>
        <div className="home-grid">
          <div className="calendar card">
            <div className="row">
              <div className="title small">{monthLabel}</div>
            </div>
            <div className="calendar-weekdays">
              {weekdays.map(w => (
                <div key={w} className="weekday">{w}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {Array.from({ length: firstDayOffset }).map((_, idx) => (
                <div key={`blank-${idx}`} className="cell empty" />
              ))}
              {monthDays.map(d => {
                const isSelected = selectedDates.has(d.iso)
                const isToday = d.iso === todayISO
                return (
                  <button
                    key={d.iso}
                    className={'cell' + (isSelected ? ' selected' : '') + (!isSelected && isToday ? ' today' : '')}
                    onClick={() => setSelectedDates(prev => { const next = new Set(prev); if (next.has(d.iso)) { next.delete(d.iso) } else { next.add(d.iso) } return next })}
                  ><span className="day-label">{d.day}<sup className="ord">{ordinalSuffix(d.day)}</sup></span></button>
                )
              })}
            </div>
            <div className="muted small left">Selected days: {selectedDates.size}</div>
          </div>

          <div className="generator card">
            <div className="row gen-toolbar">
              <label className="check campaign-check">
                <input
                  type="checkbox"
                  disabled={!canUseCampaign}
                  checked={canUseCampaign ? campaign : false}
                  onChange={e=>{ if (canUseCampaign) setCampaign(e.target.checked) }}
                />
                <span className="campaign-label">Campaign</span>
                {!canUseCampaign && (
                  <button className="inline-upgrade" type="button" onClick={()=>setScreen('subscription')}>
                    Upgrade
                  </button>
                )}
              </label>
            </div>
            <div className="stack">
              <textarea className="notes-input" rows={2} placeholder="Additional Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
              <div className="inline">
                <button className="icon-btn ghost regen-btn" aria-label="Regenerate all" onClick={()=>setIdeas(prev=>prev.map(i=>({ ...i, ...generateIdea(profile, notes) })))}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15"/></svg>
                </button>
                <button className="primary" onClick={handleGenerate}>Generate</button>
              </div>
            </div>
          </div>

          <div className="ideas card">
            {ideas.length===0 ? <div className="muted">No ideas yet.</div> : (
              <div className="idea-list">
                {ideas.map((it, idx) => (
                  <div key={it.id} className="idea">
                    <div className="idea-title">Idea {idx+1}</div>
                    <div className="idea-box"><div className="label">Visual:</div><textarea value={it.visual} onChange={e=>setIdeas(prev=>prev.map(p=>p.id===it.id?{...p, visual:e.target.value}:p))} /></div>
                    <div className="idea-box"><div className="label">Copy:</div><textarea value={it.copy} onChange={e=>setIdeas(prev=>prev.map(p=>p.id===it.id?{...p, copy:e.target.value}:p))} /></div>
                    <div className="row">
                      <select value={it.assignedDate||''} onChange={e=>handleAssign(it.id, e.target.value)}>
                        <option value="">Assign to date…</option>
                        {monthDays.map(d=> <option key={d.iso} value={d.iso}>{d.iso}</option>)}
                      </select>
                      <button className="icon-btn ghost regen-btn" aria-label="Regenerate" onClick={()=>handleRegenerateOne(it.id)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
