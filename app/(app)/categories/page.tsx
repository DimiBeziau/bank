import { Plus } from "lucide-react";
import { getCategoriesWithUsage } from "@/lib/actions/categories";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CategoryModal } from "@/components/budget/CategoryModal";
import { CategoryRow } from "@/components/budget/CategoryRow";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategoriesWithUsage();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Catégories</h1>
          <p className="text-muted text-sm">Gère les catégories utilisées par tes dépenses et souhaits.</p>
        </div>
        <CategoryModal
          trigger={
            <Button variant="ghost" className="gap-1">
              <Plus size={16} />
              Catégorie
            </Button>
          }
        />
      </div>

      <GlassCard>
        {categories.length === 0 && <p className="text-muted text-sm">Aucune catégorie pour l&apos;instant.</p>}
        <div className="flex flex-col gap-1">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
