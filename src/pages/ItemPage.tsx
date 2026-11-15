import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getItem } from "../data/items";
import { useApp } from "../context/AppContext";
import { ItemFacts } from "../components/ItemFacts";
import { buttonClass, Card, EmptyState } from "../components/ui";

/** One database item, looked up from the id in the URL. */
export function ItemPage() {
  const { itemId = "" } = useParams();
  const item = getItem(itemId);
  const { viewItem } = useApp();

  useEffect(() => {
    if (!item) return;
    document.title = `${item.name} · ReLeaf`;
    viewItem(item.id);
  }, [item, viewItem]);

  if (!item) {
    return (
      <EmptyState title="Item not found">
        <p>That database entry does not exist.</p>
        <Link className={`${buttonClass()} mt-4`} to="/database">
          Back to the database
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        className="text-sm font-extrabold text-forest-900 underline"
        to="/database"
      >
        Back to the database
      </Link>
      <Card>
        <ItemFacts item={item} source="database" />
      </Card>
    </div>
  );
}
