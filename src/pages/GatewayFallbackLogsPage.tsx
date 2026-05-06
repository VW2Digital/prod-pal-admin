import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { RefreshCw, Search, Trash2, Shuffle, CheckCircle2, XCircle } from 'lucide-react';

interface FallbackLog {
  id: string;
  created_at: string;
  order_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  payment_method: string | null;
  amount: number | null;
  original_gateway: string;
  fallback_gateway: string;
  reason: string | null;
  outcome: string;
  outcome_message: string | null;
  metadata: any;
}

const GATEWAY_LABEL: Record<string, string> = {
  asaas: 'Asaas',
  mercadopago: 'Mercado Pago',
  pagbank: 'PagBank',
  pagarme: 'Pagar.me',
};

const GatewayFallbackLogsPage = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<FallbackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('gateway_fallback_logs' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    } else {
      setLogs((data || []) as unknown as FallbackLog[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.customer_email, l.customer_name, l.original_gateway, l.fallback_gateway, l.reason, l.outcome_message, l.order_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [logs, search]);

  const stats = useMemo(() => {
    const total = logs.length;
    const ok = logs.filter((l) => l.outcome === 'success').length;
    const fail = logs.filter((l) => l.outcome === 'failure').length;
    const rate = total === 0 ? 0 : Math.round((ok / total) * 100);
    return { total, ok, fail, rate };
  }, [logs]);

  const handleDelete = async (id: string) => {
    const confirm = window.prompt('Digite EXCLUIR para confirmar a remoção deste log:');
    if (confirm !== 'EXCLUIR') return;
    const { error } = await supabase.from('gateway_fallback_logs' as any).delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast({ title: 'Log removido' });
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Fallbacks de Gateway"
        description="Histórico de tentativas de pagamento que migraram para um gateway alternativo após rejeição."
        icon={<Shuffle className="w-6 h-6" />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.total}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Recuperados</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-green-600">{stats.ok}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Falhas no fallback</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-destructive">{stats.fail}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Taxa de recuperação</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{stats.rate}%</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Eventos ({filtered.length})</CardTitle>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por e-mail, gateway, motivo…" className="pl-8 w-64" />
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Gateway original</TableHead>
                <TableHead>Gateway alternativo</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Motivo / Mensagem</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && !loading ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum fallback registrado ainda.</TableCell></TableRow>
              ) : filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{l.customer_name || '—'}</div>
                    <div className="text-muted-foreground">{l.customer_email || '—'}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{GATEWAY_LABEL[l.original_gateway] || l.original_gateway}</Badge></TableCell>
                  <TableCell><Badge>{GATEWAY_LABEL[l.fallback_gateway] || l.fallback_gateway}</Badge></TableCell>
                  <TableCell>
                    {l.outcome === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Recuperado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium"><XCircle className="w-3.5 h-3.5" /> Falhou</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md text-xs">
                    <div className="text-muted-foreground">orig.: {l.reason || '—'}</div>
                    {l.outcome_message ? <div>resp.: {l.outcome_message}</div> : null}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{l.amount != null ? `R$ ${Number(l.amount).toFixed(2)}` : '—'}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(l.id)} aria-label="Excluir log">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GatewayFallbackLogsPage;