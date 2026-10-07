import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Input } from '@orgdashio/ui';
import { FileText, Upload, Download } from 'lucide-react';

interface DocumentListWidgetProps {
  entityType: string;
  entityId: string;
}

export function DocumentListWidget({ entityType, entityId }: DocumentListWidgetProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/documents?entityType=${entityType}&entityId=${entityId}`);
      if (!res.ok) throw new Error('Erreur chargement documents');
      return res.json();
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);

    try {
      const res = await fetch('/api/v1/documents/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType,
          entityId,
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          fileSize: file.size,
        }),
      });

      if (!res.ok) throw new Error('Erreur génération URL');
      queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
      setFile(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-md font-bold text-slate-800 flex items-center">
        <FileText className="mr-2 h-5 w-5 text-indigo-600" />
        Documents & Pièces Jointes
      </h3>

      <form onSubmit={handleUpload} className="flex gap-3 items-center">
        <input
          type="file"
          className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <Button type="submit" size="sm" disabled={!file || loading}>
          <Upload className="mr-2 h-4 w-4" />
          Téléverser
        </Button>
      </form>

      <div className="divide-y border-t pt-2">
        {documents.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">Aucun document joint.</p>
        ) : (
          documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between py-2 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-700">{doc.fileName}</span>
                <span className="text-xs text-slate-400">({(doc.fileSize / 1024).toFixed(1)} KB)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => window.open('#', '_blank')}>
                <Download className="h-4 w-4 text-indigo-600" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
