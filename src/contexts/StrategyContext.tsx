import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StrategyPlan, LineItem, MonthlyBreakdown, StrategyCalculations, BudgetValidation } from '@/types/strategy';
import { strategyStorage } from '@/lib/strategyStorage';
import { toast } from 'sonner';

interface StrategyContextType {
  // Current strategy being edited
  currentStrategy: StrategyPlan | null;
  setCurrentStrategy: (strategy: StrategyPlan | null) => void;

  // All strategies list
  strategies: StrategyPlan[];
  refreshStrategies: () => void;

  // Strategy CRUD operations
  createNewStrategy: (strategy: Omit<StrategyPlan, 'id' | 'createdAt' | 'updatedAt'>) => StrategyPlan;
  updateCurrentStrategy: (updates: Partial<Omit<StrategyPlan, 'id' | 'createdAt'>>) => void;
  deleteStrategy: (id: string) => void;
  duplicateStrategy: (id: string, newName?: string) => void;
  loadStrategy: (id: string) => void;

  // Line item operations
  addLineItem: (lineItem: Omit<LineItem, 'id'>) => void;
  updateLineItem: (id: string, updates: Partial<LineItem>) => void;
  deleteLineItem: (id: string) => void;
  duplicateLineItem: (id: string) => void;

  // Monthly breakdown operations
  addMonthlyBreakdown: (breakdown: Omit<MonthlyBreakdown, 'id'>) => void;
  updateMonthlyBreakdown: (id: string, updates: Partial<MonthlyBreakdown>) => void;
  deleteMonthlyBreakdown: (id: string) => void;

  // Calculations and validations
  calculations: StrategyCalculations;
  budgetValidation: BudgetValidation;

  // Auto-save toggle
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export const useStrategy = () => {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error('useStrategy must be used within StrategyProvider');
  }
  return context;
};

