import { useState, useRef } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { fileToCompressedDataUrl } from '../lib/imageUpload';
import { Button, Input } from 'ui-components';

export function AdminImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  
  const handleFile = async (f: File | null) => {
    if (!f) return;
    setErr(null); setUploading(true);
    try { onChange(await fileToCompressedDataUrl(f)); }
    catch (e: any) { setErr(e.message || 'Upload failed'); }
    finally { setUploading(false); if (ref.current) ref.current.value = ''; }
  };
  
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-[var(--color-muted-foreground)] uppercase font-semibold">No image</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <input 
            ref={ref} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e: any) => handleFile(e.target.files?.[0] || null)} 
          />
          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline"
              size="sm"
              onClick={() => ref.current?.click()} 
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? 'Uploading…' : value ? 'Replace Image' : 'Upload Image'}
            </Button>
            {value && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onChange('')} 
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
      <Input 
        value={value.startsWith('data:') ? '' : value} 
        onChange={(e: any) => onChange(e.target.value)}
        placeholder="…or paste an image URL" 
        className="mt-1"
      />
      {err && <p className="text-xs text-red-500 font-medium">{err}</p>}
    </div>
  );
}
