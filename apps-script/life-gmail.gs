/**
 * /life W1 Gmail sweep. Runs in dhajdu@gmail.com as a standalone Apps Script.
 *
 * sweep()    hourly: travel emails from the last 2 days -> POST /api/life/ingest
 * backfill() every 10 minutes until done: the same query in monthly windows
 *            from 2006-01, cursor in Script Properties, stops itself after 5 min
 * setup()    run once by hand: creates the label and both triggers
 *
 * Script Properties: LIFE_INGEST_SECRET (required), LIFE_URL (optional,
 * defaults to https://www.davehajdu.com/api/life/ingest).
 */

var LABEL = 'life/ingested';
var DEFAULT_URL = 'https://www.davehajdu.com/api/life/ingest';
var TRAVEL_QUERY =
  '(category:travel OR subject:(itinerary OR "booking confirmation" OR "e-ticket" OR reservation OR "your trip" OR "check-in" OR cancelled OR "schedule change"))';
var BATCH = 5; // small batches keep each request well inside the server's time limit
var MAX_BODY = 100000;
var BACKFILL_START = '2006-01';
var BACKFILL_BUDGET_MS = 5 * 60 * 1000;
var CURSOR_KEY = 'LIFE_BACKFILL_CURSOR';
var PAGE = 50;

function props_() {
  return PropertiesService.getScriptProperties();
}

function label_() {
  return GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
}

function toItem_(m) {
  var body = m.getPlainBody() || '';
  return {
    source: 'gmail',
    external_id: m.getId(),
    received_at: m.getDate().toISOString(),
    payload: { from: m.getFrom(), subject: m.getSubject(), body_text: body.length > MAX_BODY ? body.slice(0, MAX_BODY) : body },
  };
}

// POSTs items in batches. Returns the set of message ids the server accepted
// (processed, stored or duplicate). Throws on auth/config errors.
function post_(items) {
  var secret = props_().getProperty('LIFE_INGEST_SECRET');
  if (!secret) throw new Error('Set the LIFE_INGEST_SECRET script property');
  var url = props_().getProperty('LIFE_URL') || DEFAULT_URL;
  var ok = {};
  for (var i = 0; i < items.length; i += BATCH) {
    var batch = items.slice(i, i + BATCH);
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + secret },
      payload: JSON.stringify(batch),
      muteHttpExceptions: true,
    });
    var code = res.getResponseCode();
    if (code === 401) throw new Error('Ingest returned 401: check LIFE_INGEST_SECRET');
    var parsed = null;
    try {
      parsed = JSON.parse(res.getContentText());
    } catch (e) {
      console.warn('Ingest returned non-JSON (' + code + ')');
      continue;
    }
    var results = (parsed && parsed.results) || [];
    for (var j = 0; j < results.length; j++) {
      if (results[j].status !== 'error') ok[results[j].external_id] = true;
      else console.warn('Ingest error for ' + results[j].external_id + ': ' + results[j].error);
    }
  }
  return ok;
}

// Sends the messages of these threads that fall inside [after, before) and labels
// each thread whose messages were all accepted. Returns the number of messages sent.
function ingestThreads_(threads, after, before) {
  var items = [];
  var byThread = [];
  for (var t = 0; t < threads.length; t++) {
    var msgs = threads[t].getMessages().filter(function (m) {
      var d = m.getDate();
      return (!after || d >= after) && (!before || d < before);
    });
    byThread.push({ thread: threads[t], ids: msgs.map(function (m) { return m.getId(); }) });
    for (var k = 0; k < msgs.length; k++) items.push(toItem_(msgs[k]));
  }
  if (!items.length) return 0;
  var ok = post_(items);
  var label = label_();
  for (var b = 0; b < byThread.length; b++) {
    var all = byThread[b].ids.every(function (id) { return ok[id]; });
    if (all && byThread[b].ids.length) byThread[b].thread.addLabel(label);
  }
  return items.length;
}

function sweep() {
  var query = '-label:' + LABEL + ' newer_than:2d ' + TRAVEL_QUERY;
  var after = new Date(Date.now() - 3 * 86400000);
  var sent = 0;
  for (var start = 0; ; start += PAGE) {
    var threads = GmailApp.search(query, start, PAGE);
    if (!threads.length) break;
    sent += ingestThreads_(threads, after, null);
    if (threads.length < PAGE) break;
  }
  console.log('sweep sent ' + sent + ' message(s)');
}

function fmt_(d) {
  return Utilities.formatDate(d, 'UTC', 'yyyy/MM/dd');
}

// Walks monthly windows from 2006-01. Cursor: {"month":"YYYY-MM","offset":N} or "done".
function backfill() {
  var started = Date.now();
  var raw = props_().getProperty(CURSOR_KEY);
  if (raw === 'done') return removeTriggers_('backfill');
  var cursor = raw ? JSON.parse(raw) : { month: BACKFILL_START, offset: 0 };
  var now = new Date();

  while (Date.now() - started < BACKFILL_BUDGET_MS) {
    var parts = cursor.month.split('-');
    var from = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, 1));
    if (from > now) {
      props_().setProperty(CURSOR_KEY, 'done');
      console.log('backfill complete');
      return removeTriggers_('backfill');
    }
    var to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
    var query = TRAVEL_QUERY + ' after:' + fmt_(from) + ' before:' + fmt_(to);
    var threads = GmailApp.search(query, cursor.offset, PAGE);
    if (threads.length) ingestThreads_(threads, from, to);
    if (threads.length < PAGE) {
      cursor = { month: Utilities.formatDate(to, 'UTC', 'yyyy-MM'), offset: 0 };
    } else {
      cursor.offset += PAGE;
    }
    props_().setProperty(CURSOR_KEY, JSON.stringify(cursor));
  }
  console.log('backfill paused at ' + JSON.stringify(cursor));
}

function removeTriggers_(fn) {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === fn) ScriptApp.deleteTrigger(t);
  });
}

function setup() {
  label_();
  removeTriggers_('sweep');
  removeTriggers_('backfill');
  ScriptApp.newTrigger('sweep').timeBased().everyHours(1).create();
  if (props_().getProperty(CURSOR_KEY) !== 'done') {
    ScriptApp.newTrigger('backfill').timeBased().everyMinutes(10).create();
  }
  console.log('Triggers created');
}
