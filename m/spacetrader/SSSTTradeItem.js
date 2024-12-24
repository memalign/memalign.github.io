const sItems = {};

class SSSTTradeItem {
    constructor(type, name, icon, techLevelToProduce, techLevelToUse, techLevelMaxProd, priceLowTech, priceIncreasePerTechLevel, priceVariance, minTradePrice, maxTradePrice, roundOffPrice, doublePriceStatus, cheapResource, expensiveResource) {
        this.type = type;
        this.name = name;
        this.icon = icon;
        this.techLevelToProduce = techLevelToProduce;
        this.techLevelToUse = techLevelToUse;
        this.techLevelMaxProd = techLevelMaxProd;
        this.priceLowTech = priceLowTech;
        this.priceIncreasePerTechLevel = priceIncreasePerTechLevel;
        this.priceVariance = priceVariance;
        this.minTradePrice = minTradePrice;
        this.maxTradePrice = maxTradePrice;
        this.roundOffPrice = roundOffPrice;
        this.doublePriceStatus = doublePriceStatus;
        this.cheapResource = cheapResource;
        this.expensiveResource = expensiveResource;
    }

    static tradeItemForType(tradeItemType) {
        if (!sItems[tradeItemType]) {
            let item;
            switch (tradeItemType) {
                case SSSTTradeItemType.Water:
                    item = new SSSTTradeItem(tradeItemType, "Water", "", SSSTTechLevel.PreAgricultural, SSSTTechLevel.PreAgricultural, SSSTTechLevel.Medieval, 30, 3, 4, 30, 50, 1, SSSTStatus.Drought, SSSTResource.SweetwaterOceans, SSSTResource.Desert);
                    break;
                case SSSTTradeItemType.Furs:
                    item = new SSSTTradeItem(tradeItemType, "Furs", "", SSSTTechLevel.PreAgricultural, SSSTTechLevel.PreAgricultural, SSSTTechLevel.PreAgricultural, 250, 10, 10, 230, 280, 5, SSSTStatus.ColdSpell, SSSTResource.RichFauna, SSSTResource.Lifeless);
                    break;
                case SSSTTradeItemType.Food:
                    item = new SSSTTradeItem(tradeItemType, "Food", "", SSSTTechLevel.Agricultural, SSSTTechLevel.PreAgricultural, SSSTTechLevel.Agricultural, 100, 5, 5, 90, 160, 5, SSSTStatus.CropFailure, SSSTResource.RichSoil, SSSTResource.PoorSoil);
                    break;
                case SSSTTradeItemType.Ore:
                    item = new SSSTTradeItem(tradeItemType, "Ore", "", SSSTTechLevel.Medieval, SSSTTechLevel.Medieval, SSSTTechLevel.Renaissance, 350, 20, 10, 350, 420, 10, SSSTStatus.AtWar, SSSTResource.MineralRich, SSSTResource.MineralPoor);
                    break;
                case SSSTTradeItemType.Games:
                    item = new SSSTTradeItem(tradeItemType, "Games", "", SSSTTechLevel.Renaissance, SSSTTechLevel.Agricultural, SSSTTechLevel.PostIndustrial, 250, -10, 5, 160, 270, 5, SSSTStatus.Boredom, SSSTResource.Artistic, SSSTResource.None);
                    break;
                case SSSTTradeItemType.Firearms:
                    item = new SSSTTradeItem(tradeItemType, "Firearms", "", SSSTTechLevel.Renaissance, SSSTTechLevel.Agricultural, SSSTTechLevel.Industrial, 1250, -75, 100, 600, 1100, 25, SSSTStatus.AtWar, SSSTResource.Warlike, SSSTResource.None);
                    break;
                case SSSTTradeItemType.Medicine:
                    item = new SSSTTradeItem(tradeItemType, "Medicine", "", SSSTTechLevel.EarlyIndustrial, SSSTTechLevel.Agricultural, SSSTTechLevel.PostIndustrial, 650, -20, 10, 400, 700, 25, SSSTStatus.Plague, SSSTResource.SpecialHerbs, SSSTResource.None);
                    break;
                case SSSTTradeItemType.Machines:
                    item = new SSSTTradeItem(tradeItemType, "Machines", "", SSSTTechLevel.EarlyIndustrial, SSSTTechLevel.Renaissance, SSSTTechLevel.Industrial, 900, -30, 5, 600, 800, 25, SSSTStatus.LackWorkers, SSSTResource.None, SSSTResource.None);
                    break;
                case SSSTTradeItemType.Narcotics:
                    item = new SSSTTradeItem(tradeItemType, "Narcotics", "", SSSTTechLevel.Industrial, SSSTTechLevel.PreAgricultural, SSSTTechLevel.Industrial, 3500, -125, 150, 2000, 3000, 50, SSSTStatus.Boredom, SSSTResource.WeirdMushrooms, SSSTResource.None);
                    break;
                case SSSTTradeItemType.Robots:
                    item = new SSSTTradeItem(tradeItemType, "Robots", "", SSSTTechLevel.PostIndustrial, SSSTTechLevel.EarlyIndustrial, SSSTTechLevel.HighTech, 5000, -150, 100, 3500, 5000, 100, SSSTStatus.LackWorkers, SSSTResource.None, SSSTResource.None);
                    break;
                default:
                    return null;
            }
            if (item) {
                sItems[tradeItemType] = item;
            }
        }
        return sItems[tradeItemType];
    };

}
