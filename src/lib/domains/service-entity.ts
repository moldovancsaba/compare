import type { ServiceComparisonEntity, ServiceSpec } from "@/types/service";

export function serviceDisplayName(service: ServiceSpec): string {
  return service.name;
}

export function toServiceComparisonEntity(service: ServiceSpec): ServiceComparisonEntity {
  return {
    id: service.id,
    domain: "services",
    serviceId: service.id,
    label: serviceDisplayName(service),
    slug: service.slug,
    aliases: service.aliases,
    sourceUrl: service.sourceUrl,
    attributes: {
      category: service.category,
      pricingModel: service.pricingModel,
      targetUser: service.targetUser,
      contractRisk: service.contractRisk,
      switchingCost: service.switchingCost,
      compliancePosture: service.compliancePosture
    }
  };
}
