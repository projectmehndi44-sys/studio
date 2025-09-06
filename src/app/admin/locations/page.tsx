
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, MapPin, Save } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { INDIA_LOCATIONS } from '@/lib/india-locations';
import { AVAILABLE_LOCATIONS } from '@/lib/available-locations';

export default function LocationManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedLocations, setSelectedLocations] = React.useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = React.useState(false);

     React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        
        // Load saved locations from localStorage, or use defaults if none are saved
        const savedLocations = localStorage.getItem('availableLocations');
        if (savedLocations) {
            setSelectedLocations(JSON.parse(savedLocations));
        } else {
            setSelectedLocations(AVAILABLE_LOCATIONS);
        }
    }, [router]);
    
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
    
    const handleSave = () => {
        setIsLoading(true);
        // Save the selected locations to localStorage to persist them.
        localStorage.setItem('availableLocations', JSON.stringify(selectedLocations));
        
        // Dispatch a storage event to notify other components if they need to update
        window.dispatchEvent(new Event('storage'));

        setTimeout(() => {
            toast({
                title: 'Locations Saved',
                description: 'The list of available service locations has been updated.',
            });
            setIsLoading(false);
        }, 1000);
    };

    const allStates = Object.keys(INDIA_LOCATIONS);

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Admin Portal
                </h1>
                <Link href="/admin">
                     <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                 <Card className="max-w-4xl mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <MapPin className="w-6 h-6 text-primary"/> Location Management
                        </CardTitle>
                        <CardDescription>
                            Select the states and districts where you will provide services. Artists and customers will only be able to register in these locations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
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
                            <Button onClick={handleSave} disabled={isLoading} className="w-full">
                                {isLoading ? 'Saving...' : <><Save className="mr-2 h-4 w-4"/> Save Changes</>}
                            </Button>
                       </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
