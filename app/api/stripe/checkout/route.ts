// ============================================================
// API: /api/stripe/checkout — Create a Stripe Checkout Session
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDbUser } from "@/lib/auth";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

export async function POST(req: NextRequest) {
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured", url: null }, { status: 200 });
  }

  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { priceId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId || process.env.STRIPE_PRO_PRICE_ID!, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?cancelled=true`,
    metadata: {
      clerkId: user.clerkId,
      userId: user.id,
    },
    customer_email: user.email,
  });

  return NextResponse.json({ url: session.url });
}
