export const user = {
  name: 'Elena Rodriguez',
  email: 'elena.r@skytrack.com',
  tier: 'Premium Member',
  avatar: 'https://i.pravatar.cc/150?img=47',
}

export const activeAlerts = [
  {
    id: 1,
    origin: 'NYC',
    originFull: 'New York',
    destination: 'LON',
    destinationFull: 'London, United Kingdom',
    dates: 'Oct 12 – Oct 20',
    status: 'active',
    trend: 'down',
    change: -42,
    currentBest: 482,
    currency: 'USD',
    targetPrice: 450,
    // AlertDetail fields
    currentPrice: 482,
    trendLabel: 'Buy Now — Prices dropping',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
    peakPrice: 640,
    lowPrice: 390,
    priceHistory: [
      { day: 'Mar 1', price: 620 },
      { day: 'Mar 4', price: 605 },
      { day: 'Mar 7', price: 640 },
      { day: 'Mar 10', price: 590 },
      { day: 'Mar 13', price: 555 },
      { day: 'Mar 16', price: 510 },
      { day: 'Mar 19', price: 480 },
      { day: 'Mar 22', price: 460 },
      { day: 'Mar 25', price: 482 },
    ],
    alternatives: [
      { id: 1, type: 'airport', label: 'Newark airport', sublabel: 'EWR → LHR', price: 315, savings: 167 },
      { id: 2, type: 'date', label: 'Later departure', sublabel: 'Depart Nov 2', price: 328, savings: 154 },
    ],
    lastCheckedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    origin: 'SFO',
    originFull: 'San Francisco',
    destination: 'TYO',
    destinationFull: 'Tokyo, Japan',
    dates: 'Flexible dates',
    status: 'active',
    trend: 'up',
    change: +115,
    currentBest: 920,
    currency: 'USD',
    targetPrice: 800,
    // AlertDetail fields
    currentPrice: 920,
    trendLabel: 'Prices rising — set a lower target',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
    peakPrice: 980,
    lowPrice: 720,
    priceHistory: [
      { day: 'Mar 1', price: 780 },
      { day: 'Mar 4', price: 800 },
      { day: 'Mar 7', price: 760 },
      { day: 'Mar 10', price: 820 },
      { day: 'Mar 13', price: 855 },
      { day: 'Mar 16', price: 870 },
      { day: 'Mar 19', price: 900 },
      { day: 'Mar 22', price: 910 },
      { day: 'Mar 25', price: 920 },
    ],
    alternatives: [
      { id: 1, type: 'airport', label: 'Oakland airport', sublabel: 'OAK → NRT', price: 840, savings: 80 },
      { id: 2, type: 'date', label: 'Earlier departure', sublabel: 'Depart Oct 15', price: 810, savings: 110 },
    ],
    lastCheckedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
]

export const bestDeals = [
  {
    id: 1,
    destination: 'Paris',
    country: 'France',
    price: 312,
    currency: 'USD',
    discount: 45,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  },
  {
    id: 2,
    destination: 'Kyoto',
    country: 'Japan',
    price: 540,
    currency: 'USD',
    discount: 32,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80',
  },
]

// Generates a plausible 9-point price history for a newly created alert
export function generatePriceHistory(targetPrice) {
  const base = targetPrice * 1.2
  const days = ['Mar 1','Mar 4','Mar 7','Mar 10','Mar 13','Mar 16','Mar 19','Mar 22','Mar 25']
  return days.map((day, i) => ({
    day,
    price: Math.round(base - (base - targetPrice) * (i / (days.length - 1)) + (Math.random() - 0.5) * base * 0.06),
  }))
}

export const notifications = [
  {
    id: 1,
    type: 'price_drop',
    icon: 'trending_down',
    category: 'Price Drop',
    title: 'Price drop for Paris!',
    timestamp: '2m ago',
    dateGroup: 'Today',
    read: false,
    alertId: 1,
    destination: 'Paris',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
    price: 412,
    originalPrice: 580,
    currency: '€',
    airlines: ['AF', 'LH'],
  },
  {
    id: 2,
    type: 'target_reached',
    icon: 'stars',
    category: 'Target Reached',
    title: 'Your target price for Tokyo was reached!',
    timestamp: '1h ago',
    dateGroup: 'Today',
    read: false,
    alertId: 2,
    badge: 'New Low',
    price: 890,
    savings: 210,
    currency: 'USD',
    expiresIn: '4h',
    dates: 'Oct 12 — Oct 24',
  },
  {
    id: 3,
    type: 'flash_sale',
    icon: 'bolt',
    category: 'Limited Time',
    title: 'Flash sale alert!',
    timestamp: '3h ago',
    dateGroup: 'Yesterday',
    read: true,
    description: 'Global partner discount — up to 45% savings',
    promoCode: 'SKY45',
  },
]

export const settings = {
  notifications: {
    push: true,
    whatsapp: true,
    email: false,
  },
  currency: 'USD ($)',
  language: 'English',
  alertFrequency: 'realtime',
  theme: 'system',
  onboardingDone: false,
  sortAlerts: 'newest',
  preferences: {
    cabin: 'Business Class',
    frequentFlyer: 'SkyMiles, OneWorld',
    dietary: 'Vegetarian',
  },
}
