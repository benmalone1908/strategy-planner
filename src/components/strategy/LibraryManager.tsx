import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Building2, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  AdvertiserAgencyPair,
  loadLibrary,
  saveLibrary,
  addAdvertiserAgencyPair,
  removeAdvertiserAgencyPair,
  getUniqueAgencies,
  getUniqueAdvertisers,
} from '@/lib/advertiserLibrary';
import {
  AudienceTarget,
  loadAudienceLibrary,
  addAudienceTarget,
  removeAudienceTarget,
  geospatialTargets,
  demographicTargets,
  demographicSecondaryTargets,
} from '@/lib/audienceLibrary';

export const LibraryManager: React.FC = () => {
  const [advertiserLibrary, setAdvertiserLibrary] = useState<AdvertiserAgencyPair[]>([]);
  const [audienceLibrary, setAudienceLibrary] = useState<AudienceTarget[]>([]);

  // Advertiser/Agency form state
  const [newAdvertiser, setNewAdvertiser] = useState('');
  const [newAgency, setNewAgency] = useState('');
  const [advertiserFilter, setAdvertiserFilter] = useState<'all' | 'agency' | 'advertiser'>('all');
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('');

  // Audience targeting form state
  const [audienceCategory, setAudienceCategory] = useState<'Geospatial' | 'Demographic'>('Geospatial');
  const [primaryTarget, setPrimaryTarget] = useState('');
  const [secondaryTarget, setSecondaryTarget] = useState<string>('');
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'geospatial' | 'demographic'>('all');

  useEffect(() => {
    setAdvertiserLibrary(loadLibrary());
    setAudienceLibrary(loadAudienceLibrary());
  }, []);

  // Advertiser/Agency handlers
  const handleAddAdvertiserAgency = () => {
    if (!newAdvertiser.trim() || !newAgency.trim()) {
      toast.error('Please enter both advertiser and agency names');
      return;
    }

    const updatedLibrary = addAdvertiserAgencyPair(newAdvertiser, newAgency);
    setAdvertiserLibrary(updatedLibrary);
    setNewAdvertiser('');
    setNewAgency('');
    toast.success('Advertiser-Agency pair added');
  };

  const handleRemoveAdvertiserAgency = (advertiser: string, agency: string) => {
    const updatedLibrary = removeAdvertiserAgencyPair(advertiser, agency);
    setAdvertiserLibrary(updatedLibrary);
    toast.success('Pair removed');
  };

  // Audience targeting handlers
  const handleAddAudienceTarget = () => {
    if (!primaryTarget.trim()) {
      toast.error('Please enter a primary target');
      return;
    }

    if (audienceCategory === 'Demographic' && !secondaryTarget) {
      toast.error('Please select a secondary target for demographic targeting');
      return;
    }

    const updatedLibrary = addAudienceTarget(
      audienceCategory,
      primaryTarget,
      audienceCategory === 'Demographic' ? secondaryTarget : undefined
    );
    setAudienceLibrary(updatedLibrary);
    setPrimaryTarget('');
    setSecondaryTarget('');
    toast.success('Audience target added');
  };

  const handleRemoveAudienceTarget = (target: AudienceTarget) => {
    const updatedLibrary = removeAudienceTarget(
      target.category,
      target.primaryTarget,
      target.secondaryTarget
    );
    setAudienceLibrary(updatedLibrary);
    toast.success('Audience target removed');
  };

  // Filter functions
  const getFilteredAdvertiserLibrary = () => {
    if (advertiserFilter === 'agency' && selectedAgency) {
      return advertiserLibrary.filter(pair => pair.agency === selectedAgency);
    }
    if (advertiserFilter === 'advertiser' && selectedAdvertiser) {
      return advertiserLibrary.filter(pair => pair.advertiser === selectedAdvertiser);
    }
    return advertiserLibrary;
  };

  const getFilteredAudienceLibrary = () => {
    if (audienceFilter === 'geospatial') {
      return audienceLibrary.filter(target => target.category === 'Geospatial');
    }
    if (audienceFilter === 'demographic') {
      return audienceLibrary.filter(target => target.category === 'Demographic');
    }
    return audienceLibrary;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Library Management
        </CardTitle>
        <CardDescription>
          Manage your advertiser/agency pairs and audience targeting options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="advertisers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="advertisers">
              <Building2 className="h-4 w-4 mr-2" />
              Advertisers & Agencies
            </TabsTrigger>
            <TabsTrigger value="audiences">
              <Target className="h-4 w-4 mr-2" />
              Audience Targeting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="advertisers" className="space-y-6">
            {/* Add New Advertiser/Agency Pair */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Add New Pair</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="advertiser">Advertiser</Label>
                  <Input
                    id="advertiser"
                    value={newAdvertiser}
                    onChange={(e) => setNewAdvertiser(e.target.value)}
                    placeholder="Enter advertiser name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agency">Agency</Label>
                  <Input
                    id="agency"
                    value={newAgency}
                    onChange={(e) => setNewAgency(e.target.value)}
                    placeholder="Enter agency name"
                  />
                </div>
              </div>
              <Button onClick={handleAddAdvertiserAgency} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Advertiser-Agency Pair
              </Button>
            </div>

            {/* Filter Options */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">View Library</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select value={advertiserFilter} onValueChange={(v: any) => setAdvertiserFilter(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pairs</SelectItem>
                    <SelectItem value="agency">By Agency</SelectItem>
                    <SelectItem value="advertiser">By Advertiser</SelectItem>
                  </SelectContent>
                </Select>

                {advertiserFilter === 'agency' && (
                  <Select value={selectedAgency} onValueChange={setSelectedAgency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select agency" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueAgencies(advertiserLibrary).map(agency => (
                        <SelectItem key={agency} value={agency}>
                          {agency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {advertiserFilter === 'advertiser' && (
                  <Select value={selectedAdvertiser} onValueChange={setSelectedAdvertiser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select advertiser" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUniqueAdvertisers(advertiserLibrary).map(advertiser => (
                        <SelectItem key={advertiser} value={advertiser}>
                          {advertiser}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Library List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getFilteredAdvertiserLibrary().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No advertiser-agency pairs found
                </p>
              ) : (
                getFilteredAdvertiserLibrary().map((pair, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{pair.advertiser}</p>
                      <p className="text-xs text-muted-foreground">{pair.agency}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAdvertiserAgency(pair.advertiser, pair.agency)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="audiences" className="space-y-6">
            {/* Add New Audience Target */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Add New Target</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={audienceCategory}
                    onValueChange={(v: 'Geospatial' | 'Demographic') => {
                      setAudienceCategory(v);
                      setPrimaryTarget('');
                      setSecondaryTarget('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Geospatial">Geospatial</SelectItem>
                      <SelectItem value="Demographic">Demographic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary">Primary Target</Label>
                  <Select value={primaryTarget} onValueChange={setPrimaryTarget}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {(audienceCategory === 'Geospatial' ? geospatialTargets : demographicTargets).map(
                        target => (
                          <SelectItem key={target} value={target}>
                            {target}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {audienceCategory === 'Demographic' && (
                  <div className="space-y-2">
                    <Label htmlFor="secondary">Secondary Target</Label>
                    <Select value={secondaryTarget} onValueChange={setSecondaryTarget}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {demographicSecondaryTargets.map(target => (
                          <SelectItem key={target} value={target}>
                            {target}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <Button onClick={handleAddAudienceTarget} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Audience Target
              </Button>
            </div>

            {/* Filter Options */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">View Targets</h3>
              <Select value={audienceFilter} onValueChange={(v: any) => setAudienceFilter(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Targets</SelectItem>
                  <SelectItem value="geospatial">Geospatial Only</SelectItem>
                  <SelectItem value="demographic">Demographic Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Audience Library List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getFilteredAudienceLibrary().length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No audience targets found
                </p>
              ) : (
                getFilteredAudienceLibrary().map((target, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded bg-primary/10">
                          {target.category}
                        </span>
                      </div>
                      <p className="font-medium text-sm mt-1">{target.primaryTarget}</p>
                      {target.secondaryTarget && (
                        <p className="text-xs text-muted-foreground">{target.secondaryTarget}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAudienceTarget(target)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
