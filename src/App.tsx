import { useEffect, useMemo, useRef, useState } from 'react'
import type { SVGProps } from 'react'
import './App.css'

type Screen = 'login' | 'profile' | 'subscription' | 'home' | 'settings' | 'settings.personal' | 'settings.security' | 'settings.notifications' | 'settings.help'

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

type SocialPlatform = 'facebook' | 'instagram' | 'x'

type IdeaCard = { id: string; visual: string; copy: string; why: string; platform: SocialPlatform; assignedDate?: string; proposedDate?: string; accepted?: boolean }

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

function fmtMDYFromISO(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${parseInt(m,10)}-${parseInt(d,10)}-${y}`
}

function generateId() {
  try {
    // @ts-ignore
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`
}

function renderPlatformIcon(p: SocialPlatform, size: number = 20) {
  const common: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as SVGProps<SVGSVGElement>['strokeLinecap'],
    strokeLinejoin: 'round' as SVGProps<SVGSVGElement>['strokeLinejoin'],
  }
  switch (p) {
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
        </svg>
      )
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 5l15 15"/>
          <path d="M19 5L4 20"/>
        </svg>
      )
    
  }
}

function generateIdea(profile: BrandProfile, notes: string) {
  const seed = Math.random().toString(36).slice(2,6)
  const base = `${profile.industry || 'Brand'} • ${profile.tone || 'Friendly'}`
  const caps = [profile.hasPhotography?'photo':undefined, profile.hasVideo?'video':undefined, profile.hasDesign?'graphic':undefined].filter(Boolean).join('/')
  const whyReasons = [
    'Aligns with brand tone',
    'Engages target audience', 
    'Matches industry trends',
    'Leverages available assets',
    'Supports content goals',
    'Builds brand awareness',
    'Drives engagement'
  ]
  const why = whyReasons[Math.floor(Math.random() * whyReasons.length)]
  return { 
    visual: `Visual: ${caps || 'asset'} ${seed}`, 
    copy: `Copy: ${base} — ${notes || 'engagement prompt'} (${seed})`,
    why: why
  }
}

function getPlatformColor(p: SocialPlatform): string {
  if (p === 'facebook') return '#1877F2'
  if (p === 'instagram') return '#E1306C'
  return '#111111'
}

