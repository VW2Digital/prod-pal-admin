import { useState } from 'react';
import { Coins, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminCurrency, type AdminCurrency } from '@/contexts/AdminCurrencyContext';
import { toast } from 'sonner';

const OPTIONS: AdminCurrency[] = ['BRL', 'USD', 'EUR', 'GBP'];

export function AdminCurrencySwitcher() {
  const { currency, setCurrency, rates, setRates, meta } = useAdminCurrency();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(rates);

  const openRates = () => {
    setDraft(rates);
    setOpen(true);
  };

  const save = () => {
    setRates({
      BRL: 1,
      USD: Number(draft.USD) || 0,
      EUR: Number(draft.EUR) || 0,
      GBP: Number(draft.GBP) || 0,
    });
    toast.success('Taxas de câmbio atualizadas');
    setOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full h-9 px-3 gap-1.5 text-xs font-semibold"
            title="Trocar moeda exibida no painel"
          >
            <Coins className="h-4 w-4" />
            <span>{currency}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs">Moeda do painel</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {OPTIONS.map((c) => (
            <DropdownMenuItem
              key={c}
              onClick={() => setCurrency(c)}
              className="text-sm flex items-center justify-between"
            >
              <span>{meta[c].label}</span>
              {currency === c && <span className="text-primary text-xs font-bold">●</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openRates} className="text-sm">
            <Settings2 className="h-3.5 w-3.5 mr-2" />
            Ajustar taxas de câmbio
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Taxas de câmbio (1 BRL =)</DialogTitle>
            <DialogDescription>
              A conversão é apenas visual no painel administrativo. Pagamentos continuam processados em BRL.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(['USD', 'EUR', 'GBP'] as const).map((c) => (
              <div key={c} className="grid grid-cols-3 items-center gap-3">
                <Label htmlFor={`rate-${c}`} className="text-sm">
                  1 BRL = {meta[c].symbol}
                </Label>
                <Input
                  id={`rate-${c}`}
                  type="number"
                  step="0.0001"
                  min="0"
                  className="col-span-2"
                  value={draft[c]}
                  onChange={(e) => setDraft((d) => ({ ...d, [c]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
