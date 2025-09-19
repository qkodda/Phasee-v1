import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react'
import type { SVGProps } from 'react'
import './App.css'
import { auth, userAPI, brandAPI } from './auth'
import type { User } from './auth'

type Screen = 'login' | 'register' | 'profile' | 'subscription' | 'home' | 'settings' | 'settings.personal' | 'settings.security' | 'settings.notifications' | 'settings.help'

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

const PlatformIcon = memo(function PlatformIcon({ platform, size = 20 }: { platform: SocialPlatform; size?: number }) {
  const common: SVGProps<SVGSVGElement> = useMemo(() => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as SVGProps<SVGSVGElement>['strokeLinecap'],
    strokeLinejoin: 'round' as SVGProps<SVGSVGElement>['strokeLinejoin'],
  }), [size])
  
  switch (platform) {
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
    default:
      return null
  }
})

function generateIdea(profile: BrandProfile, notes: string, grounded: boolean = true, platform: SocialPlatform = 'instagram', complexity: 'simple' | 'normal' | 'grand' = 'normal', usedConcepts: Set<string> = new Set(), totalCount: number = 1) {
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
  if (grounded) {
    // Industry-specific viral concepts by complexity
    const industryIdeas = {
      'Real Estate': {
        simple: [
          'Quick phone video tour pointing out 3 best features of the house',
          'Take a selfie in each room with one-sentence description',
          'Film yourself unlocking the front door with excitement',
          'Show the view from the best window in the house',
          'Quick before/after of staging one room',
          'Film the neighborhood walk-through highlighting local gems',
          'Show your "first impression" reaction entering the property',
          'Quick comparison: "This house vs last week\'s listing"',
          'Film the key handover moment with new homeowners',
          'Show the most unique architectural detail up close',
          'Quick "realtor hack" for staging this specific property type',
          'Film your morning coffee routine in the kitchen',
          'Show the sunset/sunrise view from the best room',
          'Quick "price per square foot breakdown" visual explanation',
          'Film yourself measuring rooms with funny commentary'
        ],
        normal: [
          'Host an "Open House in Pajamas" event - film yourself giving tours in cozy PJs with coffee, emphasizing comfort of home',
          'Create a "Bathtub Listing Reviews" series - film yourself in work attire in a bathtub reviewing properties with rubber ducks as props',
          'Night-time open house with string lights and hot cocoa - film the magical evening ambiance and cozy viewing experience',
          'Speed-tour challenge: Show entire house in 60 seconds using creative transitions and upbeat music',
          '"House vs My Apartment" comparison videos showing why this listing beats your current cramped space',
          'Create a "House Personality Test" - match potential buyers to rooms based on their lifestyle',
          'Film a "What Would You Change?" series where you redesign spaces with different budgets',
          'Host "Coffee with a Realtor" - casual morning chats in beautiful kitchens discussing market trends',
          'Create "House Horoscopes" - match zodiac signs to perfect home features',
          'Film "Realtor Reacts" to viral home design trends and rate their practicality',
          'Host "First-Time Buyer Bootcamp" in actual listings, teaching negotiation in real scenarios',
          'Create "House Hunting Bingo" with followers, checking off features during live tours',
          'Film "Realtor vs Interior Designer" friendly competitions in staging rooms',
          'Host "Neighborhood Detective" series uncovering hidden local history and amenities',
          'Create "House Flip or Flop" predictions, then follow up with actual renovation outcomes'
        ],
        grand: [
          'Organize a "House Olympics" event - set up fun challenges in each room (living room limbo, kitchen cook-off, bedroom pillow fight) and film families competing',
          'Create a full cinematic short film telling the "story" of the house - hire actors to play previous owners, dramatic lighting, original soundtrack',
          'Host a "Mystery House" treasure hunt - hide clues throughout the property leading to a grand prize, film families solving puzzles',
          'Transform the house into a themed experience (haunted mansion, tropical paradise, winter wonderland) for one weekend and document the transformation',
          'Organize a "House Swap Challenge" - bring in interior designers to completely redesign rooms in 24 hours while filming the entire process',
          'Create a "Real Estate Reality Show" following multiple families through their entire buying journey with weekly episodes',
          'Host a "Tiny House Challenge" - live in 200 sq ft for a week to appreciate space, document the experience',
          'Organize a "Community Build Day" - rally neighbors to improve a property together, document the transformation and relationships formed',
          'Create a "Time Capsule House" - bury items from current era, document ceremony, create 50-year follow-up plan',
          'Host a "House Auction Takeover" - buy a property live on social media with follower input on every decision'
        ]
      },
      'Food': {
        simple: [
          'Show your signature dish ingredients in 30 seconds',
          'Quick tip while prepping one ingredient',
          'Film yourself tasting and reacting to your own food',
          'Show the "money shot" of your best-looking dish',
          'Quick behind-the-scenes of your busiest hour'
        ],
        normal: [
          'Cook the recipe blindfolded while explaining each step - builds suspense and shows expertise',
          '"What I eat vs What I serve customers" honest behind-the-scenes comparison',
          'Speed-cook challenge: Make signature dish in 2 minutes with time-lapse and dramatic music',
          'Cook while answering rapid-fire questions about your business - multitasking content',
          '"Recreating childhood comfort food with a professional twist" nostalgic angle'
        ],
        grand: [
          'Host a "Chopped" style competition in your restaurant with local influencers using mystery ingredients',
          'Create a pop-up restaurant in an unusual location (rooftop, beach, forest) and document the entire experience',
          'Challenge yourself to create 50 dishes in 50 days, each inspired by a different country, and document the journey',
          'Transform your restaurant into different themed experiences each week (medieval tavern, space station, underwater) with full costume and decor',
          'Organize a "Food Truck Road Trip" across your state, collaborating with local chefs and documenting cultural food exchanges'
        ]
      },
      'Fitness': {
        simple: [
          'Show one exercise you can do anywhere in 15 seconds',
          'Quick form check: common mistake vs correct technique',
          'Film your pre-workout routine in real-time',
          'Show your favorite healthy snack prep',
          'Quick mobility stretch you can do at your desk'
        ],
        normal: [
          'Workout in unusual locations: elevator, grocery store aisle, waiting room - "fitness anywhere" concept',
          '"Getting ready for gym vs reality" expectation vs reality comedy series',
          'Exercise using only household items - creative equipment substitutions',
          'Micro-workouts during TV commercial breaks - practical fitness integration',
          '"What trainers actually eat" day-in-the-life food diary with honest commentary'
        ],
        grand: [
          'Create a city-wide fitness scavenger hunt using landmarks as workout stations, document participants\' journeys',
          'Organize a "Fitness Festival" in your community with obstacle courses, food trucks, and live music',
          'Challenge yourself to try 100 different workout styles in 100 days and document the physical and mental changes',
          'Create an outdoor "Gym in the Wild" using natural elements (logs, rocks, hills) and teach survival fitness',
          'Organize a charity fitness marathon where you do different workouts for 24 hours straight, raising money for local causes'
        ]
      },
      'Beauty': {
        simple: [
          'Show your 60-second morning routine',
          'Quick before/after of one makeup step',
          'Film yourself removing makeup at end of day',
          'Show your favorite product in action',
          'Quick tip while doing your own makeup'
        ],
        normal: [
          '"Doing makeup in weird lighting" challenge - car, bathroom, office fluorescents',
          'Speed makeup using only 3 products - minimalist beauty approach',
          '"Makeup looks inspired by my coffee order" creative theme series',
          'Getting ready while answering customer questions - multitasking beauty routine',
          '"Recreating viral makeup trends with drugstore products" budget-friendly alternatives'
        ],
        grand: [
          'Create a "Beauty Through the Decades" series with full historical accuracy, costumes, and settings for each era',
          'Organize a "Makeup Transformation Challenge" where you completely change people\'s looks to match their dream careers',
          'Host a "Beauty Olympics" with makeup artists competing in speed, creativity, and technical challenges',
          'Create a traveling "Beauty Bus" that brings free makeovers to underserved communities and document the stories',
          'Challenge yourself to create 365 different looks in one year, each inspired by a different art movement or culture'
        ]
      },
      'Tech': {
        simple: [
          'Show one tech tip in 30 seconds',
          'Quick screen recording of a useful shortcut',
          'Film your actual workspace setup',
          'Show before/after of organizing digital files',
          'Quick reaction to latest tech news'
        ],
        normal: [
          '"Explaining tech to my grandma" series - complex concepts in simple terms',
          'Speed-setup challenges: "Setting up workspace in 60 seconds"',
          '"Tech fails that taught me everything" vulnerability and learning stories',
          'Using tech in unexpected ways - creative problem-solving content',
          '"Day in life of your data" - following information through systems creatively'
        ],
        grand: [
          'Build a fully automated smart home from scratch and document every step, challenge, and breakthrough',
          'Create a "Tech Time Machine" series where you use only technology from different decades to complete modern tasks',
          'Organize a "Hackathon for Good" where teams compete to solve local community problems with technology',
          'Challenge yourself to live completely off-grid for 30 days while documenting alternative tech solutions',
          'Create a "Digital Detox Retreat" experience and document people\'s transformations without technology'
        ]
      }
    }

    // Platform-specific trends and timing
    const platformTrends = {
      'instagram': ['Carousel tutorials', 'Behind-the-scenes stories', 'Before/after reveals', 'Day-in-life content', 'Quick tips in Reels'],
      'facebook': ['Community polls', 'Live Q&As', 'Event announcements', 'Customer spotlights', 'Educational carousels'],
      'x': ['Thread tutorials', 'Hot takes on trends', 'Quick tips', 'Industry commentary', 'Real-time updates']
    }

    // Viral hooks and formats
    const viralHooks = [
      'POV: You\'re a [profession] and...',
      'Things nobody tells you about [industry]',
      'Red flags in [industry] that everyone ignores',
      'Plot twist: I\'m actually...',
      'This [industry] hack will change your life',
      'Why I quit [common practice] and you should too',
      'Unpopular opinion about [industry]',
      'The [industry] secret they don\'t want you to know'
    ]

    // Auto-scale complexity for larger quantities
    let adjustedComplexity = complexity
    if (totalCount > 7 && complexity === 'simple') {
      adjustedComplexity = 'normal' // Upgrade simple to normal for week+ content
    } else if (totalCount > 14 && complexity === 'normal') {
      adjustedComplexity = 'grand' // Upgrade normal to grand for 2+ weeks
    }

    // Get industry-specific ideas or fallback to general creative concepts
    const industry = profile.industry || 'Business'
    const industryData = industryIdeas[industry as keyof typeof industryIdeas]
    const specificIdeas = industryData?.[adjustedComplexity] || [
      adjustedComplexity === 'simple' ? 'Quick behind-the-scenes of your daily routine' :
      adjustedComplexity === 'grand' ? 'Create a documentary-style series about your industry transformation' :
      'Behind-the-scenes of your biggest mistake and what you learned',
      adjustedComplexity === 'simple' ? 'Show your workspace in 30 seconds' :
      adjustedComplexity === 'grand' ? 'Organize a community event around your expertise and document the impact' :
      'Speed-challenge: Complete your main task in record time with commentary',
      adjustedComplexity === 'simple' ? 'Quick tip while working' :
      adjustedComplexity === 'grand' ? 'Create an immersive experience that teaches your skills to others' :
      'Day-in-life but every hour you switch to a different work style/location'
    ]

    // Find unique concepts (avoid repeats)
    let availableConcepts = specificIdeas.filter(concept => !usedConcepts.has(concept))
    if (availableConcepts.length === 0) {
      // If all concepts used, reset and add variations
      availableConcepts = specificIdeas.map(concept => `${concept} (Part ${Math.floor(Math.random() * 3) + 2})`)
    }

    // Combine elements for unique concepts
    const concept = availableConcepts[Math.floor(Math.random() * availableConcepts.length)]
    usedConcepts.add(concept)
    
    const hook = viralHooks[Math.floor(Math.random() * viralHooks.length)]
    const currentPlatform = platform as keyof typeof platformTrends
    const platformTrend = platformTrends[currentPlatform] || platformTrends['instagram']
    const format = platformTrend[Math.floor(Math.random() * platformTrend.length)]

    // Create more varied copy based on quantity
    const userContext = notes ? ` Focus on: ${notes}` : ''
    const copyVariations = [
      `${hook.replace('[profession]', industry.toLowerCase()).replace('[industry]', industry)} ${userContext}`,
      `${concept.split(' - ')[0]} challenge ${userContext}`,
      `Weekly series: ${concept.split('.')[0]} ${userContext}`,
      `${industry} insider tip: ${concept.split(' ')[0].toLowerCase()} strategy ${userContext}`,
      `Behind-the-scenes: ${concept.split(' ')[0]} ${userContext}`
    ]
    const copy = copyVariations[Math.floor(Math.random() * copyVariations.length)].trim()

    return {
      visual: `${concept}`,
      copy: `${copy} | Format: ${format}`,
      why: `Leverages ${industry} trends + viral format + platform-specific engagement patterns + uniqueness tracking`
    }
  }
  return {
    visual: `Visual: ${caps || 'asset'} ${seed}`,
    copy: `Copy: ${base} — ${notes || 'engagement prompt'} (${seed})`,
    why
  }
}


