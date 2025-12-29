// Advertiser and Agency Library

export interface AdvertiserAgencyPair {
  advertiser: string;
  agency: string;
}

// Initial library of advertisers and their channel partners (agencies)
export const defaultAdvertiserLibrary: AdvertiserAgencyPair[] = [
  { advertiser: '960 Bloomingdale Rd. LLC', agency: 'The Flowery' },
  { advertiser: 'Aroma Hill', agency: 'Orangellow' },
  { advertiser: 'Ayr Wellness', agency: 'MediaJel Direct' },
  { advertiser: 'Bakeree', agency: 'Orangellow' },
  { advertiser: 'Banyan Tree', agency: 'Fat Dawgs Digital' },
  { advertiser: 'Bloom Medicinals', agency: 'Orangellow' },
  { advertiser: 'Clear Sky', agency: 'Tact Firm' },
  { advertiser: 'Dark Horse Cannabis Dispensary', agency: 'Tulip City Creative' },
  { advertiser: 'Daylite Cannabis', agency: 'Orangellow' },
  { advertiser: 'Detroit Coney Grill', agency: 'Orangellow' },
  { advertiser: 'DGT', agency: 'MediaJel Direct' },
  { advertiser: 'District Cannabis', agency: 'Herb.co' },
  { advertiser: 'Eaze', agency: 'MediaJel Direct' },
  { advertiser: 'Elevations Awareness', agency: 'NLMC' },
  { advertiser: 'Fishkill Cannabis', agency: 'Orangellow' },
  { advertiser: 'Freedom Market', agency: 'Orangellow' },
  { advertiser: 'Garden Remedies', agency: 'MediaJel Direct' },
  { advertiser: 'Grass Roots', agency: 'Orangellow' },
  { advertiser: 'Great CBD Shop', agency: 'Herb.co' },
  { advertiser: 'Green Dot Labs', agency: 'MediaJel Direct' },
  { advertiser: 'Green Dragon', agency: 'MediaJel Direct' },
  { advertiser: 'Green Pharms', agency: 'Orangellow' },
  { advertiser: 'Green Soul', agency: 'MediaJel Direct' },
  { advertiser: 'GreenLight', agency: 'Propaganda Creative' },
  { advertiser: 'Hana Dispensaries', agency: 'Orangellow' },
  { advertiser: 'Harris Furniture', agency: 'Propaganda Creative' },
  { advertiser: 'High Season', agency: 'MediaJel Direct' },
  { advertiser: 'Historic Cherry Hill', agency: 'Tulip City Creative' },
  { advertiser: 'ILGM', agency: 'Herb.co' },
  { advertiser: 'KAJ Naturals', agency: 'Orangellow' },
  { advertiser: 'KAMU Karaoke', agency: 'MediaJel Direct' },
  { advertiser: 'Kine Buds', agency: 'MediaJel Direct' },
  { advertiser: 'Kraken Kratom', agency: 'Herb.co' },
  { advertiser: 'KushCart', agency: 'Orangellow' },
  { advertiser: 'Liberty Cannabis', agency: 'MediaJel Direct' },
  { advertiser: 'Lolly Cannabis', agency: 'Orangellow' },
  { advertiser: 'Lovewell Farms', agency: 'Orangellow' },
  { advertiser: 'Lucky Farms', agency: 'Orangellow' },
  { advertiser: 'Mankind Dispensary', agency: 'MediaJel Direct' },
  { advertiser: 'Market96', agency: 'MediaJel Direct' },
  { advertiser: 'Nature\'s Grace', agency: 'MediaJel Direct' },
  { advertiser: 'Nobo', agency: 'MediaJel Direct' },
  { advertiser: 'Not Ya Son\'s Weed', agency: 'Orangellow' },
  { advertiser: 'Nurse Wellness', agency: 'Orangellow' },
  { advertiser: 'Olofly', agency: 'Orangellow' },
  { advertiser: 'Pend Oreille', agency: 'Propaganda Creative' },
  { advertiser: 'Popstar Labs', agency: 'MediaJel Direct' },
  { advertiser: 'Premiere Provisions', agency: 'Orangellow' },
  { advertiser: 'Purple Lotus Delivery', agency: 'MediaJel Direct' },
  { advertiser: 'Rolling Releaf', agency: 'Orangellow' },
  { advertiser: 'SAMJYNY LLC', agency: 'The Flowery' },
  { advertiser: 'SGA', agency: 'MediaJel Direct' },
  { advertiser: 'SOL', agency: 'MediaJel Direct' },
  { advertiser: 'Sol Flower', agency: 'Orangellow' },
  { advertiser: 'South Shore Buds', agency: 'Tact Firm' },
  { advertiser: 'SPARC', agency: 'MediaJel Direct' },
  { advertiser: 'Strawberry Fields', agency: 'NLMC' },
  { advertiser: 'Sunnyside', agency: 'Noble People' },
  { advertiser: 'Sweet Flower', agency: 'Tact Firm' },
  { advertiser: 'The Epic Remedy', agency: 'NLMC' },
  { advertiser: 'The Green Nugget', agency: 'Orangellow' },
  { advertiser: 'The Happy Camper', agency: 'Orangellow' },
  { advertiser: 'The Landing', agency: 'MediaJel Direct' },
  { advertiser: 'Thick Ass Glass', agency: 'Wunderworx' },
  { advertiser: 'Tusk Kratom', agency: 'Herb.co' },
  { advertiser: 'Union Chill', agency: 'MediaJel Direct' },
  { advertiser: 'Unity Road', agency: 'MediaJel Direct' },
  { advertiser: 'Urb', agency: 'MediaJel Direct' },
  { advertiser: 'Valley Greens', agency: 'MediaJel Direct' },
  { advertiser: 'Zebra CBD', agency: 'Wunderworx' },
];

