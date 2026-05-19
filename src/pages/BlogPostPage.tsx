import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id,title,excerpt,content,cover_image,author_name,published_at,created_at')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      if (!data) { setNotFound(true); setLoading(false); return; }
      setPost(data as BlogPost);
      document.title = `${data.title} | Blog`;
      setLoading(false);
    })();
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <Button variant="ghost" asChild className="gap-2 mb-4">
          <Link to="/blog"><ArrowLeft className="h-4 w-4" /> Voltar ao blog</Link>
        </Button>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : notFound || !post ? (
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground">Post não encontrado</h1>
            <p className="text-muted-foreground mt-2">Ele pode ter sido removido ou ainda não foi publicado.</p>
          </div>
        ) : (
          <article className="space-y-6">
            <header className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">{post.title}</h1>
              <p className="text-sm text-muted-foreground">
                {post.author_name && <span>{post.author_name} · </span>}
                {new Date(post.published_at || post.created_at).toLocaleDateString('pt-BR')}
              </p>
            </header>
            {post.cover_image && (
              <img src={post.cover_image} alt={post.title} className="w-full rounded-lg border border-border" />
            )}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
