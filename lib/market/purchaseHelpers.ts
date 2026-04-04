import { randomBytes } from "crypto";
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type { MarketProduct, MarketSize } from "@/components/market/types";

export interface PurchaseRecord {
  orderId: string;
  uid: string;
  productId: number;
  productName: string;
  productCategory: string;
  color: string;
  size: string | null;
  quantity: number;
  totalCost: number;
  remainingDevCoins: number;
  purchasedAt: FirebaseFirestore.Timestamp;
  emailSentTo: string[];
  status: "confirmed";
}

export interface OrderData {
  orderId: string;
  product: MarketProduct;
  color: string;
  size: MarketSize | null;
  quantity: number;
}

export function generateOrderId(): string {
  return "DK-" + randomBytes(3).toString("hex").toUpperCase();
}

export async function executePurchaseTransaction(
  db: Firestore,
  uid: string,
  orderData: OrderData,
): Promise<PurchaseRecord> {
  const totalCost = orderData.product.price * orderData.quantity;
  const userRef = db.collection("users").doc(uid);
  const purchaseRef = userRef.collection("purchases").doc(orderData.orderId);

  return db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) throw new Error("user_not_found");

    const currentCoins = (userSnap.data()?.devCoins as number) ?? 0;
    if (currentCoins < totalCost) throw new Error("insufficient_balance");

    const redeemedItems = (userSnap.data()?.redeemedItems as Record<string, boolean>) ?? {};
    if (redeemedItems[String(orderData.product.id)]) throw new Error("already_redeemed");

    const remainingDevCoins = currentCoins - totalCost;

    const record: Omit<PurchaseRecord, "purchasedAt"> & { purchasedAt: FirebaseFirestore.FieldValue } = {
      orderId: orderData.orderId,
      uid,
      productId: orderData.product.id,
      productName: orderData.product.name,
      productCategory: orderData.product.category,
      color: orderData.color,
      size: orderData.size,
      quantity: orderData.quantity,
      totalCost,
      remainingDevCoins,
      purchasedAt: FieldValue.serverTimestamp(),
      emailSentTo: [],
      status: "confirmed",
    };

    tx.update(userRef, {
      devCoins: FieldValue.increment(-totalCost),
      [`redeemedItems.${orderData.product.id}`]: true,
    });
    tx.set(purchaseRef, record);

    return { ...record, purchasedAt: undefined as unknown as FirebaseFirestore.Timestamp, remainingDevCoins };
  });
}

export async function getChapterCoordinators(
  db: Firestore,
  chapterId: string,
): Promise<{ email: string; username: string }[]> {
  const snap = await db
    .collection("users")
    .where("chapterId", "==", chapterId)
    .where("role", "==", "coordinator")
    .get();

  return snap.docs.map((d) => ({
    email: d.data().email as string,
    username: d.data().username as string,
  }));
}
