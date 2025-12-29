import React, { useState, useEffect } from 'react';
import { StrategyProvider, useStrategy } from '@/contexts/StrategyContext';
import { StrategyOverview } from '@/components/strategy/StrategyOverview';
import { LineItemBuilder } from '@/components/strategy/LineItemBuilder';
import { MonthlyBreakdown } from '@/components/strategy/MonthlyBreakdown';
import { LibraryManager } from '@/components/strategy/LibraryManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Save, Download, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { strategyStorage } from '@/lib/strategyStorage';
import { loadLibrary, getUniqueAgencies, getUniqueAdvertisers } from '@/lib/advertiserLibrary';

const StrategyPlannerContent: React.FC = () => {
  const {
    currentStrategy,
    setCurrentStrategy,
    strategies,
    createNewStrategy,
    deleteStrategy,
    refreshStrategies,
    autoSave,
    setAutoSave,
  } = useStrategy();

  const [showNewStrategyDialog, setShowNewStrategyDialog] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newStrategyClient, setNewStrategyClient] = useState('');
  const [newStrategyAgency, setNewStrategyAgency] = useState('');
  const [newStrategyChannel, setNewStrategyChannel] = useState('');
  const [newStrategyRevenueModel, setNewStrategyRevenueModel] = useState('');
  const [agencies, setAgencies] = useState<string[]>([]);
  const [advertisers, setAdvertisers] = useState<string[]>([]);

  useEffect(() => {
    const library = loadLibrary();
    setAgencies(getUniqueAgencies(library));
    setAdvertisers(getUniqueAdvertisers(library));
  }, []);

  const handleCreateNewStrategy = () => {
    if (!newStrategyName.trim()) {
      toast.error('Please enter a strategy name');
      return;
    }

    if (!newStrategyClient.trim()) {
      toast.error('Please select a client/advertiser');
      return;
    }

    if (!newStrategyAgency.trim()) {
      toast.error('Please select an agency');
      return;
    }

    const now = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    createNewStrategy({
      name: newStrategyName.trim(),
      agencyName: newStrategyAgency.trim(),
      clientName: newStrategyClient.trim(),
      channel: newStrategyChannel,
      billingCategory: newStrategyRevenueModel,
      clientBudget: 0,
      impressionGoal: 0,
      dspSpend: 0,
      profit: 0,
      campaignStartDate: now.toISOString(),
      campaignEndDate: threeMonthsLater.toISOString(),
      monthlyBreakdowns: [],
      lineItems: [],
    });

    setNewStrategyName('');
    setNewStrategyClient('');
    setNewStrategyAgency('');
    setNewStrategyChannel('');
    setNewStrategyRevenueModel('');
    setShowNewStrategyDialog(false);
    toast.success('New strategy created');
  };

  const handleLoadStrategy = (strategyId: string) => {
    const strategy = strategyStorage.getStrategy(strategyId);
    if (strategy) {
      setCurrentStrategy(strategy);
      toast.success(`Loaded: ${strategy.name}`);
    }
  };

  const handleDeleteStrategy = (id: string) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      deleteStrategy(id);
    }
  };

  const handleExportJSON = () => {
    if (!currentStrategy) return;

    const dataStr = JSON.stringify(currentStrategy, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStrategy.name.replace(/\s+/g, '-')}-strategy.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Strategy exported as JSON');
  };

  const handleExportCSV = () => {
    if (!currentStrategy) return;

    const headers = ['Channel Partner', 'Brand/Advertiser', 'IO Number', 'Campaign Name', 'Description', 'Impressions', 'RPM', 'Client Budget', 'DSP Bid', 'DSP Spend', 'Flight Start', 'Flight End'];
    const rows = currentStrategy.lineItems.map(item => [
      item.channelPartner,
      item.brandAdvertiser,
      item.ioNumber,
      item.campaignName,
      item.description || '',
      item.impressions.toString(),
      item.rpm.toString(),
      item.clientBudget.toString(),
      item.dspBid.toString(),
      item.dspSpend.toString(),
      item.flightStart.split('T')[0],
      item.flightEnd.split('T')[0],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStrategy.name.replace(/\s+/g, '-')}-line-items.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Line items exported as CSV');
  };

  const handleSaveManually = () => {
    if (!currentStrategy) return;
    strategyStorage.updateStrategy(currentStrategy.id, currentStrategy);
    refreshStrategies();
    toast.success('Strategy saved');
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Display Campaign Strategy Planner</h1>
          <p className="text-muted-foreground">Plan and budget your display campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              className="rounded"
            />
            Auto-save
          </label>
          {!autoSave && (
            <Button onClick={handleSaveManually} variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
          <Button onClick={() => setShowNewStrategyDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Strategy
          </Button>
        </div>
      </div>

      {/* Strategy Selector / List */}
      {!currentStrategy && strategies.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Select a strategy to edit:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategies.map((strategy) => (
                  <Card key={strategy.id} className="cursor-pointer hover:border-primary" onClick={() => handleLoadStrategy(strategy.id)}>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{strategy.name}</h4>
                        <p className="text-sm text-muted-foreground">{strategy.clientName}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Budget: ${strategy.clientBudget.toLocaleString()}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStrategy(strategy.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentStrategy && strategies.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
            <p className="text-muted-foreground mb-4">Create your first campaign strategy to get started</p>
            <Button onClick={() => setShowNewStrategyDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Strategy
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content - When strategy is selected */}
      {currentStrategy && (
        <>
          {/* Strategy Header */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h2 className="text-xl font-bold">{currentStrategy.name}</h2>
              <p className="text-sm text-muted-foreground">
                {currentStrategy.agencyName && (
                  <>
                    <span><span className="font-bold">Agency:</span> {currentStrategy.agencyName}</span>
                    <span className="mx-2">/</span>
                  </>
                )}
                <span><span className="font-bold">Advertiser:</span> {currentStrategy.clientName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={currentStrategy.id} onValueChange={handleLoadStrategy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Switch strategy" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Hidden export buttons */}
              {false && (
                <>
                  <Button variant="outline" size="sm" onClick={handleExportJSON}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteStrategy(currentStrategy.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Tabs for different sections */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="flights">Flights</TabsTrigger>
              <TabsTrigger value="line-items">Line Items</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <StrategyOverview />
            </TabsContent>

            <TabsContent value="flights" className="space-y-6">
              <MonthlyBreakdown />
            </TabsContent>

            <TabsContent value="line-items" className="space-y-6">
              <LineItemBuilder />
            </TabsContent>

            <TabsContent value="library" className="space-y-6">
              <LibraryManager />
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* New Strategy Dialog */}
      <Dialog open={showNewStrategyDialog} onOpenChange={setShowNewStrategyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Strategy</DialogTitle>
            <DialogDescription>
              Start a new campaign strategy plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="strategyName">Campaign Name</Label>
              <Input
                id="strategyName"
                placeholder="e.g., Q4 2025 Display Campaign"
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agency">Agency / Channel Partner</Label>
                <Select value={newStrategyAgency} onValueChange={setNewStrategyAgency}>
                  <SelectTrigger id="agency">
                    <SelectValue placeholder="Select agency..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agencies.map((agency) => (
                      <SelectItem key={agency} value={agency}>
                        {agency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client / Advertiser</Label>
                <Select value={newStrategyClient} onValueChange={setNewStrategyClient}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Select client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {advertisers.map((advertiser) => (
                      <SelectItem key={advertiser} value={advertiser}>
                        {advertiser}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="channel">Channel</Label>
                <Select value={newStrategyChannel} onValueChange={setNewStrategyChannel}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Display">Display</SelectItem>
                    <SelectItem value="Native">Native</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="CTV">CTV</SelectItem>
                    <SelectItem value="DOOH">DOOH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenueModel">Revenue Model</Label>
                <Select value={newStrategyRevenueModel} onValueChange={setNewStrategyRevenueModel}>
                  <SelectTrigger id="revenueModel">
                    <SelectValue placeholder="Select revenue model..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPM">CPM</SelectItem>
                    <SelectItem value="Auction+">Auction+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewStrategyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewStrategy}>
              Create Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StrategyPlanner: React.FC = () => {
  return (
    <StrategyProvider>
      <StrategyPlannerContent />
    </StrategyProvider>
  );
};

export default StrategyPlanner;
