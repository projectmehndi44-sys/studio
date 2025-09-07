
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Shield, ArrowLeft, Package, PlusCircle, Trash2, Edit, Upload, Image as ImageIcon, DollarSign, Tag } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { MehndiPackage } from '@/types';
import { packages as initialPackages } from '@/lib/packages-data';
import NextImage from 'next/image';

const packageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Package name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.'),
  tags: z.string().optional(), // Comma-separated tags
  image: z.any(),
});

type PackageFormValues = z.infer<typeof packageSchema>;

export default function PackageManagementPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [packages, setPackages] = React.useState<MehndiPackage[]>([]);
    const [editingPackage, setEditingPackage] = React.useState<MehndiPackage | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageSchema),
        defaultValues: { name: '', description: '', price: 0, tags: '', image: null },
    });

    React.useEffect(() => {
        const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated');
        if (isAdminAuthenticated !== 'true') {
            router.push('/admin/login');
        }
        
        const storedPackages = localStorage.getItem('mehndiPackages');
        setPackages(storedPackages ? JSON.parse(storedPackages) : initialPackages);
    }, [router]);
    
    const savePackages = (updatedPackages: MehndiPackage[]) => {
        setPackages(updatedPackages);
        localStorage.setItem('mehndiPackages', JSON.stringify(updatedPackages));
    }

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const onSubmit: SubmitHandler<PackageFormValues> = (data) => {
        const newPackage: MehndiPackage = {
            id: editingPackage?.id || `pkg_${Date.now()}`,
            name: data.name,
            description: data.description,
            price: data.price,
            tags: data.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
            image: imagePreview || editingPackage?.image || 'https://picsum.photos/600/400?random=1' // fallback
        };

        let updatedPackages;
        if (editingPackage) {
            updatedPackages = packages.map(p => p.id === editingPackage.id ? newPackage : p);
            toast({ title: 'Package Updated', description: `Package "${data.name}" has been updated.` });
        } else {
            updatedPackages = [newPackage, ...packages];
            toast({ title: 'Package Created', description: `Package "${data.name}" has been added.` });
        }
        
        savePackages(updatedPackages);
        setEditingPackage(null);
        setImagePreview(null);
        form.reset({ name: '', description: '', price: 0, tags: '', image: null });
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEdit = (pkg: MehndiPackage) => {
        setEditingPackage(pkg);
        form.reset({
            id: pkg.id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            tags: pkg.tags.join(', '),
            image: pkg.image,
        });
        setImagePreview(pkg.image);
    };

    const handleDelete = (id: string) => {
        const updated = packages.filter(p => p.id !== id);
        savePackages(updated);
        toast({ title: 'Package Deleted', variant: 'destructive' });
    };

    const handleCancelEdit = () => {
        setEditingPackage(null);
        setImagePreview(null);
        form.reset({ name: '', description: '', price: 0, tags: '', image: null });
        if(fileInputRef.current) fileInputRef.current.value = "";
    }


    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
                <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
                    <Shield className="w-6 h-6" />
                    Package Management
                </h1>
                <Link href="/admin/settings">
                     <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Settings</Button>
                </Link>
            </header>
            <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
                <div className="max-w-7xl mx-auto grid gap-6 py-6 lg:grid-cols-3">
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="w-6 h-6 text-primary"/> 
                                    {editingPackage ? 'Edit Package' : 'Create New Package'}
                                </CardTitle>
                                <CardDescription>
                                    {editingPackage ? 'Update the details for this package.' : 'Add a new service package to your catalog.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem><FormLabel>Package Name</FormLabel><FormControl><Input placeholder="e.g., Bridal Mehndi" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="description" render={({ field }) => (
                                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the package..." {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="price" render={({ field }) => (
                                            <FormItem><FormLabel>Price</FormLabel><div className="relative"><DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><FormControl><Input type="number" placeholder="5000" {...field} className="pl-8"/></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="tags" render={({ field }) => (
                                            <FormItem><FormLabel>Tags</FormLabel><div className="relative"><Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><FormControl><Input placeholder="e.g., Organic Henna, Both Sides" {...field} className="pl-8"/></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="image" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Package Image</FormLabel>
                                                <div className="flex items-center gap-4">
                                                     <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent flex-1">
                                                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                                                        <p className="mt-2 text-xs text-muted-foreground">Click to upload</p>
                                                        <FormControl><Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} ref={fileInputRef} /></FormControl>
                                                    </div>
                                                    {imagePreview && (
                                                        <div className="w-24 h-24 rounded-md overflow-hidden border shrink-0">
                                                            <NextImage src={imagePreview} alt="Preview" width={96} height={96} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <div className="flex gap-2">
                                            {editingPackage && <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full">Cancel</Button>}
                                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                                {editingPackage ? <><Edit className="mr-2 h-4 w-4"/> Update Package</> : <><PlusCircle className="mr-2 h-4 w-4"/>Create Package</>}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Existing Packages</CardTitle>
                                <CardDescription>Here are all the service packages currently in your catalog.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-4">
                                {packages.map(pkg => (
                                    <Card key={pkg.id} className="overflow-hidden group">
                                        <div className="relative">
                                            <NextImage src={pkg.image} alt={pkg.name} width={400} height={250} className="w-full object-cover aspect-video" />
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Button size="icon" variant="outline" className="bg-background/80" onClick={() => handleEdit(pkg)}><Edit className="h-4 w-4"/></Button>
                                                 <Button size="icon" variant="destructive" onClick={() => handleDelete(pkg.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                        </div>
                                        <CardHeader>
                                            <CardTitle>{pkg.name}</CardTitle>
                                            <CardDescription className="text-sm">₹{pkg.price.toLocaleString()}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {pkg.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

