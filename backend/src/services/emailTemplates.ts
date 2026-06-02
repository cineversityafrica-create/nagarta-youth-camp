/**
 * Email Template Builders for NAGARTA Youth Camp
 * All templates use consistent NAGARTA branding and styling
 */

/**
 * Registration Confirmation Email
 * Sent when a parent/camper completes registration
 */
export function buildRegistrationConfirmationEmail(
  childName: string,
  parentName: string,
  parentEmail: string,
  referenceCode: string,
  registrationType: 'SELF' | 'CHILD'
): string {
  const greeting = registrationType === 'SELF' ? 'Welcome to NAGARTA Youth Camp!' : `Hi ${parentName},`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Registration Confirmation</title>
  <style>body{font-family:Georgia,serif;padding:28px;color:#301317;background:#fff;font-size:12px;}
  .hdr{background:#301317;color:#cba36b;padding:14px 20px;border-radius:8px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;}
  .hdr h1{margin:0;font-size:19px;letter-spacing:2px;} .hdr p{margin:0;font-size:9px;letter-spacing:3px;text-transform:uppercase;opacity:.65;}
  .sec{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#531c22;font-family:Arial,sans-serif;border-bottom:1px solid #decbb2;padding-bottom:3px;margin:14px 0 6px;}
  .badge{display:inline-block;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;background:#cba36b;color:#301317;}
  .ref{font-family:monospace;font-size:16px;font-weight:700;color:#531c22;letter-spacing:2px;background:#f3eee9;padding:10px;border-radius:4px;margin:8px 0;}
  .content{line-height:1.6;margin:14px 0;}
  .footer{margin-top:20px;border-top:1px solid #decbb2;padding-top:12px;font-size:10px;color:#aaa;text-align:center;}
  .btn{display:inline-block;padding:8px 16px;background:#531c22;color:#fff;border-radius:4px;text-decoration:none;font-weight:600;margin-top:10px;}</style>
  </head><body>
  <div class="hdr"><div><h1>NAGARTA Youth Camp 2026</h1><p>Registration Confirmation</p></div>
  <div style="text-align:right;font-size:10px;opacity:.65;">${new Date().toLocaleDateString('en-GB')}</div></div>

  <div class="content">
    <p>${greeting}</p>
    <p>Thank you for registering for NAGARTA Youth Camp 2026! We're excited to have <strong>${childName}</strong> join us.</p>

    <div class="sec">Your Registration Reference</div>
    <div class="ref">${referenceCode}</div>
    <p style="font-size:11px;color:#666;">Please save this reference code — you'll need it to complete payment and for check-in at camp.</p>

    <div class="sec">Next Steps</div>
    <ol style="line-height:1.8;">
      <li><strong>Complete Payment:</strong> Use your reference code to make payment via our secure portal or contact us at <strong>hello@nagartayouthcamp.com</strong></li>
      <li><strong>Upload Documents:</strong> Log in to your parent dashboard to upload any required medical or emergency forms</li>
      <li><strong>Confirm Details:</strong> Review all attendee information in your dashboard</li>
      <li><strong>Track Progress:</strong> Check announcements and updates in your parent portal</li>
    </ol>

    <div class="sec">Attendee Information</div>
    <p><strong>Camper Name:</strong> ${childName}</p>
    <p><strong>Parent/Guardian:</strong> ${parentName}</p>
    <p><strong>Email:</strong> ${parentEmail}</p>

    <div class="sec">Questions?</div>
    <p>If you have any questions about registration or the camp, please contact us at:</p>
    <p style="margin:8px 0;">
      📧 <strong>Email:</strong> hello@nagartayouthcamp.com<br/>
      📱 <strong>Phone:</strong> +233 (0) 123 456 789
    </p>
  </div>

  <div class="footer">
    NAGARTA Youth Camp 2026 • Arise & Lead • Registration ID: ${referenceCode}
  </div>
  </body></html>`;
}

/**
 * Payment Confirmation Email
 * Sent when payment is recorded or verified
 */
export function buildPaymentConfirmationEmail(
  childName: string,
  parentName: string,
  amount: number,
  method: string,
  referenceCode: string,
  paymentReference?: string
): string {
  const methodDisplay = method.replace('_', ' ');
  const formattedAmount = (amount / 100).toFixed(2);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Payment Confirmation</title>
  <style>body{font-family:Georgia,serif;padding:28px;color:#301317;background:#fff;font-size:12px;}
  .hdr{background:#301317;color:#cba36b;padding:14px 20px;border-radius:8px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;}
  .hdr h1{margin:0;font-size:19px;letter-spacing:2px;} .hdr p{margin:0;font-size:9px;letter-spacing:3px;text-transform:uppercase;opacity:.65;}
  .sec{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#531c22;font-family:Arial,sans-serif;border-bottom:1px solid #decbb2;padding-bottom:3px;margin:14px 0 6px;}
  .badge{display:inline-block;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;background:#cba36b;color:#301317;}
  .amount{font-size:24px;font-weight:700;color:#531c22;margin:10px 0;}
  .content{line-height:1.6;margin:14px 0;}
  .footer{margin-top:20px;border-top:1px solid #decbb2;padding-top:12px;font-size:10px;color:#aaa;text-align:center;}
  table{border-collapse:collapse;width:100%;} td{padding:6px 8px;vertical-align:top;font-size:12px;}</style>
  </head><body>
  <div class="hdr"><div><h1>NAGARTA Youth Camp 2026</h1><p>Payment Confirmation</p></div>
  <div style="text-align:right;font-size:10px;opacity:.65;">${new Date().toLocaleDateString('en-GB')}</div></div>

  <div class="content">
    <p>Dear ${parentName},</p>
    <p>Your payment for <strong>${childName}'s</strong> registration has been received. Thank you!</p>

    <div class="sec">Payment Details</div>
    <table>
      <tr><td style="color:#531c22;font-weight:600;">Camper Name</td><td>${childName}</td></tr>
      <tr><td style="color:#531c22;font-weight:600;">Amount Paid</td><td><strong class="amount">₵${formattedAmount}</strong></td></tr>
      <tr><td style="color:#531c22;font-weight:600;">Payment Method</td><td>${methodDisplay}</td></tr>
      ${paymentReference ? `<tr><td style="color:#531c22;font-weight:600;">Transaction Reference</td><td style="font-family:monospace;">${paymentReference}</td></tr>` : ''}
      <tr><td style="color:#531c22;font-weight:600;">Registration Reference</td><td style="font-family:monospace;">${referenceCode}</td></tr>
      <tr><td style="color:#531c22;font-weight:600;">Date</td><td>${new Date().toLocaleDateString('en-GB')}</td></tr>
    </table>

    <div class="sec">What's Next?</div>
    <p>Your registration is now confirmed! You can now:</p>
    <ul style="line-height:1.8;">
      <li>View and download your registration receipt</li>
      <li>Complete your child's medical and emergency forms</li>
      <li>Review camp schedule and activities</li>
      <li>Check announcements and updates</li>
    </ul>

    <p style="margin-top:14px;">Your confirmation email and receipt have been saved. You'll receive further updates about camp logistics closer to the start date.</p>
  </div>

  <div class="footer">
    NAGARTA Youth Camp 2026 • Arise & Lead • Reference: ${referenceCode}
  </div>
  </body></html>`;
}

/**
 * Status Update Email
 * Sent when registration status changes (e.g., PENDING → CONFIRMED)
 */
export function buildStatusUpdateEmail(
  childName: string,
  parentName: string,
  oldStatus: string,
  newStatus: string,
  referenceCode: string,
  notes?: string
): string {
  const statusMessages: { [key: string]: string } = {
    CONFIRMED: 'Your registration has been confirmed! Your child is officially registered for NAGARTA Youth Camp 2026.',
    WAITLISTED: 'Your application is on our waitlist. We\'ll notify you as soon as a spot becomes available.',
    CANCELLED: 'Your registration has been cancelled. If this was unintended, please contact us immediately.',
    PENDING: 'Your registration is pending review. We\'ll update you within 48 hours.',
  };

  const statusColor = newStatus === 'CONFIRMED' ? '#531c22' : '#666';
  const message = statusMessages[newStatus] || `Your registration status has been updated to ${newStatus}.`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Registration Status Update</title>
  <style>body{font-family:Georgia,serif;padding:28px;color:#301317;background:#fff;font-size:12px;}
  .hdr{background:#301317;color:#cba36b;padding:14px 20px;border-radius:8px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;}
  .hdr h1{margin:0;font-size:19px;letter-spacing:2px;} .hdr p{margin:0;font-size:9px;letter-spacing:3px;text-transform:uppercase;opacity:.65;}
  .sec{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#531c22;font-family:Arial,sans-serif;border-bottom:1px solid #decbb2;padding-bottom:3px;margin:14px 0 6px;}
  .badge{display:inline-block;padding:6px 12px;border-radius:4px;font-size:11px;font-weight:700;background:#cba36b;color:#301317;}
  .status{font-size:18px;font-weight:700;color:${statusColor};margin:10px 0;}
  .content{line-height:1.6;margin:14px 0;}
  .footer{margin-top:20px;border-top:1px solid #decbb2;padding-top:12px;font-size:10px;color:#aaa;text-align:center;}</style>
  </head><body>
  <div class="hdr"><div><h1>NAGARTA Youth Camp 2026</h1><p>Status Update</p></div>
  <div style="text-align:right;font-size:10px;opacity:.65;">${new Date().toLocaleDateString('en-GB')}</div></div>

  <div class="content">
    <p>Dear ${parentName},</p>
    <p>We have an update about <strong>${childName}'s</strong> registration.</p>

    <div class="sec">Status Changed</div>
    <p style="font-size:11px;color:#aaa;">From: <span class="badge">${oldStatus}</span> &nbsp; To: <span class="badge">${newStatus}</span></p>

    <div class="status">${newStatus}</div>

    <p>${message}</p>

    ${notes ? `<div class="sec">Additional Notes</div><p>${notes}</p>` : ''}

    <div class="sec">Reference Information</div>
    <p style="font-size:11px;color:#666;">
      <strong>Registration Reference:</strong> <span style="font-family:monospace;font-weight:600;">${referenceCode}</span><br/>
      <strong>Camper:</strong> ${childName}
    </p>

    <p style="margin-top:14px;">If you have any questions about this update, please contact us at hello@nagartayouthcamp.com.</p>
  </div>

  <div class="footer">
    NAGARTA Youth Camp 2026 • Arise & Lead • Reference: ${referenceCode}
  </div>
  </body></html>`;
}

/**
 * Announcement Email
 * Sent to parents/campers when a new announcement is published
 */
export function buildAnnouncementEmail(
  title: string,
  body: string,
  recipientName: string,
  targetAudience: string
): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Announcement</title>
  <style>body{font-family:Georgia,serif;padding:28px;color:#301317;background:#fff;font-size:12px;}
  .hdr{background:#301317;color:#cba36b;padding:14px 20px;border-radius:8px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;}
  .hdr h1{margin:0;font-size:19px;letter-spacing:2px;} .hdr p{margin:0;font-size:9px;letter-spacing:3px;text-transform:uppercase;opacity:.65;}
  .title{font-size:16px;font-weight:700;color:#531c22;margin:14px 0 6px;}
  .content{line-height:1.6;margin:14px 0;color:#333;}
  .footer{margin-top:20px;border-top:1px solid #decbb2;padding-top:12px;font-size:10px;color:#aaa;text-align:center;}</style>
  </head><body>
  <div class="hdr"><div><h1>NAGARTA Youth Camp 2026</h1><p>Important Announcement</p></div>
  <div style="text-align:right;font-size:10px;opacity:.65;">${new Date().toLocaleDateString('en-GB')}</div></div>

  <div style="margin:14px 0;">
    <p>Hi ${recipientName},</p>

    <div class="title">${title}</div>

    <div class="content">
      ${body.split('\n').map(para => `<p>${para}</p>`).join('')}
    </div>

    <p style="font-size:11px;color:#aaa;margin-top:14px;"><em>This announcement was sent to ${targetAudience}.</em></p>
  </div>

  <div class="footer">
    NAGARTA Youth Camp 2026 • Arise & Lead
  </div>
  </body></html>`;
}
