
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Save } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { INDIA_LOCATIONS } from '@/lib/india-locations';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { getDocument, setConfigDocument } from '@/lib/services';

async function getSavedLocations(): Promise<Record<string, string[]>> {
    const config = await getDocument<{ locations: Record<string, string[]> }>('config', 'availableLocations');
    return config?.locations || {};
}

async function saveAvailableLocations(locations: Record<string, string[]>): Promise<void> {
    await setConfigDocument('availableLocations', { locations });
}


export default function LocationManagementPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [selectedLocations, setSelectedLocations] = React.useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = React.useState(false);
    const [isLoadingData, setIsLoadingData] = React.useState(true);

     React.useEffect(() => {
        getSavedLocations().then(locations => {
            setSelectedLocations(locations);
            setIsLoadingData(false);
        });
    }, []);
    
    const handleStateChange = (state: string, checked: boolean | 'indeterminate') => {
        setSelectedLocations(prev => {
            const newState = { ...prev };
            if (checked) {
                // Select all districts in that state
                newState[state] = INDIA_LOCATIONS[state];
            } else {
                // Deselect all districts in that state
                delete newState[state];
            }
            return newState;
        });
    };

    const handleDistrictChange = (state: string, district: string, checked: boolean) => {
        setSelectedLocations(prev => {
            const newState = { ...prev };
            const districtsInState = newState[state] || [];

            if (checked) {
                if (!districtsInState.includes(district)) {
                    newState[state] = [...districtsInState, district];
                }
            } else {
                newState[state] = districtsInState.filter(d => d !== district);
                if (newState[state].length === 0) {
                    delete newState[state];
                }
            }
            return newState;
        });
    };
    
    const handleSave = async () => {
        setIsLoading(true);
        try {
            await saveAvailableLocations(selectedLocations);
            toast({
                title: 'Locations Saved',
                description: 'The list of available service locations has been updated.',
            });
        } catch (error) {
             console.error("Failed to save locations:", error);
             toast({
                title: 'Error Saving Locations',
                description: 'Could not update the locations in the database.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const allStates = Object.keys(INDIA_LOCATIONS);

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Location Management</h1>
            </div>
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-primary"/> Available Locations
                    </CardTitle>
                    <CardDescription>
                        Select the states and districts where you will provide services. Artists and customers will only be able to register in these locations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoadingData ? (
                            <p>Loading saved locations...</p>
                        ) : (
                        <Accordion type="multiple" className="w-full">
                            {allStates.map(state => {
                                const allDistrictsInState = INDIA_LOCATIONS[state];
                                const selectedDistrictsInState = selectedLocations[state] || [];
                                const isAllSelected = allDistrictsInState && selectedDistrictsInState.length === allDistrictsInState.length;
                                const isIndeterminate = selectedDistrictsInState.length > 0 && !isAllSelected;

                                return (
                                    <AccordionItem value={state} key={state}>
                                        <div className="flex items-center gap-4 w-full border-b">
                                            <div className="flex items-center gap-4 py-4 pl-0">
                                                <Checkbox 
                                                    id={`state-${state}`}
                                                    checked={isAllSelected}
                                                    onCheckedChange={(checked) => handleStateChange(state, checked)}
                                                    data-state={isIndeterminate ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                                                />
                                            </div>
                                            <AccordionTrigger className="flex-1 text-left py-4 hover:no-underline border-none">
                                                <Label htmlFor={`state-${state}`} className="font-bold text-lg cursor-pointer">{state}</Label>
                                            </AccordionTrigger>
                                        </div>
                                        <AccordionContent>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 pl-12 bg-muted/50 rounded-md">
                                                {allDistrictsInState.map(district => (
                                                    <div className="flex items-center space-x-2" key={district}>
                                                        <Checkbox
                                                            id={`dist-${state}-${district}`}
                                                            checked={selectedDistrictsInState.includes(district)}
                                                            onCheckedChange={(checked) => handleDistrictChange(state, district, !!checked)}
                                                        />
                                                        <Label htmlFor={`dist-${state}-${district}`}>{district}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                        )}
                        <Button onClick={handleSave} disabled={isLoading || !hasPermission('settings', 'edit')} className="w-full">
                            {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