// Get unique list of agencies
export const getUniqueAgencies = (library: AdvertiserAgencyPair[] = defaultAdvertiserLibrary): string[] => {
  const agencies = new Set(library.map(pair => pair.agency));
  return Array.from(agencies).sort();
};

// Get unique list of advertisers
export const getUniqueAdvertisers = (library: AdvertiserAgencyPair[] = defaultAdvertiserLibrary): string[] => {
  const advertisers = new Set(library.map(pair => pair.advertiser));
  return Array.from(advertisers).sort();
};

// Get advertisers by agency
export const getAdvertisersByAgency = (agency: string, library: AdvertiserAgencyPair[] = defaultAdvertiserLibrary): string[] => {
  return library
    .filter(pair => pair.agency === agency)
    .map(pair => pair.advertiser)
    .sort();
};

// Get agency for an advertiser (returns first match if multiple)
export const getAgencyForAdvertiser = (advertiser: string, library: AdvertiserAgencyPair[] = defaultAdvertiserLibrary): string | null => {
  const pair = library.find(p => p.advertiser === advertiser);
  return pair ? pair.agency : null;
};

// LocalStorage key for custom library additions
const LIBRARY_STORAGE_KEY = 'strategy_planner_advertiser_library';

// Load library from localStorage (merges with defaults)
export const loadLibrary = (): AdvertiserAgencyPair[] => {
  try {
    const stored = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (stored) {
      const custom: AdvertiserAgencyPair[] = JSON.parse(stored);
      // Merge custom with defaults (custom entries can override defaults)
      const merged = [...defaultAdvertiserLibrary];
      custom.forEach(customPair => {
        // Check if this exact pair already exists
        const exists = merged.some(
          pair => pair.advertiser === customPair.advertiser && pair.agency === customPair.agency
        );
        if (!exists) {
          merged.push(customPair);
        }
      });
      return merged;
    }
  } catch (error) {
    console.error('Error loading advertiser library:', error);
  }
  return defaultAdvertiserLibrary;
};

// Save custom library additions to localStorage
export const saveLibrary = (library: AdvertiserAgencyPair[]): void => {
  try {
    // Only save entries that aren't in the default library
    const customEntries = library.filter(pair => {
      return !defaultAdvertiserLibrary.some(
        defaultPair => defaultPair.advertiser === pair.advertiser && defaultPair.agency === pair.agency
      );
    });
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(customEntries));
  } catch (error) {
    console.error('Error saving advertiser library:', error);
  }
};

// Add a new advertiser-agency pair
export const addAdvertiserAgencyPair = (advertiser: string, agency: string): AdvertiserAgencyPair[] => {
  const library = loadLibrary();
  const newPair: AdvertiserAgencyPair = { advertiser: advertiser.trim(), agency: agency.trim() };

  // Check if already exists
  const exists = library.some(
    pair => pair.advertiser === newPair.advertiser && pair.agency === newPair.agency
  );

  if (!exists) {
    library.push(newPair);
    saveLibrary(library);
  }

  return library;
};

// Remove an advertiser-agency pair
export const removeAdvertiserAgencyPair = (advertiser: string, agency: string): AdvertiserAgencyPair[] => {
  const library = loadLibrary();
  const filtered = library.filter(
    pair => !(pair.advertiser === advertiser && pair.agency === agency)
  );
  saveLibrary(filtered);
  return filtered;
};
