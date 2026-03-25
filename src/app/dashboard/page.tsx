
"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  ArrowLeft,
  DollarSign,
  Users,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const HEATMAP_DATA = [
  { hour: '8 AM', sales: 12 },
  { hour: '10 AM', sales: 34 },
  { hour: '12 PM', sales: 56 },
  { hour: '2 PM', sales: 42 },
  { hour: '4 PM', sales: 88 },
  { hour: '6 PM', sales: 112 },
  { hour: '8 PM', sales: 95 },
  { hour: '10 PM', sales: 22 },
];

const DEAD_STOCK = [
  { name: 'Imported Biscuits', days: 68, value: 4500 },
  { name: 'Specialty Detergent', days: 62, value: 2100 },
  { name: 'Organic Honey', days: 61, value: 1800 },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background p-6 font-body">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-black text-foreground">SUPER 9+ INSIGHTS</h1>
              <p className="text-muted-foreground">Real-time performance and inventory analytics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Clock className="h-4 w-4" /> Last 7 Days
            </Button>
            <Button className="bg-primary text-primary-foreground font-bold">
              Export Report
            </Button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card border-none shadow-lg overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">Daily Revenue</p>
                  <h3 className="text-3xl font-black mt-1">₹1,24,500</h3>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold mt-2">
                    <TrendingUp className="h-4 w-4" /> +12.5% vs yesterday
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-lg overflow-hidden">
             <div className="h-1 bg-accent w-full" />
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">Net Profit</p>
                  <h3 className="text-3xl font-black mt-1 text-accent">₹18,675</h3>
                  <p className="text-xs text-muted-foreground mt-2">Profit Margin: 15%</p>
                </div>
                <div className="p-3 bg-accent/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">Footfall</p>
                  <h3 className="text-3xl font-black mt-1">428</h3>
                  <p className="text-xs text-muted-foreground mt-2">Peak: 6 PM - 8 PM</p>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-none shadow-lg">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase">Stock Status</p>
                  <h3 className="text-3xl font-black mt-1">94%</h3>
                  <div className="flex items-center gap-1 text-destructive text-sm font-bold mt-2">
                    <AlertTriangle className="h-4 w-4" /> 12 Low Items
                  </div>
                </div>
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <Package className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Heatmap */}
          <Card className="lg:col-span-2 bg-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-black uppercase">Hourly Sales Heatmap</CardTitle>
              <CardDescription>Busiest hours for staffing and inventory readiness</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={HEATMAP_DATA}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted)/0.3)" vertical={false} />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Dead Stock Alerts */}
          <Card className="bg-card border-none shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase">Dead Stock Alert</CardTitle>
                <CardDescription>Unsold for &gt;60 days</CardDescription>
              </div>
              <Badge variant="destructive" className="animate-pulse">Action Required</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {DEAD_STOCK.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.days} days idle</span>
                        <span>•</span>
                        <span className="font-medium">Valuation: ₹{item.value}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold border-accent text-accent hover:bg-accent hover:text-white">
                      Create Coupon
                    </Button>
                  </div>
                ))}
              </div>
              <Separator className="my-6 bg-border/50" />
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">AI Recommendation</p>
                <p className="text-sm leading-relaxed">
                  Generate a <span className="font-bold">"Buy 2 Get 1"</span> digital offer for regular dairy customers to clear the Imported Biscuits stock within 48 hours.
                </p>
                <Button variant="link" size="sm" className="p-0 h-auto mt-3 text-primary font-bold">
                  Execute AI Flow <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
