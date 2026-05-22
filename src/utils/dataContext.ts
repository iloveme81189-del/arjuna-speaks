/**
 * Data Context Detector
 * 
 * Analyzes uploaded data (file names, column headers) to determine the
 * business/professional context. Returns contextual icons, colors, and
 * emojis for a richer visual experience.
 */

export interface DataContext {
  /** Primary domain category */
  domain: string;
  /** Display label for the domain */
  label: string;
  /** Emoji representing this domain */
  emoji: string;
  /** Lucide icon name or custom icon key */
  iconKey: string;
  /** Hex color accent for the domain */
  accentColor: string;
  /** Brief description of the detected context */
  description: string;
}

// Comprehensive keyword maps for context detection
const DOMAIN_PATTERNS: { domain: string; label: string; emoji: string; iconKey: string; accentColor: string; keywords: string[]; matchAll?: boolean }[] = [
  // Healthcare & Medical
  {
    domain: 'healthcare',
    label: 'Healthcare',
    emoji: '🏥',
    iconKey: 'heart-pulse',
    accentColor: '#DC2626',
    keywords: [
      'doctor', 'patient', 'hospital', 'clinic', 'medical', 'health', 'nurse',
      'diagnosis', 'treatment', 'prescription', 'medicine', 'pharmacy',
      'surgery', 'appointment', 'physician', 'clinical', 'symptom',
      'vaccine', 'immunization', 'lab', 'test result', 'blood', 'heart rate',
      'bp', 'blood pressure', 'bmi', 'temperature', 'weight', 'height',
      'department', 'specialty', 'ward', 'bed', 'discharge', 'admission',
      'insurance', 'claim', 'coverage', 'provider', 'medication', 'dosage',
      'emergency', 'icu', 'operation', 'referral', 'consultation',
      'arjuna', 'ayurveda', 'ayurvedic', 'herbal', 'wellness',
    ],
  },
  // Finance & Banking
  {
    domain: 'finance',
    label: 'Finance & Banking',
    emoji: '💰',
    iconKey: 'dollar-sign',
    accentColor: '#059669',
    keywords: [
      'revenue', 'profit', 'loss', 'income', 'expense', 'budget', 'financial',
      'bank', 'account', 'transaction', 'payment', 'invoice', 'tax', 'audit',
      'asset', 'liability', 'equity', 'balance', 'cash', 'flow', 'credit',
      'debit', 'loan', 'interest', 'investment', 'stock', 'bond', 'dividend',
      'portfolio', 'return', 'roi', 'cost', 'price', 'margin', 'markup',
      'salary', 'wage', 'payroll', 'overhead', 'depreciation', 'amortization',
      'net worth', 'valuation', 'forecast', 'projection', 'fund', 'capital',
      'expenditure', 'reimbursement', 'refund', 'charge', 'fee', 'rate',
      'apr', 'apy', 'principal', 'collateral', 'underwriting',
    ],
  },
  // Sales & Retail
  {
    domain: 'sales',
    label: 'Sales & Retail',
    emoji: '🛒',
    iconKey: 'shopping-cart',
    accentColor: '#F59E0B',
    keywords: [
      'sales', 'product', 'customer', 'order', 'purchase', 'checkout',
      'cart', 'inventory', 'stock', 'sku', 'price', 'discount', 'promotion',
      'revenue', 'lead', 'conversion', 'funnel', 'pipeline', 'deal',
      'opportunity', 'quota', 'target', 'commission', 'forecast',
      'wholesale', 'retail', 'distributor', 'vendor', 'supplier',
      'ecommerce', 'online', 'basket', 'abandon', 'return', 'refund',
      'upsell', 'cross-sell', 'lifetime value', 'ltv', 'acquisition',
      'churn', 'retention', 'loyalty', 'membership', 'subscription',
      'store', 'branch', 'outlet', 'register', 'pos', 'terminal',
    ],
  },
  // Human Resources
  {
    domain: 'hr',
    label: 'Human Resources',
    emoji: '👥',
    iconKey: 'users',
    accentColor: '#6366F1',
    keywords: [
      'employee', 'staff', 'hiring', 'recruitment', 'onboarding',
      'attrition', 'turnover', 'attendance', 'leave', 'absent',
      'performance', 'review', 'appraisal', 'promotion', 'compensation',
      'benefit', 'payroll', 'timesheet', 'overtime', 'training',
      'development', 'skill', 'competency', 'job', 'position', 'role',
      'candidate', 'applicant', 'interview', 'offer', 'resignation',
      'termination', 'headcount', 'fte', 'contractor', 'full-time',
      'part-time', 'intern', 'probation', 'tenure', 'seniority',
      'engagement', 'satisfaction', 'survey', 'feedback', 'grievance',
      'diversity', 'inclusion', 'equal opportunity', 'compliance',
    ],
  },
  // Education & Academic
  {
    domain: 'education',
    label: 'Education',
    emoji: '🎓',
    iconKey: 'graduation-cap',
    accentColor: '#8B5CF6',
    keywords: [
      'student', 'teacher', 'professor', 'course', 'class', 'grade',
      'score', 'exam', 'test', 'assignment', 'homework', 'project',
      'attendance', 'enrollment', 'curriculum', 'syllabus', 'lesson',
      'lecture', 'tutorial', 'workshop', 'seminar', 'degree', 'diploma',
      'certification', 'scholarship', 'tuition', 'fee', 'academic',
      'school', 'college', 'university', 'institute', 'academy',
      'gpa', 'cgpa', 'mark', 'percentage', 'rank', 'percentile',
      'discipline', 'department', 'faculty', 'staff', 'administration',
      'library', 'laboratory', 'research', 'publication', 'thesis',
      'semester', 'trimester', 'quarter', 'term', 'year',
    ],
  },
  // Manufacturing & Supply Chain
  {
    domain: 'manufacturing',
    label: 'Manufacturing & Supply Chain',
    emoji: '🏭',
    iconKey: 'factory',
    accentColor: '#0EA5E9',
    keywords: [
      'manufacturing', 'production', 'factory', 'plant', 'assembly',
      'supply chain', 'logistics', 'warehouse', 'inventory', 'material',
      'raw material', 'component', 'batch', 'lot', 'quality', 'inspection',
      'defect', 'rework', 'scrap', 'yield', 'output', 'capacity',
      'machine', 'equipment', 'tool', 'maintenance', 'downtime',
      'order', 'purchase order', 'po', 'shipment', 'dispatch',
      'vendor', 'supplier', 'procurement', 'sourcing', 'lead time',
      'cycle time', 'throughput', 'bottleneck', 'wip', 'work in progress',
      'safety', 'incident', 'accident', 'compliance', 'regulation',
      'standard', 'iso', 'six sigma', 'lean', 'kaizen', 'continuous improvement',
    ],
  },
  // Real Estate & Property
  {
    domain: 'real-estate',
    label: 'Real Estate',
    emoji: '🏢',
    iconKey: 'building-2',
    accentColor: '#F97316',
    keywords: [
      'property', 'real estate', 'apartment', 'house', 'villa', 'flat',
      'condo', 'commercial', 'residential', 'rent', 'lease', 'mortgage',
      'tenant', 'landlord', 'owner', 'buyer', 'seller', 'agent',
      'broker', 'listing', 'inspection', 'appraisal', 'valuation',
      'sq ft', 'square foot', 'acre', 'plot', 'land', 'construction',
      'developer', 'builder', 'contractor', 'architecture', 'design',
      'floor plan', 'blueprint', 'zoning', 'permit', 'approval',
      'amenity', 'facility', 'maintenance', 'repair', 'renovation',
      'hoa', 'association', 'fee', 'deposit', 'security', 'closing',
      'title', 'deed', 'registration', 'tax', 'assessment',
    ],
  },
  // Technology & IT
  {
    domain: 'technology',
    label: 'Technology & IT',
    emoji: '💻',
    iconKey: 'monitor',
    accentColor: '#3B82F6',
    keywords: [
      'software', 'hardware', 'application', 'app', 'system', 'server',
      'network', 'database', 'cloud', 'api', 'microservice', 'deployment',
      'agile', 'sprint', 'backlog', 'story', 'task', 'bug', 'feature',
      'release', 'version', 'code', 'repository', 'commit', 'branch',
      'test', 'qa', 'quality', 'uat', 'production', 'staging',
      'incident', 'ticket', 'support', 'sla', 'resolution', 'escalation',
      'infrastructure', 'security', 'firewall', 'encryption', 'backup',
      'monitoring', 'alert', 'log', 'metric', 'dashboard', 'analytics',
      'bandwidth', 'latency', 'uptime', 'availability', 'performance',
      'license', 'subscription', 'saas', 'paas', 'iaas',
      'cpu', 'memory', 'disk', 'storage', 'compute', 'instance',
    ],
  },
  // Marketing & Advertising
  {
    domain: 'marketing',
    label: 'Marketing & Advertising',
    emoji: '📢',
    iconKey: 'megaphone',
    accentColor: '#EC4899',
    keywords: [
      'marketing', 'advertising', 'campaign', 'promotion', 'brand',
      'social media', 'facebook', 'instagram', 'twitter', 'linkedin',
      'email', 'newsletter', 'subscriber', 'click', 'ctr', 'impression',
      'reach', 'engagement', 'followers', 'audience', 'segment',
      'seo', 'sem', 'ppc', 'cpc', 'cpm', 'cpa', 'roas',
      'content', 'blog', 'video', 'creative', 'design', 'copy',
      'landing page', 'funnel', 'lead gen', 'conversion', 'optimization',
      'ab test', 'split test', 'variant', 'personalization', 'targeting',
      'retargeting', 'remarketing', 'analytics', 'attribution',
      'kpi', 'metric', 'report', 'insight', 'dashboard',
      'organic', 'paid', 'direct', 'referral', 'traffic', 'source',
      'medium', 'channel', 'device', 'mobile', 'desktop', 'tablet',
    ],
  },
  // Hospitality & Tourism
  {
    domain: 'hospitality',
    label: 'Hospitality & Tourism',
    emoji: '🏨',
    iconKey: 'hotel',
    accentColor: '#14B8A6',
    keywords: [
      'hotel', 'resort', 'restaurant', 'cafe', 'bar', 'lounge',
      'guest', 'customer', 'booking', 'reservation', 'check-in',
      'check-out', 'room', 'suite', 'occupancy', 'revenue',
      'table', 'menu', 'order', 'kitchen', 'service', 'dining',
      'tour', 'travel', 'trip', 'flight', 'destination', 'package',
      'guide', 'tourist', 'visitor', 'attraction', 'activity',
      'rating', 'review', 'feedback', 'star', 'score', 'satisfaction',
      'event', 'conference', 'meeting', 'banquet', 'wedding',
      'housekeeping', 'maintenance', 'front desk', 'concierge',
      'amenity', 'facility', 'pool', 'gym', 'spa', 'parking',
    ],
  },
  // Agriculture & Farming
  {
    domain: 'agriculture',
    label: 'Agriculture & Farming',
    emoji: '🌾',
    iconKey: 'sprout',
    accentColor: '#22C55E',
    keywords: [
      'crop', 'harvest', 'yield', 'field', 'farm', 'farmer',
      'irrigation', 'fertilizer', 'pesticide', 'soil', 'seed',
      'plant', 'grow', 'cultivate', 'season', 'weather', 'rainfall',
      'livestock', 'cattle', 'poultry', 'dairy', 'egg', 'meat',
      'organic', 'sustainable', 'green', 'eco', 'environment',
      'supply', 'demand', 'price', 'market', 'commodity', 'trade',
      'acre', 'hectare', 'ton', 'kilogram', 'production', 'storage',
      'cold chain', 'transport', 'distribution', 'export', 'import',
      'subsidy', 'insurance', 'loan', 'credit', 'scheme', 'govt',
      'cooperative', 'farmer group', 'fpo', 'producer', 'processor',
    ],
  },
  // Logistics & Transportation
  {
    domain: 'logistics',
    label: 'Logistics & Transportation',
    emoji: '🚚',
    iconKey: 'truck',
    accentColor: '#F97316',
    keywords: [
      'logistics', 'transport', 'shipping', 'delivery', 'courier',
      'fleet', 'vehicle', 'driver', 'route', 'trip', 'mileage',
      'fuel', 'distance', 'weight', 'volume', 'capacity',
      'warehouse', 'dispatch', 'loading', 'unloading', 'dock',
      'tracking', 'track', 'trace', 'status', 'eta', 'arrival',
      'departure', 'transit', 'consignment', 'freight', 'cargo',
      'container', 'pallet', 'box', 'parcel', 'package', 'envelope',
      'air', 'ocean', 'sea', 'rail', 'road', 'intermodal',
      'customs', 'clearance', 'duty', 'tariff', 'documentation',
      'invoice', 'bill', 'lading', 'boe', 'pod', 'proof',
    ],
  },
  // Energy & Utilities
  {
    domain: 'energy',
    label: 'Energy & Utilities',
    emoji: '⚡',
    iconKey: 'zap',
    accentColor: '#F59E0B',
    keywords: [
      'energy', 'electricity', 'power', 'gas', 'water', 'utility',
      'consumption', 'usage', 'meter', 'reading', 'bill', 'tariff',
      'solar', 'wind', 'renewable', 'green', 'carbon', 'emission',
      'grid', 'load', 'demand', 'supply', 'generation', 'transmission',
      'distribution', 'substation', 'transformer', 'line', 'cable',
      'efficiency', 'savings', 'conservation', 'sustainability',
      'plant', 'station', 'facility', 'maintenance', 'outage',
      'voltage', 'current', 'frequency', 'phase', 'watt', 'kilowatt',
      'mwh', 'kwh', 'unit', 'cost', 'rate', 'peak', 'off-peak',
      'smart meter', 'iot', 'sensor', 'monitoring', 'control',
    ],
  },
  // Legal & Compliance
  {
    domain: 'legal',
    label: 'Legal & Compliance',
    emoji: '⚖️',
    iconKey: 'scale',
    accentColor: '#1E293B',
    keywords: [
      'legal', 'law', 'attorney', 'lawyer', 'counsel', 'court',
      'case', 'litigation', 'dispute', 'settlement', 'judgment',
      'contract', 'agreement', 'clause', 'term', 'condition',
      'compliance', 'regulation', 'policy', 'statute', 'ordinance',
      'license', 'permit', 'certification', 'registration',
      'audit', 'review', 'investigation', 'inquiry', 'hearing',
      'plaintiff', 'defendant', 'petitioner', 'respondent',
      'patent', 'trademark', 'copyright', 'intellectual property',
      'non-disclosure', 'nda', 'confidentiality', 'privacy',
      'arbitration', 'mediation', 'negotiation', 'resolution',
      'damage', 'remedy', 'injunction', 'appeal', 'verdict',
    ],
  },
  // Sports & Fitness
  {
    domain: 'sports',
    label: 'Sports & Fitness',
    emoji: '🏀',
    iconKey: 'trophy',
    accentColor: '#0EA5E9',
    keywords: [
      'sport', 'player', 'team', 'match', 'game', 'tournament',
      'score', 'goal', 'point', 'win', 'loss', 'draw', 'tie',
      'championship', 'league', 'season', 'training', 'practice',
      'coach', 'captain', 'referee', 'umpire', 'official',
      'stadium', 'arena', 'field', 'court', 'track', 'pool',
      'fitness', 'gym', 'exercise', 'workout', 'gym', 'yoga',
      'medal', 'record', 'ranking', 'standing', 'division',
      'athlete', 'competitor', 'opponent', 'champion', 'title',
      'football', 'cricket', 'tennis', 'basketball', 'baseball',
      'hockey', 'rugby', 'golf', 'swimming', 'running', 'cycling',
    ],
  },
  // Government & Public Sector
  {
    domain: 'government',
    label: 'Government & Public Sector',
    emoji: '🏛️',
    iconKey: 'landmark',
    accentColor: '#475569',
    keywords: [
      'government', 'public', 'policy', 'scheme', 'program',
      'ministry', 'department', 'office', 'bureau', 'agency',
      'budget', 'grant', 'subsidy', 'funding', 'allocation',
      'tax', 'revenue', 'expenditure', 'deficit', 'surplus',
      'election', 'vote', 'candidate', 'party', 'constituency',
      'citizen', 'resident', 'population', 'census', 'demographic',
      'welfare', 'social', 'health', 'education', 'infrastructure',
      'development', 'project', 'scheme', 'initiative', 'mission',
      'regulation', 'compliance', 'audit', 'oversight', 'report',
      'fiscal', 'monetary', 'economic', 'growth', 'inflation',
      'gdp', 'gnp', 'index', 'indicator', 'statistics', 'data',
    ],
  },
];

