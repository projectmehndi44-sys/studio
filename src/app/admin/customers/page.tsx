
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, XCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Customer } from '@/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { initialCustomers } from '@/lib/data';

type CustomerWithStatus = Customer & { status: 'Active' | 'Suspended'; registeredOn: string; };

export default function CustomerManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [customers, setCustomers] = React.useState<CustomerWithStatus[]>([]);

    const fetchCustomers = React.useCallback(() => {
        const storedCustomers = JSON.parse(localStorage.getItem('customers') || JSON.stringify(initialCustomers));
        // Add mock status and registration date for UI
        setCustomers(storedCustomers.map((c: Customer) => ({
            ...c,
            status: c.name.includes('Sunita') ? 'Suspended' : 'Active', // Mocked status
            registeredOn: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toLocaleDateString() // Mocked date
        })));
    }, []);

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        } else {
            fetchCustomers();
            window.addEventListener('storage', fetchCustomers);
            return () => window.removeEventListener('storage', fetchCustomers);
        }
    }, [router, fetchCustomers]);
    
    const handleAction = (action: string, customerId: string) => {
        toast({
            title: `Action: ${action}`,
            description: `Performed '${action}' on customer ${customerId}. (This is a mock action)`,
        });
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Customer Management</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Registered Customers</CardTitle>
                    <CardDescription>
                        View and manage all customer accounts on the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Registered On</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.name}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{customer.email}</span>
                                            <span className="text-muted-foreground">{customer.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.registeredOn}</TableCell>
                                    <TableCell>
                                        <Badge variant={customer.status === 'Active' ? 'default' : 'destructive'}>
                                            {customer.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onSelect={() => handleAction('Suspend', customer.id)}>
                                                    <XCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                                    Suspend
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => handleAction('Delete', customer.id)}>
                                                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}
