import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { FileText, History, Star, Upload } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { money } from "../lib/finance";
import type { Property } from "../types/database";

type RatingRow = {
  user_id: string;
  overall: number;
  location: number;
  layout: number;
  price: number;
  neighborhood: number;
  future_potential: number;
};
type PriceRow = {
  id: string;
  old_price: number | null;
  new_price: number;
  changed_at: string;
};
type DocumentRow = {
  id: string;
  title: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  created_at: string;
  signed_url?: string | null;
};

export function PropertyExtras({ property }: { property: Property }) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [history, setHistory] = useState<PriceRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const [ratingResult, historyResult, documentResult] = await Promise.all([
      supabase
        .from("property_ratings")
        .select(
          "user_id,overall,location,layout,price,neighborhood,future_potential",
        )
        .eq("property_id", property.id),
      supabase
        .from("property_price_history")
        .select("*")
        .eq("property_id", property.id)
        .order("changed_at", { ascending: false }),
      supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", property.id)
        .order("created_at", { ascending: false }),
    ]);

    setRatings((ratingResult.data as RatingRow[]) ?? []);
    setHistory((historyResult.data as PriceRow[]) ?? []);

    const rows = (documentResult.data as DocumentRow[]) ?? [];
    if (rows.length) {
      const { data: signed } = await supabase.storage
        .from("property-documents")
        .createSignedUrls(
          rows.map((row) => row.storage_path),
          3600,
        );
      setDocuments(
        rows.map((row, index) => ({
          ...row,
          signed_url: signed?.[index]?.signedUrl,
        })),
      );
    } else {
      setDocuments([]);
    }
  }

  useEffect(() => {
    load();
  }, [property.id]);

  const average = useMemo(() => {
    if (!ratings.length) return 0;
    return (
      ratings.reduce((sum, row) => sum + Number(row.overall || 0), 0) /
      ratings.length
    );
  }, [ratings]);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const extension = file.name.split(".").pop() || "file";
    const path = `${property.household_id}/${property.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("property-documents")
      .upload(path, file, { contentType: file.type || undefined });

    if (!uploadError) {
      await supabase.from("property_documents").insert({
        property_id: property.id,
        household_id: property.household_id,
        created_by: user.id,
        title: file.name,
        file_name: file.name,
        storage_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
    }

    event.target.value = "";
    setUploading(false);
    load();
  }

  return (
    <div className="workspace-grid extras-grid">
      <section className="info-card workspace-card">
        <h3>
          <Star size={18} /> הציון המשותף
        </h3>
        <div className="joint-score">
          <strong>{average.toFixed(1)}</strong>
          <span>מתוך 10 · {ratings.length} דירוגים</span>
        </div>
      </section>

      <section className="info-card workspace-card">
        <h3>
          <History size={18} /> היסטוריית מחיר
        </h3>
        {history.length === 0 ? (
          <p className="muted-text">שינוי המחיר הבא יישמר כאן אוטומטית.</p>
        ) : (
          <div className="price-history">
            {history.map((row) => (
              <article key={row.id}>
                <span>
                  {new Date(row.changed_at).toLocaleDateString("he-IL")}
                </span>
                <strong>
                  {money(Number(row.old_price || 0))} ₪ ←{" "}
                  {money(Number(row.new_price))} ₪
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="info-card workspace-card documents-card">
        <h3>
          <FileText size={18} /> מסמכים פרטיים
        </h3>
        <label className="document-upload">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
            onChange={upload}
          />
          <Upload size={18} /> {uploading ? "מעלה…" : "העלאת מסמך"}
        </label>
        <div className="documents-list">
          {documents.map((document) =>
            document.signed_url ? (
              <a
                key={document.id}
                href={document.signed_url}
                target="_blank"
                rel="noreferrer"
              >
                <FileText size={17} />
                <span>{document.title}</span>
                <small>
                  {new Date(document.created_at).toLocaleDateString("he-IL")}
                </small>
              </a>
            ) : (
              <div key={document.id} className="document-card">
                <FileText size={17} />
                <span>{document.title}</span>
                <small>המסמך לא זמין כרגע</small>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
