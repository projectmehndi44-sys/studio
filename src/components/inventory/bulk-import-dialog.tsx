"use client";

import { useState, useRef } from 'react';
import { 
  X, 
  FileUp, 
  ClipboardPaste, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileText,
  Table as TableIcon
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/types';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingProducts: Product[];
}

interface ImportItem {
  name: string;
  price: number;
  stock?: number;
  category: string;
  isValid: boolean;
  error?: string;
  existingId?: string;
}

export function BulkImportDialog({ isOpen, onClose, existingProducts }: BulkImportDialogProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [importData, setImportData] = useState<ImportItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [importMode, setImportMode] = useState<'skip' | 'update'>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseLine = (line: string): ImportItem | null => {
    if (!line.trim()) return null;
    const parts = line.split(',').map(p => p.trim());
    
    const name = parts[0] || '';
    const priceRaw = parts[1] || '0';
    const price = parseFloat(priceRaw.replace(/[^\d.]/g, '')) || 0;
    const stockRaw = parts[2] || '';
    const stock = stockRaw ? parseInt(stockRaw.replace(/[^\d]/g, '')) : undefined;
    const category = parts[3] || 'General';

    const existing = existingProducts.find(p => p.name.toLowerCase() === name.toLowerCase());

    return {
      name,
      price,
      stock,
      category,
      isValid: !!name && price > 0,
      existingId: existing?.id,
      error: !name ? 'Missing Name' : price <= 0 ? 'Invalid Price' : undefined
    };
  };

  const handlePasteProcess = () => {
    const lines = pasteText.split('\n');
    const items = lines.map(parseLine).filter((i): i is ImportItem => i !== null);
    setImportData(items);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      const items: ImportItem[] = data.slice(1).map(row => {
        const name = String(row[0] || '').trim();
        const price = parseFloat(String(row[1] || '0').replace(/[^\d.]/g, '')) || 0;
        const stock = row[2] !== undefined ? parseInt(String(row[2]).replace(/[^\d]/g, '')) : undefined;
        const category = String(row[3] || 'General').trim();

        const existing = existingProducts.find(p => p.name.toLowerCase() === name.toLowerCase());

        return {
          name,
          price,
          stock,
          category,
          isValid: !!name && price > 0,
          existingId: existing?.id,
          error: !name ? 'Missing Name' : price <= 0 ? 'Invalid Price' : undefined
        };
      }).filter(i => i.name !== '');

      setImportData(items);
    };
    reader.readAsBinaryString(file);
  };

  const handleCommit = async () => {
    setIsProcessing(true);
    const validItems = importData.filter(i => i.isValid);
    let added = 0;
    let updated = 0;

    validItems.forEach(item => {
      const data = {
        name: item.name,
        price: item.price,
        costPrice: item.price * 0.8,
        stock: item.stock ?? null,
        category: item.category,
        isActive: true,
        updatedAt: new Date().toISOString()
      };

      if (item.existingId) {
        if (importMode === 'update') {
          updateDocumentNonBlocking(doc(db, 'products', item.existingId), data);
          updated++;
        }
      } else {
        addDocumentNonBlocking(collection(db, 'products'), {
          ...data,
          createdAt: new Date().toISOString()
        });
        added++;
      }
    });

    toast({ title: "Import Successful", description: `Enrolled ${added} new items and refreshed ${updated} existing records.` });
    setIsProcessing(false);
    onClose();
    setImportData([]);
    setPasteText('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl rounded-[40px] p-0 border-none shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
        <DialogHeader className="p-10 border-b bg-slate-50/50 flex flex-row items-center justify-between shrink-0">
          <div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-secondary">Bulk Importer</DialogTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Excel, CSV, or Text Paste Supported</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="rounded-2xl h-12 w-12 p-0"><X className="h-6 w-6" /></Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          <Tabs defaultValue="paste" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-10 pt-8 flex items-center justify-between shrink-0">
              <TabsList className="bg-slate-100 p-1 rounded-2xl h-14">
                <TabsTrigger value="paste" className="rounded-xl px-8 font-bold text-[10px] uppercase gap-2"><ClipboardPaste className="h-4 w-4" /> Pasteboard</TabsTrigger>
                <TabsTrigger value="file" className="rounded-xl px-8 font-bold text-[10px] uppercase gap-2"><FileUp className="h-4 w-4" /> File Upload</TabsTrigger>
              </TabsList>
              {importData.length > 0 && (
                <div className="flex items-center gap-3 animate-in fade-in">
                   <p className="text-[10px] font-black uppercase text-slate-400">Handle Duplicates:</p>
                   <Select value={importMode} onValueChange={(v: any) => setImportMode(v)}>
                     <SelectTrigger className="h-10 w-32 border-none bg-slate-50 rounded-xl font-bold text-[9px] uppercase"><SelectValue /></SelectTrigger>
                     <SelectContent className="rounded-xl"><SelectItem value="skip">Skip New</SelectItem><SelectItem value="update">Overwrite</SelectItem></SelectContent>
                   </Select>
                </div>
              )}
            </div>

            <TabsContent value="paste" className="flex-1 overflow-hidden p-10 flex flex-col gap-6">
              <Textarea 
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Format: Item Name, Price, Qty (opt), Category&#10;Amul Milk, 28, 50, Dairy&#10;Maggi, 14, 100, Staples"
                className="flex-1 bg-slate-50 border-none rounded-2xl p-6 font-mono text-xs focus-visible:ring-primary/20"
              />
              <Button onClick={handlePasteProcess} className="h-14 rounded-2xl font-black uppercase text-[10px] bg-secondary text-white shadow-xl">Process Pasteboard</Button>
            </TabsContent>

            <TabsContent value="file" className="flex-1 overflow-hidden p-10 flex flex-col items-center justify-center gap-6">
              <div onClick={() => fileInputRef.current?.click()} className="w-full max-w-lg aspect-video border-4 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-slate-50 transition-all group">
                <FileText className="h-12 w-12 text-slate-300 group-hover:scale-110 transition-transform" />
                <div className="text-center"><h4 className="text-sm font-black text-secondary uppercase">Select Spreadsheet</h4><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Excel (.xlsx) or CSV</p></div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
              </div>
            </TabsContent>
          </Tabs>

          {importData.length > 0 && (
            <div className="px-10 pb-10 flex-1 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-4"><TableIcon className="h-4 w-4 text-primary" /><h3 className="text-[10px] font-black uppercase text-secondary">Audit Preview ({importData.length} items)</h3></div>
              <div className="flex-1 border border-slate-100 rounded-[28px] overflow-hidden">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0"><TableRow className="border-none"><TableHead className="text-[9px] font-black uppercase h-10">Item</TableHead><TableHead className="text-[9px] font-black uppercase h-10">Price</TableHead><TableHead className="text-[9px] font-black uppercase h-10 text-right">Status</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {importData.map((item, idx) => (
                        <TableRow key={idx} className={cn("border-slate-50", !item.isValid && "bg-primary/5")}>
                          <TableCell className="font-bold text-xs">{item.name}</TableCell><TableCell className="font-bold text-xs">₹{item.price}</TableCell>
                          <TableCell className="text-right">{item.isValid ? <Badge variant="outline" className="text-[8px] uppercase">{item.existingId ? 'Update' : 'New'}</Badge> : <Badge variant="destructive" className="text-[8px] uppercase">{item.error}</Badge>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-10 bg-slate-50/50 border-t shrink-0">
          <div className="flex items-center justify-between w-full">
            <p className="text-[9px] font-bold uppercase text-slate-400 max-w-[300px]">Rows highlighted in red will be skipped during synchronization.</p>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setImportData([])} className="h-14 px-8 rounded-2xl font-bold uppercase text-[10px] text-slate-400">Clear</Button>
              <Button disabled={isProcessing || importData.length === 0} onClick={handleCommit} className="h-14 px-10 rounded-2xl font-black uppercase text-[10px] bg-primary text-white shadow-xl gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Synchronize Ledger
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}