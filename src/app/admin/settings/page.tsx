

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Save, Percent, IndianRupee, Building, Mail, Phone, Globe } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getFinancialSettings, saveFinancialSettings, getCompanyProfile, saveCompanyProfile } from '@/lib/services';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();

    React.useEffect(() => {
        // This page is deprecated and its contents are moved. Redirect to the new pages.
        router.replace('/admin/financial-settings');
    }, [router]);

    // Render a loading state or null while redirecting
    return (
        <div className="flex items-center justify-center min-h-full">
            <p>Redirecting...</p>
        </div>
    );
}
