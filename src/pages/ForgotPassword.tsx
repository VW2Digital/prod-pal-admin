import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoImg from '@/assets/liberty-pharma-logo.png';
import { useLanguage } from '@/contexts/LanguageContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email, redirectBase: window.location.origin },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSent(true);
      toast({
        title: t('emailSent'),
        description: t('checkInboxToResetPassword'),
      });
    } catch (err: any) {
      toast({
        title: t('sendError'),
        description: err.message || t('couldNotSendRecoveryEmail'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border/50 bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/catalogo" className="flex items-center gap-2">
            <img src={logoImg} alt="Liberty Pharma" className="h-10 object-contain" />
          </Link>
          <Link to="/catalogo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {t('backToCatalog')}
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-border/50">
          <CardHeader className="text-center space-y-4 pb-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              {sent ? (
                <CheckCircle2 className="w-7 h-7 text-primary" />
              ) : (
                <Mail className="w-7 h-7 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {sent ? t('emailSent') : t('recoverPassword')}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {sent
                  ? t('resetCodeSentToEmail', { email })
                  : t('enterEmailToCreateNewPassword')}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-3 pt-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                >
                  {t('sendToAnotherEmail')}
                </Button>
                <Link to="/cliente/login" className="block">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToLogin')}
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t('sendRecoveryCode')}
                </Button>
                <Link to="/cliente/login" className="block">
                  <Button type="button" variant="ghost" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t('backToLogin')}
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;