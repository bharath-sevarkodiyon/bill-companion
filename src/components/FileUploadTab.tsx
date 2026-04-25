import { useState, useRef, DragEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileUp,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  Pencil,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

const EXTRACT_URL = "/api/extract";

type Extracted = Record<string, any> & {
  submeters?: Array<Record<string, any>>;
};

const FileUploadTab = ({ onUploaded }: { onUploaded?: () => void }) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<Extracted | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleFiles = async (selected: File | null) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }
    setFile(selected);
    setData(null);
    setSaved(false);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", selected);
      const res = await fetch(EXTRACT_URL, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`Extract API failed (${res.status})`);
      const json = await res.json();
      setData(json);

      if (user) {
        const { error } = await supabase.from("extractions").insert({
          user_id: user.id,
          file_name: selected.name,
          data: json,
        });
        if (error) throw error;
        setSaved(true);
        onUploaded?.();
        toast.success("Extraction saved");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFiles(f);
  };

  const accuracy =
    typeof data?.overall_confidence_score === "number"
      ? Math.round(data.overall_confidence_score * 100)
      : null;

  const fieldEntries = data
    ? Object.entries(data).filter(
        ([k, v]) =>
          !["submeters", "justification", "overall_confidence_score"].includes(
            k,
          ) &&
          v !== null &&
          v !== undefined,
      )
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview */}
      <Card className="bg-mist border-0 shadow-[var(--shadow-card)] overflow-hidden flex flex-col h-[650px]">
        <div className="bg-deep-navy text-primary-foreground px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <FileText className="h-4 w-4" />
            <span className="truncate">
              Preview: {file?.name ?? "no file selected"}
            </span>
          </div>
        </div>
        <div className="p-5 flex-1">
          <div className="h-full w-full rounded-lg bg-[hsl(var(--ink))] flex items-center justify-center text-primary-foreground/30 overflow-hidden">
            {previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            ) : (
              <span className="text-sm">PDF preview will appear here</span>
            )}
          </div>
        </div>
      </Card>

      {/* Dropzone */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`h-[650px] flex flex-col items-center justify-center text-center border-2 border-dashed transition-colors ${
          dragOver
            ? "border-deep-navy bg-mist/60"
            : "border-border bg-background"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <div className="h-16 w-16 rounded-2xl bg-mist flex items-center justify-center mb-5">
          {loading ? (
            <Loader2 className="h-7 w-7 text-deep-navy animate-spin" />
          ) : (
            <FileUp className="h-7 w-7 text-deep-navy" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-ink">Upload Document</h3>
        <p className="text-sm text-slate mt-2 max-w-xs">
          Drag and drop your PDF invoices, receipts, or technical documents here
          for instant extraction.
        </p>
        <Button
          variant="navy"
          className="mt-6"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? "Extracting…" : "Select PDF File"}
        </Button>
        <p className="text-xs text-slate mt-3">
          Maximum file size: 25MB (PDF only)
        </p>
      </Card>

      {/* Results */}
      {data && (
        <Card className="lg:col-span-2 bg-mist border-0 shadow-[var(--shadow-card)] p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <Sparkles className="h-4 w-4 text-deep-navy" />
              Data Extracted
            </div>
            <div className="flex items-center gap-3">
              {saved && (
                <Badge
                  variant="secondary"
                  className="bg-success/15 text-success border-0"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Saved
                </Badge>
              )}
              {accuracy !== null && (
                <Badge className="bg-deep-navy/10 text-deep-navy border-0 hover:bg-deep-navy/10">
                  {accuracy}% Accuracy
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Fields */}
            <div className="space-y-2">
              {fieldEntries.map(([k, v]) => (
                <div
                  key={k}
                  className="bg-background rounded-lg px-4 py-3 flex items-center justify-between gap-4"
                >
                  <span className="text-xs uppercase tracking-wide text-slate font-medium">
                    {k.toUpperCase()}
                  </span>
                  <span className="text-sm text-ink font-semibold text-right truncate">
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>

            {/* Submeters & Raw JSON */}
            <div className="flex flex-col gap-5">
              {Array.isArray(data.submeters) && data.submeters.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate font-medium mb-2">
                    Submeters
                  </p>
                  <div className="space-y-2">
                    {data.submeters.map((sm, i) => (
                      <div
                        key={i}
                        className="bg-background rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-ink">
                            {sm.submeter_number ?? sm.id ?? `Submeter ${i + 1}`}
                          </span>
                          {sm.consumption && (
                            <span className="text-sm text-ink font-semibold">
                              {sm.consumption}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 rounded-full bg-mist overflow-hidden">
                          <div className="h-full bg-deep-navy w-2/3" />
                        </div>
                        {Object.entries(sm)
                          .filter(
                            ([key]) =>
                              ![
                                "submeter_number",
                                "consumption",
                                "id",
                              ].includes(key),
                          )
                          .map(([key, val]) => (
                            <div
                              key={key}
                              className="flex justify-between text-xs text-slate mt-1"
                            >
                              <span>{key}</span>
                              <span>{String(val)}</span>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide text-slate font-medium">
                    Raw JSON Snippet
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(data, null, 2),
                      );
                      toast.success("Copied");
                    }}
                    className="text-xs text-deep-navy font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" /> Copy Code
                  </button>
                </div>
                <pre className="bg-[hsl(var(--ink))] text-primary-foreground/90 rounded-lg p-4 text-xs overflow-auto max-h-80 font-mono leading-relaxed">
                  {JSON.stringify(data, null, 2)}
                </pre>

                <div className="mt-4 flex gap-2">
                  <Button variant="navy" className="flex-1">
                    <CheckCircle2 className="h-4 w-4" /> Approve Extraction
                  </Button>
                  <Button variant="outline" size="icon" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FileUploadTab;
