import { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  // In development, allow Postman (or any client) to skip signature verification
  if (process.env.NODE_ENV === "development") {
    const raw = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : (req.body as string);
    event = JSON.parse(raw) as Stripe.Event;
    console.log(
      "[Stripe Webhook] Postman/dev bypass: skipping signature verification",
    );
  } else {
    if (!sig) {
      console.error("[Stripe Webhook] Missing signature");
      return res.status(400).send("Missing signature");
    }
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err: any) {
      console.error(
        "[Stripe Webhook] Signature verification failed:",
        err.message,
      );
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log(
      "[Webhook] Test event detected, returning verification response",
    );
    return res.json({
      verified: true,
    });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);

        // Update purchase status to failed if exists
        const purchase = await db.getPurchaseByStripeSessionId(
          paymentIntent.id,
        );
        if (purchase) {
          await db.updatePurchaseStatus(purchase.id, "failed");
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Checkout completed: ${session.id}`);

  // Extract metadata
  const userId = session.metadata?.user_id;
  const purchaseType = session.metadata?.type; // "plan" or "single"
  const planId = session.metadata?.plan_id;

  if (!userId) {
    console.error("[Stripe Webhook] Missing user_id in metadata");
    return;
  }

  const userIdNum = parseInt(userId);

  // Get or create purchase record
  let purchase = await db.getPurchaseByStripeSessionId(session.id);

  if (!purchase) {
    console.log("[Stripe Webhook] Creating new purchase record");

    const credits =
      purchaseType === "single"
        ? 1
        : session.metadata?.credits
          ? parseInt(session.metadata.credits)
          : 0;

    await db.createPurchase({
      userId: userIdNum,
      type: purchaseType === "single" ? "single" : "plan",
      planId: planId ? parseInt(planId) : null,
      amountInCents: session.amount_total || 0,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      status: "completed",
      creditsAdded: credits,
    });

    purchase = await db.getPurchaseByStripeSessionId(session.id);
  } else if (purchase.status === "pending") {
    console.log("[Stripe Webhook] Updating existing purchase");
    await db.updatePurchaseStatus(
      purchase.id,
      "completed",
      session.payment_intent as string,
    );
  }
  if (!purchase) {
    console.error("[Stripe Webhook] Failed to create/retrieve purchase");
    return;
  }

  purchase = await db.getPurchaseById(purchase.id);
  if (!purchase) {
    console.error("[Stripe Webhook] Failed to create/retrieve purchase");
    return;
  }
  // Add credits to user if not already added
  if (purchase.status === "completed" && purchase.creditsAdded > 0) {
    const user = await db.getUserById(userIdNum);

    if (user) {
      // Check if credits were already added by looking at transaction history
      const transactions = await db.getCreditTransactionsByUserId(userIdNum);
      const alreadyAdded = transactions.some(
        (t) => t.purchaseId === purchase.id,
      );

      if (!alreadyAdded) {
        console.log(
          `[Stripe Webhook] Adding ${purchase.creditsAdded} credits to user ${userIdNum}`,
        );

        const description =
          purchaseType === "single"
            ? "Compra de aula avulsa"
            : `Compra de plano - ${purchase.creditsAdded} aulas`;

        await db.addCreditsToUser(
          userIdNum,
          purchase.creditsAdded,
          purchaseType === "single" ? "single_purchase" : "plan_purchase",
          description,
          purchase.id,
        );

        console.log("[Stripe Webhook] Credits added successfully");
      } else {
        console.log("[Stripe Webhook] Credits already added for this purchase");
      }
    }
  }
}
