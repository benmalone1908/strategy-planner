import { StrategyPlan, StrategyTemplate, AudienceSegment } from '@/types/strategy';

// LocalStorage keys
const STORAGE_KEYS = {
  STRATEGIES: 'strategy_planner_strategies',
  TEMPLATES: 'strategy_planner_templates',
  SEGMENTS: 'strategy_planner_segments',
  CURRENT_STRATEGY_ID: 'strategy_planner_current_id',
} as const;

// Strategy Plan CRUD operations
export const strategyStorage = {
  // Get all strategies
  getAllStrategies: (): StrategyPlan[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STRATEGIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading strategies:', error);
      return [];
    }
  },

  // Get a single strategy by ID
  getStrategy: (id: string): StrategyPlan | null => {
    const strategies = strategyStorage.getAllStrategies();
    return strategies.find(s => s.id === id) || null;
  },

  // Save a new strategy
  createStrategy: (strategy: Omit<StrategyPlan, 'id' | 'createdAt' | 'updatedAt'>): StrategyPlan => {
    const strategies = strategyStorage.getAllStrategies();
    const newStrategy: StrategyPlan = {
      ...strategy,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    strategies.push(newStrategy);
    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
    return newStrategy;
  },

  // Update an existing strategy
  updateStrategy: (id: string, updates: Partial<Omit<StrategyPlan, 'id' | 'createdAt'>>): StrategyPlan | null => {
    const strategies = strategyStorage.getAllStrategies();
    const index = strategies.findIndex(s => s.id === id);

    if (index === -1) return null;

    strategies[index] = {
      ...strategies[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
    return strategies[index];
  },

  // Delete a strategy
  deleteStrategy: (id: string): boolean => {
    const strategies = strategyStorage.getAllStrategies();
    const filtered = strategies.filter(s => s.id !== id);

    if (filtered.length === strategies.length) return false;

    localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(filtered));

    // Clear current strategy if it was deleted
    const currentId = strategyStorage.getCurrentStrategyId();
    if (currentId === id) {
      strategyStorage.setCurrentStrategyId(null);
    }

    return true;
  },

  // Duplicate a strategy
  duplicateStrategy: (id: string, newName?: string): StrategyPlan | null => {
    const strategy = strategyStorage.getStrategy(id);
    if (!strategy) return null;

    const duplicate = {
      ...strategy,
      name: newName || `${strategy.name} (Copy)`,
    };

    delete (duplicate as Partial<StrategyPlan>).id;
    delete (duplicate as Partial<StrategyPlan>).createdAt;
    delete (duplicate as Partial<StrategyPlan>).updatedAt;

    return strategyStorage.createStrategy(duplicate);
  },

  // Get/Set current strategy ID (for active editing)
  getCurrentStrategyId: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_STRATEGY_ID);
  },

  setCurrentStrategyId: (id: string | null): void => {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_STRATEGY_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STRATEGY_ID);
    }
  },

  // Export all strategies to JSON
  exportStrategies: (): string => {
    const strategies = strategyStorage.getAllStrategies();
    return JSON.stringify(strategies, null, 2);
  },

  // Import strategies from JSON
  importStrategies: (jsonString: string, merge: boolean = false): number => {
    try {
      const imported: StrategyPlan[] = JSON.parse(jsonString);

      if (!Array.isArray(imported)) {
        throw new Error('Invalid format: expected array');
      }

      let strategies = merge ? strategyStorage.getAllStrategies() : [];

      // Add imported strategies with new IDs to avoid conflicts
      imported.forEach(strategy => {
        strategies.push({
          ...strategy,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      localStorage.setItem(STORAGE_KEYS.STRATEGIES, JSON.stringify(strategies));
      return imported.length;
    } catch (error) {
      console.error('Error importing strategies:', error);
      throw error;
    }
  },
};

// Template CRUD operations
export const templateStorage = {
  getAllTemplates: (): StrategyTemplate[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading templates:', error);
      return [];
    }
  },

  getTemplate: (id: string): StrategyTemplate | null => {
    const templates = templateStorage.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  },

  createTemplate: (template: Omit<StrategyTemplate, 'id' | 'createdAt' | 'updatedAt'>): StrategyTemplate => {
    const templates = templateStorage.getAllTemplates();
    const newTemplate: StrategyTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    templates.push(newTemplate);
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return newTemplate;
  },

  updateTemplate: (id: string, updates: Partial<Omit<StrategyTemplate, 'id' | 'createdAt'>>): StrategyTemplate | null => {
    const templates = templateStorage.getAllTemplates();
    const index = templates.findIndex(t => t.id === id);

    if (index === -1) return null;

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    return templates[index];
  },

  deleteTemplate: (id: string): boolean => {
    const templates = templateStorage.getAllTemplates();
    const filtered = templates.filter(t => t.id !== id);

    if (filtered.length === templates.length) return false;

    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(filtered));
    return true;
  },
};

// Audience Segment CRUD operations
export const segmentStorage = {
  getAllSegments: (): AudienceSegment[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SEGMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading segments:', error);
      return [];
    }
  },

  getSegment: (id: string): AudienceSegment | null => {
    const segments = segmentStorage.getAllSegments();
    return segments.find(s => s.id === id) || null;
  },

  createSegment: (segment: Omit<AudienceSegment, 'id' | 'createdAt' | 'updatedAt'>): AudienceSegment => {
    const segments = segmentStorage.getAllSegments();
    const newSegment: AudienceSegment = {
      ...segment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    segments.push(newSegment);
    localStorage.setItem(STORAGE_KEYS.SEGMENTS, JSON.stringify(segments));
    return newSegment;
  },

  updateSegment: (id: string, updates: Partial<Omit<AudienceSegment, 'id' | 'createdAt'>>): AudienceSegment | null => {
    const segments = segmentStorage.getAllSegments();
    const index = segments.findIndex(s => s.id === id);

    if (index === -1) return null;

    segments[index] = {
      ...segments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEYS.SEGMENTS, JSON.stringify(segments));
    return segments[index];
  },

  deleteSegment: (id: string): boolean => {
    const segments = segmentStorage.getAllSegments();
    const filtered = segments.filter(s => s.id !== id);

    if (filtered.length === segments.length) return false;

    localStorage.setItem(STORAGE_KEYS.SEGMENTS, JSON.stringify(filtered));
    return true;
  },
};

// Clear all data (for testing/reset)
export const clearAllStrategyData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};