export default function App() {
  const today = new Date()
  const todayISO = fmtISO(today)
  const [viewDate, setViewDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1))
  const LS_COMPLETED_PROFILE = 'phasee.completedProfile'
  const LS_SELECTED_PLAN = 'phasee.selectedPlan'
  const LS_PLAN_VALUE = 'phasee.plan'
  // const hasCompletedProfile = () => localStorage.getItem(LS_COMPLETED_PROFILE) === '1'
  const [screen, setScreen] = useState<Screen>('login')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [activeSettingsItem, setActiveSettingsItem] = useState<string>('personal')
  const [profile, setProfile] = useState<BrandProfile>({ brandName:'', yearFounded:'', industry:'', audience:'', tone:'', hasPhotography:false, hasVideo:false, hasDesign:false, companyDescription:'', brandCulture:'', contentGoals:'' })
  
  // Registration form state
  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [registerError, setRegisterError] = useState<string>('')
  const [isRegistering, setIsRegistering] = useState<boolean>(false)

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  const [loginError, setLoginError] = useState<string>('')
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false)
  const [plan, setPlan] = useState<PlanKey>('d30')
  const [ideas, setIdeas] = useState<IdeaCard[]>([])
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<string>('')
  const [campaign, setCampaign] = useState<boolean>(false)
  const [openCalendarFor, setOpenCalendarFor] = useState<string | null>(null)
  const [platform] = useState<SocialPlatform>('instagram')
  const [editingCards, setEditingCards] = useState<Set<string>>(new Set())
  const [showCampaignTooltip, setShowCampaignTooltip] = useState<boolean>(false)
  // Swipe disabled: remove drag states
  const [explodingCards] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatingText, setGeneratingText] = useState<string>('Brainstorming!')
  // Swipe disabled: remove refs
  const [editingScheduledItem, setEditingScheduledItem] = useState<string | null>(null)
  const [closedHeight, setClosedHeight] = useState<number>(56)
  const [sheetHeight, setSheetHeight] = useState<number>(56)

  const closeAllOpen = useCallback(() => {
    if (openCalendarFor !== null) setOpenCalendarFor(null)
    if (editingCards.size > 0) setEditingCards(new Set())
    if (editingScheduledItem !== null) setEditingScheduledItem(null)
  }, [openCalendarFor, editingCards, editingScheduledItem])

  // Check for existing user session on app load
  useEffect(() => {
    const user = auth.getCurrentUser()
    if (user) {
      console.log('Found existing user session:', user)
      setCurrentUser(user)
      setScreen('home')
      // Load user's brand profile
      brandAPI.getProfile(user.id).then(result => {
        console.log('Profile load result:', result)
        if (result.success) {
          console.log('Setting profile:', result.profile)
          setProfile(result.profile)
        } else {
          console.log('Failed to load profile:', result.error)
        }
      }).catch(error => {
        console.error('Error loading profile:', error)
      })
    } else {
      console.log('No existing user session found')
    }
  }, [])

  // Handle user registration
  const handleRegister = useCallback(async () => {
    setRegisterError('')
    
    // Validation
    if (!registerForm.firstName.trim()) {
      setRegisterError('First name is required')
      return
    }
    if (!registerForm.email.trim()) {
      setRegisterError('Email is required')
      return
    }
    if (!registerForm.password) {
      setRegisterError('Password is required')
      return
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('Passwords do not match')
      return
    }
    if (registerForm.password.length < 6) {
      setRegisterError('Password must be at least 6 characters')
      return
    }

    setIsRegistering(true)
    
    try {
      console.log('Attempting to register user:', registerForm.email)
      const result = await userAPI.register(
        registerForm.email.trim(),
        registerForm.password,
        registerForm.firstName.trim(),
        registerForm.lastName.trim()
      )
      
      console.log('Registration result:', result)
      
      if (result.success) {
        console.log('Registration successful, setting user and navigating to profile')
        setCurrentUser(result.user)
        setScreen('profile') // Take them to profile setup
      } else {
        console.log('Registration failed:', result.error)
        setRegisterError(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration network error:', error)
      setRegisterError('Network error. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }, [registerForm])

  // Click outside handler to close open cards
  useEffect(() => {
    function handleGlobalPointer(event: Event) {
      const target = event.target as HTMLElement
      
      // Only prevent closing for very specific interactive elements
      const isButton = target.tagName === 'BUTTON' || target.closest('button')
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
      const isMiniCal = target.closest('.mini-cal')
      const isScheduledEdit = target.closest('.scheduled-edit-card')
      
      // Don't close if clicking on interactive elements
      if (isButton || isInput || isMiniCal || isScheduledEdit) {
        return
      }
      
      // Close any open states when clicking anywhere else
      if (openCalendarFor !== null) {
        setOpenCalendarFor(null)
      }
      if (editingCards.size > 0) {
        setEditingCards(new Set())
      }
      if (editingScheduledItem !== null) {
        setEditingScheduledItem(null)
      }
    }

    // Use capture phase to ensure we see the event before stops
    document.addEventListener('pointerdown', handleGlobalPointer, true)
    document.addEventListener('touchstart', handleGlobalPointer, true)
    document.addEventListener('mousedown', handleGlobalPointer, true)
    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointer, true)
      document.removeEventListener('touchstart', handleGlobalPointer, true)
      document.removeEventListener('mousedown', handleGlobalPointer, true)
    }
  }, [openCalendarFor, editingCards, editingScheduledItem])
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

  // Memoize platform counts calculation for better performance
  const platformCountsByDate = useMemo(() => {
    const counts: Record<string, Record<SocialPlatform, number>> = {}
    ideas.filter(i => i.accepted && i.assignedDate).forEach(i => {
      const date = i.assignedDate!
      if (!counts[date]) counts[date] = {} as Record<SocialPlatform, number>
      const platform = i.platform as SocialPlatform
      counts[date][platform] = (counts[date][platform] || 0) + 1
    })
    return counts
  }, [ideas])

  // Sunday-first offset for the first row padding
  const firstDayOffset = useMemo(() => {
    const base = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    return base.getDay() // 0=Sun..6=Sat
  }, [viewDate])

  const weekdays = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long' }).format(viewDate)

  const visibleIdeas = useMemo(() => {
    return ideas
      .filter(i => !i.accepted)
      .sort((a, b) => {
        // Sort by proposed date (earliest first), then by creation order
        if (a.proposedDate && b.proposedDate) {
          return a.proposedDate.localeCompare(b.proposedDate)
        }
        if (a.proposedDate && !b.proposedDate) return -1
        if (!a.proposedDate && b.proposedDate) return 1
        return a.id.localeCompare(b.id) // fallback to ID order
      })
  }, [ideas])
  // Toggle body class to control background scroll when overlay is shown
  useEffect(() => {
    if (visibleIdeas.length > 0) {
      document.body.classList.add('ideas-open')
    } else {
      document.body.classList.remove('ideas-open')
    }
    return () => { document.body.classList.remove('ideas-open') }
  }, [visibleIdeas.length])

  const handleGenerate = useCallback(() => {
    // Set generating state and text progression
    setIsGenerating(true)
    setGeneratingText('Brainstorming!')
    
    // Change text after 2 seconds
    setTimeout(() => {
      setGeneratingText('Building ideas!')
    }, 2000)
    
    const startTime = Date.now()
    const selectedISOList = Array.from(selectedDates).sort()
    const sourceDates = selectedISOList.length > 0 ? selectedISOList : [todayISO]
    const count = Math.min(10, Math.max(1, sourceDates.length))
    fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, notes, count, campaign: campaign && selectedDates.size > 1, sourceDates, grounded: true })
    }).then(r=>r.json()).then(data => {
      const desired = count
      const apiIdeas: { visual:string; copy:string; why?:string }[] = Array.isArray(data?.ideas) ? data.ideas.slice(0, desired) : []
      const filled: { visual:string; copy:string; why?:string }[] = [...apiIdeas]
      const usedConcepts = new Set<string>()
      while (filled.length < desired) {
        filled.push(generateIdea(profile, notes, true, platform, 'normal', usedConcepts, desired))
      }
      const ideasToAdd: IdeaCard[] = filled.map((g, idx) => {
        const iso = sourceDates[idx % sourceDates.length]
        return { id: generateId(), visual: g.visual, copy: g.copy, why: g.why || 'AI-generated recommendation', platform, proposedDate: iso, accepted: false }
      })
      setIdeas(prev => [...prev, ...ideasToAdd])
      setSelectedDates(new Set())
      // Ensure the generating moment is seen for at least ~4000ms
      const remaining = Math.max(0, 4000 - (Date.now() - startTime))
      setTimeout(() => {
        setIsGenerating(false)
        setGeneratingText('Brainstorming!')
      }, remaining)
    }).catch(() => {
      const usedConcepts = new Set<string>()
      const ideasFallback: IdeaCard[] = sourceDates.slice(0, count).map((iso) => {
        const g = generateIdea(profile, notes, true, platform, 'normal', usedConcepts, count)
        return { id: generateId(), visual: g.visual, copy: g.copy, why: g.why, platform, proposedDate: iso, accepted: false }
      })
      setIdeas(prev => [...prev, ...ideasFallback])
      setSelectedDates(new Set())
      const remaining = Math.max(0, 4000 - (Date.now() - startTime))
      setTimeout(() => {
        setIsGenerating(false)
        setGeneratingText('Brainstorming!')
      }, remaining)
    })
  }, [selectedDates, todayISO, profile, notes, platform, ideas, campaign])
  const handleRegenerateOne = useCallback(async (id: string, complexity: 'simple' | 'normal' | 'grand' = 'normal') => { 
    const idea = ideas.find(it => it.id === id)
    const iso = idea?.proposedDate || todayISO
    try {
      const resp = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, notes, count: 1, campaign: campaign && selectedDates.size > 1, sourceDates: [iso], grounded: true, complexity })
      })
      const data = await resp.json()
       const g = (Array.isArray(data?.ideas) && data.ideas[0]) || generateIdea(profile, notes, true, platform, complexity, new Set(), 1)
      setIdeas(prev => prev.map(it => it.id===id ? { ...it, visual: g.visual, copy: g.copy, why: g.why || 'AI-generated recommendation' } : it))
    } catch {
      const g = generateIdea(profile, notes, true, platform, complexity, new Set(), 1)
      setIdeas(prev => prev.map(it => it.id===id ? { ...it, visual: g.visual, copy: g.copy, why: g.why } : it))
    }
  }, [ideas, profile, notes, campaign, selectedDates, todayISO, platform])

  const handleSimplifyIdea = useCallback((id: string) => {
    handleRegenerateOne(id, 'simple')
  }, [handleRegenerateOne])

  const handleAmplifyIdea = useCallback((id: string) => {
    handleRegenerateOne(id, 'grand')
  }, [handleRegenerateOne])
  
  const handleAssign = useCallback((id: string, iso: string) => { 
    setIdeas(prev => prev.map(it => it.id===id ? { ...it, assignedDate: iso } : it)) 
  }, [])

  // optimize temporarily disabled
  async function handleEmailSchedule() {
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

  // Swipe disabled

  // Swipe handlers disabled

  // no-op

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

  // Handle user login
  const handleLogin = useCallback(async () => {
    setLoginError('')
    
    // Validation
    if (!loginForm.email.trim()) {
      setLoginError('Email is required')
      return
    }
    if (!loginForm.password) {
      setLoginError('Password is required')
      return
    }

    setIsLoggingIn(true)
    
    try {
      console.log('Attempting to login user:', loginForm.email)
      const result = await userAPI.login(
        loginForm.email.trim(),
        loginForm.password
      )
      
      console.log('Login result:', result)
      
      if (result.success) {
        console.log('Login successful, setting user and navigating to home')
        setCurrentUser(result.user)
        // Load user's brand profile
        const profileResult = await brandAPI.getProfile(result.user.id)
        if (profileResult.success) {
          setProfile(profileResult.profile)
        }
        setScreen('home')
      } else {
        console.log('Login failed:', result.error)
        setLoginError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login network error:', error)
      setLoginError('Network error. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }, [loginForm])

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
            <div className="settings-header"><span className="settings-icon">👤</span><span className="settings-title">Account Information</span></div>
            <div className="divider" />
            <div className="stack">
              <div className="section">Personal Details</div>
              <label className="inline">Full Name <input placeholder="Your full name" value="John Smith" /></label>
              <label className="inline">Email <input placeholder="name@company.com" value="john@company.com" /></label>
              
              
              
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
              <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
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
              <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
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
              <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
            </button>
            <span />
          </div>
          <div className="card settings">
            <div className="settings-header"><span className="settings-icon">❓</span><span className="settings-title">Help & Support</span></div>
            <div className="divider" />
            <div className="stack">
              <button className="ghost" style={{justifySelf: 'start'}}>📚 Help Center</button>

              <button className="ghost" style={{justifySelf: 'start'}}>📖 User Guide</button>

              <div className="section">Contact</div>
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
              <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
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

            <button className="logout-row" type="button" onClick={() => {
              console.log('Logging out user')
              auth.logout()
              setCurrentUser(null)
              setProfile({ brandName:'', yearFounded:'', industry:'', audience:'', tone:'', hasPhotography:false, hasVideo:false, hasDesign:false, companyDescription:'', brandCulture:'', contentGoals:'' })
              setLoginForm({ email: '', password: '' })
              setLoginError('')
              setScreen('login')
            }}>
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
      <div className="screen login-screen">
        <div className="frame">
          <div className="login-logo">
            <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
          </div>
          <div className="login-card">
            <h2 className="title">Start Building!</h2>
            <div className="stack">
              <input 
                placeholder="Email" 
                type="email"
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})}
              />
              <input 
                placeholder="Password" 
                type="password"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              />
              
              {loginError && (
                <div className="error-message" style={{color: '#ef4444', fontSize: '14px', textAlign: 'center'}}>
                  {loginError}
                </div>
              )}
              
              <div className="row split">
                <button className="ghost" onClick={() => setScreen('register')}>Create account</button>
                <button 
                  className="primary" 
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? 'Logging in...' : 'Log in'}
                </button>
              </div>
              <button className="text" type="button">Having issues logging in?</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'register') {
    return (
      <div className="screen login-screen">
        <div className="frame">
          <div className="login-logo">
            <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
          </div>
          <div className="login-card">
            <h2 className="title">Create Your Account</h2>
            <div className="stack">
              <div className="row split">
                <input 
                  placeholder="First Name" 
                  value={registerForm.firstName}
                  onChange={e => setRegisterForm({...registerForm, firstName: e.target.value})}
                />
                <input 
                  placeholder="Last Name" 
                  value={registerForm.lastName}
                  onChange={e => setRegisterForm({...registerForm, lastName: e.target.value})}
                />
              </div>
              <input 
                placeholder="Email" 
                type="email"
                value={registerForm.email}
                onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
              />
              <input 
                placeholder="Password" 
                type="password"
                value={registerForm.password}
                onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
              />
              <input 
                placeholder="Confirm Password" 
                type="password"
                value={registerForm.confirmPassword}
                onChange={e => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
              />
              
              {registerError && (
                <div className="error-message" style={{color: '#ef4444', fontSize: '14px', textAlign: 'center'}}>
                  {registerError}
                </div>
              )}
              
              <div className="row split">
                <button className="ghost" onClick={() => setScreen('login')}>Back to Login</button>
                <button 
                  className="primary" 
                  onClick={handleRegister}
                  disabled={isRegistering}
                >
                  {isRegistering ? 'Creating...' : 'Create Account'}
                </button>
              </div>
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
              <img src={`${import.meta.env.BASE_URL}header-logo.png`} alt="Header logo" className="brand-logo" />
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
            <div className="profile-subtitle">Tell us about your brand and goals! The more material, the better the build!</div>
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

              <button className="primary update-btn" onClick={async () => { 
                if (currentUser) {
                  const result = await brandAPI.saveProfile(currentUser.id, profile)
                  if (result.success) {
                    localStorage.setItem(LS_COMPLETED_PROFILE, '1')
                    setScreen('home')
                  } else {
                    alert('Failed to save profile: ' + result.error)
                  }
                } else {
                  localStorage.setItem(LS_COMPLETED_PROFILE, '1')
                  setScreen('home')
                }
              }}>Update</button>
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
            <button className="icon-btn" aria-label="Back" onClick={()=>setScreen('settings')}>←</button>
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
    <div className="screen" onClick={(e)=>{ const el = e.target as HTMLElement; if (!el.closest('.idea, .mini-cal, .scheduled-edit-card, button, input, textarea, select, .schedule-sheet')) { closeAllOpen() } }}>
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
                    const platformCounts = platformCountsByDate[iso] || {}
                    const entries = Object.entries(platformCounts) as [SocialPlatform, number][]
                    const icons = entries.reduce((acc, [, count]) => acc + count, 0)
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
                        {icons > 0 && (
                          <div className={"chip-icons" + (isThree ? " three" : "")} aria-hidden="true">
                            {(isThree ? entries.slice(0,3) : entries).map(([p, count], idx3) => {
                              const posClass = isThree
                                ? (idx3 === 0 ? ' chip-pos-bl' : idx3 === 1 ? ' chip-pos-br' : ' chip-pos-tr')
                                : ''
                              return (
                                <span key={`${iso}-${p}`} className={"chip-icon" + posClass}>
                                  <PlatformIcon platform={p as SocialPlatform} size={12} />
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
                    const platformCounts = platformCountsByDate[d.iso] || {}
                const entries = Object.entries(platformCounts) as [SocialPlatform, number][]
                    const icons = entries.reduce((acc, [, count]) => acc + count, 0)
                const isThree = entries.length >= 3
                    const renderSelected = isSelected
                return (
                  <button
                    key={d.iso}
                        className={'cell' + (renderSelected ? ' selected' : '') + (!renderSelected && isToday ? ' today' : '') + (isPast ? ' past' : '')}
                        disabled={isPast}
                    onClick={() => setSelectedDates(prev => { const next = new Set(prev); if (next.has(d.iso)) { next.delete(d.iso) } else { next.add(d.iso) } return next })}
                  ><span className="day-label">{d.day}<sup className="ord">{ordinalSuffix(d.day)}</sup></span>
                        {icons > 0 && (
                      <div className={"chip-icons" + (isThree ? " three" : "")} aria-hidden="true">
                        {(isThree ? entries.slice(0,3) : entries).map(([p, count], idx3) => {
                          const posClass = isThree
                            ? (idx3 === 0 ? ' chip-pos-bl' : idx3 === 1 ? ' chip-pos-br' : ' chip-pos-tr')
                            : ''
                          return (
                            <span key={`${d.iso}-${p}`} className={"chip-icon" + posClass}>
                                  <PlatformIcon platform={p as SocialPlatform} size={12} />
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
                                <div key={`${it.id}-${iso}`} className="scheduled-item-wrapper">
                                  <span className="scheduled-time">12:00</span>
                                  {editingScheduledItem === it.id ? (
                                    // Full expanded edit mode - like regular idea card
                                    <div className="scheduled-edit-card">
                                      <div className="idea-header">
                                        <button 
                                          className="close-card-btn" 
                                          aria-label="Close card" 
                                          onClick={() => setEditingScheduledItem(null)}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"/>
                                            <line x1="6" y1="6" x2="18" y2="18"/>
                                          </svg>
                                </button>
                                        <button 
                                          className="regen-btn" 
                                          aria-label="Regenerate"
                                          onClick={() => handleRegenerateOne(it.id)}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="23 4 23 10 17 10"/>
                                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                                          </svg>
                                </button>
                                        <div className="idea-platform-wrap">
                                          <PlatformIcon platform={p as SocialPlatform} size={20} />
                                        </div>
                                        <button 
                                          className="accept-btn" 
                                          aria-label="Save changes"
                                          onClick={() => setEditingScheduledItem(null)}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                          </svg>
                                        </button>
                                        <button 
                                          className="icon-btn trash-btn" 
                                          aria-label="Delete"
                                          onClick={() => setIdeas(prev => prev.filter(i => i.id !== it.id))}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"/>
                                            <line x1="10" y1="11" x2="10" y2="17"/>
                                            <line x1="14" y1="11" x2="14" y2="17"/>
                                          </svg>
                                        </button>
                                      </div>
                                      <div className="idea-box">
                                        <textarea 
                                          className="idea-text" 
                                          defaultValue={it.visual}
                                          placeholder="Visual description..."
                                        />
                                        <textarea 
                                          className="idea-text" 
                                          defaultValue={it.copy}
                                          placeholder="Copy text..."
                                        />
                                      </div>
                                      <div className="idea-footer">
                                        <div className="idea-why">
                                          <strong>Why this works:</strong> {it.why}
                                        </div>
                                        <div className="idea-actions">
                                          <button 
                                            className="schedule-btn"
                                            onClick={() => {
                                              const selectedISOList = Array.from(selectedDates).sort()
                                              const pool = selectedISOList.length === 0 ? [todayISO] : selectedISOList
                                              const used = new Set(ideas.filter(i=>i.id!==it.id && i.assignedDate).map(i=>i.assignedDate as string))
                                              const chosen = pool.find(iso => !used.has(iso)) || pool[0]
                                              setIdeas(prev => prev.map(i => i.id===it.id ? { ...i, assignedDate: chosen, accepted: true, platform } : i))
                                              setEditingScheduledItem(null)
                                            }}
                                          >
                                            Reschedule
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    // Collapsed view
                                    <div className="scheduled-item-compact" data-platform={p}>
                                      <div className="si-icon">
                                        <PlatformIcon platform={p as SocialPlatform} size={14} />
                                      </div>
                                      <div className="si-content">
                                        <div className="si-field">
                                          <span className="si-label">Visuals:</span>
                                          <span className="si-text">{it.visual.slice(0, 25)}{it.visual.length > 25 ? '…' : ''}</span>
                                        </div>
                                        <div className="si-field">
                                          <span className="si-label">Copy:</span>
                                          <span className="si-text">{it.copy.slice(0, 25)}{it.copy.length > 25 ? '…' : ''}</span>
                                        </div>
                                      </div>
                                      <div className="si-actions">
                                        <button 
                                          className="icon-btn edit-btn" 
                                          aria-label="Edit"
                                          onClick={() => setEditingScheduledItem(it.id)}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                          </svg>
                                        </button>
                                        <button 
                                          className="icon-btn trash-btn" 
                                          aria-label="Delete"
                                          onClick={() => setIdeas(prev => prev.filter(i => i.id !== it.id))}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6"/>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                            <line x1="10" y1="11" x2="10" y2="17"/>
                                            <line x1="14" y1="11" x2="14" y2="17"/>
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
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
      {(selectedDates.size === 0 && visibleIdeas.length === 0) && (
        <div className="generator-floating">
          <button className={"generator-toggle" + (isGenerating ? " generating" : "")} onClick={handleGenerate} disabled={isGenerating}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
            {isGenerating ? generatingText : 'Create'}
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
              <button className={"generator-toggle" + (isGenerating ? " generating" : "")} onClick={handleGenerate} style={{ flex: 1 }} disabled={isGenerating}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
                </svg>
                {isGenerating ? generatingText : 'Create'}
                  </button>
                </div>
              </div>
            </div>
      )}

      {/* Ideas section */}
      {visibleIdeas.length > 0 && (
        <div className={"ideas-overlay" + (visibleIdeas.length === 1 ? " single" : "") + (visibleIdeas.length >= 3 ? " crowded" : "")} onClick={(e)=>{ if (e.currentTarget === e.target) { setIdeas([]) } }}>
          <div className="ideas card">
            {visibleIdeas.length===0 ? <div className="muted">No ideas yet.</div> : (
              <div className="idea-list">
                {visibleIdeas.map((it) => (
                  <div
                    key={it.id}
                    data-card-id={it.id}
                    className={`idea${explodingCards.has(it.id) ? ' exploding' : ''}`}
                    style={{ zIndex: openCalendarFor === it.id ? 999999 : 'auto' }}
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
                        </div>
                      </div>
                      <div className="idea-platform-wrap" aria-label="Platform icon">
                        <PlatformIcon platform={it.platform || platform} size={18} />
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
                      <div className="actions-left">
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
                      </div>

                       {/* Centered regenerate controls */}
                       <div className="actions-center">
                         <button className="icon-btn ghost simplify-btn" aria-label="Simplify idea" title="Make it simpler" onClick={()=>handleSimplifyIdea(it.id)}>
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <line x1="5" y1="12" x2="19" y2="12"/>
                           </svg>
                         </button>
                        <button className="icon-btn ghost regen-btn" aria-label="Regenerate" onClick={()=>handleRegenerateOne(it.id)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0 0 20.49 15"/></svg>
                        </button>
                         <button className="icon-btn ghost amplify-btn" aria-label="Amplify idea" title="Make it bigger" onClick={()=>handleAmplifyIdea(it.id)}>
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <line x1="12" y1="5" x2="12" y2="19"/>
                             <line x1="5" y1="12" x2="19" y2="12"/>
                           </svg>
                         </button>
                       </div>

                      <div className="actions-right">
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