/**
 * Detect the most likely data context from file name and column headers
 */
export function detectDataContext(fileName: string, headers: string[]): DataContext {
  const lowerFileName = fileName.toLowerCase();
  const lowerHeaders = headers.map(h => h.toLowerCase());

  const scores: { domain: string; score: number }[] = [];

  for (const domain of DOMAIN_PATTERNS) {
    let score = 0;

    // Score from file name
    for (const kw of domain.keywords) {
      if (lowerFileName.includes(kw)) {
        score += 5; // Higher weight for file name match
      }
    }

    // Score from column headers
    for (const header of lowerHeaders) {
      for (const kw of domain.keywords) {
        if (header.includes(kw)) {
          score += 3; // Medium weight for column matches
        }
      }
    }

    if (score > 0) {
      scores.push({ domain: domain.domain, score });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // If no context detected, return general
  if (scores.length === 0) {
    return {
      domain: 'general',
      label: 'General Data',
      emoji: '📊',
      iconKey: 'database',
      accentColor: '#3B82F6',
      description: 'Business data analysis',
    };
  }

  const topDomain = scores[0];
  const topPattern = DOMAIN_PATTERNS.find(d => d.domain === topDomain.domain)!;

  return {
    domain: topPattern.domain,
    label: topPattern.label,
    emoji: topPattern.emoji,
    iconKey: topPattern.iconKey,
    accentColor: topPattern.accentColor,
    description: `${topPattern.label} — ${scores.length > 1 ? `Also detected: ${scores.slice(1, 3).map(s => DOMAIN_PATTERNS.find(d => d.domain === s.domain)?.label).join(', ')}` : 'Data analysis and visualization'}`,
  };
}

/**
 * Get an appropriate emoji for a given metric based on its title and data context
 */
export function getMetricEmoji(metricTitle: string, contextDomain: string): string {
  const title = metricTitle.toLowerCase();

  // Domain-specific emoji overrides
  const domainEmojis: Record<string, Record<string, string>> = {
    healthcare: {
      patient: '👤',
      doctor: '👨‍⚕️',
      appointment: '📅',
      treatment: '💊',
      surgery: '🔪',
      diagnosis: '🔍',
      revenue: '💰',
      satisfaction: '⭐',
      wait: '⏱️',
      bed: '🛏️',
      emergency: '🚨',
      discharge: '✅',
      admission: '📋',
      insurance: '🛡️',
      claim: '📄',
    },
    finance: {
      revenue: '💰',
      profit: '📈',
      cost: '📉',
      expense: '💸',
      asset: '🏦',
      liability: '📋',
      cash: '💵',
      tax: '🧾',
      investment: '📊',
      return: '🎯',
      budget: '📋',
      income: '💵',
      loan: '🏦',
      interest: '📈',
    },
    sales: {
      customer: '👤',
      order: '📦',
      product: '🏷️',
      cart: '🛒',
      revenue: '💰',
      conversion: '🎯',
      lead: '🎯',
      target: '🎯',
      discount: '🏷️',
      return: '🔄',
      satisfaction: '⭐',
      pipeline: '🔵',
    },
    hr: {
      employee: '👤',
      hiring: '👋',
      attrition: '🚪',
      salary: '💰',
      performance: '⭐',
      attendance: '📋',
      leave: '🏖️',
      training: '📚',
      promotion: '⬆️',
      satisfaction: '😊',
    },
    education: {
      student: '👨‍🎓',
      score: '📝',
      grade: '⭐',
      attendance: '📋',
      enrollment: '📊',
      fee: '💰',
      teacher: '👨‍🏫',
      rank: '🏆',
      pass: '✅',
      fail: '❌',
    },
  };

  // Generic metric emojis
  const genericEmojis: Record<string, string> = {
    total: '📊',
    count: '🔢',
    sum: '➕',
    average: '📐',
    min: '⬇️',
    max: '⬆️',
    rate: '📈',
    growth: '📈',
    trend: '📈',
    change: '🔄',
    ratio: '⚖️',
    percentage: '%',
    score: '⭐',
    index: '📊',
    kpi: '🎯',
    target: '🎯',
    goal: '🎯',
    threshold: '⚠️',
    status: '🔵',
    flag: '🚩',
  };

  // Check domain-specific emojis first
  if (domainEmojis[contextDomain]) {
    for (const [key, emoji] of Object.entries(domainEmojis[contextDomain])) {
      if (title.includes(key)) return emoji;
    }
  }

  // Check generic emojis
  for (const [key, emoji] of Object.entries(genericEmojis)) {
    if (title.includes(key)) return emoji;
  }

  return '📊';
}
