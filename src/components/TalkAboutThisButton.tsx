import { useEffect, useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { therapyBookmarkService, type TherapyBookmark } from '@/services/supabase';
import { useToast } from '@/hooks/use-toast';

interface TalkAboutThisButtonProps {
  sourceType: TherapyBookmark['source_type'];
  sourceId: string;
  content: string;
  className?: string;
}

const TalkAboutThisButton = ({ sourceType, sourceId, content, className }: TalkAboutThisButtonProps) => {
  const [bookmark, setBookmark] = useState<TherapyBookmark | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [available, setAvailable] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    therapyBookmarkService.getBySource(sourceType, sourceId)
      .then((saved) => {
        if (!active) return;
        setBookmark(saved);
        setNote(saved?.note || '');
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => { active = false; };
  }, [sourceId, sourceType]);

  const save = async () => {
    setSaving(true);
    try {
      const saved = await therapyBookmarkService.save({ source_type: sourceType, source_id: sourceId, content, note: note.trim() });
      setBookmark(saved);
      setOpen(false);
      toast({ title: 'Saved for therapy', description: 'This moment will appear in your session brief.' });
    } catch (error) {
      toast({ title: 'Could not save bookmark', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!bookmark) return;
    setSaving(true);
    try {
      await therapyBookmarkService.remove(bookmark.id);
      setBookmark(null);
      setNote('');
      setOpen(false);
      toast({ title: 'Bookmark removed' });
    } catch (error) {
      toast({ title: 'Could not remove bookmark', description: error instanceof Error ? error.message : 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!available) return null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={className}
        aria-label={bookmark ? 'Edit therapy bookmark' : 'Talk about this in therapy'}
      >
        {bookmark ? <BookmarkCheck className="mr-1.5 h-4 w-4 text-primary" /> : <Bookmark className="mr-1.5 h-4 w-4" />}
        {bookmark ? 'Saved' : 'Talk about this'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Talk about this in therapy</DialogTitle>
            <DialogDescription>
              Save this moment for your private session brief. You can add why it matters, edit it later, or remove it anytime.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground line-clamp-4">
            {content}
          </div>
          <div>
            <label htmlFor={`bookmark-note-${sourceId}`} className="mb-2 block text-sm font-medium">
              Why does this matter? <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id={`bookmark-note-${sourceId}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="I want help understanding why this keeps happening..."
              className="min-h-24"
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            {bookmark ? (
              <Button type="button" variant="ghost" onClick={remove} disabled={saving} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </Button>
            ) : <span />}
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {bookmark ? 'Update bookmark' : 'Save bookmark'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TalkAboutThisButton;
