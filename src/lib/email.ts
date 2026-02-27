import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderConfirmationParams {
  to: string;
  orderId: string;
  customerName: string;
  total: string;
  items: Array<{ name: string; quantity: number }>;
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

  try {
    const { data, error } = await resend.emails.send({
      from: "5iveArts <orders@5ivearts.com>", // You'll need to verify your domain on Resend
      to,
      subject: `Order Confirmed: #${orderId.slice(0, 8)}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #050505; color: #ffffff; border: 1px solid #111; border-radius: 4px;">
          <h1 style="color: #eab308; font-size: 24px; text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 30px; font-weight: 900;">Order Secured</h1>
          <p style="font-size: 12px; line-height: 1.6; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.1em;">Hi ${customerName},</p>
          <p style="font-size: 12px; line-height: 1.6; color: #a3a3a3;">Your order has been recorded in our vault. Our artisans are preparing your masterpiece for processing.</p>
          
          <div style="background-color: #0c0c0c; border: 1px solid #1a1a1a; padding: 25px; margin: 30px 0;">
            <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: bold; color: #404040; text-transform: uppercase; letter-spacing: 0.2em;">Transaction ID: <span style="color: #ffffff;">${orderId}</span></p>
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #404040; text-transform: uppercase; letter-spacing: 0.2em;">Investment Total: <span style="color: #eab308;">${total}</span></p>
          </div>
          
          <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #ffffff; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #1a1a1a; font-weight: 900;">Arsenal Details</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${items
          .map(
            (item) => `
              <li style="padding: 15px 0; border-bottom: 1px solid #111;">
                <span style="font-weight: bold; color: #eab308; font-size: 12px;">${item.quantity}x</span> 
                <span style="color: #ffffff; text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; margin-left: 10px; font-weight: 700;">${item.name}</span>
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
