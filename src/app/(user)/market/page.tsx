import { requireRole } from "@/lib/dal";
import { getPrisma } from "@/lib/prisma";
import { getPointsBalance } from "@/lib/points";
import { AppHeader } from "@/components/AppHeader";
import { MarketTabs } from "@/components/MarketTabs";

export default async function MarketPage() {
  const user = await requireRole("USER");
  const prisma = getPrisma();

  const [vouchers, balance] = await Promise.all([
    prisma.voucher.findMany({ where: { active: true }, orderBy: { costPoints: "asc" } }),
    getPointsBalance(user.id),
  ]);

  return (
    <div>
      <AppHeader title="Marketplace" />
      <div className="px-4 pt-4">
        <MarketTabs
          vouchers={vouchers.map((v) => ({
            id: v.id,
            title: v.title,
            description: v.description,
            costPoints: v.costPoints,
          }))}
          pointsBalance={balance}
        />
      </div>
    </div>
  );
}
