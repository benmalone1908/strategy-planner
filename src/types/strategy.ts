// Strategy Planner Type Definitions

export interface LineItem {
  id: string;
  channel?: string;    // Display, Native, Video, CTV, DOOH
  billingCategory?: string; // CPM, Auction+
  tactic?: string;     // Conquesting, Prospecting, Retargeting, Event Targeting
  targeting?: string;  // Audience targeting (e.g., "Geospatial: Dispensary Visitors" or "Demographic: Baby Boomers (Male)")
  channelPartner: string;
  brandAdvertiser: string;
  ioNumber: string;
  campaignName: string;
  description?: string;
  impressions: number;
  rpm: number;
  clientBudget: number;
  dspBid: number;
  dspSpend: number;
  flightStart: string; // ISO date string
  flightEnd: string;   // ISO date string
  ioFile?: string;     // Optional reference to IO file
  budgetTracker?: string; // Optional reference to budget tracker doc
  order?: number;      // For sorting/ordering
}

export interface MonthlyBreakdown {
  id: string;
  monthYear: string;        // e.g., "2025-10", "2025-11", "2025-12"
  impressionsAllocation: number;
  rpmTarget: number;
  clientBudgetAllocation: number;
  dspBidAllocation: number;
  dspSpendAllocation: number;
  profitMargin: number;     // Auto-calculated
  order: number;            // For sorting months
}

export interface StrategyPlan {
  id: string;
  name: string;             // Strategy/Campaign name
  agencyName?: string;      // Agency/Channel Partner name
  clientName: string;       // Client/advertiser name
  channel?: string;         // Display, Native, Video, CTV, DOOH
  billingCategory?: string; // CPM, Auction+
  clientBudget: number;     // Total client budget
  impressionGoal: number;   // Total impression goal
  dspSpend: number;         // Total DSP spend
  profit: number;           // Auto-calculated: clientBudget - dspSpend
  campaignStartDate: string; // ISO date string
  campaignEndDate: string;   // ISO date string
  monthlyBreakdowns: MonthlyBreakdown[];
  lineItems: LineItem[];
  notes?: string;
  ioPdfFile?: string;       // Base64 encoded PDF or file data URL
  ioPdfFileName?: string;   // Original filename
  budgetTrackerUrl?: string; // External budget tracker link
  createdAt: string;
  updatedAt: string;
  templateId?: string;      // Reference to template if created from one
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description?: string;
  defaultDuration: number;  // Duration in months (e.g., 3)
  lineItemTemplate: Omit<LineItem, 'id' | 'flightStart' | 'flightEnd' | 'impressions' | 'clientBudget' | 'dspSpend'>[];
  monthlyBreakdownTemplate: Omit<MonthlyBreakdown, 'id' | 'monthYear'>[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description?: string;
  estimatedReach?: number;
  category?: string;        // e.g., "Cannabis", "Beverage", "Retail"
  createdAt: string;
  updatedAt: string;
}

// Helper type for budget validation
export interface BudgetValidation {
  isValid: boolean;
  totalLineItemBudget: number;
  totalClientBudget: number;
  difference: number;
  warnings: string[];
  errors: string[];
}

// Helper type for calculations
export interface StrategyCalculations {
  totalImpressions: number;
  totalClientBudget: number;
  totalDspSpend: number;
  totalProfit: number;
  averageRpm: number;
  profitMarginPercentage: number;
}
