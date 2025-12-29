import React, { useState, useEffect } from 'react';
import { useStrategy } from '@/contexts/StrategyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Target, TrendingUp, Calendar, Upload, Download, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loadLibrary, getUniqueAgencies, getUniqueAdvertisers } from '@/lib/advertiserLibrary';
import { toast } from 'sonner';

export const StrategyOverview: React.FC = () => {
  const { currentStrategy, updateCurrentStrategy, calculations, budgetValidation } = useStrategy();
  const [agencies, setAgencies] = useState<string[]>([]);
  const [advertisers, setAdvertisers] = useState<string[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  useEffect(() => {
    const library = loadLibrary();
    setAgencies(getUniqueAgencies(library));
    setAdvertisers(getUniqueAdvertisers(library));
  }, []);

  if (!currentStrategy) {
    return (
      <Alert>
        <AlertDescription>
          No strategy selected. Create a new strategy to get started.
        </AlertDescription>
      </Alert>
    );
  }

  const handleInputChange = (field: keyof typeof currentStrategy, value: string | number) => {
    updateCurrentStrategy({ [field]: value });
  };

  // Format currency with commas and conditional decimals
  const formatCurrency = (value: number): string => {
    const hasDecimals = value % 1 !== 0;
    return '$' + value.toLocaleString('en-US', {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: 2
    });
  };

  // Format impressions with commas
  const formatImpressions = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateCurrentStrategy({
        ioPdfFile: dataUrl,
        ioPdfFileName: file.name,
      });
      toast.success('IO PDF uploaded');
    };
    reader.onerror = () => {
      toast.error('Failed to upload file');
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPdf = () => {
    if (!currentStrategy.ioPdfFile || !currentStrategy.ioPdfFileName) return;

    const link = document.createElement('a');
    link.href = currentStrategy.ioPdfFile;
    link.download = currentStrategy.ioPdfFileName;
    link.click();
    toast.success('Downloading IO PDF');
  };

  // Auto-calculate profit when budget or spend changes
  const profit = currentStrategy.clientBudget - currentStrategy.dspSpend;
  const profitMargin = currentStrategy.clientBudget > 0
    ? ((profit / currentStrategy.clientBudget) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Campaign Details and Budget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Campaign Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Campaign Overview</CardTitle>
                <CardDescription>
                  High-level campaign information
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {/* IO PDF Upload */}
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="ioPdfUpload" className="text-sm text-muted-foreground whitespace-nowrap">
                    IO PDF:
                  </Label>
                  <input
                    type="file"
                    id="ioPdfUpload"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('ioPdfUpload')?.click()}
                    title="Upload IO PDF"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  {currentStrategy.ioPdfFile && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadPdf}
                      title={`Download ${currentStrategy.ioPdfFileName || 'IO PDF'}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Budget Tracker Link */}
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="budgetTrackerUrl" className="text-sm text-muted-foreground whitespace-nowrap">
                    Budget Tracker:
                  </Label>
                  <Input
                    id="budgetTrackerUrl"
                    type="url"
                    value={currentStrategy.budgetTrackerUrl || ''}
                    onChange={(e) => handleInputChange('budgetTrackerUrl', e.target.value)}
                    placeholder="URL"
                    className="h-8 w-48"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agency and Client Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Agency Name */}
              <div className="space-y-2">
                <Label htmlFor="agencyName">Agency / Channel Partner</Label>
                <Select value={currentStrategy.agencyName || ''} onValueChange={(value) => handleInputChange('agencyName', value)}>
                  <SelectTrigger id="agencyName">
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

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName">Client / Advertiser</Label>
                <Select value={currentStrategy.clientName} onValueChange={(value) => handleInputChange('clientName', value)}>
                  <SelectTrigger id="clientName">
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

            {/* Campaign Name, Channel, and Billing Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input
                  id="campaignName"
                  value={currentStrategy.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Q4 2025 Display Campaign"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strategyChannel">Channel</Label>
                <Select value={currentStrategy.channel || ''} onValueChange={(value) => handleInputChange('channel', value)}>
                  <SelectTrigger id="strategyChannel">
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
                <Label htmlFor="strategyBillingCategory">Revenue Model</Label>
                <Select value={currentStrategy.billingCategory || ''} onValueChange={(value) => handleInputChange('billingCategory', value)}>
                  <SelectTrigger id="strategyBillingCategory">
                    <SelectValue placeholder="Select model..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPM">CPM</SelectItem>
                    <SelectItem value="Auction+">Auction+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campaign Start Date */}
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Campaign Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={currentStrategy.campaignStartDate.split('T')[0]}
                  onChange={(e) => handleInputChange('campaignStartDate', new Date(e.target.value).toISOString())}
                />
              </div>

              {/* Campaign End Date */}
              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Campaign End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={currentStrategy.campaignEndDate.split('T')[0]}
                  onChange={(e) => handleInputChange('campaignEndDate', new Date(e.target.value).toISOString())}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={currentStrategy.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this strategy..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Budget & Goals Stacked */}
        <div className="flex flex-col gap-4">
          {/* Client Budget Card */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Client Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editingField === 'clientBudget' ? editingValue : formatCurrency(currentStrategy.clientBudget)}
                  onFocus={() => {
                    setEditingField('clientBudget');
                    setEditingValue(currentStrategy.clientBudget.toString());
                  }}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => {
                    const value = editingValue.replace(/[^0-9.]/g, '');
                    handleInputChange('clientBudget', parseFloat(value) || 0);
                    setEditingField(null);
                  }}
                  className="text-2xl font-bold"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Total budget from client
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Impression Goal Card */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Impression Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editingField === 'impressionGoal' ? editingValue : formatImpressions(currentStrategy.impressionGoal)}
                  onFocus={() => {
                    setEditingField('impressionGoal');
                    setEditingValue(currentStrategy.impressionGoal.toString());
                  }}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => {
                    const value = editingValue.replace(/[^0-9]/g, '');
                    handleInputChange('impressionGoal', parseInt(value) || 0);
                    setEditingField(null);
                  }}
                  className="text-2xl font-bold"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Target impressions to deliver
                </p>
              </div>
            </CardContent>
          </Card>

          {/* DSP Spend Card */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                DSP Spend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={editingField === 'dspSpend' ? editingValue : formatCurrency(currentStrategy.dspSpend)}
                  onFocus={() => {
                    setEditingField('dspSpend');
                    setEditingValue(currentStrategy.dspSpend.toString());
                  }}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => {
                    const value = editingValue.replace(/[^0-9.]/g, '');
                    handleInputChange('dspSpend', parseFloat(value) || 0);
                    setEditingField(null);
                  }}
                  className="text-2xl font-bold"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Total spend in DSP
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Calculated Metrics Card */}
      {false && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardHeader>
            <CardTitle>Calculated Metrics</CardTitle>
            <CardDescription>
              Auto-calculated based on your inputs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Profit */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Profit</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Profit Margin */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className="text-2xl font-bold">
                  {profitMargin}%
                </p>
              </div>

              {/* Average RPM */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg RPM</p>
                <p className="text-2xl font-bold">
                  ${calculations.averageRpm.toFixed(2)}
                </p>
              </div>

              {/* Line Items Total */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Line Items Budget</p>
                <p className="text-2xl font-bold">
                  ${calculations.totalClientBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Budget Validation Alerts */}
      {false && budgetValidation.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {budgetValidation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {false && budgetValidation.warnings.length > 0 && (
        <Alert>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {budgetValidation.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
