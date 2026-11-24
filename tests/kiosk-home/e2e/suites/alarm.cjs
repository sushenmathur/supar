// Alarm keypad: a passcode that doesn't match must show "Access denied" and leave the alarm alone, for arm home,
// arm away and disarm. MODE (set by run.mjs with the matching mock switches):
//   script   script.alarm_keypad installed, alarm without a code of its own
//   panel    script installed, alarm with its own code that rejects wrong codes
//   silent   script installed, alarm with its own code that ignores wrong codes without an error (like Alarmo)
//   direct   no script, alarm with its own code that ignores wrong codes silently: the page must notice
//   missing  no script, alarm without a code: the keypad refuses
//   mismatch script accepts the code but the alarm's own code differs, so nothing changes
const { chromium } = require('playwright');
const BASE = 'http://localhost:8123', NAME = process.env.NAME || 'kiosk-home', PAGE = BASE + '/local/' + NAME + (process.env.SINGLE ? '.html' : '/index.html');
const MODE = process.env.MODE || 'script';
const R = []; const check = (n, c, x = '') => R.push(`${c ? 'PASS' : 'FAIL'} [${MODE}] ${n}${x ? ' (' + x + ')' : ''}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lg = async () => (await (await fetch(BASE + '/__log')).json());
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.addInitScript(() => localStorage.setItem('hassTokens', JSON.stringify({ hassUrl: location.origin, clientId: location.origin + '/', access_token: 'x', refresh_token: 'r', expires: Date.now() + 3e6 })));
  await p.goto(PAGE); await sleep(1500);
  const state = () => p.locator('#alarm .sub').first().textContent();
  const msg = () => p.locator('#lpmsg').textContent();
  // The page waits up to 8 s for the alarm to change when it can't be told the code was wrong.
  const slow = MODE === 'direct' || MODE === 'mismatch';
  // A right code changes the alarm at once, so only wrong ones need the long wait.
  const enter = async (digits, wait = slow ? 8800 : 500) => { for (const k of [...digits, 'ok']) await p.locator(`#sheet [data-key="${k}"]`).click(); await sleep(wait); };
  const open = async (act) => { await p.locator(`#alarm [data-act="${act}"]`).click(); await sleep(300); };
  if (MODE === 'missing') {
    await open('alarm-arm-away'); await enter('1234');
    check('no code check installed: refuses to arm', /not set up/.test(await msg()) && /Disarmed/.test(await state()), await msg());
  } else if (MODE === 'mismatch') {
    await open('alarm-arm-away'); await enter('1234');
    check("script OK but the alarm didn't change: says so, never 'Armed'", /didn't change/.test(await msg()) && !/Armed/.test(await msg()) && /Disarmed/.test(await state()), await msg());
  } else {
    for (const [act, chip, want] of [['alarm-arm-away', 'alarm_arm_away', /Armed away/], ['alarm-disarm', 'alarm_disarm', /Disarmed/], ['alarm-arm-home', 'alarm_arm_home', /Armed home/], ['alarm-disarm', 'alarm_disarm', /Disarmed/]]) {
      const before = await state();
      await open(act); await enter('9999');
      check(`${chip}: wrong passcode shows Access denied`, /Access denied/.test(await msg()) && !/Armed|Disarmed/.test(await msg()) && (await state()) === before, `${await msg()} | ${await state()}`);
      await sleep(1000); await enter('12345');
      check(`${chip}: another wrong passcode, Access denied again`, /Access denied/.test(await msg()) && (await state()) === before);
      await sleep(1000); await enter('1234', 600);
      check(`${chip}: right passcode works`, want.test(await state()) && want.test(await msg()), `${await msg()} | ${await state()}`);
      await sleep(1900);
    }
    const sent = (await lg()).data.filter((d) => /alarm/.test(d.svc)).map((d) => d.svc);
    const direct = MODE === 'direct';
    check(direct ? 'no script: after trying it, the right codes go straight to the alarm' : 'codes are checked by script.alarm_keypad', direct ? sent.filter((s) => s.startsWith('alarm_control_panel.')).length >= 4 : sent.every((s) => s === 'script.alarm_keypad'), [...new Set(sent)].join(','));
  }
  console.log(R.join('\n')); await b.close(); process.exit(R.some((r) => r.startsWith('FAIL')) ? 1 : 0);
})();
