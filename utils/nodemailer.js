const nodemailer = require("nodemailer");
require("dotenv").config();

const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendPasswordReset = async (email, firstName, resetPasswordCode) => {
  try {
    const info = await transport.sendMail({
      from: `SWIFT`,
      to: email,
      subject: "Reset your password",
      html: `<div>
            <div style="display: flex; align-items: center;">
                <img alt="Logo" style="height: 50px; margin-right: 8px; width: 50px;" src="https://drive.google.com/uc?export=view&id=1VxBysUQV0835JiijO4hs24M9A0rZ_Q-d">
                <img alt="Heurekka" style="height: 30px; margin-right: 8px;" src="https://drive.google.com/uc?export=view&id=1REJbJrhQZakh4UD3gypU8OPa-A2RJVZA">
            </div>
            <br/>
            // <p style="line-height: 1.2;">Hi ${firstName},</p>
            <p style="line-height: 1.2;">We've received a request to reset your password.</p>
            <p style="line-height: 1.5;">If you didn't make the request, just ignore this message. Otherwise, you can reset your password.</p>        
            <a href=https://server-medstock.onrender.com/user_auth/reset_password/${resetPasswordCode}>
                <button style="font-weight: 500;font-size: 14px;cursor: pointer; background-color: rgba(238, 119, 36, 1); border: none; border-radius: 4px; padding: 12px 18px 12px 18px; color: white;">
                    Reset your password
                </button>
            </a>
            <br/>
            <br/>
            <p  style="line-height: 0.2;">Thanks!</p>
            <p  style="line-height: 0.5;">The Heurekka team.</p>
            <br/>
            <br/> 
            <hr style="border: 0.5px solid rgb(186, 185, 185); width: 100%;"></hr>
            <br/> 
            <p style="font-size: 14px; color: grey">Powered by Heurekka.</p>
            <p style="font-size: 14px; color: grey">Find, Connect & Share with the best Creators, Developers & Designers.</p>
        </div>`,
      headers: {
        "Content-Type": "multipart/mixed",
      },
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    return { msg: "Error sending email", error };
  }
};

const sendOTP = async (email, otp) => {
  try {
    const info = await transport.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "One Time Password",
      html: `<p style="line-height: 1.5">
        Your OTP verification code is: <br /> <br />
        <font size="3">${otp}</font> <br />
        Best regards,<br />
        Team MiniProject.
        </p>
        </div>`,
    });

    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    return { msg: "Error sending email", error };
  }
};

