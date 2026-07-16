import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import {
  buildRegistrationConfirmationEmail,
  buildPaymentConfirmationEmail,
  buildStatusUpdateEmail,
  buildAnnouncementEmail,
} from './emailTemplates';

/**
 * NotificationService
 * Handles all email sending with error tracking and database logging
 */
class NotificationService {
  private getTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  /**
   * Internal method to send email and log to database
   */
  private async _sendEmail(
    to: string,
    subject: string,
    html: string,
    userId: string | null, // null for recipients without an account (e.g. volunteers)
    type: string,
    template: string,
    registrationId?: string
  ) {
    let status = 'SENT';
    let error: string | null = null;

    try {
      // Check if SMTP is configured
      if (!process.env.SMTP_USER) {
        throw new Error('SMTP_USER not configured');
      }

      // Send email
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });

      console.log(`[NotificationService] Email sent: ${type} to ${to}`);
    } catch (err: any) {
      status = 'FAILED';
      error = err.message;
      console.error(`[NotificationService] Email failed: ${type} to ${to}:`, err.message);
    }

    // Log to database. Notifications are keyed to a user account, so recipients
    // without one (volunteers) are emailed but not logged here.
    if (!userId) return;
    try {
      await prisma.notification.create({
        data: {
          userId,
          registrationId: registrationId || null,
          type,
          subject,
          recipientEmail: to,
          template,
          status,
          error: error || null,
          sentAt: new Date(),
        },
      });
    } catch (dbErr: any) {
      console.error(`[NotificationService] Failed to log notification to database:`, dbErr.message);
    }
  }

  /**
   * Send registration confirmation email
   */
  async sendRegistrationConfirmation(
    userId: string,
    childName: string,
    parentName: string,
    parentEmail: string,
    referenceCode: string,
    registrationType: 'SELF' | 'CHILD',
    registrationId?: string
  ) {
    const html = buildRegistrationConfirmationEmail(
      childName,
      parentName,
      parentEmail,
      referenceCode,
      registrationType
    );

    await this._sendEmail(
      parentEmail,
      `NAGARTA Youth Camp 2026 — Registration Confirmed (${referenceCode})`,
      html,
      userId,
      'REGISTRATION_CONFIRMATION',
      'registration_confirmation',
      registrationId
    );
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(
    userId: string,
    childName: string,
    parentName: string,
    parentEmail: string,
    amount: number,
    method: string,
    referenceCode: string,
    registrationId?: string,
    paymentReference?: string
  ) {
    const html = buildPaymentConfirmationEmail(
      childName,
      parentName,
      amount,
      method,
      referenceCode,
      paymentReference
    );

    await this._sendEmail(
      parentEmail,
      `NAGARTA Youth Camp 2026 — Payment Confirmed (₵${(amount / 100).toFixed(2)})`,
      html,
      userId,
      'PAYMENT_CONFIRMATION',
      'payment_confirmation',
      registrationId
    );
  }

  /**
   * Send status update email
   */
  async sendStatusUpdate(
    userId: string,
    childName: string,
    parentName: string,
    parentEmail: string,
    oldStatus: string,
    newStatus: string,
    referenceCode: string,
    registrationId?: string,
    notes?: string
  ) {
    const html = buildStatusUpdateEmail(
      childName,
      parentName,
      oldStatus,
      newStatus,
      referenceCode,
      notes
    );

    await this._sendEmail(
      parentEmail,
      `NAGARTA Youth Camp 2026 — Registration Status Updated to ${newStatus}`,
      html,
      userId,
      'STATUS_UPDATE',
      'status_update',
      registrationId
    );
  }

  /**
   * Email every volunteer applicant who has not been rejected.
   *
   * Volunteers are applications rather than user accounts: they have no login
   * and no portal feed, so email is the only way to reach them.
   */
  private async _sendVolunteerAnnouncement(announcementId: string, title: string, body: string) {
    const applications = await prisma.volunteerApplication.findMany({
      where: { status: { not: 'REJECTED' } },
      select: { fullName: true, email: true },
      orderBy: { createdAt: 'desc' },
    });

    // One email per address, even if somebody applied more than once
    const seen = new Set<string>();
    const recipients = applications.filter((a) => {
      const email = (a.email || '').trim().toLowerCase();
      if (!email || !email.includes('@') || seen.has(email)) return false;
      seen.add(email);
      return true;
    });

    if (recipients.length === 0) {
      console.log(`[NotificationService] No volunteers to notify for announcement ${announcementId}`);
      return;
    }

    for (const r of recipients) {
      const html = buildAnnouncementEmail(title, body, r.fullName, 'Volunteers');
      await this._sendEmail(
        r.email,
        `NAGARTA Youth Camp 2026 — ${title}`,
        html,
        null, // no user account to log against
        'ANNOUNCEMENT',
        'announcement'
      );
    }

    console.log(`[NotificationService] Announcement ${announcementId} sent to ${recipients.length} volunteers`);
  }

  /**
   * Send announcement to users by role
   * If targetRole is null, sends to all users
   */
  async sendAnnouncement(
    announcementId: string,
    title: string,
    body: string,
    targetRole: string | null
  ) {
    try {
      if (targetRole === 'VOLUNTEER') {
        return await this._sendVolunteerAnnouncement(announcementId, title, body);
      }

      // Build query based on target role
      const userQuery: { role?: string } = {};
      if (targetRole) {
        userQuery.role = targetRole;
      }

      // Fetch all matching users
      const users = await prisma.user.findMany({
        where: userQuery,
        select: { id: true, name: true, email: true },
      });

      if (users.length === 0) {
        console.log(
          `[NotificationService] No users found for announcement ${announcementId} with role ${targetRole || 'all'}`
        );
        return;
      }

      // Send to each user
      const audience = targetRole || 'All Users';
      for (const user of users) {
        if (!user.email) {
          console.warn(`[NotificationService] User ${user.id} has no email, skipping announcement`);
          continue;
        }

        const html = buildAnnouncementEmail(title, body, user.name, audience);
        await this._sendEmail(
          user.email,
          `NAGARTA Youth Camp 2026 — ${title}`,
          html,
          user.id,
          'ANNOUNCEMENT',
          'announcement',
          undefined // announcements don't have a registration context
        );
      }

      console.log(
        `[NotificationService] Announcement ${announcementId} sent to ${users.length} ${audience.toLowerCase()}`
      );
    } catch (err: any) {
      console.error(`[NotificationService] Failed to send announcement ${announcementId}:`, err.message);
    }
  }

  /**
   * Resend a notification by ID
   */
  async resendNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        console.error(`[NotificationService] Notification ${notificationId} not found`);
        return false;
      }

      // For now, we'll just attempt to resend with the same content
      // In a more sophisticated system, we might regenerate content
      let status = 'SENT';
      let error: string | null = null;

      try {
        if (!process.env.SMTP_USER) {
          throw new Error('SMTP_USER not configured');
        }

        const transporter = this.getTransporter();
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: notification.recipientEmail,
          subject: notification.subject,
          // Note: We don't have the original HTML, so this is a limitation
          // In production, you'd either store the HTML or regenerate it
          html: `<p>Unable to resend original email. Please contact support.</p>`,
        });
      } catch (err: any) {
        status = 'FAILED';
        error = err.message;
      }

      // Update notification record
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status,
          error,
          sentAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return status === 'SENT';
    } catch (err: any) {
      console.error(`[NotificationService] Failed to resend notification:`, err.message);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
