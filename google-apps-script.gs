/**
 * INONEGO Lead Capture - Google Apps Script
 *
 * What this does:
 *   1. Receives form POSTs from index.html and contact-support.html
 *      (Contact form, Get Started modal, Lead popup, Contact Support form)
 *   2. Sends an email notification with the lead's details to NOTIFY_EMAIL
 *      (no data is written to a Google Sheet)
 *
 * ===== SETUP =====
 * 1. Open script.google.com (or Extensions -> Apps Script from any Sheet/Doc).
 *    Delete any starter code and paste this entire file in.
 *
 * 2. Update NOTIFY_EMAIL below to the inbox that should receive lead alerts.
 *
 * 3. Click Deploy -> New deployment -> select type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy and authorize the requested permissions.
 *
 * 4. Copy the Web App URL it gives you (ends in /exec).
 *    Paste that URL into index.html and contact-support.html as the value
 *    of LEAD_ENDPOINT.
 *
 * 5. Test: submit any form on the site, then check the NOTIFY_EMAIL inbox.
 *
 * IMPORTANT: every form on the site sends exactly these 7 fields:
 * source, name, phone, email, service, message, page_url.
 * If you add a new form, map its fields to these same keys in the page's
 * submitLeadForm() before posting.
 */

const NOTIFY_EMAIL = 'adstubeindia@gmail.com'; // <-- change to the inbox that should get lead alerts

function doPost(e) {
  try {
    var data = e.parameter || {};

    // Strict Validation: Stop submission if Name or Phone is missing
    if (!data.name || !data.name.trim() || !data.phone || !data.phone.trim()) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Name and Phone are required' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var timestamp = new Date();
    var name = data.name.trim();
    var phone = String(data.phone).trim();
    var email = data.email ? data.email.trim() : '';
    var service = data.service || '';
    var message = data.message || '';
    var source = data.source || 'Website';
    var pageUrl = data.page_url || '';

    sendNotificationEmail({
      timestamp: timestamp,
      source: source,
      name: name,
      phone: phone,
      email: email,
      service: service,
      message: message,
      pageUrl: pageUrl
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Lead emailed' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotificationEmail(row) {
  var subject = 'New INONEGO Lead: ' + (row.name || 'Unknown') + ' (' + (row.source || 'Website') + ')';
  var body =
    'New lead received from the website.\n\n' +
    'Source: ' + row.source + '\n' +
    'Name: ' + row.name + '\n' +
    'Phone: ' + row.phone + '\n' +
    'Email: ' + row.email + '\n' +
    'Service: ' + row.service + '\n' +
    'Message: ' + row.message + '\n' +
    'Page URL: ' + row.pageUrl + '\n' +
    'Submitted At: ' + row.timestamp;

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}