const sendMail = async ({ from, to, subject, text, html }) => {
  try {
    if (!to) throw new Error("No recipient email provided to sendMail()");

    const info = await transport.sendMail({
      from: from || process.env.MAIL_USER,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent to:", to, "| Subject:", subject);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { msg: "Error sending email", error };
  }
};


const sendMasterAdminCreatedEmail = async (email, firstName, tempPassword) => {
  try {
    const subject = "Your Master Admin Account Has Been Created!";
    const html = `
      <div>
        <div style="display: flex; align-items: center;">
            <img alt="Logo" style="height: 50px; margin-right: 8px; width: 50px;" src="https://drive.google.com/uc?export=view&id=1VxBysUQV0835JiijO4hs24M9A0rZ_Q-d">
            <h2 style="margin:0;">SWIFT Admin Portal</h2>
        </div>
        <br/>
        <p>Hi ${firstName},</p>
        <p>Your Master Admin account has been successfully created!</p>
        <p>You can now log in to the admin portal using your credentials below:</p>
        <ul>
          <li><b>Email:</b> ${email}</li>
          <li><b>Temporary Password:</b> ${tempPassword}</li>
        </ul>
        <p>For security, please reset your password after logging in.</p>
        <a href="https://your-admin-portal-url.com/login">
            <button style="font-weight: 500;font-size: 14px;cursor: pointer; background-color: #EE7724; border: none; border-radius: 4px; padding: 12px 18px; color: white;">
                Login to Admin Portal
            </button>
        </a>
        <br/><br/>
        <p>Thanks!</p>
        <p>The SWIFT Team.</p>
        <hr style="border: 0.5px solid rgb(186, 185, 185); width: 100%;"></hr>
        <p style="font-size: 14px; color: grey">Powered by SWIFT.</p>
      </div>
    `;

    const info = await sendMail(email, subject, html);
    console.log("Master admin email sent:", info.response);
  } catch (error) {
    console.error("Error sending master admin email:", error);
  }
};


const sendBookingEmailToAdmin = async (booking, user, number, adminEmails) => {
  try {
    if (!adminEmails || adminEmails.length === 0) {
      console.warn("⚠️ No admin emails to send to.");
      return;
    }

    const info = await transport.sendMail({
      from: process.env.MAIL_USER,
      to: Array.isArray(adminEmails) ? adminEmails.join(",") : adminEmails,
      subject: "New Booking Created",
      html: `
        <div>
          <h3>New Booking Alert 🚗</h3>
          <p>A new booking has been created by <b>${user.firstName}</b> (${user.email}, ${number}).</p>
          <p><b>Pickup:</b> ${booking.pickupLocation}</p>
          <p><b>Dropoff:</b> ${booking.dropoffLocation}</p>
          <p><b>Service:</b> ${booking.serviceType}</p>
          <p><b>Vehicle:</b> ${booking.vehicle}</p>
          <p><b>User Number:</b> ${number}</p>
          <p><b>Date:</b> ${booking.bookingDate || "N/A"} at ${booking.bookingTime}</p>
          <p><b>Total Price:</b> ₦${booking.totalPrice || "0"}</p>
          <br/>
          <p>Please review the booking in your admin dashboard.</p>
        </div>
      `,
    });

    console.log("Admin booking email sent:", info.response);
  } catch (error) {
    console.error("Error sending admin booking email:", error);
  }
};

// ✅ NEW FUNCTION — Send New Admin Password Email
const sendNewAdminPasswordEmail = async (email, name, password) => {
  try {
    const subject = "Your Admin Account Has Been Created!";
    const html = `
      <div style="font-family:sans-serif;line-height:1.6">
        <div style="display:flex;align-items:center;">
          <img alt="Logo" style="height:50px;margin-right:8px;width:50px;" 
            src="https://drive.google.com/uc?export=view&id=1VxBysUQV0835JiijO4hs24M9A0rZ_Q-d" />
          <h2 style="margin:0;">SWIFT Admin Portal</h2>
        </div>
        <br/>
        <p>Hello ${name},</p>
        <p>Your admin account has been successfully created.</p>
        <p>Here are your login details:</p>
        <ul>
          <li><b>Email:</b> ${email}</li>
          <li><b>Password:</b> ${password}</li>
        </ul>
        <p>Login and change your password immediately for security reasons.</p>
        <br/>
        <a href="https://your-admin-portal-url.com/login">
          <button style="background-color:#EE7724;color:white;border:none;padding:12px 18px;border-radius:6px;cursor:pointer;">
            Login to Admin Portal
          </button>
        </a>
        <br/><br/>
        <p>Best regards,<br/>SWIFT Team</p>
      </div>
    `;

    const info = await sendMail(email, subject, html);
    console.log("New Admin Password Email sent:", info.response);
  } catch (error) {
    console.error("Error sending new admin email:", error);
  }
};


const sendAssignmentEmailToRider = async (booking, rider) => {
  try {
    if (!rider?.email) return;

    const customer = booking.user ? `${booking.user.firstName || ''} ${booking.user.lastName || ''}`.trim() : 'Customer';
    const text = `Hello ${rider.firstName || ''},

You have been assigned a new booking (${booking._id}).

Pickup: ${booking.pickupLocation || booking.fromLocation || 'N/A'}
Dropoff: ${booking.dropoffLocation || booking.toLocation || 'N/A'}
Customer: ${customer}

Please check your rider dashboard for details and confirm acceptance.

Thank you,
Team`;

    const html = `<p>Hello ${rider.firstName || ''},</p>
<p>You have been assigned a new booking (<strong>${booking._id}</strong>).</p>
<ul>
  <li>Pickup: ${booking.pickupLocation || booking.fromLocation || 'N/A'}</li>
  <li>Dropoff: ${booking.dropoffLocation || booking.toLocation || 'N/A'}</li>
  <li>Customer: ${customer}</li>
</ul>
<p>Please check your rider dashboard for details and confirm acceptance.</p>
<p>Thanks,<br/>Team</p>`;

    await sendMail({
      from: process.env.EMAIL_FROM,
      to: rider.email,
      subject: `New booking assigned: ${booking._id}`,
      text,
      html,
    });
  } catch (err) {
    console.error('sendAssignmentEmailToRider error', err);
    throw err;
  }
}


const sendPaymentEmailToUser = async (booking, price, paymentInfo = {}) => {
  try {
    if (!booking?.user?.email) return;

    const user = booking.user;
    const bank = process.env.PAYMENT_BANK_NAME || 'Your Bank';
    const account = process.env.PAYMENT_ACCOUNT_NUMBER || '0000000000';
    const accountName = process.env.PAYMENT_ACCOUNT_NAME || 'Company Name';

    const text = `Hello ${user.firstName || ''},

A payment of ₦${Number(price).toLocaleString()} has been requested for your booking (${booking._id.toString().slice(-6)
      }).

Pickup: ${booking.pickupLocation || booking.fromLocation || 'N/A'}
Dropoff: ${booking.dropoffLocation || booking.toLocation || 'N/A'}

Please make payment to:
Bank: ${bank}
Account Number: ${account}
Account Name: ${accountName}

If you have already paid, please ignore or reply with proof.

Thank you,
Team`;

    const html = `<p>Hello ${user.firstName || ''},</p>
<p>A payment of <strong>₦${Number(price).toLocaleString()}</strong> has been requested for your booking (<strong>${booking._id.toString().slice(-6)}</strong>).</p>
<ul>
  <li>Pickup: ${booking.pickupLocation || booking.fromLocation || 'N/A'}</li>
  <li>Dropoff: ${booking.dropoffLocation || booking.toLocation || 'N/A'}</li>
</ul>
<p>Please make payment to:</p>
<ul>
  <li><strong>Bank:</strong> ${bank}</li>
  <li><strong>Account Number:</strong> ${account}</li>
  <li><strong>Account Name:</strong> ${accountName}</li>
</ul>
<p>If you have already paid, please ignore or reply with proof.</p>
<p>Thanks,<br/>Team</p>`;

    await sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Payment requested for booking ${booking._id.toString().slice(-6)}`,
      text,
      html,
    });
  } catch (err) {
    console.error('sendPaymentEmailToUser error', err);
    throw err;
  }
}

const sendPaymentConfirmedEmail = async (booking) => {
  const user = booking.user;
  const html = `
    <p>Hi ${user.firstName || ''},</p>
    <p>Your payment for booking <strong>${booking._id.slice(-6)}</strong> has been successfully confirmed ✅.</p>
    <p>Thank you for using our service!</p>
    <p>Team</p>
  `;
  await sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: `Payment Confirmed — Booking ${booking._id.slice(-6)}`,
    html,
  });
};

// ✅ Email to admins requesting payment confirmation
const sendPaymentConfirmationEmail = async (booking, adminEmails = []) => {
  try {
    if (!Array.isArray(adminEmails) || adminEmails.length === 0) {
      console.warn("⚠️ No admin emails provided for payment confirmation.");
      return;
    }

    const html = `
      <h2>Payment Confirmation Requested</h2>
      <p><strong>Booking ID:</strong> ${booking._id}</p>
      <p><strong>User:</strong> ${booking.user.firstName} ${booking.user.lastName}</p>
      <p><strong>Email:</strong> ${booking.user.email}</p>
      <p><strong>Amount:</strong> ₦${booking.totalPrice?.toLocaleString() || "N/A"}</p>
      <p>Please review and mark the payment as "Paid" in your admin dashboard.</p>
    `;

    await transport.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmails.join(", "),
      subject: "Payment Confirmation Request",
      html,
    });

    console.log("📤 Payment confirmation email sent to admins:", adminEmails);
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
  }
};


module.exports = {
  sendAssignmentEmailToRider,
  sendPaymentEmailToUser,
  sendBookingEmailToAdmin,
  sendPasswordReset,
  sendOTP,
  sendMail,
  sendMasterAdminCreatedEmail,
  sendNewAdminPasswordEmail,
  sendPaymentConfirmedEmail,
  sendPaymentConfirmationEmail,
  transport
};