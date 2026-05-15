import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, ArrowLeft, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Lead {
  id: string; name: string; email: string; phone: string | null;
  created_at: string; converted_order_id: string | null;
}

export default function FlashCampaignLeadsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaignTitle, setCampaignTitle] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONVERTED' | 'NOT_CONVERTED'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const PAGE_SIZE = 30;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: c }, { data: ls }] = await Promise.all([
        supabase.from('flash_campaigns' as any).select('title').eq('id', id).maybeSingle(),
        supabase.from('flash_campaign_leads' as any).select('*').eq('campaign_id', id).order('created_at', { ascending: false }),
      ]);
      setCampaignTitle((c as any)?.title || '');
      setLeads((ls as any) || []);
      setLoading(false);
    })();
  }, [id]);

  const filtered = leads.filter(l => {
    if (q.trim()) {
      const s = q.toLowerCase();
      const match = l.name.toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || (l.phone || '').includes(s);
      if (!match) return false;
    }
    if (filterStatus === 'CONVERTED' && !l.converted_order_id) return false;
    if (filterStatus === 'NOT_CONVERTED' && l.converted_order_id) return false;
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00').getTime();
      if (new Date(l.created_at).getTime() < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59').getTime();
      if (new Date(l.created_at).getTime() > to) return false;
    }
    return true;
  });

  useEffect(() => { setPage(1); }, [q, filterStatus, dateFrom, dateTo]);

  const hasFilters = !!(q || filterStatus !== 'ALL' || dateFrom || dateTo);
  const clearFilters = () => { setQ(''); setFilterStatus('ALL'); setDateFrom(''); setDateTo(''); };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const exportCsv = () => {
    const header = 'Nome,Email,WhatsApp,Data\n';
    const rows = filtered.map(l => `"${l.name}","${l.email}","${l.phone || ''}","${new Date(l.created_at).toLocaleString('pt-BR')}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${campaignTitle || id}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={Users}
        title={`Leads — ${campaignTitle}`}
        description={`${leads.length} lead(s) capturado(s)`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/campanhas-relampago')}>
              <ArrowLeft className="w-4 h-4 mr-2" />Voltar
            </Button>
            <Button onClick={exportCsv} disabled={!filtered.length}>
              <Download className="w-4 h-4 mr-2" />Exportar CSV
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5 lg:col-span-1">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Buscar</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Nome, email ou telefone" className="pl-9" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Comprou?</label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="CONVERTED">Comprou</SelectItem>
                  <SelectItem value="NOT_CONVERTED">Não comprou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data início</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('h-9 text-sm w-full justify-start font-normal', !dateFrom && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(parseISO(dateFrom), 'dd/MM/yyyy') : 'Selecionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker mode="single" locale={ptBR} selected={dateFrom ? parseISO(dateFrom) : undefined} onSelect={(d) => d && setDateFrom(d.toISOString().slice(0, 10))} initialFocus className={cn('p-3 pointer-events-auto')} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data fim</label>
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('h-9 text-sm w-full justify-start font-normal', !dateTo && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(parseISO(dateTo), 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker mode="single" locale={ptBR} selected={dateTo ? parseISO(dateTo) : undefined} onSelect={(d) => d && setDateTo(d.toISOString().slice(0, 10))} initialFocus className={cn('p-3 pointer-events-auto')} />
                  </PopoverContent>
                </Popover>
                {hasFilters && (
                  <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={clearFilters} aria-label="Limpar filtros">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Nenhum lead encontrado.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Comprou?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell>{l.email}</TableCell>
                    <TableCell>{l.phone || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{l.converted_order_id ? <span className="text-success font-medium">Sim</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Mostrando {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} de {filtered.length}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
