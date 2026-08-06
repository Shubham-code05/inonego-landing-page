/**
 * INONEGO Lead Capture - Google Apps Script
 *
 * What this does:
 *   1. Receives form POSTs from index.html and contact-support.html
 *      (Contact form, Get Started modal, Lead popup, Contact Support form)
 *   2. Appends each lead as a new row in a Google Sheet, in a fixed column order
 *   3. Sends an email notification with the lead's details
 *
 * ===== SETUP =====
 * 1. Create a new Google Sheet. Rename the first tab to "Leads".
 *    In row 1, add these headers (must match exactly, in this order):
 *    Timestamp | Source | Name | Phone | Email | Service | Message | Page URL
 *
 * 2. In the Sheet, go to Extensions -> Apps Script. Delete any starter code
 *    and paste this entire file in.
 *
 * 3. Update NOTIFY_EMAIL below to the inbox that should receive lead alerts.
 *
 * 4. Click Deploy -> New deployment -> select type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy and authorize the requested permissions.
 *
 * 5. Copy the Web App URL it gives you (ends in /exec).
 *    Paste that URL into index.html and contact-support.html as the value
 *    of LEAD_ENDPOINT.
 *
 * 6. Test: submit any form on the site, then check the "Leads" sheet
 *    and the NOTIFY_EMAIL inbox.
 *
 * IMPORTANT: every form on the site sends exactly these 7 fields:
 * source, name, phone, email, service, message, page_url.
 * If you add a new form, map its fields to these same keys in the page's
 * submitLeadForm() before posting — don't add new/renamed keys here without
 * also updating the sheet headers above.
 */

const SHEET_NAME = 'Leads';
const NOTIFY_EMAIL = 'contact@inonego.in'; // <-- change to the inbox that should get lead alerts
const HEADERS = ['Timestamp', 'Source', 'Name', 'Phone', 'Email', 'Service', 'Message', 'Page URL'];

function doPost(e) {
  try {
    var sheet = getOrCreateSheet();
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

    // Map strictly to matching sheet columns A to H
    var newRow = [
      timestamp,        // Column A: Timestamp
      source,           // Column B: Source
      name,             // Column C: Name
      "'" + phone,      // Column D: Phone (prefixed with ' to force string)
      email,            // Column E: Email
      service,          // Column F: Service
      message,          // Column G: Message
      pageUrl           // Column H: Page URL
    ];

    sheet.appendRow(newRow);

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
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Data saved' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
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
