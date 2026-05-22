import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getFirebaseAdminOrThrow, verifyBearerUid } from "@/lib/firebase-admin";
import { PRODUCTS } from "@/components/market/data";
import {
  generateOrderId,
  executePurchaseTransaction,
  getChapterCoordinators,
} from "@/lib/market/purchaseHelpers";
import { buildReceiptEmailHtml } from "@/lib/market/receiptEmailHtml";

export const maxDuration = 30;

interface PurchaseRequestBody {
  productId: number;
  color: string;
  size: string | null;
  quantity: number;
}

export async function POST(req: Request) {
  // 1. Auth
  let uid: string;
  try {
    uid = await verifyBearerUid(req.headers.get("authorization"));
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let body: PurchaseRequestBody;
  try {
    body = (await req.json()) as PurchaseRequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { productId, color, size, quantity } = body;
  if (!productId || !color || typeof quantity !== "number" || quantity < 1) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // 3. Look up product server-side (authoritative price)
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    return NextResponse.json({ error: "product_not_found" }, { status: 400 });
  }

  // 4. Load buyer's user doc
  const { db } = getFirebaseAdminOrThrow();
  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }
  const userData = userSnap.data()!;
  const buyerEmail = userData.email as string;
  const buyerUsername = userData.username as string;
  const chapterId = userData.chapterId as string;

  // 5. Execute Firestore transaction
  const orderId = generateOrderId();
  let purchase: Awaited<ReturnType<typeof executePurchaseTransaction>>;
  try {
    purchase = await executePurchaseTransaction(db, uid, {
      orderId,
      product,
      color,
      size: size as import("@/components/market/types").MarketSize | null,
      quantity,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "insufficient_balance") {
      return NextResponse.json({ error: "insufficient_balance" }, { status: 402 });
    }
    if (e instanceof Error && e.message === "already_redeemed") {
      return NextResponse.json({ error: "already_redeemed" }, { status: 409 });
    }
    if (e instanceof Error && e.message === "user_not_found") {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }
    throw e;
  }

  // 6. Send emails (failure does not roll back the purchase)
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (gmailUser && gmailPass) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    const now = new Date();
    const date = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const emailCommon = {
      orderId,
      productName: product.name,
      color,
      size,
      quantity,
      totalCost: purchase.totalCost,
      remainingDevCoins: purchase.remainingDevCoins,
      date,
      time,
    };

    const emailsSent: string[] = [];
    const emailPromises: Promise<void>[] = [];

    // Volunteer email
    if (buyerEmail) {
      emailPromises.push(
        transporter
          .sendMail({
            from: `"DEVCON Kids" <${gmailUser}>`,
            to: buyerEmail,
            subject: `DEVCON Kids: Order ${orderId} Confirmed`,
            html: buildReceiptEmailHtml({
              ...emailCommon,
              recipientName: buyerUsername,
              isCoordinator: false,
            }),
          })
          .then(() => { emailsSent.push(buyerEmail); })
          .catch((err: unknown) => console.error("[purchase] volunteer email failed:", err)),
      );
    }

    // Coordinator emails
    try {
      const coordinators = await getChapterCoordinators(db, chapterId);
      for (const coord of coordinators) {
        if (!coord.email) continue;
        emailPromises.push(
          transporter
            .sendMail({
              from: `"DEVCON Kids" <${gmailUser}>`,
              to: coord.email,
              subject: `DEVCON Kids: Chapter Purchase — Order ${orderId}`,
              html: buildReceiptEmailHtml({
                ...emailCommon,
                recipientName: buyerUsername,
                isCoordinator: true,
              }),
            })
            .then(() => { emailsSent.push(coord.email); })
            .catch((err: unknown) => console.error("[purchase] coordinator email failed:", err)),
        );
      }
    } catch (err) {
      console.error("[purchase] failed to fetch coordinators:", err);
    }

    await Promise.allSettled(emailPromises);

    // Update purchase record with emails sent (best-effort)
    if (emailsSent.length > 0) {
      db.collection("users")
        .doc(uid)
        .collection("purchases")
        .doc(orderId)
        .update({ emailSentTo: emailsSent })
        .catch((err: unknown) => console.error("[purchase] failed to update emailSentTo:", err));
    }
  }

  return NextResponse.json({
    orderId: purchase.orderId,
    remainingDevCoins: purchase.remainingDevCoins,
  });
}