export const StrategyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStrategy, setCurrentStrategyState] = useState<StrategyPlan | null>(null);
  const [strategies, setStrategies] = useState<StrategyPlan[]>([]);
  const [autoSave, setAutoSave] = useState(true);

  // Load strategies on mount
  useEffect(() => {
    refreshStrategies();

    // Load current strategy if one was being edited
    const currentId = strategyStorage.getCurrentStrategyId();
    if (currentId) {
      const strategy = strategyStorage.getStrategy(currentId);
      if (strategy) {
        setCurrentStrategyState(strategy);
      }
    }
  }, []);

  // Auto-save when current strategy changes
  useEffect(() => {
    if (autoSave && currentStrategy && currentStrategy.id) {
      const timeoutId = setTimeout(() => {
        strategyStorage.updateStrategy(currentStrategy.id, currentStrategy);
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [currentStrategy, autoSave]);

  const refreshStrategies = useCallback(() => {
    const allStrategies = strategyStorage.getAllStrategies();
    setStrategies(allStrategies);
  }, []);

  const setCurrentStrategy = useCallback((strategy: StrategyPlan | null) => {
    setCurrentStrategyState(strategy);
    if (strategy) {
      strategyStorage.setCurrentStrategyId(strategy.id);
    } else {
      strategyStorage.setCurrentStrategyId(null);
    }
  }, []);

  const createNewStrategy = useCallback((strategy: Omit<StrategyPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newStrategy = strategyStorage.createStrategy(strategy);
    refreshStrategies();
    setCurrentStrategy(newStrategy);
    toast.success('Strategy created successfully');
    return newStrategy;
  }, [refreshStrategies, setCurrentStrategy]);

  const updateCurrentStrategy = useCallback((updates: Partial<Omit<StrategyPlan, 'id' | 'createdAt'>>) => {
    if (!currentStrategy) return;

    const updated = { ...currentStrategy, ...updates };
    setCurrentStrategyState(updated);

    if (!autoSave) {
      // Manual save
      strategyStorage.updateStrategy(currentStrategy.id, updates);
      refreshStrategies();
    }
  }, [currentStrategy, autoSave, refreshStrategies]);

  const deleteStrategy = useCallback((id: string) => {
    strategyStorage.deleteStrategy(id);
    if (currentStrategy?.id === id) {
      setCurrentStrategy(null);
    }
    refreshStrategies();
    toast.success('Strategy deleted');
  }, [currentStrategy, setCurrentStrategy, refreshStrategies]);

  const duplicateStrategy = useCallback((id: string, newName?: string) => {
    const duplicated = strategyStorage.duplicateStrategy(id, newName);
    if (duplicated) {
      refreshStrategies();
      setCurrentStrategy(duplicated);
      toast.success('Strategy duplicated');
    }
  }, [refreshStrategies, setCurrentStrategy]);

  const loadStrategy = useCallback((id: string) => {
    const strategy = strategyStorage.getStrategy(id);
    if (strategy) {
      setCurrentStrategy(strategy);
    }
  }, [setCurrentStrategy]);

  // Line item operations
  const addLineItem = useCallback((lineItem: Omit<LineItem, 'id'>) => {
    if (!currentStrategy) return;

    const newLineItem: LineItem = {
      ...lineItem,
      id: crypto.randomUUID(),
    };

    updateCurrentStrategy({
      lineItems: [...currentStrategy.lineItems, newLineItem],
    });
  }, [currentStrategy, updateCurrentStrategy]);

  const updateLineItem = useCallback((id: string, updates: Partial<LineItem>) => {
    if (!currentStrategy) return;

    const updatedLineItems = currentStrategy.lineItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );

    updateCurrentStrategy({ lineItems: updatedLineItems });
  }, [currentStrategy, updateCurrentStrategy]);

  const deleteLineItem = useCallback((id: string) => {
    if (!currentStrategy) return;

    const filteredLineItems = currentStrategy.lineItems.filter(item => item.id !== id);

    // If there are remaining line items, redistribute budget and impressions evenly
    if (filteredLineItems.length > 0) {
      const totalBudget = currentStrategy.clientBudget;
      const totalImpressions = currentStrategy.impressionGoal;
      const evenBudget = totalBudget / filteredLineItems.length;
      const evenImpressions = Math.round(totalImpressions / filteredLineItems.length);
      const rpm = totalBudget > 0 && totalImpressions > 0 ? (totalBudget / totalImpressions) * 1000 : 0;

      const updatedLineItems = filteredLineItems.map(lineItem => ({
        ...lineItem,
        clientBudget: evenBudget,
        impressions: evenImpressions,
        rpm: rpm,
        dspSpend: (evenImpressions / 1000) * lineItem.dspBid,
      }));

      updateCurrentStrategy({ lineItems: updatedLineItems });
    } else {
      updateCurrentStrategy({ lineItems: filteredLineItems });
    }
  }, [currentStrategy, updateCurrentStrategy]);

  const duplicateLineItem = useCallback((id: string) => {
    if (!currentStrategy) return;

    const item = currentStrategy.lineItems.find(i => i.id === id);
    if (!item) return;

    const newLineItemCount = currentStrategy.lineItems.length + 1;
    const totalBudget = currentStrategy.clientBudget;
    const totalImpressions = currentStrategy.impressionGoal;
    const evenBudget = totalBudget / newLineItemCount;
    const evenImpressions = Math.round(totalImpressions / newLineItemCount);
    const rpm = totalBudget > 0 && totalImpressions > 0 ? (totalBudget / totalImpressions) * 1000 : 0;

    // Update all existing line items with even distribution
    const updatedLineItems = currentStrategy.lineItems.map(lineItem => ({
      ...lineItem,
      clientBudget: evenBudget,
      impressions: evenImpressions,
      rpm: rpm,
      dspSpend: (evenImpressions / 1000) * lineItem.dspBid,
    }));

    // Create the duplicated line item
    const duplicated: LineItem = {
      ...item,
      id: crypto.randomUUID(),
      campaignName: `${item.campaignName} (Copy)`,
      clientBudget: evenBudget,
      impressions: evenImpressions,
      rpm: rpm,
      dspSpend: (evenImpressions / 1000) * item.dspBid,
    };

    updateCurrentStrategy({
      lineItems: [...updatedLineItems, duplicated],
    });
  }, [currentStrategy, updateCurrentStrategy]);

  // Monthly breakdown operations
  const addMonthlyBreakdown = useCallback((breakdown: Omit<MonthlyBreakdown, 'id'>) => {
    if (!currentStrategy) return;

    const newBreakdown: MonthlyBreakdown = {
      ...breakdown,
      id: crypto.randomUUID(),
    };

    updateCurrentStrategy({
      monthlyBreakdowns: [...currentStrategy.monthlyBreakdowns, newBreakdown],
    });
  }, [currentStrategy, updateCurrentStrategy]);

  const updateMonthlyBreakdown = useCallback((id: string, updates: Partial<MonthlyBreakdown>) => {
    if (!currentStrategy) return;

    const updatedBreakdowns = currentStrategy.monthlyBreakdowns.map(bd =>
      bd.id === id ? { ...bd, ...updates } : bd
    );

    updateCurrentStrategy({ monthlyBreakdowns: updatedBreakdowns });
  }, [currentStrategy, updateCurrentStrategy]);

  const deleteMonthlyBreakdown = useCallback((id: string) => {
    if (!currentStrategy) return;

    const filteredBreakdowns = currentStrategy.monthlyBreakdowns.filter(bd => bd.id !== id);
    updateCurrentStrategy({ monthlyBreakdowns: filteredBreakdowns });
  }, [currentStrategy, updateCurrentStrategy]);

  // Calculate totals and metrics
  const calculations: StrategyCalculations = React.useMemo(() => {
    if (!currentStrategy) {
      return {
        totalImpressions: 0,
        totalClientBudget: 0,
        totalDspSpend: 0,
        totalProfit: 0,
        averageRpm: 0,
        profitMarginPercentage: 0,
      };
    }

    const totalImpressions = currentStrategy.lineItems.reduce((sum, item) => sum + item.impressions, 0);
    const totalClientBudget = currentStrategy.lineItems.reduce((sum, item) => sum + item.clientBudget, 0);
    const totalDspSpend = currentStrategy.lineItems.reduce((sum, item) => sum + item.dspSpend, 0);
    const totalProfit = totalClientBudget - totalDspSpend;
    const averageRpm = totalImpressions > 0 ? (totalClientBudget / totalImpressions) * 1000 : 0;
    const profitMarginPercentage = totalClientBudget > 0 ? (totalProfit / totalClientBudget) * 100 : 0;

    return {
      totalImpressions,
      totalClientBudget,
      totalDspSpend,
      totalProfit,
      averageRpm,
      profitMarginPercentage,
    };
  }, [currentStrategy]);

  // Validate budget allocation
  const budgetValidation: BudgetValidation = React.useMemo(() => {
    if (!currentStrategy) {
      return {
        isValid: true,
        totalLineItemBudget: 0,
        totalClientBudget: 0,
        difference: 0,
        warnings: [],
        errors: [],
      };
    }

    const totalLineItemBudget = calculations.totalClientBudget;
    const totalClientBudget = currentStrategy.clientBudget;
    const difference = totalLineItemBudget - totalClientBudget;
    const warnings: string[] = [];
    const errors: string[] = [];

    if (Math.abs(difference) > 0.01) {
      if (difference > 0) {
        errors.push(`Line items exceed client budget by $${Math.abs(difference).toFixed(2)}`);
      } else {
        warnings.push(`Unallocated budget: $${Math.abs(difference).toFixed(2)}`);
      }
    }

    if (calculations.totalImpressions !== currentStrategy.impressionGoal) {
      const impDiff = calculations.totalImpressions - currentStrategy.impressionGoal;
      if (impDiff !== 0) {
        warnings.push(`Impression allocation differs from goal by ${impDiff.toLocaleString()}`);
      }
    }

    return {
      isValid: errors.length === 0,
      totalLineItemBudget,
      totalClientBudget,
      difference,
      warnings,
      errors,
    };
  }, [currentStrategy, calculations]);

  const value: StrategyContextType = {
    currentStrategy,
    setCurrentStrategy,
    strategies,
    refreshStrategies,
    createNewStrategy,
    updateCurrentStrategy,
    deleteStrategy,
    duplicateStrategy,
    loadStrategy,
    addLineItem,
    updateLineItem,
    deleteLineItem,
    duplicateLineItem,
    addMonthlyBreakdown,
    updateMonthlyBreakdown,
    deleteMonthlyBreakdown,
    calculations,
    budgetValidation,
    autoSave,
    setAutoSave,
  };

  return <StrategyContext.Provider value={value}>{children}</StrategyContext.Provider>;
};
