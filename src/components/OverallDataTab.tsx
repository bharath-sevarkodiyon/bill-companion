import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Factory,
  Home,
  Building,
  Download,
  RefreshCw,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

type Row = {
  id: string;
  file_name: string | null;
  data: any;
  created_at: string;
};

const ICONS = [Building2, Factory, Home, Building];
const PAGE_SIZE = 4;

const OverallDataTab = ({ refreshKey }: { refreshKey: number }) => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("extractions")
      .select("id, file_name, data, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const totalExtractions = rows.length;
  const avgAccuracy = useMemo(() => {
    const scores = rows
      .map((r) => Number(r.data?.overall_confidence_score))
      .filter((n) => !Number.isNaN(n));
    if (!scores.length) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length) * 100;
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const maxSubmeters = useMemo(
    () => Math.max(0, ...rows.map((r) => (Array.isArray(r.data?.submeters) ? r.data.submeters.length : 0))),
    [rows]
  );

  const exportCSV = () => {
    if (!rows.length) return toast.error("No data to export");
    const headers = [
      "extraction_id",
      "timestamp",
      "file_name",
      "supplier",
      "utility_type",
      "account_number",
      "total_consumption",
      "total_cost",
      "submeter_count",
    ];
    const lines = [headers.join(",")];
    rows.forEach((r) => {
      const d = r.data ?? {};
      lines.push(
        [
          r.id,
          r.created_at,
          r.file_name ?? "",
          d.supplier ?? "",
          d.utility_type ?? "",
          d.account_number ?? "",
          d.total_consumption ?? "",
          d.total_cost ?? "",
          Array.isArray(d.submeters) ? d.submeters.length : 0,
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extractions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Card className="bg-mist border-0 shadow-[var(--shadow-card)] p-6">
        <h2 className="text-lg font-semibold text-ink">Overall Data</h2>
        <p className="text-sm text-slate mt-2 max-w-xl">
          Aggregated extraction results from your document uploads. Monitoring real-time data sync and validation status.
        </p>
        <div className="flex flex-wrap gap-3 mt-5">
          <Button variant="navy" onClick={exportCSV}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Sync
          </Button>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-mist border-0 border-l-4 border-l-steel shadow-[var(--shadow-card)] p-5">
          <p className="text-xs uppercase tracking-wide text-slate font-medium">Total Extractions</p>
          <p className="text-3xl font-bold text-ink mt-2">{totalExtractions.toLocaleString()}</p>
          <p className="text-sm text-success font-medium mt-2 inline-flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> Live count
          </p>
        </Card>
        <Card className="bg-mist border-0 border-l-4 border-l-steel shadow-[var(--shadow-card)] p-5">
          <p className="text-xs uppercase tracking-wide text-slate font-medium">Avg. Accuracy</p>
          <p className="text-3xl font-bold text-ink mt-2">
            {avgAccuracy !== null ? `${avgAccuracy.toFixed(1)}%` : "—"}
          </p>
          <div className="h-1.5 rounded-full bg-background mt-3 overflow-hidden">
            <div
              className="h-full bg-deep-navy transition-all"
              style={{ width: `${avgAccuracy ?? 0}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-background border-0 shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-mist hover:bg-mist border-0">
                <TableHead className="text-ink font-bold uppercase text-xs tracking-wide">Extraction ID</TableHead>
                <TableHead className="text-ink font-bold uppercase text-xs tracking-wide">Timestamp</TableHead>
                <TableHead className="text-ink font-bold uppercase text-xs tracking-wide">Entity</TableHead>
                <TableHead className="text-ink font-bold uppercase text-xs tracking-wide">Supplier</TableHead>
                <TableHead className="text-ink font-bold uppercase text-xs tracking-wide">Consumption</TableHead>
                <TableHead className="text-ink font-bold uppercase text-xs tracking-wide">Total Cost</TableHead>
                <TableHead className="text-ink font-bold uppercase text-xs tracking-wide">Accuracy</TableHead>
                {Array.from({ length: maxSubmeters }).map((_, i) => (
                  <TableHead key={i} className="text-ink font-bold uppercase text-xs tracking-wide whitespace-nowrap">
                    Submeter {i + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7 + maxSubmeters} className="text-center py-10 text-slate">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!loading && pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7 + maxSubmeters} className="text-center py-10 text-slate">
                    No extractions yet. Upload a PDF to get started.
                  </TableCell>
                </TableRow>
              )}
              {pageRows.map((r, i) => {
                const d = r.data ?? {};
                const Icon = ICONS[i % ICONS.length];
                const acc = typeof d.overall_confidence_score === "number"
                  ? Math.round(d.overall_confidence_score * 100)
                  : null;
                const submeters = Array.isArray(d.submeters) ? d.submeters : [];
                return (
                  <TableRow key={r.id} className="hover:bg-mist/40">
                    <TableCell className="font-mono text-sm text-slate">
                      #EXT-{r.id.slice(0, 4).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-slate text-sm whitespace-nowrap">
                      {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate text-sm">
                        <Icon className="h-4 w-4 text-deep-navy" />
                        <span className="capitalize">{d.utility_type ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-ink text-sm font-medium">{d.supplier ?? "—"}</TableCell>
                    <TableCell className="text-slate text-sm whitespace-nowrap">{d.total_consumption ?? "—"}</TableCell>
                    <TableCell className="text-ink font-semibold text-sm">
                      {typeof d.total_cost === "number" ? `$${d.total_cost.toLocaleString()}` : (d.total_cost ?? "—")}
                    </TableCell>
                    <TableCell>
                      {acc !== null ? (
                        <Badge className="bg-deep-navy/10 text-deep-navy border-0 hover:bg-deep-navy/10">
                          {acc}%
                        </Badge>
                      ) : "—"}
                    </TableCell>
                    {Array.from({ length: maxSubmeters }).map((_, idx) => {
                      const sm = submeters[idx];
                      return (
                        <TableCell key={idx} className="text-xs text-slate whitespace-nowrap">
                          {sm ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-ink">{sm.submeter_number ?? `#${idx + 1}`}</div>
                              {sm.consumption && <div>{sm.consumption}</div>}
                              {sm.demand && <div className="text-slate/70">{sm.demand}</div>}
                            </div>
                          ) : (
                            <span className="text-slate/40">—</span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-mist/30">
          <p className="text-xs text-slate">
            Showing {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
            {Math.min(page * PAGE_SIZE, rows.length)} of {rows.length} entries
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(3, totalPages) }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 w-9 rounded-md text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-deep-navy text-primary-foreground"
                      : "text-slate hover:bg-mist"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {/* <Button variant="navy" size="icon" className="ml-2 rounded-full" aria-label="Add">
              <Plus className="h-4 w-4" />
            </Button> */}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OverallDataTab;
