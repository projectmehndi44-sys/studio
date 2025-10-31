

'use client';

import * as React from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Package, PlusCircle, Trash2, Edit, Upload, IndianRupee, Tag } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { MasterServicePackage } from '@/lib/types';
import NextImage from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminAuth } from '@/firebase/auth/use-admin-auth';
import { Separator } from '@/components/ui/separator';
import { doc, setDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { getMasterServices, saveMasterServices } from '@/lib/services';

const categorySchema = z.object({
  name: z.enum(['Normal', 'Premium', 'Ultra Premium']),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  basePrice: z.coerce.number().min(0, 'Base price must be a positive number.'),
  image: z.any().optional(),
});

const packageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Package name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  service: z.enum(['mehndi', 'makeup', 'photography'], { required_error: 'Please select a service category.' }),
  tags: z.string().optional(), // Comma-separated tags
  image: z.any(),
  categories: z.array(categorySchema).min(1, 'At least one category is required.'),
});

type PackageFormValues = z.infer<typeof packageSchema>;

export default function PackageManagementPage() {
    const { toast } = useToast();
    const { hasPermission } = useAdminAuth();
    const [masterServices, setMasterServices] = React.useState<MasterServicePackage[]>([]);
    const [editingPackage, setEditingPackage] = React.useState<MasterServicePackage | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [categoryImagePreviews, setCategoryImagePreviews] = React.useState<Record<number, string | null>>({});

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageSchema),
        defaultValues: { name: '', description: '', tags: '', image: null, service: 'mehndi', categories: [
             { name: 'Normal', description: '', basePrice: 0, image: null },
             { name: 'Premium', description: '', basePrice: 0, image: null },
             { name: 'Ultra Premium', description: '', basePrice: 0, image: null },
        ]},
    });
    
    const { fields } = useFieldArray({
        control: form.control,
        name: "categories"
    });

    const fetchPackages = React.useCallback(async () => {
        const packages = await getMasterServices();
        setMasterServices(packages);
    }, []);

    React.useEffect(() => {
        fetchPackages();
    }, [fetchPackages]);
    
    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleCategoryImgeChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = event.target.files?.[0];
        if (file) {
            form.setValue(`categories.${index}.image`, file);
            setCategoryImagePreviews(prev => ({...prev, [index]: URL.createObjectURL(file)}));
        }
    }

    const onSubmit: SubmitHandler<PackageFormValues> = async (data) => {
        let updatedServices;
        const newPackageData: MasterServicePackage = {
            id: editingPackage ? editingPackage.id : `ms-${Date.now()}`,
            name: data.name,
            service: data.service,
            description: data.description,
            tags: data.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
            image: imagePreview || (editingPackage?.image) || 'https://picsum.photos/600/400?random=' + Date.now(),
            categories: data.categories.map((cat, index) => ({
                ...cat,
                image: categoryImagePreviews[index] || (editingPackage?.categories[index]?.image) || 'https://picsum.photos/200/200?random=' + (Date.now() + index),
            }))
        };

        if (editingPackage) {
            updatedServices = masterServices.map(p => p.id === editingPackage.id ? newPackageData : p);
            toast({ title: 'Master Service Updated', description: `Service "${data.name}" has been updated.` });
        } else {
            updatedServices = [...masterServices, newPackageData];
            toast({ title: 'Master Service Created', description: `Service "${data.name}" has been added.` });
        }
        
        await saveMasterServices(updatedServices);
        setMasterServices(updatedServices);
        handleCancelEdit();
    };

    const handleEdit = (pkg: MasterServicePackage) => {
        setEditingPackage(pkg);
        form.reset({
            id: pkg.id,
            name: pkg.name,
            service: pkg.service,
            description: pkg.description,
            tags: pkg.tags.join(', '),
            image: pkg.image,
            categories: pkg.categories,
        });
        setImagePreview(pkg.image);
        
        const previews: Record<number, string | null> = {};
        pkg.categories.forEach((cat, index) => {
            if(cat.image) previews[index] = cat.image;
        });
        setCategoryImagePreviews(previews);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this service package? This action cannot be undone.")) return;
        
        const updatedServices = masterServices.filter(p => p.id !== id);
        await saveMasterServices(updatedServices);
        setMasterServices(updatedServices);
        toast({ title: 'Master Service Deleted', variant: 'destructive' });
    };

    const handleCancelEdit = () => {
        setEditingPackage(null);
        setImagePreview(null);
        setCategoryImagePreviews({});
        form.reset({ name: '', description: '', tags: '', image: null, service: 'mehndi', categories: [
            { name: 'Normal', description: '', basePrice: 0 },
            { name: 'Premium', description: '', basePrice: 0 },
            { name: 'Ultra Premium', description: '', basePrice: 0 },
        ]});
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold md:text-2xl">Master Service Catalog</h1>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="w-6 h-6 text-primary"/> 
                                {editingPackage ? 'Edit Master Service' : 'Create New Master Service'}
                            </CardTitle>
                            <CardDescription>
                                {editingPackage ? 'Update the details for this service.' : 'Define a new service template that artists can offer.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {/* --- Basic Info --- */}
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Service Name</FormLabel><FormControl><Input placeholder="e.g., Bridal Mehendi" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the service..." {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="service" render={({ field }) => (
                                            <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl><SelectContent><SelectItem value="mehndi">Mehendi</SelectItem><SelectItem value="makeup">Makeup</SelectItem><SelectItem value="photography">Photography</SelectItem></SelectContent></Select></FormItem>
                                        )} />
                                        <FormField control={form.control} name="tags" render={({ field }) => (
                                            <FormItem><FormLabel>Tags</FormLabel><div className="relative"><Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><FormControl><Input placeholder="e.g., Bridal, Wedding" {...field} className="pl-8"/></FormControl></div><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="image" render={() => (
                                        <FormItem><FormLabel>Default Image</FormLabel><div className="flex items-center gap-4"><div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-accent flex-1"><Upload className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-2 text-xs text-muted-foreground">Click to upload</p><FormControl><Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} ref={fileInputRef} /></FormControl></div>{imagePreview && (<div className="w-24 h-24 rounded-md overflow-hidden border shrink-0"><NextImage src={imagePreview} alt="Preview" width={96} height={96} className="w-full h-full object-cover" /></div>)}</div><FormMessage /></FormItem>
                                    )} />
                                    
                                    <Separator />

                                    {/* --- Tiers / Categories --- */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Service Tiers</h3>
                                        {fields.map((field, index) => (
                                            <Card key={field.id} className="p-4 bg-muted/50">
                                                <div className="flex justify-between items-center mb-2">
                                                    <h4 className="font-semibold text-primary">{field.name} Tier</h4>
                                                </div>
                                                <FormField control={form.control} name={`categories.${index}.description`} render={({ field }) => (
                                                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe what's included in this tier" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                 <FormField control={form.control} name={`categories.${index}.basePrice`} render={({ field }) => (
                                                    <FormItem className="mt-2"><FormLabel>Base Price (Floor Price)</FormLabel><div className="relative"><IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/><FormControl><Input type="number" placeholder="5000" {...field} className="pl-8"/></FormControl></div><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name={`categories.${index}.image`} render={({field}) => (
                                                    <FormItem className="mt-2">
                                                        <FormLabel>Tier Image</FormLabel>
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-2 text-center hover:border-accent flex-1">
                                                                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                                                                <FormControl><Input type="file" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleCategoryImgeChange(e, index)}/></FormControl>
                                                            </div>
                                                            { (categoryImagePreviews[index] || field.value) && (
                                                                <div className="w-16 h-16 rounded-md overflow-hidden border shrink-0">
                                                                    <NextImage src={categoryImagePreviews[index] || (field.value as string)} alt="Preview" width={64} height={64} className="w-full h-full object-cover" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <FormMessage/>
                                                    </FormItem>
                                                )} />
                                            </Card>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        {editingPackage && <Button type="button" variant="outline" onClick={handleCancelEdit} className="w-full">Cancel</Button>}
                                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !hasPermission('packages', 'edit')}>
                                            {editingPackage ? <><Edit className="mr-2 h-4 w-4"/> Update Service</> : <><PlusCircle className="mr-2 h-4 w-4"/>Create Service</>}
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
                            <CardTitle>Existing Master Services</CardTitle>
                            <CardDescription>These are the templates artists can choose to offer.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {masterServices.length > 0 ? masterServices.map(pkg => (
                                <Card key={pkg.id} className="overflow-hidden group flex">
                                    <div className="relative shrink-0">
                                        <NextImage src={pkg.image} alt={pkg.name} width={150} height={150} className="w-40 h-full object-cover" />
                                    </div>
                                    <div className="flex flex-col flex-grow">
                                        <CardHeader className="flex flex-row justify-between items-start">
                                            <div>
                                                <CardTitle>{pkg.name}</CardTitle>
                                                <CardDescription className="text-sm">{pkg.description}</CardDescription>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(pkg)} disabled={!hasPermission('packages', 'edit')}><Edit className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(pkg.id)} disabled={!hasPermission('packages', 'edit')}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-3 gap-2 flex-grow">
                                             {pkg.categories.map(cat => (
                                                <div key={cat.name} className="p-2 border rounded-md bg-background relative overflow-hidden aspect-square flex flex-col justify-end">
                                                    {cat.image && <NextImage src={cat.image} alt={cat.name} fill={true} className="object-cover -z-10"/>}
                                                    <div className="bg-black/40 text-white p-1 rounded">
                                                        <h4 className="font-semibold text-white">{cat.name}</h4>
                                                        <p className="text-xs text-white/80 line-clamp-2">{cat.description}</p>
                                                        <p className="text-sm font-bold mt-1">₹{cat.basePrice.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                             ))}
                                        </CardContent>
                                    </div>
                                </Card>
                            )) : (
                                <p className="text-muted-foreground text-center py-8">No master services have been created yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
