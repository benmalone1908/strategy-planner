// Audience Targeting Library

export interface AudienceTarget {
  category: 'Geospatial' | 'Demographic';
  primaryTarget: string;
  secondaryTarget?: string;
}

// Geospatial targeting options
export const geospatialTargets = [
  'Dispensary Visitors',
  'Smoke Shop Visitors',
  'Liquor Store Visitors',
  'Concert Venue Visitors (21+)',
  'Concert Venue Visitors (All Ages)',
];

// Demographic targeting options
export const demographicTargets = [
  'Baby Boomers',
  'Gen X',
  'Millenial',
  'Xennial',
];

// Secondary targeting for demographics
export const demographicSecondaryTargets = [
  'Male',
  'Female',
  'All',
];

// Default audience targeting library
export const defaultAudienceLibrary: AudienceTarget[] = [
  // Geospatial targets (no secondary targeting)
  { category: 'Geospatial', primaryTarget: 'Dispensary Visitors' },
  { category: 'Geospatial', primaryTarget: 'Smoke Shop Visitors' },
  { category: 'Geospatial', primaryTarget: 'Liquor Store Visitors' },
  { category: 'Geospatial', primaryTarget: 'Concert Venue Visitors (21+)' },
  { category: 'Geospatial', primaryTarget: 'Concert Venue Visitors (All Ages)' },

  // Demographic targets with secondary targeting
  { category: 'Demographic', primaryTarget: 'Baby Boomers', secondaryTarget: 'Male' },
  { category: 'Demographic', primaryTarget: 'Baby Boomers', secondaryTarget: 'Female' },
  { category: 'Demographic', primaryTarget: 'Baby Boomers', secondaryTarget: 'All' },
  { category: 'Demographic', primaryTarget: 'Gen X', secondaryTarget: 'Male' },
  { category: 'Demographic', primaryTarget: 'Gen X', secondaryTarget: 'Female' },
  { category: 'Demographic', primaryTarget: 'Gen X', secondaryTarget: 'All' },
  { category: 'Demographic', primaryTarget: 'Millenial', secondaryTarget: 'Male' },
  { category: 'Demographic', primaryTarget: 'Millenial', secondaryTarget: 'Female' },
  { category: 'Demographic', primaryTarget: 'Millenial', secondaryTarget: 'All' },
  { category: 'Demographic', primaryTarget: 'Xennial', secondaryTarget: 'Male' },
  { category: 'Demographic', primaryTarget: 'Xennial', secondaryTarget: 'Female' },
  { category: 'Demographic', primaryTarget: 'Xennial', secondaryTarget: 'All' },
];

// LocalStorage key for custom audience library additions
const AUDIENCE_LIBRARY_STORAGE_KEY = 'strategy_planner_audience_library';

// Load library from localStorage (merges with defaults)
export const loadAudienceLibrary = (): AudienceTarget[] => {
  try {
    const stored = localStorage.getItem(AUDIENCE_LIBRARY_STORAGE_KEY);
    if (stored) {
      const custom: AudienceTarget[] = JSON.parse(stored);
      // Merge custom with defaults
      const merged = [...defaultAudienceLibrary];
      custom.forEach(customTarget => {
        // Check if this exact target already exists
        const exists = merged.some(
          target =>
            target.category === customTarget.category &&
            target.primaryTarget === customTarget.primaryTarget &&
            target.secondaryTarget === customTarget.secondaryTarget
        );
        if (!exists) {
          merged.push(customTarget);
        }
      });
      return merged;
    }
  } catch (error) {
    console.error('Error loading audience library:', error);
  }
  return defaultAudienceLibrary;
};

// Save custom library additions to localStorage
export const saveAudienceLibrary = (library: AudienceTarget[]): void => {
  try {
    // Only save entries that aren't in the default library
    const customEntries = library.filter(target => {
      return !defaultAudienceLibrary.some(
        defaultTarget =>
          defaultTarget.category === target.category &&
          defaultTarget.primaryTarget === target.primaryTarget &&
          defaultTarget.secondaryTarget === target.secondaryTarget
      );
    });
    localStorage.setItem(AUDIENCE_LIBRARY_STORAGE_KEY, JSON.stringify(customEntries));
  } catch (error) {
    console.error('Error saving audience library:', error);
  }
};

// Add a new audience target
export const addAudienceTarget = (
  category: 'Geospatial' | 'Demographic',
  primaryTarget: string,
  secondaryTarget?: string
): AudienceTarget[] => {
  const library = loadAudienceLibrary();
  const newTarget: AudienceTarget = {
    category,
    primaryTarget: primaryTarget.trim(),
    secondaryTarget: secondaryTarget?.trim(),
  };

  // Check if already exists
  const exists = library.some(
    target =>
      target.category === newTarget.category &&
      target.primaryTarget === newTarget.primaryTarget &&
      target.secondaryTarget === newTarget.secondaryTarget
  );

  if (!exists) {
    library.push(newTarget);
    saveAudienceLibrary(library);
  }

  return library;
};

// Remove an audience target
export const removeAudienceTarget = (
  category: 'Geospatial' | 'Demographic',
  primaryTarget: string,
  secondaryTarget?: string
): AudienceTarget[] => {
  const library = loadAudienceLibrary();
  const filtered = library.filter(
    target =>
      !(
        target.category === category &&
        target.primaryTarget === primaryTarget &&
        target.secondaryTarget === secondaryTarget
      )
  );
  saveAudienceLibrary(filtered);
  return filtered;
};

// Get targets by category
export const getTargetsByCategory = (
  category: 'Geospatial' | 'Demographic',
  library: AudienceTarget[] = defaultAudienceLibrary
): AudienceTarget[] => {
  return library.filter(target => target.category === category);
};
