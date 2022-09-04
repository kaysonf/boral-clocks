import { IOrderCore, OrderFilled } from "../order";

export const matchOrders = (
  bestAsk: IOrderCore,
  bestBid: IOrderCore
): { askFilled: OrderFilled; bidFilled: OrderFilled } => {
  const quantityFilled = Math.min(
    bestAsk.getCurrentQuantity(),
    bestBid.getCurrentQuantity()
  );

  const askFilled = {
    id: bestAsk.getId(),
    side: bestAsk.getSide(),
    quantity: quantityFilled,
    price: bestAsk.getPrice(),
  };

  const bidFilled = {
    id: bestBid.getId(),
    side: bestBid.getSide(),
    quantity: quantityFilled,
    price: bestBid.getPrice(),
  };

  bestAsk.decreaseQuantity(quantityFilled);
  if (bestAsk.getCurrentQuantity() === 0) {
    bestAsk.setStatus("FILLED");
  }

  bestBid.decreaseQuantity(quantityFilled);
  if (bestBid.getCurrentQuantity() === 0) {
    bestBid.setStatus("FILLED");
  }

  return { askFilled, bidFilled };
};

export const priceLevelsOverlap = (
  bestAsk: IOrderCore,
  bestBid: IOrderCore
): boolean => {
  return bestAsk.getPrice() <= bestBid.getPrice();
};
