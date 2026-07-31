import { notFound } from "next/navigation";
import { requireRole } from "@/lib/dal";
import { getPointsBalance } from "@/lib/points";
import { AppHeader } from "@/components/AppHeader";
import { ServiceRequestForm } from "@/components/ServiceRequestForm";
import { getService } from "@/lib/services";

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  const user = await requireRole("USER");
  const pointsBalance = await getPointsBalance(user.id);

  return (
    <div>
      <AppHeader title={service.title} backHref="/market" />
      <div className="flex flex-col gap-4 px-4 pt-4">
        <div>
          <p className="eyebrow">{service.sub}</p>
          <p className="p-note !mb-0">{service.description}</p>
        </div>

        <ServiceRequestForm
          slug={service.slug}
          pointsCost={service.pointsCost}
          pointsBalance={pointsBalance}
          fulfillment={service.fulfillment}
        />
      </div>
    </div>
  );
}
