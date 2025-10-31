
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, XCircle, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import type { Customer } from '@/lib/types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';
import { listenToCollection, updateCustomer, deleteCustomer } from '@/lib/services';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Timestamp } from 'firebase/firestore';


export default function CustomerManagementPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [customers, setCustomers] = React.useState<Customer[]>([]);
    const [dialogState, setDialogState] = React.useState<{ type: 'suspend' | 'delete' | null, data: Customer | null }>({ type: null, data: null });

    React.useEffect(() => {
        const unsubscribe = listenToCollection<Customer>('customers', setCustomers);
        return () => unsubscribe();
    }, []);

    const confirmAction = async () => {
        if (!dialogState.data || !dialogState.type) return;
        const { type, data } = dialogState;

        try {
            if (type === 'suspend') {
                const newStatus = data.status === 'Suspended' ? 'Active' : 'Suspended';
                await updateCustomer(data.id, { status: newStatus });
                toast({ title: 'Customer Status Updated', description: `${data.name}'s status is now ${newStatus}.` });
            } else if (type === 'delete') {
                await deleteCustomer(data.id);
                toast({ title: 'Customer Deleted', description: `${data.name} has been permanently removed.`, variant: 'destructive' });
            }
        } catch (error: any) {
             toast({ title: 'Action Failed', description: error.message, variant: 'destructive' });
        } finally {
            setDialogState({ type: null, data: null });
        }
    };
    
    const getRegisteredDate = (customer: Customer) => {
        if (customer.createdOn && customer.createdOn instanceof Timestamp) {
            return customer.createdOn.toDate().toLocaleDateString();
        }
        // Fallback for older data that might not have this field
        return 'N/A';
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
                                {hasPermission('customers', 'edit') && (
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/admin/customers/${customer.id}`} className="hover:underline text-primary">
                                            {customer.name || 'N/A'}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{customer.email}</span>
                                            <span className="text-muted-foreground">{customer.phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getRegisteredDate(customer)}</TableCell>
                                    <TableCell>
                                        <Badge variant={customer.status === 'Active' ? 'default' : 'destructive'}>
                                            {customer.status || 'Active'}
                                        </Badge>
                                    </TableCell>
                                    {hasPermission('customers', 'edit') && (
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
                                                    <DropdownMenuItem onSelect={() => setDialogState({ type: 'suspend', data: customer })}>
                                                        <XCircle className="mr-2 h-4 w-4 text-yellow-500" />
                                                        {customer.status === 'Suspended' ? 'Reactivate' : 'Suspend'}
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem onSelect={() => setDialogState({ type: 'delete', data: customer })} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <AlertDialog open={!!dialogState.type} onOpenChange={() => setDialogState({type: null, data: null})}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           {dialogState.type === 'delete' && `This will permanently delete the customer '${dialogState.data?.name}'. This action cannot be undone.`}
                           {dialogState.type === 'suspend' && `This will ${dialogState.data?.status === 'Suspended' ? 'reactivate' : 'suspend'} the account for '${dialogState.data?.name}'.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmAction} className={dialogState.type === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}>
                           Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
