import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function BlogPostsList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,published,published_at,created_at')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar posts');
    setPosts((data as BlogPost[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) return toast.error('Erro ao excluir');
    toast.success('Post excluído');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-sm text-muted-foreground">Gerencie os posts publicados no blog.</p>
        </div>
        <Button onClick={() => navigate('/admin/blog/novo')} className="gap-2">
          <Plus className="h-4 w-4" /> Novo post
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          Nenhum post criado ainda.
        </Card>
      ) : (
        <div className="grid gap-3">
          {posts.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">{p.title}</h3>
                  {p.published ? (
                    <Badge variant="default">Publicado</Badge>
                  ) : (
                    <Badge variant="secondary">Rascunho</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">/blog/{p.slug}</p>
                {p.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.excerpt}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.published && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link to={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/blog/${p.id}`)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação é permanente e não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(p.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