export default function App() {
  const today = new Date()
  const todayISO = fmtISO(today)
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))
  const LS_COMPLETED_PROFILE = 'phasee.completedProfile'
  const LS_SELECTED_PLAN = 'phasee.selectedPlan'
  const LS_PLAN_VALUE = 'phasee.plan'
  const hasCompletedProfile = () => localStorage.getItem(LS_COMPLETED_PROFILE) === '1'
  const hasSelectedPlan = () => localStorage.getItem(LS_SELECTED_PLAN) === '1'
  const [screen, setScreen] = useState<Screen>('login')
  const [activeSettingsItem, setActiveSettingsItem] = useState<string>('personal')
  const [profile, setProfile] = useState<BrandProfile>({ brandName:'', yearFounded:'', industry:'', audience:'', tone:'', hasPhotography:false, hasVideo:false, hasDesign:false, companyDescription:'', brandCulture:'', contentGoals:'' })
  const [plan, setPlan] = useState<PlanKey>('d30')
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<string>('')
  const [campaign, setCampaign] = useState<boolean>(false)
  const [openCalendarFor, setOpenCalendarFor] = useState<string | null>(null)
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [editingCards, setEditingCards] = useState<Set<string>>(new Set())
  const [showCampaignTooltip, setShowCampaignTooltip] = useState<boolean>(false)
  const dragStartXRef = useRef<Record<string, number>>({})
  const [dragXById, setDragXById] = useState<Record<string, number>>({})
  const [closedHeight, setClosedHeight] = useState<number>(56)
  const [sheetHeight, setSheetHeight] = useState<number>(56)
  // Drag disabled for bottom sheet; tap to open/close only
  const sheetHeaderRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Measure header height to define the closed (peek) height so the title is vertically centered
    const measure = () => {
      const h = sheetHeaderRef.current?.offsetHeight || 56
      setClosedHeight(h)
      setSheetHeight(h)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCampaignTooltip && !(event.target as Element)?.closest('.campaign-help')) {
        setShowCampaignTooltip(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showCampaignTooltip])
  const isSheetOpen = sheetHeight > closedHeight + 2
  const LS_IDEAS = 'phasee.ideas.v1'

  // Load persisted ideas on first mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_IDEAS)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setIdeas(parsed)
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist ideas whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LS_IDEAS, JSON.stringify(ideas))
    } catch {}
  }, [ideas])

  const hasScheduledForSelection = useMemo(() => {
    for (const iso of selectedDates) {
      if (ideas.some(i => i.accepted && i.assignedDate === iso)) return true
    }
    return false
  }, [selectedDates, ideas])

  const monthDays = useMemo(() => {
    const days: { day:number; iso:string }[] = []
    const base = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    const len = lastDay(base)
    for (let d = 1; d <= len; d++) {
      const dt = new Date(base.getFullYear(), base.getMonth(), d)
      days.push({ day: d, iso: fmtISO(dt) })
    }
    return days
  }, [viewDate])

  // Sunday-first offset for the first row padding
  const firstDayOffset = useMemo(() => {
    const base = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    return base.getDay() // 0=Sun..6=Sat
  }, [viewDate])

  const weekdays = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(viewDate)
  const assignedUniqueDates = useMemo(() => new Set(ideas.filter(i=>i.assignedDate).map(i=>i.assignedDate as string)).size, [ideas])
  const remainingDays = useMemo(() => Math.max(0, planIdeaAllowance(plan) - assignedUniqueDates), [plan, assignedUniqueDates])
  const canUseCampaign = plan === 'd30'

  const visibleIdeas = useMemo(() => ideas.filter(i => !i.accepted), [ideas])

  function handleGenerate() {
    const selectedISOList = Array.from(selectedDates).sort()
    const sourceDates = selectedISOList.length > 0 ? selectedISOList : [todayISO]
    const count = Math.min(10, Math.max(1, sourceDates.length))
    fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, notes, count })
    }).then(r=>r.json()).then(data => {
      const fromApi: { visual:string; copy:string; why?:string }[] = Array.isArray(data?.ideas)? data.ideas : []
      const ideasToAdd: IdeaCard[] = (fromApi.length? fromApi : Array.from({length: count}, ()=> generateIdea(profile, notes))).map((g, idx) => {
        const iso = sourceDates[idx % sourceDates.length]
        return { id: generateId(), visual: g.visual, copy: g.copy, why: g.why || 'AI-generated recommendation', platform, proposedDate: iso, accepted: false }
      })
      setIdeas(prev => [...prev, ...ideasToAdd])
      setSelectedDates(new Set())
    }).catch(() => {
      const ideasFallback: IdeaCard[] = sourceDates.slice(0, count).map((iso) => {
        const g = generateIdea(profile, notes)
        return { id: generateId(), visual: g.visual, copy: g.copy, why: g.why, platform, proposedDate: iso, accepted: false }
      })
      setIdeas(prev => [...prev, ...ideasFallback])
      setSelectedDates(new Set())
    })
  }
  function handleRegenerateOne(id: string) { setIdeas(prev => prev.map(it => it.id===id ? { ...it, ...generateIdea(profile, notes) } : it)) }
  function handleAssign(id: string, iso: string) { setIdeas(prev => prev.map(it => it.id===id ? { ...it, assignedDate: iso } : it)) }
  function handleDeleteScheduled(id: string) { setIdeas(prev => prev.filter(i => i.id !== id)) }
  function handleEditScheduled(id: string) {
    setIdeas(prev => prev.map(it => it.id===id ? { ...it, accepted: false, proposedDate: it.assignedDate } : it))
    setOpenCalendarFor(id)
  }
  async function handleShareScheduled() {
    const selectedList = Array.from(selectedDates).sort()
    const lines: string[] = []
    for (const iso of selectedList) {
      const dayItems = ideas.filter(i => i.accepted && i.assignedDate === iso)
      if (dayItems.length === 0) continue
      lines.push(`${fmtMDYFromISO(iso)}`)
      const byPlatform: Record<SocialPlatform, IdeaCard[]> = dayItems.reduce((acc, it) => {
        const key = (it.platform || platform) as SocialPlatform
        if (!acc[key]) acc[key] = []
        acc[key].push(it)
        return acc
      }, {} as Record<SocialPlatform, IdeaCard[]>)
      Object.entries(byPlatform).forEach(([p, arr]) => {
        arr.forEach((it, idx) => {
          lines.push(`- [${p}] ${it.visual}${idx < arr.length - 1 ? '' : ''}`)
        })
      })
      lines.push('')
    }
    const text = lines.join('\n') || 'No scheduled posts in selection.'
    try {
      if (navigator && 'share' in navigator && typeof (navigator as any).share === 'function') {
        await (navigator as any).share({ title: 'Scheduled Posts', text })
      } else if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        alert('Copied schedule to clipboard')
      }
    } catch {
      try { await navigator.clipboard.writeText(text); alert('Copied schedule to clipboard') } catch {}
    }
  }

  function handleEmailSchedule() {
    const selectedList = Array.from(selectedDates).sort()
    const lines: string[] = []
    for (const iso of selectedList) {
      const dayItems = ideas.filter(i => i.accepted && i.assignedDate === iso)
      if (dayItems.length === 0) continue
      lines.push(`${fmtMDYFromISO(iso)}`)
      const byPlatform: Record<SocialPlatform, IdeaCard[]> = dayItems.reduce((acc, it) => {
        const key = (it.platform || platform) as SocialPlatform
        if (!acc[key]) acc[key] = []
        acc[key].push(it)
        return acc
      }, {} as Record<SocialPlatform, IdeaCard[]>)
      Object.entries(byPlatform).forEach(([p, arr]) => {
        arr.forEach((it, idx) => {
          lines.push(`- [${p}] ${it.visual}${idx < arr.length - 1 ? '' : ''}`)
        })
      })
      lines.push('')
    }
    const body = (lines.join('\n') || 'No scheduled posts in selection.')
    const subject = 'Scheduled Posts'
    const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = href
  }

  function assignToNextAvailableSelectedDate(id: string) {
    const idea = ideas.find(i=>i.id===id)
    // If a date is already designated on the card, just accept it and keep that date
    if (idea?.assignedDate) {
      setIdeas(prev => prev.map(it => it.id===id ? { ...it, accepted: true, platform } : it))
      try { fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: idea.id, visual: idea.visual, copy: idea.copy, why: idea.why, assignedDate: idea.assignedDate, platform, accepted: true }) }) } catch {}
      if (openCalendarFor === id) setOpenCalendarFor(null)
      return
    }
    const selectedISOList = Array.from(selectedDates).sort()
    if (selectedISOList.length === 0) {
      const target = idea?.proposedDate || todayISO
      handleAssign(id, target)
      setIdeas(prev => prev.map(it => it.id===id ? { ...it, accepted: true, platform } : it))
      try { fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: idea?.id, visual: idea?.visual, copy: idea?.copy, why: idea?.why, assignedDate: target, platform, accepted: true }) }) } catch {}
      if (openCalendarFor === id) setOpenCalendarFor(null)
      return
    }
    const used = new Set(ideas.filter(i=>i.id!==id && i.accepted && i.assignedDate).map(i=>i.assignedDate as string))
    const preferred = idea?.proposedDate
    const nextFromSelection = selectedISOList.find(iso => !used.has(iso)) || selectedISOList[0]
    const assignIso = preferred && !used.has(preferred) ? preferred : nextFromSelection
    handleAssign(id, assignIso)
    setIdeas(prev => prev.map(it => it.id===id ? { ...it, accepted: true, platform } : it))
    try { fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: idea?.id, visual: idea?.visual, copy: idea?.copy, why: idea?.why, assignedDate: assignIso, platform, accepted: true }) }) } catch {}
    if (openCalendarFor === id) setOpenCalendarFor(null)
  }

  const SWIPE_THRESHOLD = 120
  const DEADZONE = 12
  const MAX_DRAG = 140

  function onCardPointerDown(id: string, e: React.PointerEvent<HTMLDivElement>) {
    const t = e.target as HTMLElement
    if (t.closest('button, [role="button"], .date-trigger, select, textarea, input')) return
    dragStartXRef.current[id] = e.clientX
  }

  function onCardPointerMove(id: string, e: React.PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary) return
    const startX = dragStartXRef.current[id]
    if (startX === undefined) return
    const raw = e.clientX - startX
    const abs = Math.abs(raw)
    const clamped = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, raw))
    const dx = abs < DEADZONE ? 0 : clamped
    setDragXById(prev => ({ ...prev, [id]: dx }))
  }

  function onCardPointerUp(id: string, e: React.PointerEvent<HTMLDivElement>) {
    const dx = dragStartXRef.current[id] === undefined ? 0 : (dragXById[id] || 0)
    delete dragStartXRef.current[id]
    setDragXById(prev => ({ ...prev, [id]: 0 }))
    if (dx > SWIPE_THRESHOLD) {
      // Accept/schedule to the next available selected date
      const selectedISOList = Array.from(selectedDates).sort()
      const pool = selectedISOList.length === 0 ? [todayISO] : selectedISOList
      const used = new Set(ideas.filter(i=>i.id!==id && i.assignedDate).map(i=>i.assignedDate as string))
      const chosen = pool.find(iso => !used.has(iso)) || pool[0]
      setIdeas(prev => prev.map(it => it.id===id ? { ...it, assignedDate: chosen, accepted: true, platform } : it))
    } else if (dx < -SWIPE_THRESHOLD) {
      handleRegenerateOne(id)
    }
  }

  // Bottom sheet interactions
  function openScheduleHalf() {
    const maxH = Math.round(window.innerHeight * 0.55)
    setSheetHeight(maxH)
  }
  function closeSchedule() { setSheetHeight(closedHeight) }
  // Pointer drag handlers removed
  function onSheetHeaderClick() {
    const half = Math.round(window.innerHeight * 0.55)
    const full = Math.round(window.innerHeight * 0.9)
    // Always allow opening/closing regardless of scheduled content
    if (sheetHeight <= closedHeight + 2) {
      // If closed, open to half height
      openScheduleHalf()
    } else if (sheetHeight < half - 20) {
      // If partially open, open fully
      setSheetHeight(full)
    } else {
      // If open, close
      closeSchedule()
    }
  }

  function handleLogin() {
    if (!hasCompletedProfile()) { setScreen('profile'); return }
    // Do not auto-open subscription anymore; go straight to Home
    setScreen('home')
  }

  // Settings subpages
  if (screen === 'settings.personal') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar">
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('settings')}>←</button>
            <button className="logo-btn" aria-label="Home" onClick={()=>setScreen('home')}>
              <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
            </button>
            <span />
          </div>
          <div className="card settings">
            <div className="settings-header"><span className="settings-icon">👤</span><span className="settings-title">Personal Details</span></div>
            <div className="divider" />
            <div className="stack">
              <div className="section">Account Information</div>
              <label className="inline">Full Name <input placeholder="Your full name" value="John Smith" /></label>
              <label className="inline">Email <input placeholder="name@company.com" value="john@company.com" /></label>
              <label className="inline">Company <input placeholder="Company name" value="Acme Corp" /></label>
              <label className="inline">Role <input placeholder="Your role" value="Marketing Manager" /></label>
              
              <div className="section">Preferences</div>
              <label className="check">
                <input type="checkbox" defaultChecked />
                <span>Email notifications</span>
              </label>
              <label className="check">
                <input type="checkbox" />
                <span>Weekly summary reports</span>
              </label>
              
              <div className="row split">
                <button className="ghost">Cancel</button>
                <button className="primary">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }


  if (screen === 'settings.security') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar">
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('settings')}>←</button>
            <button className="logo-btn" aria-label="Home" onClick={()=>setScreen('home')}>
              <img src="/header-logo.png" alt="Header logo" className="brand-logo" />
            </button>
            <span />
          </div>
          <div className="card settings">
            <div className="settings-header"><span className="settings-icon">🛡️</span><span className="settings-title">Security</span></div>
            <div className="divider" />
            <div className="stack">
              <div className="section">Password & Authentication</div>
              <label className="inline">Password <button className="ghost">Change Password</button></label>
              <label className="check">
                <input type="checkbox" />
                <span>Enable two-factor authentication</span>
              </label>
              <p className="muted left small">Add an extra layer of security to your account</p>
              
              <div className="section">Login Activity</div>
              <div className="muted left">Last login: Today at 2:30 PM</div>
              <div className="muted left">Device: Chrome on Windows</div>
              <button className="ghost" style={{justifySelf: 'start', marginTop: '8px'}}>View All Sessions</button>
              
              <div className="section">Data & Privacy</div>
              <button className="ghost" style={{justifySelf: 'start'}}>Download My Data</button>
              <button className="ghost" style={{justifySelf: 'start', color: '#ef4444'}}>Delete Account</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'settings.notifications') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar">
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('settings')}>←</button>
            <button className="logo-btn" aria-label="Home" onClick={()=>setScreen('home')}>
              <img src="/header-logo.png" alt="Header logo" className="brand-logo" />
            </button>
            <span />
          </div>
          <div className="card settings">
            <div className="settings-header"><span className="settings-icon">🔔</span><span className="settings-title">Notifications</span></div>
            <div className="divider" />
            <div className="stack">
              <div className="section">Email Notifications</div>
              <label className="check">
                <input type="checkbox" defaultChecked />
                <span>New ideas generated</span>
              </label>
              <label className="check">
                <input type="checkbox" defaultChecked />
                <span>Schedule reminders</span>
              </label>
              <label className="check">
                <input type="checkbox" />
                <span>Weekly performance summary</span>
              </label>
              <label className="check">
                <input type="checkbox" />
                <span>Product updates & tips</span>
              </label>
              
              <div className="section">Push Notifications</div>
              <label className="check">
                <input type="checkbox" defaultChecked />
                <span>Post publishing reminders</span>
              </label>
              <label className="check">
                <input type="checkbox" />
                <span>Campaign milestones</span>
              </label>
              
              <div className="row split">
                <button className="ghost">Reset to Default</button>
                <button className="primary">Save Preferences</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'settings.help') {
    return (
      <div className="screen">
        <div className="frame">
          <div className="header-bar">
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('settings')}>←</button>
            <button className="logo-btn" aria-label="Home" onClick={()=>setScreen('home')}>
              <img src="/header-logo.png" alt="Header logo" className="brand-logo" />
            </button>
            <span />
          </div>
          <div className="card settings">
            <div className="settings-header"><span className="settings-icon">❓</span><span className="settings-title">Help & Support</span></div>
            <div className="divider" />
            <div className="stack">
              <div className="section">Get Help</div>
              <button className="ghost" style={{justifySelf: 'start'}}>📚 Help Center</button>
              <button className="ghost" style={{justifySelf: 'start'}}>💬 Contact Support</button>
              <button className="ghost" style={{justifySelf: 'start'}}>🎥 Video Tutorials</button>
              
              <div className="section">Resources</div>
              <button className="ghost" style={{justifySelf: 'start'}}>📖 User Guide</button>
              <button className="ghost" style={{justifySelf: 'start'}}>🚀 What's New</button>
              <button className="ghost" style={{justifySelf: 'start'}}>💡 Feature Requests</button>
              
              <div className="section">Contact Information</div>
              <div className="muted left">Email: support@phasee.app</div>
              <div className="muted left">Response time: Within 24 hours</div>
              <div className="muted left">Version: 2.1.0</div>
            </div>
          </div>
        </div>
      </div>
    )
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
              <button className={`settings-item${activeSettingsItem === 'personal' ? ' active' : ''}`} type="button" onClick={()=>{setActiveSettingsItem('personal'); setScreen('settings.personal')}}>
                <span className="item-icon" aria-hidden="true">
                  {/* user */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </span>
                <span className="item-label">Personal Details</span>
              </button>

              <button className={`settings-item subscription-item${activeSettingsItem === 'subscription' ? ' active' : ''}`} type="button" onClick={()=>{setActiveSettingsItem('subscription'); setScreen('subscription')}}>
                <span className="item-icon crown-icon" aria-hidden="true">
                  {/* crown */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l5 4 4-6 4 6 5-4v11H3z"/></svg>
                </span>
                <span className="item-label subscription-label">Subscription</span>
              </button>

              <button className={`settings-item${activeSettingsItem === 'security' ? ' active' : ''}`} type="button" onClick={()=>{setActiveSettingsItem('security'); setScreen('settings.security')}}>
                <span className="item-icon" aria-hidden="true">
                  {/* shield */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
                <span className="item-label">Security</span>
              </button>

              <button className={`settings-item${activeSettingsItem === 'notifications' ? ' active' : ''}`} type="button" onClick={()=>{setActiveSettingsItem('notifications'); setScreen('settings.notifications')}}>
                <span className="item-icon" aria-hidden="true">
                  {/* bell */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </span>
                <span className="item-label">Notifications</span>
              </button>

              <button className={`settings-item${activeSettingsItem === 'help' ? ' active' : ''}`} type="button" onClick={()=>{setActiveSettingsItem('help'); setScreen('settings.help')}}>
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
            <div className="brand"><img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" /></div>
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
              <img src={`${import.meta.env.BASE_URL}settings.svg`} alt="Settings" />
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
              <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
            </button>
            <button className="icon-btn" aria-label="Settings" onClick={()=>setScreen('settings')}>
              <img src={`${import.meta.env.BASE_URL}settings.svg`} alt="Settings" />
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
    <>
    <div className="screen">
      <div className="frame" onClick={(e)=>{ if (sheetHeight > closedHeight + 2) { const el = e.target as HTMLElement; if (!el.closest('.schedule-sheet')) closeSchedule() } }}>
        <div className="header-bar">
          <button className="icon-btn" aria-label="Profile" onClick={()=>setScreen('profile')}>
            <img src={`${import.meta.env.BASE_URL}profile.svg`} alt="Profile" />
          </button>
          <div className="brand"><img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" /></div>
          <button className="icon-btn" aria-label="Settings" onClick={()=>setScreen('settings')}>
            <img src={`${import.meta.env.BASE_URL}settings.svg`} alt="Settings" />
          </button>
        </div>
        <div className="home-grid">
          <div className="calendar card" onClick={(e)=>{ const target = e.target as HTMLElement; if (!target.closest('.schedule-sheet')) { /* noop for now */ } }}>
            <div className="row center">
              <div className="month-scroller" role="tablist" aria-label="Select month">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const base = new Date(today.getFullYear(), today.getMonth(), 1)
                  const d = new Date(base.getFullYear(), base.getMonth() + idx, 1)
                  const key = `${d.getFullYear()}-${d.getMonth()}`
                  const label = new Intl.DateTimeFormat(undefined, { month: 'short' }).format(d)
                  const selected = d.getFullYear()===viewDate.getFullYear() && d.getMonth()===viewDate.getMonth()
                  return (
                    <button
                      key={key}
                      role="tab"
                      aria-selected={selected}
                      className={'month-chip' + (selected?' selected':'')}
                      onClick={()=>setViewDate(d)}
                    >{label}</button>
                  )
                })}
              </div>
            </div>
            <div className="calendar-weekdays">
              {weekdays.map(w => (
                <div key={w} className="weekday">{w}</div>
              ))}
            </div>
            <div className="calendar-grid">
              {viewDate.getFullYear() === today.getFullYear() && viewDate.getMonth() === today.getMonth() ? (
                // Keep current week at the top: render 6 weeks starting from Sunday's date of current week
                (() => {
                  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
                  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
                  const lastOfMonthDate = lastDay(viewDate)
                  const lastOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), lastOfMonthDate)
                  return Array.from({ length: 35 }).map((_, idx) => {
                    const gd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + idx)
                    const iso = fmtISO(gd)
                    const isOutside = gd.getMonth() !== viewDate.getMonth()
                    const outsideClass = isOutside ? (gd < firstOfMonth ? ' outside prev' : (gd > lastOfMonth ? ' outside next' : ' outside')) : ''
                    const isSelected = selectedDates.has(iso)
                    const isToday = iso === todayISO
                    const isPast = iso < todayISO
                    const icons = ideas.filter(i=>i.accepted && i.assignedDate===iso).map(i=>i.platform)
                    const platformCounts = icons.reduce<Record<SocialPlatform, number>>((acc, p) => {
                      const key = p as SocialPlatform
                      acc[key] = (acc[key] ?? 0) + 1
                      return acc
                    }, {} as Record<SocialPlatform, number>)
                    const entries = Object.entries(platformCounts) as [SocialPlatform, number][]
                    const isThree = entries.length >= 3
                    return (
                      <button
                        key={iso}
                        className={'cell' + outsideClass + (isSelected ? ' selected' : '') + (!isSelected && isToday ? ' today' : '') + (isPast ? ' past' : '')}
                        disabled={isPast}
                        onClick={() => setSelectedDates(prev => { const next = new Set(prev); if (next.has(iso)) { next.delete(iso) } else { next.add(iso) } return next })}
                        type="button"
                      >
                        <span className="day-label">{gd.getDate()}<sup className="ord">{ordinalSuffix(gd.getDate())}</sup></span>
                        {icons.length>0 && (
                          <div className={"chip-icons" + (isThree ? " three" : "")} aria-hidden="true">
                            {(isThree ? entries.slice(0,3) : entries).map(([p, count], idx3) => {
                              const posClass = isThree
                                ? (idx3 === 0 ? ' chip-pos-bl' : idx3 === 1 ? ' chip-pos-br' : ' chip-pos-tr')
                                : ''
                              return (
                                <span key={`${iso}-${p}`} className={"chip-icon" + posClass}>
                                  {renderPlatformIcon(p as SocialPlatform, 12)}
                                  {count > 1 ? <sup className="chip-count">{count}</sup> : null}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </button>
                    )
                  })
                })()
              ) : (
                // Default month view
                <>
                  {Array.from({ length: firstDayOffset }).map((_, idx) => {
                    const base = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
                    const prevMonth = new Date(base.getFullYear(), base.getMonth() - 1, 1)
                    const prevMonthLast = lastDay(prevMonth)
                    const dayNum = prevMonthLast - firstDayOffset + 1 + idx
                    return (
                      <button
                        key={`prev-${idx}`}
                        className={'cell outside prev'}
                        disabled
                        type="button"
                      >
                        <span className="day-label">{dayNum}<sup className="ord">{ordinalSuffix(dayNum)}</sup></span>
                      </button>
                    )
                  })}
                  {monthDays.map(d => {
                    const isSelected = selectedDates.has(d.iso)
                    const isToday = d.iso === todayISO
                    const isPast = d.iso < todayISO
                    const icons = ideas.filter(i=>i.accepted && i.assignedDate===d.iso).map(i=>i.platform)
                    const platformCounts = icons.reduce<Record<SocialPlatform, number>>((acc, p) => {
                      const key = p as SocialPlatform
                      acc[key] = (acc[key] ?? 0) + 1
                      return acc
                    }, {} as Record<SocialPlatform, number>)
                    const entries = Object.entries(platformCounts) as [SocialPlatform, number][]
                    const isThree = entries.length >= 3
                    const renderSelected = isSelected
                    return (
                      <button
                        key={d.iso}
                        className={'cell' + (renderSelected ? ' selected' : '') + (!renderSelected && isToday ? ' today' : '') + (isPast ? ' past' : '')}
                        disabled={isPast}
                        onClick={() => setSelectedDates(prev => { const next = new Set(prev); if (next.has(d.iso)) { next.delete(d.iso) } else { next.add(d.iso) } return next })}
                      ><span className="day-label">{d.day}<sup className="ord">{ordinalSuffix(d.day)}</sup></span>
                        {icons.length>0 && (
                          <div className={"chip-icons" + (isThree ? " three" : "")} aria-hidden="true">
                            {(isThree ? entries.slice(0,3) : entries).map(([p, count], idx3) => {
                              const posClass = isThree
                                ? (idx3 === 0 ? ' chip-pos-bl' : idx3 === 1 ? ' chip-pos-br' : ' chip-pos-tr')
                                : ''
                              return (
                                <span key={`${d.iso}-${p}`} className={"chip-icon" + posClass}>
                                  {renderPlatformIcon(p as SocialPlatform, 12)}
                                  {count > 1 ? <sup className="chip-count">{count}</sup> : null}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {(() => {
                    const totalCells = firstDayOffset + monthDays.length
                    const trailing = (7 - (totalCells % 7)) % 7
                    if (trailing === 0) return null
                    const nextBase = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
                    return Array.from({ length: trailing }).map((_, idx) => {
                      const dayNum = idx + 1
                      const nextDate = new Date(nextBase.getFullYear(), nextBase.getMonth(), dayNum)
                      const iso = fmtISO(nextDate)
                      const isSelected = selectedDates.has(iso)
                      return (
                        <button
                          key={`next-${idx}`}
                          className={'cell outside next' + (isSelected ? ' selected' : '')}
                          type="button"
                          onClick={() => setSelectedDates(prev => { const next = new Set(prev); if (next.has(iso)) { next.delete(iso) } else { next.add(iso) } return next })}
                        >
                          <span className="day-label">{dayNum}<sup className="ord">{ordinalSuffix(dayNum)}</sup></span>
                        </button>
                      )
                    })
                  })()}
                </>
              )}
            </div>
            <div className="row" style={{ gridAutoFlow: 'unset', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
              {selectedDates.size > 0 ? (
                <button className="text unselect-btn" type="button" onClick={()=>setSelectedDates(new Set())}>Unselect All</button>
              ) : <span />}
              {ideas.some(i => i.accepted && i.assignedDate) && (
                <button className="share-btn" aria-label="Share schedule" title="Share schedule" onClick={(e)=>{ e.stopPropagation(); handleEmailSchedule() }}>
                  SHARE
                </button>
              )}
            </div>


            {/* Schedule section moved here */}
            <div className="schedule-section">
              <div className="schedule-header" onClick={onSheetHeaderClick} />
              <div className="schedule-body">
                {(() => {
                  // Get all scheduled ideas, grouped by date
                  const allScheduled = ideas.filter(i => i.accepted && i.assignedDate)
                  const datesWithScheduled = [...new Set(allScheduled.map(i => i.assignedDate).filter((d): d is string => !!d))].sort()
                  
                  if (datesWithScheduled.length === 0) {
                    return <div className="muted" style={{textAlign: 'center', padding: '20px'}}>No scheduled posts.</div>
                  }
                  
                  return datesWithScheduled.map((iso) => {
                    const scheduled = ideas.filter(i => i.accepted && i.assignedDate === iso)
                    if (scheduled.length === 0) return null
                  const groups = scheduled.reduce<Record<SocialPlatform, IdeaCard[]>>((acc, it) => {
                    const key = (it.platform || platform) as SocialPlatform
                    if (!acc[key]) acc[key] = []
                    acc[key].push(it)
                    return acc
                  }, {} as Record<SocialPlatform, IdeaCard[]>)
                  
                  return (
                    <div key={`schedule-${iso}`} className="scheduled card">
                      <div className="scheduled-header">
                        <div className="scheduled-date">{fmtMDYFromISO(iso)}</div>
                        <div className="scheduled-count muted small">{scheduled.length} scheduled</div>
                      </div>
                      <div className="scheduled-groups">
                        {Object.entries(groups).map(([p, items]) => (
                          <div key={`${iso}-${p}`} className="scheduled-group">
                            <div className="group-head" />
                            <ul className="group-list">
                              {items.map(it => (
                                <li key={`${it.id}-${iso}`} className="group-item" data-platform={p}>
                                  <span className="gi-time">12:00</span>
                                  <span className="gi-icon">{renderPlatformIcon(p as SocialPlatform, 14)}</span>
                                  <span className="gi-visual">
                                    {`${it.visual.slice(0, 20)}${it.visual.length>20?'…':''} | ${it.copy.slice(0, 20)}${it.copy.length>20?'…':''}`}
                                  </span>
                                  <button className="icon-btn text" aria-label="Edit" title="Edit" onClick={()=>handleEditScheduled(it.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                  </button>
                                  <button className="icon-btn text" aria-label="Delete" title="Delete" onClick={()=>handleDeleteScheduled(it.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                  })
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Floating Create Button - bottom of screen when no dates selected */}
      {selectedDates.size === 0 && (
        <div className="generator-floating">
          <button className="generator-toggle" onClick={handleGenerate} disabled={selectedDates.size === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
            Create
          </button>
        </div>
      )}

      {/* Floating Create Overlay - appears above all content when dates selected */}
      {selectedDates.size > 0 && (
        <div className="generator-overlay">
          <div className="generator-overlay-content">
            <div className="generator-header">
              <h3 className="generator-title">Got a direction? Let's build it!</h3>
              <button className="generator-close-btn" onClick={() => setSelectedDates(new Set())}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="generator-subheader">
              <div className="day-counter">
                {selectedDates.size} day{selectedDates.size !== 1 ? 's' : ''} selected
              </div>
              <label className={`campaign-checkbox${selectedDates.size < 2 ? ' disabled' : ''}`}>
                <input
                  type="checkbox"
                  checked={campaign}
                  disabled={selectedDates.size < 2}
                  onChange={e => setCampaign(e.target.checked)}
                />
                <span>Make it a campaign!</span>
              </label>
            </div>
            <textarea 
              className="generator-text-input"
              placeholder="(New Product, Season Sales, &quot;Job Fair&quot; Promotion)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
            <div className="generator-actions">
              <button className="generator-toggle" onClick={handleGenerate} style={{ flex: 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ideas section */}
      {visibleIdeas.length > 0 && (
        <div className="ideas-overlay">
          <div className="ideas card">
            {visibleIdeas.length===0 ? <div className="muted">No ideas yet.</div> : (
              <div className="idea-list">
                {visibleIdeas.map((it, idx) => (
                  <div
                    key={it.id}
                    className="idea"
                    style={{ transform: `translateX(${dragXById[it.id] || 0}px)`, zIndex: openCalendarFor === it.id ? 999999 : 'auto' }}
                    onPointerDown={(e)=>onCardPointerDown(it.id, e)}
                    onPointerMove={(e)=>onCardPointerMove(it.id, e)}
                    onPointerUp={(e)=>onCardPointerUp(it.id, e)}
                    onPointerCancel={(e)=>onCardPointerUp(it.id, e)}
                    onPointerLeave={(e)=>onCardPointerUp(it.id, e)}
                  >
                    <div className="idea-header">
                      <button 
                        className="close-card-btn" 
                        aria-label="Close card" 
                        onClick={()=>setIdeas(prev => prev.filter(i => i.id !== it.id))}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                      <div className="idea-right-controls">
                        <div className="idea-date-time">
                          <button className="date-trigger" type="button" onClick={()=>setOpenCalendarFor(prev => prev===it.id ? null : it.id)}>
                            {it.assignedDate ? fmtMDYFromISO(it.assignedDate) : (it.proposedDate ? fmtMDYFromISO(it.proposedDate) : 'Assign to date…')}
                          </button>
                          <select className="idea-time-select" defaultValue="12:00">
                            {Array.from({length:24}).map((_,h)=>{
                              const value = String(h).padStart(2,'0') + ':00'
                              const label = new Date(2000,0,1,h).toLocaleTimeString([], { hour: 'numeric' })
                              return <option key={value} value={value}>{label}</option>
                            })}
                          </select>
                          <div className="idea-platform" aria-label="Platform icon">
                            {renderPlatformIcon(it.platform || platform, 18)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {openCalendarFor === it.id && (
                      <div className="mini-cal" role="dialog" aria-label="Select date">
                        <div className="mini-cal-header">{monthLabel}</div>
                        <div className="mini-cal-weekdays">
                          {weekdays.map(w => (
                            <div key={w} className="mini-weekday">{w}</div>
                          ))}
                        </div>
                        <div className="mini-cal-grid">
                          {Array.from({ length: firstDayOffset }).map((_, idx) => (
                            <div key={`mblank-${idx}`} className="mini-cell empty" />
                          ))}
                          {monthDays.map(d => (
                            <button
                              key={`m-${d.iso}`}
                              className={'mini-cell' + (it.assignedDate===d.iso ? ' selected' : '')}
                              onClick={()=>{ handleAssign(it.id, d.iso); setOpenCalendarFor(null) }}
                            >
                              {d.day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="idea-content">
                      <div className="idea-box">
                        {editingCards.has(it.id) ? (
                          <>
                            <div className="label">Visual:</div>
                            <textarea value={it.visual} onChange={e=>setIdeas(prev=>prev.map(p=>p.id===it.id?{...p, visual:e.target.value}:p))} />
                          </>
                        ) : (
                          <div className="inline-text"><span className="label">Visual:</span> {it.visual}</div>
                        )}
                      </div>
                      <div className="idea-box">
                        {editingCards.has(it.id) ? (
                          <>
                            <div className="label">Copy:</div>
                            <textarea value={it.copy} onChange={e=>setIdeas(prev=>prev.map(p=>p.id===it.id?{...p, copy:e.target.value}:p))} />
                          </>
                        ) : (
                          <div className="inline-text"><span className="label">Copy:</span> {it.copy}</div>
                        )}
                      </div>
                      <div className="idea-box">
                        <div className="why-inline"><span className="label">Why:</span> {it.why || 'AI-generated recommendation'}</div>
                      </div>
                    </div>

                    <div className="idea-actions">
                      <button 
                        className="icon-btn ghost edit-save-btn" 
                        aria-label={editingCards.has(it.id) ? "Save" : "Edit"} 
                        onClick={()=>{
                          if (editingCards.has(it.id)) {
                            setEditingCards(prev => {
                              const next = new Set(prev)
                              next.delete(it.id)
                              return next
                            })
                          } else {
                            setEditingCards(prev => new Set([...prev, it.id]))
                          }
                        }}
                      >
                        {editingCards.has(it.id) ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        )}
                      </button>
                      <div className="actions-right">
                        <button className="icon-btn ghost regen-btn" aria-label="Regenerate" onClick={()=>handleRegenerateOne(it.id)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15"/></svg>
                        </button>
                        <button className="icon-btn ghost accept-btn" aria-label="Accept" title="Accept/Schedule" onClick={()=>assignToNextAvailableSelectedDate(it.id)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
    </>
  )
}
