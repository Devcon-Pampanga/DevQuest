interface ReceiptEmailParams {
  recipientName: string;
  orderId: string;
  productName: string;
  color: string;
  size: string | null;
  quantity: number;
  totalCost: number;
  remainingDevCoins: number;
  date: string;
  time: string;
  isCoordinator: boolean;
}

export function buildReceiptEmailHtml(params: ReceiptEmailParams): string {
  const {
    recipientName,
    orderId,
    productName,
    color,
    size,
    quantity,
    totalCost,
    remainingDevCoins,
    date,
    time,
    isCoordinator,
  } = params;

  const intro = isCoordinator
    ? `<p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">A volunteer in your chapter (<strong style="color:#e4e4e7;">${recipientName}</strong>) has redeemed an item from the DevQuest Marketplace. The details are below.</p>`
    : `<p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">Hi <strong style="color:#e4e4e7;">${recipientName}</strong>, your redemption has been confirmed! Show this receipt at the DEVCON Kids Merch Booth to claim your item.</p>`;

  const sizeRow = size
    ? `<tr>
        <td style="padding:10px 16px;color:#a1a1aa;font-size:13px;border-bottom:1px solid #27272a;">Size</td>
        <td style="padding:10px 16px;color:#e4e4e7;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #27272a;">${size}</td>
      </tr>`
    : "";

  const colorRow =
    color && color !== "Default"
      ? `<tr>
        <td style="padding:10px 16px;color:#a1a1aa;font-size:13px;border-bottom:1px solid #27272a;">Color</td>
        <td style="padding:10px 16px;color:#e4e4e7;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #27272a;">${color}</td>
      </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DEVCON Kids Receipt</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a855f7;">DEVCON Kids</p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;">
                ${isCoordinator ? "Chapter Purchase" : "Redemption Confirmed"}
              </h1>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:16px;padding:28px;">

              ${intro}

              <!-- Order ID badge -->
              <div style="background-color:#09090b;border:1px solid #3f3f46;border-radius:8px;padding:10px 16px;margin-bottom:24px;text-align:center;">
                <span style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.12em;display:block;margin-bottom:4px;">Order ID</span>
                <span style="font-size:18px;font-weight:700;color:#a855f7;letter-spacing:0.08em;">${orderId}</span>
              </div>

              <!-- Product details table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;border:1px solid #27272a;border-radius:10px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="padding:10px 16px;color:#a1a1aa;font-size:13px;border-bottom:1px solid #27272a;">Item</td>
                  <td style="padding:10px 16px;color:#e4e4e7;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #27272a;">${productName}</td>
                </tr>
                ${sizeRow}
                ${colorRow}
                <tr>
                  <td style="padding:10px 16px;color:#a1a1aa;font-size:13px;border-bottom:1px solid #27272a;">Quantity</td>
                  <td style="padding:10px 16px;color:#e4e4e7;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #27272a;">x${quantity}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;color:#a1a1aa;font-size:13px;border-bottom:1px solid #27272a;">Date</td>
                  <td style="padding:10px 16px;color:#e4e4e7;font-size:13px;text-align:right;border-bottom:1px solid #27272a;">${date}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;color:#a1a1aa;font-size:13px;">Time</td>
                  <td style="padding:10px 16px;color:#e4e4e7;font-size:13px;text-align:right;">${time}</td>
                </tr>
              </table>

              <!-- Cost summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#09090b;border:1px solid #27272a;border-radius:8px;padding:12px 16px;width:50%;">
                    <span style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:4px;">DevCoins Spent</span>
                    <span style="font-size:20px;font-weight:700;color:#ffffff;">${totalCost.toLocaleString()}</span>
                    <span style="font-size:12px;color:#a855f7;margin-left:4px;">DC</span>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="background-color:#09090b;border:1px solid #27272a;border-radius:8px;padding:12px 16px;width:50%;">
                    <span style="font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.1em;display:block;margin-bottom:4px;">Remaining Balance</span>
                    <span style="font-size:20px;font-weight:700;color:#a855f7;">${remainingDevCoins.toLocaleString()}</span>
                    <span style="font-size:12px;color:#a855f7;margin-left:4px;">DC</span>
                  </td>
                </tr>
              </table>

              ${
                !isCoordinator
                  ? `<div style="background-color:#1a0f2e;border:1px solid #6d28d9;border-radius:8px;padding:12px 16px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#c4b5fd;font-weight:600;">Show this email at the DEVCON Kids Merch Booth to claim your item.</p>
              </div>`
                  : `<div style="background-color:#0f172a;border:1px solid #27272a;border-radius:8px;padding:12px 16px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#71717a;">This is an automated notification for chapter coordinators. No action is required.</p>
              </div>`
              }

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#52525b;">DevQuest &mdash; Turn your volunteer work into your career.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
