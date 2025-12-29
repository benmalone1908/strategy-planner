import React, { useState, useEffect } from 'react';
import { useStrategy } from '@/contexts/StrategyContext';
import { LineItem } from '@/types/strategy';
import { loadAudienceLibrary, AudienceTarget } from '@/lib/audienceLibrary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Copy, Trash2, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

export const LineItemBuilder: React.FC = () => {
  const { currentStrategy, updateCurrentStrategy, updateLineItem, deleteLineItem, duplicateLineItem } = useStrategy();
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [numLineItems, setNumLineItems] = useState('1');
  const [budgetAllocationType, setBudgetAllocationType] = useState<'even' | 'manual'>('even');
  const [manualAllocations, setManualAllocations] = useState<string[]>([]);
  const [allocationError, setAllocationError] = useState('');
  const [selectedTactics, setSelectedTactics] = useState<string[]>(['Conquesting']);
  const [showRedistributeModal, setShowRedistributeModal] = useState(false);
  const [pendingEdit, setPendingEdit] = useState<{ item: LineItem; field: keyof LineItem; value: string } | null>(null);
  const [showChangeTacticModal, setShowChangeTacticModal] = useState(false);
  const [itemToChangeTactic, setItemToChangeTactic] = useState<LineItem | null>(null);
  const [audienceLibrary, setAudienceLibrary] = useState<AudienceTarget[]>([]);

  useEffect(() => {
    setAudienceLibrary(loadAudienceLibrary());
  }, []);

  if (!currentStrategy) {
    return null;
  }

  // Format audience targets for dropdown display
  const formatTargetDisplay = (target: AudienceTarget): string => {
    if (target.secondaryTarget) {
      return `${target.category}: ${target.primaryTarget} (${target.secondaryTarget})`;
    }
    return `${target.category}: ${target.primaryTarget}`;
  };

  const handleNumLineItemsChange = (value: string) => {
    setNumLineItems(value);
    const count = parseInt(value) || 0;
    // Initialize manual allocations array with empty strings
    if (count > 0) {
      setManualAllocations(new Array(count).fill(''));
      // Initialize tactics array with default tactic for each line item
      setSelectedTactics(new Array(count).fill('Conquesting'));
    }
  };

  const handleManualAllocationChange = (index: number, value: string) => {
    const newAllocations = [...manualAllocations];
    newAllocations[index] = value;
    setManualAllocations(newAllocations);

    // Check if total adds up to 100
    const total = newAllocations.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    if (total !== 100 && newAllocations.some(val => val !== '')) {
      setAllocationError(`Total is ${total.toFixed(1)}%. Must equal 100%.`);
    } else {
      setAllocationError('');
    }
  };

  const handleTacticChange = (index: number, value: string) => {
    const newTactics = [...selectedTactics];
    newTactics[index] = value;
    setSelectedTactics(newTactics);
  };

  const handleAddLineItems = () => {
    const count = parseInt(numLineItems) || 0;
    if (count < 1) {
      toast.error('Please enter a valid number of line items');
      return;
    }

    // Validate manual allocations if needed
    if (budgetAllocationType === 'manual') {
      const total = manualAllocations.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        toast.error('Budget allocations must add up to 100%');
        return;
      }
    }

    // Create line items array
    const totalBudget = currentStrategy.clientBudget;
    const totalImpressions = currentStrategy.impressionGoal;
    const existingLineItems = currentStrategy.lineItems;
    const totalLineItemCount = existingLineItems.length + count;
    const newLineItems: LineItem[] = [];

    // Redistribute existing line items evenly
    const redistributedExisting = existingLineItems.map(item => {
      const evenPercentage = 100 / totalLineItemCount;
      const itemBudget = (totalBudget * evenPercentage) / 100;
      const itemImpressions = (totalImpressions * evenPercentage) / 100;
      return {
        ...item,
        clientBudget: itemBudget,
        impressions: Math.round(itemImpressions),
      };
    });

    // Create new line items
    for (let i = 0; i < count; i++) {
      let budgetPercentage: number;

      if (budgetAllocationType === 'even') {
        budgetPercentage = 100 / totalLineItemCount;
      } else {
        // For manual allocation, we need to redistribute
        budgetPercentage = parseFloat(manualAllocations[i]) || 0;
      }

      const itemBudget = (totalBudget * budgetPercentage) / 100;
      const itemImpressions = (totalImpressions * budgetPercentage) / 100;

      const lineItem: LineItem = {
        id: crypto.randomUUID(),
        channelPartner: '',
        brandAdvertiser: '',
        ioNumber: '',
        campaignName: '',
        description: '',
        tactic: selectedTactics[i] || 'Conquesting',
        impressions: Math.round(itemImpressions),
        rpm: totalBudget > 0 && totalImpressions > 0 ? (totalBudget / totalImpressions) * 1000 : 0,
        clientBudget: itemBudget,
        dspBid: 0,
        dspSpend: 0,
        flightStart: currentStrategy.campaignStartDate || new Date().toISOString(),
        flightEnd: currentStrategy.campaignEndDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        order: currentStrategy.lineItems.length + i,
      };
      newLineItems.push(lineItem);
    }

    // Add all line items at once with redistributed budgets
    updateCurrentStrategy({
      lineItems: [...redistributedExisting, ...newLineItems],
    });

    toast.success(`${count} line item${count > 1 ? 's' : ''} added and budgets redistributed evenly`);
    setIsModalOpen(false);
    setNumLineItems('1');
    setBudgetAllocationType('even');
    setManualAllocations([]);
    setAllocationError('');
    setSelectedTactics(['Conquesting']);
  };

  const handleCellEdit = (item: LineItem, field: keyof LineItem, value: string) => {
    // Check if this is a manual edit to impressions or clientBudget that would affect allocation
    if ((field === 'impressions' || field === 'clientBudget') && currentStrategy.lineItems.length > 1) {
      setPendingEdit({ item, field, value });
      setShowRedistributeModal(true);
      return;
    }

    applyEdit(item, field, value);
  };

  const applyEdit = (item: LineItem, field: keyof LineItem, value: string) => {
    const numericFields = ['impressions', 'rpm', 'clientBudget', 'dspBid', 'dspSpend'];

    let parsedValue: string | number = value;
    if (numericFields.includes(field)) {
      parsedValue = parseFloat(value) || 0;
    }

    // Auto-calculate DSP Spend if impressions or DSP Bid changes
    let updates: Partial<LineItem> = { [field]: parsedValue };

    if (field === 'impressions' || field === 'dspBid') {
      const impressions = field === 'impressions' ? (parsedValue as number) : item.impressions;
      const dspBid = field === 'dspBid' ? (parsedValue as number) : item.dspBid;
      updates.dspSpend = (impressions / 1000) * dspBid;
    }

    // Auto-calculate Client Budget if impressions or RPM changes
    if (field === 'impressions' || field === 'rpm') {
      const impressions = field === 'impressions' ? (parsedValue as number) : item.impressions;
      const rpm = field === 'rpm' ? (parsedValue as number) : item.rpm;
      updates.clientBudget = (impressions / 1000) * rpm;
    }

    updateLineItem(item.id, updates);
  };

  const handleRedistributeEvenly = () => {
    if (!pendingEdit) return;

    const { item, field, value } = pendingEdit;
    const parsedValue = parseFloat(value) || 0;

    // Apply the edit to the current item
    applyEdit(item, field, value);

    // Calculate remaining budget/impressions for other items
    const totalBudget = currentStrategy.clientBudget;
    const totalImpressions = currentStrategy.impressionGoal;
    const otherItems = currentStrategy.lineItems.filter(li => li.id !== item.id);

    if (field === 'clientBudget') {
      const remainingBudget = totalBudget - parsedValue;
      const budgetPerItem = remainingBudget / otherItems.length;

      otherItems.forEach(otherItem => {
        const newImpressions = Math.round((budgetPerItem / otherItem.rpm) * 1000);
        updateLineItem(otherItem.id, {
          clientBudget: budgetPerItem,
          impressions: newImpressions,
          dspSpend: (newImpressions / 1000) * otherItem.dspBid,
        });
      });
    } else if (field === 'impressions') {
      const remainingImpressions = totalImpressions - parsedValue;
      const impressionsPerItem = Math.round(remainingImpressions / otherItems.length);

      otherItems.forEach(otherItem => {
        const newBudget = (impressionsPerItem / 1000) * otherItem.rpm;
        updateLineItem(otherItem.id, {
          impressions: impressionsPerItem,
          clientBudget: newBudget,
          dspSpend: (impressionsPerItem / 1000) * otherItem.dspBid,
        });
      });
    }

    setShowRedistributeModal(false);
    setPendingEdit(null);
    toast.success('Remaining items redistributed evenly');
  };

  const handleManualAdjustment = () => {
    if (!pendingEdit) return;

    const { item, field, value } = pendingEdit;
    applyEdit(item, field, value);

    setShowRedistributeModal(false);
    setPendingEdit(null);
    toast.info('Please adjust other line items manually');
  };

  const handleDeleteItem = (id: string) => {
    deleteLineItem(id);
    toast.success('Line item deleted');
  };

  const handleDuplicateItem = (id: string) => {
    duplicateLineItem(id);
    toast.success('Line item duplicated');
  };

  const handleChangeTactic = (newTactic: string) => {
    if (!itemToChangeTactic) return;

    updateLineItem(itemToChangeTactic.id, { tactic: newTactic });
    setShowChangeTacticModal(false);
    setItemToChangeTactic(null);
    toast.success(`Line item moved to ${newTactic}`);
  };

  const renderEditableCell = (item: LineItem, field: keyof LineItem, type: 'text' | 'number' | 'date' = 'text') => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    let value = item[field];

    // Format dates for display
    if (type === 'date' && typeof value === 'string') {
      value = value.split('T')[0];
    }

    // Format currency
    if (['clientBudget', 'dspSpend', 'dspBid', 'rpm'].includes(field) && typeof value === 'number') {
      const displayValue = `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      return (
        <div>
          {isEditing ? (
            <Input
              type="text"
              inputMode="decimal"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => {
                handleCellEdit(item, field, editingValue);
                setEditingCell(null);
              }}
              className="h-7 px-1 py-1 text-xs bg-background border focus-visible:ring-1 rounded inline-block"
              style={{ width: `${Math.min(displayValue.length * 0.65, 10)}rem` }}
              autoFocus
            />
          ) : (
            <span
              onClick={() => {
                setEditingCell({ id: item.id, field });
                setEditingValue(value.toString());
              }}
              className="cursor-pointer hover:bg-muted px-1 py-1 rounded inline-block text-xs"
            >
              {displayValue}
            </span>
          )}
        </div>
      );
    }

    // Format impressions
    if (field === 'impressions' && typeof value === 'number') {
      const displayValue = value.toLocaleString();
      return (
        <div>
          {isEditing ? (
            <Input
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(e) => handleCellEdit(item, field, e.target.value)}
              onBlur={() => setEditingCell(null)}
              className="h-7 px-1 py-1 text-xs bg-background border focus-visible:ring-1 rounded inline-block"
              style={{ width: `${Math.min(displayValue.length * 0.65, 10)}rem` }}
              autoFocus
            />
          ) : (
            <span
              onClick={() => setEditingCell({ id: item.id, field })}
              className="cursor-pointer hover:bg-muted px-1 py-1 rounded inline-block text-xs"
            >
              {displayValue}
            </span>
          )}
        </div>
      );
    }

    const displayValue = (value as string) || '-';
    return (
      <div>
        {isEditing ? (
          <Input
            type={type}
            value={value as string}
            onChange={(e) => handleCellEdit(item, field, e.target.value)}
            onBlur={() => setEditingCell(null)}
            className="h-7 px-1 py-1 text-xs bg-background border focus-visible:ring-1 rounded inline-block"
            style={{ width: type === 'date' ? '7rem' : '6rem' }}
            autoFocus
          />
        ) : (
          <span
            onClick={() => setEditingCell({ id: item.id, field })}
            className="cursor-pointer hover:bg-muted px-1 py-1 rounded inline-block text-xs"
          >
            {displayValue}
          </span>
        )}
      </div>
    );
  };

  const sortedLineItems = [...currentStrategy.lineItems].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Group line items by tactic
  const groupedByTactic = sortedLineItems.reduce((acc, item) => {
    const tactic = item.tactic || 'Uncategorized';
    if (!acc[tactic]) {
      acc[tactic] = [];
    }
    acc[tactic].push(item);
    return acc;
  }, {} as Record<string, LineItem[]>);

  const tacticOrder = ['Conquesting', 'Prospecting', 'Retargeting', 'Event Targeting', 'Uncategorized'];
  const sortedTactics = Object.keys(groupedByTactic).sort((a, b) => {
    const indexA = tacticOrder.indexOf(a);
    const indexB = tacticOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>
              Build your campaign line items with detailed budget allocation
            </CardDescription>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item(s)
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Line Item(s)</DialogTitle>
                <DialogDescription>
                  Configure the number of line items and budget allocation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numLineItems">Number of Line Items</Label>
                    <Input
                      id="numLineItems"
                      type="text"
                      inputMode="numeric"
                      value={numLineItems}
                      onChange={(e) => handleNumLineItemsChange(e.target.value)}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Budget Allocation</Label>
                    <Select value={budgetAllocationType} onValueChange={(value: 'even' | 'manual') => setBudgetAllocationType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="even">Even Distribution</SelectItem>
                        <SelectItem value="manual">Manual Allocation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show tactic dropdowns for each line item */}
                {parseInt(numLineItems) > 0 && (
                  <div className="space-y-2">
                    <Label>Tactics</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedTactics.map((tactic, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Label className="w-24 text-sm">Line Item {index + 1}:</Label>
                          <Select value={tactic} onValueChange={(value) => handleTacticChange(index, value)}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select tactic..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Conquesting">Conquesting</SelectItem>
                              <SelectItem value="Prospecting">Prospecting</SelectItem>
                              <SelectItem value="Retargeting">Retargeting</SelectItem>
                              <SelectItem value="Event Targeting">Event Targeting</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {budgetAllocationType === 'manual' && parseInt(numLineItems) > 0 && (
                  <div className="space-y-2">
                    <Label>Budget Percentages (must total 100%)</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {manualAllocations.map((allocation, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Label className="w-24 text-sm">Line Item {index + 1}:</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={allocation}
                            onChange={(e) => handleManualAllocationChange(index, e.target.value)}
                            placeholder="0"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      ))}
                    </div>
                    {allocationError && (
                      <p className="text-sm text-red-600">{allocationError}</p>
                    )}
                    {!allocationError && manualAllocations.some(val => val !== '') && (
                      <p className="text-sm text-green-600">
                        Total: {manualAllocations.reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toFixed(1)}%
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLineItems} disabled={budgetAllocationType === 'manual' && allocationError !== ''}>
                  Add Line Item{parseInt(numLineItems) > 1 ? 's' : ''}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {sortedLineItems.length === 0 ? (
          <div className="rounded-md border overflow-x-auto">
            <div className="text-center text-muted-foreground py-8">
              No line items yet. Click "Add Line Item(s)" to get started.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedTactics.map((tactic) => (
              <div key={tactic} className="space-y-2">
                {/* Tactic Header */}
                <h3 className="font-semibold text-base px-2">{tactic}</h3>

                {/* Tactic Table */}
                <div className="rounded-md border overflow-x-auto">
                  <Table className="text-xs" style={{ tableLayout: 'fixed', width: '100%', border: '1px solid #ccc' }}>
                    <TableBody>
                      {groupedByTactic[tactic].map((item, index) => {
                      // Calculate allocation percentage
                      const totalBudget = currentStrategy.clientBudget;
                      const allocationPercentage = totalBudget > 0
                        ? (item.clientBudget / totalBudget) * 100
                        : 0;

                      // Alternating background color for line item groups
                      const isEvenRow = index % 2 === 0;
                      const rowBg = isEvenRow ? '#ffffff' : '#e8e8e8';

                      return (
                        <React.Fragment key={item.id}>
                          {/* Row 1: Targeting dropdown and Actions */}
                          <TableRow className="border-b-0" style={{ backgroundColor: rowBg }}>
                            <TableCell className="px-1 py-2 border-b-0 align-middle" colSpan={2}>
                              {/* Targeting Dropdown */}
                              <Select
                                value={item.targeting || ''}
                                onValueChange={(value) => updateLineItem(item.id, { targeting: value })}
                              >
                                <SelectTrigger className="h-7 text-xs max-w-xs">
                                  <SelectValue placeholder="Select targeting..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {audienceLibrary.map((target, index) => {
                                    const displayValue = formatTargetDisplay(target);
                                    return (
                                      <SelectItem key={`${displayValue}-${index}`} value={displayValue}>
                                        {displayValue}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="p-0 py-2 text-right border-b-0 align-middle" colSpan={6}>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setItemToChangeTactic(item);
                                    setShowChangeTacticModal(true);
                                  }}
                                  title="Move to another tactic"
                                >
                                  <ArrowLeftRight className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDuplicateItem(item.id)}
                                  title="Duplicate"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(item.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {/* Row 2: Column Headers */}
                          <TableRow className="border-t-0" style={{ backgroundColor: rowBg }}>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>Allocation</TableCell>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>Impressions</TableCell>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>RPM</TableCell>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>Client Budget</TableCell>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>DSP Max Bid</TableCell>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>DSP Spend</TableCell>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>Flight Start</TableCell>
                            <TableCell className="px-2 py-1 text-xs font-medium border-t-0" style={{ width: '12.5%', border: '1px solid #ccc' }}>Flight End</TableCell>
                          </TableRow>
                          {/* Row 3: Data Values */}
                          <TableRow className="border-t-0" style={{ backgroundColor: rowBg }}>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              <span className="text-xs text-muted-foreground">
                                {allocationPercentage.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              {renderEditableCell(item, 'impressions', 'number')}
                            </TableCell>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              {renderEditableCell(item, 'rpm', 'number')}
                            </TableCell>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              {renderEditableCell(item, 'clientBudget', 'number')}
                            </TableCell>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              {renderEditableCell(item, 'dspBid', 'number')}
                            </TableCell>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              {renderEditableCell(item, 'dspSpend', 'number')}
                            </TableCell>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              {renderEditableCell(item, 'flightStart', 'date')}
                            </TableCell>
                            <TableCell className="px-2 py-1" style={{ border: '1px solid #ccc' }}>
                              {renderEditableCell(item, 'flightEnd', 'date')}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedLineItems.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Total Impressions</p>
                <p className="text-lg font-bold">
                  {sortedLineItems.reduce((sum, item) => sum + item.impressions, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Total Client Budget</p>
                <p className="text-lg font-bold">
                  ${sortedLineItems.reduce((sum, item) => sum + item.clientBudget, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Total DSP Spend</p>
                <p className="text-lg font-bold">
                  ${sortedLineItems.reduce((sum, item) => sum + item.dspSpend, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Total Profit</p>
                <p className="text-lg font-bold text-green-600">
                  ${(sortedLineItems.reduce((sum, item) => sum + item.clientBudget, 0) - sortedLineItems.reduce((sum, item) => sum + item.dspSpend, 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Redistribution Modal */}
      <Dialog open={showRedistributeModal} onOpenChange={setShowRedistributeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Remaining Line Items?</DialogTitle>
            <DialogDescription>
              You've manually adjusted {pendingEdit?.field === 'impressions' ? 'impressions' : 'client budget'} for one line item.
              This will affect the total allocation. How would you like to adjust the remaining line items?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => {
              setShowRedistributeModal(false);
              setPendingEdit(null);
            }}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleManualAdjustment}>
              Manual Adjustment
            </Button>
            <Button onClick={handleRedistributeEvenly}>
              Redistribute Evenly
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Tactic Modal */}
      <Dialog open={showChangeTacticModal} onOpenChange={setShowChangeTacticModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Line Item to Different Tactic</DialogTitle>
            <DialogDescription>
              Select the tactic where you want to move this line item
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tactic</Label>
              <Select
                value={itemToChangeTactic?.tactic || ''}
                onValueChange={handleChangeTactic}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tactic..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conquesting">Conquesting</SelectItem>
                  <SelectItem value="Prospecting">Prospecting</SelectItem>
                  <SelectItem value="Retargeting">Retargeting</SelectItem>
                  <SelectItem value="Event Targeting">Event Targeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
