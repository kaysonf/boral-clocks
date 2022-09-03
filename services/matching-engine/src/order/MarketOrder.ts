import { MarketOrderRequest } from "../models/OrderRequest";
import { Sequenced } from "../system";
import { IOrderCore, Order } from "./Order";

export class MarketOrder implements IOrderCore {
  constructor(
    private _orderRequest: Sequenced<MarketOrderRequest>,
    private _id: string,
    private _status: Order["status"],
    private _bestMarketPrice: () => number
  ) {}

  public getType = () => this._orderRequest.type;

  public toOrder = () => {
    return {
      ...this._orderRequest,
      id: this._id,
      status: this._status,
      price: this._bestMarketPrice(),
    };
  };
}
