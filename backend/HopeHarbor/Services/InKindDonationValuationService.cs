namespace HopeHarbor.Services;

public interface IInKindDonationValuationService
{
    InKindDonationValueEstimate Estimate(InKindDonationValueInput input);
}

public sealed class InKindDonationValueInput
{
    public string? ItemCategory { get; set; }
    public int Quantity { get; set; }
    public string? UnitOfMeasure { get; set; }
    public string? IntendedUse { get; set; }
    public string? ReceivedCondition { get; set; }
}

public sealed class InKindDonationValueEstimate
{
    public decimal EstimatedUnitValuePhp { get; set; }
    public decimal EstimatedTotalValuePhp { get; set; }
    public string ModelVersion { get; set; } = "in-kind-value-v1";
}

public sealed class InKindDonationValuationService : IInKindDonationValuationService
{
    private const string ModelVersion = "in-kind-value-v1";

    public InKindDonationValueEstimate Estimate(InKindDonationValueInput input)
    {
        var categoryBase = (input.ItemCategory ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "food" => 120m,
            "supplies" => 90m,
            "clothing" => 280m,
            "schoolmaterials" => 140m,
            "hygiene" => 110m,
            "furniture" => 2200m,
            "medical" => 350m,
            _ => 160m
        };

        var conditionMultiplier = (input.ReceivedCondition ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "new" => 1.00m,
            "good" => 0.82m,
            "fair" => 0.60m,
            _ => 0.78m
        };

        var useMultiplier = (input.IntendedUse ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "meals" => 1.05m,
            "education" => 1.08m,
            "shelter" => 1.12m,
            "hygiene" => 1.00m,
            "health" => 1.15m,
            _ => 1.00m
        };

        var unitMultiplier = (input.UnitOfMeasure ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "boxes" => 8.0m,
            "kg" => 1.4m,
            "sets" => 3.5m,
            "packs" => 2.2m,
            "pcs" => 1.0m,
            _ => 1.0m
        };

        var quantity = Math.Clamp(input.Quantity, 1, 100000);
        var estimatedUnit = Math.Round(categoryBase * conditionMultiplier * useMultiplier, 2);
        var estimatedTotal = Math.Round(estimatedUnit * unitMultiplier * quantity, 2);

        return new InKindDonationValueEstimate
        {
            EstimatedUnitValuePhp = estimatedUnit,
            EstimatedTotalValuePhp = estimatedTotal,
            ModelVersion = ModelVersion
        };
    }
}
