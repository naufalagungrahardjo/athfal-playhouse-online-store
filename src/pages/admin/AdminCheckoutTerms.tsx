import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_COPY, type WebsiteCopy } from '@/hooks/useWebsiteCopy';

const AdminCheckoutTerms = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [terms, setTerms] = useState(DEFAULT_COPY.checkoutTerms);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();
      if (data?.content && typeof data.content === 'object') {
        const stored = data.content as any;
        if (stored.checkoutTerms) {
          setTerms({ ...DEFAULT_COPY.checkoutTerms, ...stored.checkoutTerms });
        }
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('website_copy')
        .select('content')
        .eq('id', 'main')
        .maybeSingle();

      const currentContent = (existing?.content as Record<string, any>) || {};
      const updatedContent = { ...currentContent, checkoutTerms: terms };

      const { error } = await supabase
        .from('website_copy')
        .upsert({ id: 'main', content: updatedContent, updated_at: new Date().toISOString() });

      if (error) throw error;

      toast({ title: 'Saved', description: 'Checkout terms updated successfully.' });
      window.dispatchEvent(new Event('websiteCopyUpdated'));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Checkout Terms</h1>
      <p className="text-muted-foreground">
        Edit the terms & conditions content shown to customers before checkout.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Indonesian */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Indonesian (Bahasa)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={terms.title.id}
                onChange={(e) => setTerms(prev => ({ ...prev, title: { ...prev.title, id: e.target.value } }))}
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={terms.content.id}
                onChange={(e) => setTerms(prev => ({ ...prev, content: { ...prev.content, id: e.target.value } }))}
                rows={8}
              />
            </div>
          </CardContent>
        </Card>

        {/* English */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">English</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={terms.title.en}
                onChange={(e) => setTerms(prev => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={terms.content.en}
                onChange={(e) => setTerms(prev => ({ ...prev, content: { ...prev.content, en: e.target.value } }))}
                rows={8}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

export default AdminCheckoutTerms;
