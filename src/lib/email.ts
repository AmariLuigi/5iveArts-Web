import { Resend } from "resend";
import { escapeHtml } from "./validate";



interface OrderConfirmationParams {
  to: string | string[];
  orderId: string;
  customerName: string;
  total: string;
  items: Array<{ name: string; quantity: number }>;
}

interface OrderStageUpdateParams {
  to: string | string[];
  orderId: string;
  customerName: string;
  stage: 'forging' | 'finalized' | 'shipped';
  previewUrl?: string; // For finalized stage
  trackingNumber?: string; // For shipped stage
}

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  customerName,
  total,
  items,
}: OrderConfirmationParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set. Skipping email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME || "5iveArts";

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`, // You'll need to verify your domain on Resend
      to,
      subject: `Order Confirmed: #${escapeHtml(orderId.slice(0, 8))}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #050505; color: #ffffff; border: 1px solid #111; border-radius: 4px;">
          <h1 style="color: #eab308; font-size: 24px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 30px; font-weight: 900;">Order Secured</h1>
          <p style="font-size: 12px; line-height: 1.6; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em;">Hi ${escapeHtml(customerName)},</p>
          <p style="font-size: 12px; line-height: 1.6; color: #a3a3a3;">Your order has been recorded in our vault. Our artisans are preparing your masterpiece for processing.</p>
          
          <div style="background-color: #0c0c0c; border: 1px solid #1a1a1a; padding: 25px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: bold; color: #404040; text-transform: uppercase; letter-spacing: 0.2em;">Transaction ID: <span style="color: #ffffff;">${escapeHtml(orderId)}</span></p>
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #404040; text-transform: uppercase; letter-spacing: 0.2em;">Investment Total: <span style="color: #eab308;">${escapeHtml(total)}</span></p>
          </div>
          
          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #ffffff; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #1a1a1a; font-weight: 900;">Arsenal Details</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${items
          .map(
            (item) => `
              <li style="padding: 15px 0; border-bottom: 1px solid #111;">
                <span style="font-weight: bold; color: #eab308; font-size: 12px;">${escapeHtml(String(item.quantity))}x</span> 
                <span style="color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; margin-left: 10px; font-weight: 700;">${escapeHtml(item.name)}</span>
              </li>
            `
          )
          .join("")}
          </ul>
          
          <p style="margin-top: 40px; font-size: 10px; color: #525252; text-transform: uppercase; letter-spacing: 0.15em; font-weight: bold;">
            Tracking credentials will be transmitted once the curation process is complete.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #1a1a1a; margin: 40px 0;" />
          <p style="text-align: center; color: #eab308; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em;">
            5iveArts — Handcrafted Excellence
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[email] Resend error:", error);
    } else {
      console.log("[email] Confirmation email sent:", data?.id);
    }
  } catch (err) {
    console.error("[email] Failed to send email:", err);
  }
}
export async function sendOrderStageUpdateEmail({
  to,
  orderId,
  customerName,
  stage,
  previewUrl,
  trackingNumber,
}: OrderStageUpdateParams) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY is not set. Skipping email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME || "5iveArts";

  let subject = "";
  let title = "";
  let message = "";
  let highlight = "";

  switch (stage) {
    case 'forging':
      subject = `Fabrication Initiated: Artifact #${orderId.slice(0, 8).toUpperCase()}`;
      title = "Forging Protocol Active";
      message = "Your commission has entered the artisan queue. Our forges are now hot as we begin the materialization of your artifact.";
      highlight = "Production Phase: MATERIALIZATION";
      break;
    case 'finalized':
      subject = `Artifact Finalized: Review Required #${orderId.slice(0, 8).toUpperCase()}`;
      title = "Protocol: Finalization";
      message = "Curation is complete. Your artifact has been finalized and is awaiting deployment preparation.";
      highlight = "Status: READY FOR DEPLOYMENT";
      break;
    case 'shipped':
      subject = `Artifact Deployed: Tracking #${orderId.slice(0, 8).toUpperCase()}`;
      title = "Deployment Protocol Initiated";
      message = "Your artifact has cleared the bureau and is currently in transit to your coordinates.";
      highlight = `Tracking Credentials: ${trackingNumber || "PENDING"}`;
      break;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #050505; color: #ffffff; border: 1px solid #111; border-radius: 4px;">
          <h1 style="color: #eab308; font-size: 24px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 30px; font-weight: 900;">${title}</h1>
          <p style="font-size: 12px; line-height: 1.6; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em;">Hi ${escapeHtml(customerName)},</p>
          <p style="font-size: 12px; line-height: 1.6; color: #a3a3a3;">${message}</p>
          
          <div style="background-color: #0c0c0c; border: 1px solid #1a1a1a; padding: 25px; margin: 30px 0;">
             <p style="margin: 0; font-size: 10px; font-weight: bold; color: #eab308; text-transform: uppercase; letter-spacing: 0.2em;">${highlight}</p>
          </div>

          ${previewUrl ? `
          <div style="margin: 30px 0; border: 1px solid #1a1a1a; padding: 10px; border-radius: 2px;">
            <img src="${previewUrl}" alt="Artifact Preview" style="width: 100%; height: auto; display: block;" />
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="https://5ivearts.com/account" style="display: inline-block; padding: 15px 30px; background-color: #eab308; color: #000000; text-decoration: none; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; border-radius: 2px;">View Protocol Journal</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #1a1a1a; margin: 40px 0;" />
          <p style="text-align: center; color: #eab308; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em;">
            5iveArts — Handcrafted Excellence
          </p>
        </div>
      `,
    });

    if (error) console.error("[email] Resend stage update error:", error);
  } catch (err) {
    console.error("[email] Failed to send stage update email:", err);
  }
}

export async function sendLowCreditAlert(creditValue: number, currency: string) {
  if (!process.env.RESEND_API_KEY) return;
  const adminEmail = process.env.ADMIN_EMAIL || "info@5ivearts.com";
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME || "5iveArts";

  try {
    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: adminEmail,
      subject: `CRITICAL: Paccofacile Credit Low (${creditValue} ${currency})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #050505; color: #ffffff; border: 1px solid #111; border-radius: 4px;">
          <h1 style="color: #ef4444; font-size: 20px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 30px; font-weight: 900;">Logistics Depletion Alert</h1>
          <p style="font-size: 14px; line-height: 1.6; color: #ffffff; font-weight: bold;">Paccofacile account balance is critically low: <span style="color: #ef4444;">${creditValue} ${currency}</span></p>
          <p style="font-size: 12px; line-height: 1.6; color: #a3a3a3;">Automated shipment fulfillment will fail if credit is exhausted. Please refill the account immediately via the Paccofacile portal.</p>
          
          <div style="text-align: center; margin-top: 40px;">
            <a href="https://www.paccofacile.it/area-riservata/ricarica-credito" style="display: inline-block; padding: 15px 30px; background-color: #ef4444; color: #ffffff; text-decoration: none; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.2em; border-radius: 2px;">Refill Account</a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #1a1a1a; margin: 40px 0;" />
          <p style="text-align: center; color: #eab308; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.4em;">
            5iveArts — System Administrator
          </p>
        </div>
      `
    });
  } catch (err) {
    console.error("[email] Failed to send low credit alert:", err);
  }
}
