import React, { useState, useEffect } from 'react';
import { useStrategy } from '@/contexts/StrategyContext';
import { MonthlyBreakdown as MonthlyBreakdownType } from '@/types/strategy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Calendar } from 'lucide-react';

// Generate flights based on start and end dates (monthly increments)
const generateFlights = (startDate: string, endDate: string): { start: Date; end: Date; label: string }[] => {
  const flights: { start: Date; end: Date; label: string }[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentStart = new Date(start);

  while (currentStart < end) {
    // Calculate flight end: same day next month minus 1 day
    const currentEnd = new Date(currentStart);
    currentEnd.setMonth(currentEnd.getMonth() + 1);
    currentEnd.setDate(currentEnd.getDate() - 1);

    // If the calculated end exceeds the campaign end date, use campaign end date
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    const label = `${formatDate(currentStart)} to ${formatDate(currentEnd)}`;
    flights.push({ start: new Date(currentStart), end: new Date(currentEnd), label });

    // Move to next flight start (day after current end)
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }

  return flights;
};

const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

export const MonthlyBreakdown: React.FC = () => {
  const { currentStrategy, updateCurrentStrategy } = useStrategy();
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [flights, setFlights] = useState<MonthlyBreakdownType[]>([]);

  useEffect(() => {
    if (currentStrategy) {
      generateFlightsFromDates();
    }
  }, [currentStrategy?.campaignStartDate, currentStrategy?.campaignEndDate]);

  if (!currentStrategy) {
    return null;
  }

  const generateFlightsFromDates = () => {
    const flightPeriods = generateFlights(currentStrategy.campaignStartDate, currentStrategy.campaignEndDate);
    const numFlights = flightPeriods.length;

    if (numFlights === 0) {
      setFlights([]);
      return;
    }

    // Calculate even distribution
    const impressionsPerFlight = Math.floor(currentStrategy.impressionGoal / numFlights);
    const budgetPerFlight = currentStrategy.clientBudget / numFlights;
    const dspSpendPerFlight = currentStrategy.dspSpend / numFlights;
    const averageRpm = currentStrategy.impressionGoal > 0
      ? (currentStrategy.clientBudget / currentStrategy.impressionGoal) * 1000
      : 0;
    const averageDspBid = currentStrategy.impressionGoal > 0
      ? (currentStrategy.dspSpend / currentStrategy.impressionGoal) * 1000
      : 0;

    const newFlights: MonthlyBreakdownType[] = flightPeriods.map((flight, index) => ({
      id: `flight-${index}`,
      monthYear: flight.label,
      impressionsAllocation: impressionsPerFlight,
      rpmTarget: averageRpm,
      clientBudgetAllocation: budgetPerFlight,
      dspBidAllocation: averageDspBid,
      dspSpendAllocation: dspSpendPerFlight,
      profitMargin: budgetPerFlight - dspSpendPerFlight,
      order: index,
    }));

    setFlights(newFlights);
    updateCurrentStrategy({ monthlyBreakdowns: newFlights });
  };

  const handleCellEdit = (breakdown: MonthlyBreakdownType, field: keyof MonthlyBreakdownType, value: string) => {
    const numericFields = ['impressionsAllocation', 'rpmTarget', 'clientBudgetAllocation', 'dspBidAllocation', 'dspSpendAllocation', 'profitMargin'];

    let parsedValue: string | number = value;
    if (numericFields.includes(field)) {
      parsedValue = parseFloat(value) || 0;
    }

    // Auto-calculate derived values
    let updates: Partial<MonthlyBreakdownType> = { [field]: parsedValue };

    // Auto-calculate DSP Spend if impressions or DSP Bid changes
    if (field === 'impressionsAllocation' || field === 'dspBidAllocation') {
      const impressions = field === 'impressionsAllocation' ? (parsedValue as number) : breakdown.impressionsAllocation;
      const dspBid = field === 'dspBidAllocation' ? (parsedValue as number) : breakdown.dspBidAllocation;
      updates.dspSpendAllocation = (impressions / 1000) * dspBid;
    }

    // Auto-calculate Client Budget if impressions or RPM changes
    if (field === 'impressionsAllocation' || field === 'rpmTarget') {
      const impressions = field === 'impressionsAllocation' ? (parsedValue as number) : breakdown.impressionsAllocation;
      const rpm = field === 'rpmTarget' ? (parsedValue as number) : breakdown.rpmTarget;
      updates.clientBudgetAllocation = (impressions / 1000) * rpm;
    }

    // Auto-calculate profit margin
    const budget = updates.clientBudgetAllocation ?? breakdown.clientBudgetAllocation;
    const spend = updates.dspSpendAllocation ?? breakdown.dspSpendAllocation;
    updates.profitMargin = budget - spend;

    const updatedFlights = flights.map(f =>
      f.id === breakdown.id ? { ...f, ...updates } : f
    );

    setFlights(updatedFlights);
    updateCurrentStrategy({ monthlyBreakdowns: updatedFlights });
  };

  const renderEditableCell = (breakdown: MonthlyBreakdownType, field: keyof MonthlyBreakdownType) => {
    const isEditing = editingCell?.id === breakdown.id && editingCell?.field === field;
    let value = breakdown[field];

    // Format currency
    if (['clientBudgetAllocation', 'dspSpendAllocation', 'dspBidAllocation', 'rpmTarget', 'profitMargin'].includes(field) && typeof value === 'number') {
      return (
        <div className="text-right">
          {isEditing && field !== 'profitMargin' ? (
            <Input
              type="number"
              value={value}
              onChange={(e) => handleCellEdit(breakdown, field, e.target.value)}
              onBlur={() => setEditingCell(null)}
              className="h-8 w-full text-right"
              autoFocus
              step="0.01"
            />
          ) : (
            <span
              onClick={() => field !== 'profitMargin' && setEditingCell({ id: breakdown.id, field })}
              className={`${field !== 'profitMargin' ? 'cursor-pointer hover:bg-muted' : ''} px-2 py-1 rounded block ${field === 'profitMargin' && value >= 0 ? 'text-green-600 font-semibold' : field === 'profitMargin' ? 'text-red-600 font-semibold' : ''}`}
            >
              ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      );
    }

    // Format impressions
    if (field === 'impressionsAllocation' && typeof value === 'number') {
      return (
        <div className="text-right">
          {isEditing ? (
            <Input
              type="number"
              value={value}
              onChange={(e) => handleCellEdit(breakdown, field, e.target.value)}
              onBlur={() => setEditingCell(null)}
              className="h-8 w-full text-right"
              autoFocus
            />
          ) : (
            <span
              onClick={() => setEditingCell({ id: breakdown.id, field })}
              className="cursor-pointer hover:bg-muted px-2 py-1 rounded block"
            >
              {value.toLocaleString()}
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Campaign Flights
            </CardTitle>
            <CardDescription>
              Auto-generated monthly flights based on campaign dates
            </CardDescription>
          </div>
          <Button onClick={generateFlightsFromDates} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {flights.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Set campaign start and end dates in the Overview tab to generate flights.</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flight Period</TableHead>
                    <TableHead className="text-right">Impressions</TableHead>
                    <TableHead className="text-right">RPM</TableHead>
                    <TableHead className="text-right">Client Budget</TableHead>
                    <TableHead className="text-right">DSP Max Bid</TableHead>
                    <TableHead className="text-right">DSP Max Spend</TableHead>
                    <TableHead className="text-right">Profit Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flights.map((flight) => (
                    <TableRow key={flight.id}>
                      <TableCell className="font-medium">
                        {flight.monthYear}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(flight, 'impressionsAllocation')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(flight, 'rpmTarget')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(flight, 'clientBudgetAllocation')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(flight, 'dspBidAllocation')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(flight, 'dspSpendAllocation')}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(flight, 'profitMargin')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {flights.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Total Impressions</p>
                    <p className="text-lg font-bold">
                      {flights.reduce((sum, f) => sum + f.impressionsAllocation, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Total Client Budget</p>
                    <p className="text-lg font-bold">
                      ${flights.reduce((sum, f) => sum + f.clientBudgetAllocation, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Total DSP Max Spend</p>
                    <p className="text-lg font-bold">
                      ${flights.reduce((sum, f) => sum + f.dspSpendAllocation, 0).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Total Profit</p>
                    <p className="text-lg font-bold text-green-600">
                      ${flights.reduce((sum, f) => sum + f.profitMargin, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
