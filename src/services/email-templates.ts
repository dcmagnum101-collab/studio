/**
 * Branded Email Templates for Monica Selvaggio AI Hub.
 * Branding: Primary #0F172A (Navy), Accent #D4AF37 (Gold).
 */

const base = (content: string, contactId?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    body { margin:0; padding:0; background-color:#f8f9fa; font-family:'Helvetica Neue', Arial, sans-serif; }
    .wrapper { width:100%; max-width:600px; margin:0 auto; background-color:#ffffff; }
    .header { background-color:#0F172A; padding:30px 40px; text-align:center; }
    .header h1 { color:#D4AF37; margin:0; font-size:24px; font-weight:800; letter-spacing:4px; text-transform:uppercase; }
    .header p { color:#94a3b8; margin:8px 0 0; font-size:12px; letter-spacing:1px; }
    .content { padding:40px; color:#1e293b; line-height:1.6; font-size:16px; }
    .box { background-color:#f8f6f0; border-left:4px solid #D4AF37; padding:20px; margin:25px 0; border-radius:0 8px 8px 0; }
    .btn { display:inline-block; background-color:#D4AF37; color:#0F172A; padding:14px 32px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:14px; margin:20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .footer { background-color:#0F172A; padding:30px 40px; text-align:center; color:#64748b; font-size:11px; }
    .footer a { color:#D4AF37; text-decoration:none; font-weight:bold; }
    .footer p { margin:5px 0; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>MONICA SELVAGGIO</h1>
    <p>LAS VEGAS REAL ESTATE SPECIALIST</p>
  </div>
  <div class="content">${content}</div>
  <div class="footer">
    <p><strong>Monica Selvaggio | REALTOR®</strong></p>
    <p>${process.env.MONICA_PHONE || '(702) 555-0199'} | ${process.env.GMAIL_USER}</p>
    <p>${process.env.MONICA_BROKERAGE || 'Selvaggio Global Real Estate'}</p>
    <div style="margin-top:20px; border-top:1px solid #1e293b; padding-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/unsubscribe?id=${contactId || 'unknown'}">Unsubscribe</a> from these emails.
    </div>
  </div>
</div>
</body>
</html>`;

export const emailTemplates = {
  expired: (contact: any, market: any) =>
    base(`
      <p>Hi ${contact.name.split(' ')[0]},</p>
      <p>I noticed your property at <strong>${contact.propertyAddress}</strong> recently came off the market, and I wanted to reach out with some context on why that might have happened.</p>
      <div class="box">
        <strong>Current Market Pulse for your neighborhood:</strong><br>
        • Active competing listings: ${market.active_listings || 12}<br>
        • Avg. Days on Market: ${market.avg_dom || 42} days<br>
        • Recent neighbor sale benchmark established in your area.
      </div>
      <p>Selling a home today requires a different strategy than it did even six months ago. I've helped several homeowners in your exact situation reposition their properties for a successful sale.</p>
      <p>I have a few specific ideas for your property. No pitch — just a real conversation about what works right now.</p>
      <a href="${process.env.CALENDAR_LINK || '#'}" class="btn">Schedule a 15-Min Strategy Call</a>
      <p>Talk soon,<br><strong>Monica Selvaggio</strong></p>
    `, contact.id),

  fsbo: (contact: any) =>
    base(`
      <p>Hi ${contact.name.split(' ')[0]},</p>
      <p>I came across your listing at <strong>${contact.propertyAddress}</strong>. It's a beautiful home, and I admire the DIY approach to selling.</p>
      <p>I work with a lot of active buyers in your area, and I wanted to share a free resource that might help you whether you end up listing with an agent or selling it yourself:</p>
      <div class="box">
        <strong>Did you know?</strong><br>
        • Homes listed with an agent sell for an average of 22% more.<br>
        • Most FSBO listings convert to agent listings within 30 days.<br>
        • Proper professional photography can increase click-through by 400%.
      </div>
      <p>I'd love to send you a complimentary "Home Value Report" so you can be 100% sure you're priced right for the current market speed.</p>
      <a href="${process.env.CALENDAR_LINK || '#'}" class="btn">Get My Free Value Report</a>
      <p>Best of luck with the sale,<br><strong>Monica Selvaggio</strong></p>
    `, contact.id),

  preforeclosure: (contact: any) =>
    base(`
      <p>Hi ${contact.name.split(' ')[0]},</p>
      <p>I specialize in helping Las Vegas families navigate complex real estate situations, and I'm reaching out because I believe I can offer some valuable options for your property.</p>
      <div class="box">
        <strong>You have more options than you think:</strong><br>
        • Protect your equity before an auction date.<br>
        • Understand the "short sale" process and if it's right for you.<br>
        • Get a clear timeline of your legal rights as a homeowner.
      </div>
      <p>I offer a completely free, confidential consultation. No judgment, no pressure — just an expert second opinion on where you stand.</p>
      <a href="${process.env.CALENDAR_LINK || '#'}" class="btn">Request a Confidential Chat</a>
      <p>Warmly,<br><strong>Monica Selvaggio</strong></p>
    `, contact.id),

  justSoldBlast: (contact: any, soldAddress: string, _soldPrice: number, soldDom: number) =>
    base(`
      <p>Hi ${contact.name.split(' ')[0]},</p>
      <p>I have some great news for your property value! Your neighbor's home just sold, and it sets a new high-water mark for the area:</p>
      <div class="box">
        <strong>🏆 RECENT NEIGHBORHOOD SALE</strong><br>
        ${soldAddress}<br>
        <strong>Recent Activity:</strong> A home near yours recently sold — and it sets a strong benchmark for your neighborhood's current value.<br>
        Days on Market: <strong>${soldDom} days</strong>
      </div>
      <p>Based on this recent activity, your home at <strong>${contact.propertyAddress}</strong> could be worth significantly more than the automated estimates online might suggest.</p>
      <p>Would you like a custom valuation based on this latest sale?</p>
      <a href="${process.env.CALENDAR_LINK || '#'}" class="btn">Get My New Home Value</a>
      <p>Best,<br><strong>Monica Selvaggio</strong></p>
    `, contact.id),
};
