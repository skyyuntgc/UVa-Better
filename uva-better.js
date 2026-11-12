// ==UserScript==
// @name         UVA Better
// @name:zh-CN   UVA Better
// @namespace    https://github.com/skyyuntgc/uvabetter
// @version      1.0.1
// @description  Enhance UVa Online Judge (onlinejudge.org) with dark mode, problem-page toolbar, uHunt statistics, sample copy, submit helper and a settings panel.
// @description:zh-CN 增强 UVa Online Judge（onlinejudge.org）：深色模式、题目页工具栏、uHunt 统计、样例一键复制、提交辅助与设置面板。
// @author       Sky-Yun
// @icon         https://cdn.luogu.com.cn/upload/usericon/1059100.png
// @license      MIT
// @match        https://onlinejudge.org/*
// @match        http://onlinejudge.org/*
// @match        https://uva.onlinejudge.org/*
// @match        http://uva.onlinejudge.org/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      uhunt.onlinejudge.org
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/skyyuntgc/UVa-Better/main/uva-better.js
// @downloadURL  https://raw.githubusercontent.com/skyyuntgc/UVa-Better/main/uva-better.js
// @noframes
// ==/UserScript==
(function () {
  'use strict';

  // ==========================================================================
  // 0. Constants
  // ==========================================================================

  var META = {
    name: 'UVA Better',
    version: '1.0.0',
    storagePrefix: 'uvabetter.',
  };

  /** Classic UVa Online Judge language ids used by the submit form. */
  var UVA_LANGUAGES = {
    1: 'ANSI C',
    2: 'Java',
    3: 'C++',
    4: 'Pascal',
    5: 'C++11',
    6: 'Python 3',
  };

  // ==========================================================================
  // 1. i18n
  // ==========================================================================

  var I18N = {
    zh: {
      // toolbar
      toolbar_submit: '提交',
      toolbar_stats: '统计',
      toolbar_pdf: 'PDF',
      toolbar_udebug: 'uDebug',
      toolbar_vjudge: 'vjudge',
      toolbar_luogu: '洛谷',
      toolbar_uhunt: 'uHunt',
      toolbar_translate: '翻译',
      toolbar_copy_statement: '复制题面',
      // stats
      stats_title: 'uHunt 统计',
      stats_loading: '加载中…',
      stats_failed: '统计加载失败',
      stats_accepted: 'AC 人数',
      stats_accept_rate: 'AC 率',
      stats_submissions: '提交总数',
      stats_wrong_answer: 'WA',
      stats_time_limit: 'TLE',
      stats_runtime_error: 'RE',
      stats_compile_error: 'CE',
      // sample copy
      sample_copy_input: '复制输入',
      sample_copy_output: '复制输出',
      sample_copied: '已复制',
      // submit helper
      submit_language: '语言',
      submit_code: '代码',
      submit_confirm_title: '确认提交',
      submit_confirm_text: '确定要提交代码到题目 {num} 吗？',
      submit_confirm_yes: '提交',
      submit_confirm_no: '取消',
      submit_remember_note: '（已记住你上次选择的语言）',
      // settings
      settings_title: 'UVA Better 设置',
      settings_dark: '深色模式',
      settings_toolbar: '题目页工具栏',
      settings_stats: 'uHunt 统计卡片',
      settings_sample: '样例复制按钮',
      settings_submit_helper: '提交页辅助',
      settings_remember_lang: '记住上次选择的语言',
      settings_language: '默认语言',
      settings_template: '代码模板（打开提交页时自动填入）',
      settings_submit_confirm: '提交前确认',
      settings_ui_lang: '界面语言',
      settings_ui_lang_auto: '自动',
      settings_save: '保存',
      settings_reset: '恢复默认',
      settings_saved: '已保存',
      // misc
      copied: '已复制到剪贴板',
    },
    en: {
      toolbar_submit: 'Submit',
      toolbar_stats: 'Stats',
      toolbar_pdf: 'PDF',
      toolbar_udebug: 'uDebug',
      toolbar_vjudge: 'vjudge',
      toolbar_luogu: 'Luogu',
      toolbar_uhunt: 'uHunt',
      toolbar_translate: 'Translate',
      toolbar_copy_statement: 'Copy statement',
      stats_title: 'uHunt Stats',
      stats_loading: 'Loading…',
      stats_failed: 'Failed to load stats',
      stats_accepted: 'Accepted by',
      stats_accept_rate: 'AC rate',
      stats_submissions: 'Submissions',
      stats_wrong_answer: 'WA',
      stats_time_limit: 'TLE',
      stats_runtime_error: 'RE',
      stats_compile_error: 'CE',
      sample_copy_input: 'Copy input',
      sample_copy_output: 'Copy output',
      sample_copied: 'Copied',
      submit_language: 'Language',
      submit_code: 'Code',
      submit_confirm_title: 'Confirm submission',
      submit_confirm_text: 'Submit your code to problem {num}?',
      submit_confirm_yes: 'Submit',
      submit_confirm_no: 'Cancel',
      submit_remember_note: ' (your last language was restored)',
      settings_title: 'UVA Better Settings',
      settings_dark: 'Dark mode',
      settings_toolbar: 'Problem-page toolbar',
      settings_stats: 'uHunt stats card',
      settings_sample: 'Sample copy buttons',
      settings_submit_helper: 'Submit-page helper',
      settings_remember_lang: 'Remember last language',
      settings_language: 'Default language',
      settings_template: 'Code template (auto-filled on submit page)',
      settings_submit_confirm: 'Confirm before submit',
      settings_ui_lang: 'UI language',
      settings_ui_lang_auto: 'Auto',
      settings_save: 'Save',
      settings_reset: 'Reset',
      settings_saved: 'Saved',
      copied: 'Copied to clipboard',
    },
  };

  function detectLang() {
    var l = (navigator.language || 'en').toLowerCase();
    if (l.indexOf('zh') === 0) return 'zh';
    return 'en';
  }

  function t(key, params) {
    var lang = Settings.get('uiLang') === 'auto' ? detectLang() : Settings.get('uiLang');
    var table = I18N[lang] || I18N.en;
    var s = table[key] || I18N.en[key] || key;
    if (params) {
      Object.keys(params).forEach(function (k) {
        s = s.replace('{' + k + '}', params[k]);
      });
    }
    return s;
  }

  // ==========================================================================
  // 2. Settings (GM storage wrapper)
  // ==========================================================================

  var DEFAULTS = {
    darkMode: false,
    showToolbar: true,
    showUhuntStats: true,
    showSampleCopy: true,
    submitHelper: true,
    rememberLanguage: true,
    language: '3',
    codeTemplate: '',
    submitConfirm: true,
    uiLang: 'auto',
  };

  var Settings = {
    _cache: null,
    load: function () {
      var data = {};
      try {
        if (typeof GM_getValue === 'function') {
          data = GM_getValue(META.storagePrefix + 'settings', {});
        }
      } catch (e) {
        data = {};
      }
      this._cache = {};
      for (var k in DEFAULTS) {
        this._cache[k] = data && Object.prototype.hasOwnProperty.call(data, k) ? data[k] : DEFAULTS[k];
      }
    },
    get: function (key) {
      return this._cache && Object.prototype.hasOwnProperty.call(this._cache, key)
        ? this._cache[key]
        : DEFAULTS[key];
    },
    set: function (key, value) {
      this._cache[key] = value;
    },
    save: function () {
      try {
        if (typeof GM_setValue === 'function') {
          GM_setValue(META.storagePrefix + 'settings', JSON.parse(JSON.stringify(this._cache)));
        }
      } catch (e) { /* ignore */ }
    },
    reset: function () {
      this._cache = Object.assign({}, DEFAULTS);
      this.save();
    },
  };

  // ==========================================================================
  // 3. Utilities
  // ==========================================================================

  function $sel(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function createEl(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function getUrlParam(name) {
    var m = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function setClipboard(text, done) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
      if (done) done();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { if (done) done(); }, fallback);
    } else {
      fallback();
    }
  }

  /** Fetch JSON via GM_xmlhttpRequest with a plain-fetch fallback (CORS-limited). */
  function httpGetJson(url, onOk, onFail) {
    var done = false;
    function ok(data) { if (!done) { done = true; onOk(data); } }
    function fail() { if (!done) { done = true; if (onFail) onFail(); } }
    if (typeof GM_xmlhttpRequest === 'function') {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        timeout: 12000,
        onload: function (r) {
          try { ok(JSON.parse(r.responseText)); } catch (e) { fail(); }
        },
        onerror: fail,
        ontimeout: fail,
      });
    } else if (typeof fetch === 'function') {
      fetch(url, { method: 'GET' })
        .then(function (r) { return r.json(); })
        .then(ok, fail);
    } else {
      fail();
    }
  }

  // ==========================================================================
  // 4. Page detection & problem info extraction
  // ==========================================================================

  function isUvaPage() {
    return /(onlinejudge\.org)/i.test(window.location.hostname);
  }

  function isProblemPage() {
    return getUrlParam('page') === 'show_problem' || /page=show_problem/.test(window.location.search);
  }

  function isSubmitPage() {
    return getUrlParam('page') === 'submit_problem' || /page=submit_problem/.test(window.location.search);
  }

  /**
   * Extract problem metadata from the current page.
   * - On show_problem pages the <h3> looks like "100 - The 3n + 1 problem".
   * - `problemid` (the internal pid) and `category` come from the URL.
   */
  function getProblemInfo() {
    var info = { num: null, title: null, pid: null, category: null, pdfUrl: null };

    var pid = getUrlParam('problem') || getUrlParam('problemid');
    if (pid) info.pid = parseInt(pid, 10);

    var cat = getUrlParam('category');
    if (cat) info.category = cat;

    // The title heading is the most reliable place to read the problem number.
    var headings = $all('h3');
    for (var i = 0; i < headings.length; i++) {
      var text = (headings[i].textContent || '').trim();
      var m = /^\s*(\d+)\s*-\s*(.+?)\s*$/.exec(text);
      if (m) {
        info.num = parseInt(m[1], 10);
        info.title = m[2];
        break;
      }
    }

    // PDF link: external/{volume}/{num}.pdf
    if (info.num) {
      var pdf = $sel('a[href*=".pdf"]');
      if (pdf) info.pdfUrl = pdf.getAttribute('href');
      if (!info.pdfUrl) {
        var vol = Math.floor(info.num / 100);
        info.pdfUrl = 'external/' + vol + '/' + info.num + '.pdf';
      }
    }
    return info;
  }

  function absUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return new URL(path, window.location.origin).href;
  }

  function problemLinks(info) {
    var links = [];
    var base = 'index.php?option=com_onlinejudge&Itemid=8';
    if (info.pid) {
      links.push({
        key: 'toolbar_submit',
        href: absUrl(base + '&page=submit_problem&problemid=' + info.pid + (info.category ? '&category=' + info.category : '')),
      });
      links.push({
        key: 'toolbar_stats',
        href: absUrl(base + '&page=problem_stats&problemid=' + info.pid + (info.category ? '&category=' + info.category : '')),
      });
    }
    if (info.num) {
      if (info.pdfUrl) links.push({ key: 'toolbar_pdf', href: absUrl(info.pdfUrl) });
      links.push({ key: 'toolbar_udebug', href: 'https://www.udebug.com/UVa/' + info.num });
      links.push({ key: 'toolbar_vjudge', href: 'https://vjudge.net/problem/UVA-' + info.num });
      links.push({ key: 'toolbar_luogu', href: 'https://www.luogu.com.cn/problem/UVA' + info.num });
      var targetLang = (Settings.get('uiLang') === 'auto' ? detectLang() : Settings.get('uiLang')) === 'zh' ? 'zh-CN' : 'en';
      links.push({ key: 'toolbar_translate', href: 'https://translate.google.com/translate?hl=' + targetLang + '&sl=en&tl=' + targetLang + '&u=' + encodeURIComponent(window.location.href) });
    }
    links.push({ key: 'toolbar_uhunt', href: 'https://uhunt.onlinejudge.org/' });
    return links;
  }

  // ==========================================================================
  // 5. Feature: Dark mode
  // ==========================================================================

  var DARK_CSS = [
    'html.uvab-dark, html.uvab-dark body { background: #0d1117 !important; color: #c9d1d9 !important; }',
    'html.uvab-dark table, html.uvab-dark tbody, html.uvab-dark tr, html.uvab-dark td, html.uvab-dark th { background: transparent !important; color: #c9d1d9 !important; border-color: #30363d !important; }',
    'html.uvab-dark td[bgcolor], html.uvab-dark th[bgcolor] { background: transparent !important; }',
    'html.uvab-dark font { color: inherit !important; }',
    'html.uvab-dark h1, html.uvab-dark h2, html.uvab-dark h3, html.uvab-dark h4, html.uvab-dark h5 { color: #e6edf3 !important; }',
    'html.uvab-dark a { color: #58a6ff !important; }',
    'html.uvab-dark a:visited { color: #bc8cff !important; }',
    'html.uvab-dark pre { background: #161b22 !important; color: #c9d1d9 !important; border: 1px solid #30363d !important; }',
    'html.uvab-dark input[type="text"], html.uvab-dark input[type="password"], html.uvab-dark textarea, html.uvab-dark select { background: #161b22 !important; color: #c9d1d9 !important; border-color: #30363d !important; }',
    'html.uvab-dark #wrapper, html.uvab-dark #main, html.uvab-dark #content, html.uvab-dark #header, html.uvab-dark #footer { background: #0d1117 !important; }',
  ].join('\n');

  var DarkMode = {
    apply: function () {
      var root = document.documentElement;
      if (Settings.get('darkMode')) root.classList.add('uvab-dark');
      else root.classList.remove('uvab-dark');
    },
    toggle: function () {
      Settings.set('darkMode', !Settings.get('darkMode'));
      Settings.save();
      this.apply();
    },
  };

  // ==========================================================================
  // 6. Feature: Problem-page toolbar + quick links
  // ==========================================================================

  var TOOLBAR_STYLE = [
    '#uvab-toolbar { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; padding:8px; background:#f6f8fa; border:1px solid #d0d7de; border-radius:6px; }',
    'html.uvab-dark #uvab-toolbar { background:#161b22; border-color:#30363d; }',
    '#uvab-toolbar a.uvab-btn { display:inline-block; padding:4px 10px; font-size:12px; line-height:1.4; color:#0969da; background:#fff; border:1px solid #d0d7de; border-radius:6px; text-decoration:none; }',
    '#uvab-toolbar a.uvab-btn:hover { background:#0969da; color:#fff !important; }',
    'html.uvab-dark #uvab-toolbar a.uvab-btn { color:#58a6ff; background:#0d1117; border-color:#30363d; }',
    '#uvab-toolbar .uvab-label { align-self:center; font-weight:bold; font-size:13px; color:#57606a; margin-right:4px; }',
    'html.uvab-dark #uvab-toolbar .uvab-label { color:#8b949e; }',
  ].join('\n');

  var Toolbar = {
    init: function () {
      if (document.getElementById('uvab-toolbar')) return; // idempotent
      var info = getProblemInfo();
      if (!info.num && !info.pid) return;

      var heading = null;
      var h3s = $all('h3');
      for (var i = 0; i < h3s.length; i++) {
        if (/^\s*\d+\s*-\s*/.test(h3s[i].textContent || '')) { heading = h3s[i]; break; }
      }

      var bar = createEl('div', { id: 'uvab-toolbar' });
      bar.appendChild(createEl('span', { class: 'uvab-label' }, META.name));
      var links = problemLinks(info);
      links.forEach(function (l) {
        var a = createEl('a', { class: 'uvab-btn', href: l.href, target: '_blank', rel: 'noopener' }, t(l.key));
        bar.appendChild(a);
      });

      // Insert the toolbar right after the problem heading (or at the top of content).
      var anchor = heading ? heading.closest('table') || heading.closest('td') || heading : null;
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(bar, anchor.nextSibling);
      } else {
        document.body.insertBefore(bar, document.body.firstChild);
      }
    },
  };

  // ==========================================================================
  // 7. Feature: uHunt statistics card
  // ==========================================================================

  var STATS_STYLE = [
    '#uvab-stats { display:flex; flex-wrap:wrap; gap:6px 18px; margin:8px 0; padding:10px; background:#f6f8fa; border:1px solid #d0d7de; border-radius:6px; font-size:13px; }',
    'html.uvab-dark #uvab-stats { background:#161b22; border-color:#30363d; }',
    '#uvab-stats .uvab-stat { display:flex; flex-direction:column; }',
    '#uvab-stats .uvab-stat b { font-size:16px; color:#24292f; }',
    'html.uvab-dark #uvab-stats .uvab-stat b { color:#e6edf3; }',
    '#uvab-stats .uvab-stat span { color:#57606a; font-size:12px; }',
    'html.uvab-dark #uvab-stats .uvab-stat span { color:#8b949e; }',
  ].join('\n');

  var UHuntStats = {
    init: function () {
      if (document.getElementById('uvab-stats')) return; // idempotent
      var info = getProblemInfo();
      if (!info.num) return;

      var heading = null;
      var h3s = $all('h3');
      for (var i = 0; i < h3s.length; i++) {
        if (/^\s*\d+\s*-\s*/.test(h3s[i].textContent || '')) { heading = h3s[i]; break; }
      }

      var card = createEl('div', { id: 'uvab-stats' });
      card.appendChild(createEl('span', { class: 'uvab-stat' }, t('stats_loading')));

      var anchor = heading ? heading.closest('table') || heading.closest('td') || heading : null;
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(card, anchor.nextSibling);
      } else {
        document.body.insertBefore(card, document.body.firstChild);
      }

      var self = this;
      httpGetJson(
        'https://uhunt.onlinejudge.org/api/p/num/' + info.num,
        function (data) {
          if (!data || typeof data.dacu === 'undefined') { self.renderError(card); return; }
          self.render(card, data);
        },
        function () { self.renderError(card); }
      );
    },
    render: function (card, d) {
      card.textContent = '';
      var items = [];
      items.push([t('stats_accepted'), d.dacu]);
      var total = (d.ac || 0) + (d.wa || 0) + (d.tle || 0) + (d.re || 0) + (d.ce || 0) + (d.mle || 0) + (d.pe || 0) + (d.ole || 0) + (d.rf || 0);
      var rate = total > 0 ? ((100 * (d.ac || 0)) / total).toFixed(1) + '%' : '—';
      items.push([t('stats_accept_rate'), rate]);
      items.push([t('stats_submissions'), total || '—']);
      items.push([t('stats_wrong_answer'), d.wa || 0]);
      items.push([t('stats_time_limit'), d.tle || 0]);
      items.push([t('stats_runtime_error'), d.re || 0]);
      items.push([t('stats_compile_error'), d.ce || 0]);
      items.forEach(function (it) {
        var box = createEl('span', { class: 'uvab-stat' });
        box.appendChild(createEl('b', null, String(it[1])));
        box.appendChild(createEl('span', null, it[0]));
        card.appendChild(box);
      });
    },
    renderError: function (card) {
      card.textContent = '';
      card.appendChild(createEl('span', { class: 'uvab-stat' }, t('stats_failed')));
    },
  };

  // ==========================================================================
  // 8. Feature: Sample input/output copy buttons
  // ==========================================================================

  var SAMPLE_STYLE = [
    '.uvab-copy-btn { display:inline-block; margin-left:8px; padding:1px 8px; font-size:12px; color:#0969da; background:#fff; border:1px solid #d0d7de; border-radius:6px; cursor:pointer; }',
    '.uvab-copy-btn:hover { background:#0969da; color:#fff; }',
    'html.uvab-dark .uvab-copy-btn { color:#58a6ff; background:#0d1117; border-color:#30363d; }',
  ].join('\n');

  var SampleCopy = {
    init: function () {
      // UVa renders "Sample Input" / "Sample Output" labels followed by a <pre> block.
      var labels = $all('p, b, strong, font, h3, h4, td');
      labels.forEach(function (label) {
        var text = (label.textContent || '').trim();
        var kind = null;
        if (/^Sample\s*Input$/i.test(text)) kind = 'input';
        else if (/^Sample\s*Output$/i.test(text)) kind = 'output';
        if (!kind) return;

        var pre = findNextPre(label);
        if (!pre) return;
        if (pre.__uvabCopy) return; // dedup: nested label + its container map to the same <pre>
        pre.__uvabCopy = true;

        var btn = createEl('button', { class: 'uvab-copy-btn', type: 'button' }, t(kind === 'input' ? 'sample_copy_input' : 'sample_copy_output'));
        btn.addEventListener('click', function () {
          var content = pre.textContent || '';
          setClipboard(content, function () {
            var old = btn.textContent;
            btn.textContent = t('sample_copied');
            setTimeout(function () { btn.textContent = old; }, 1200);
          });
        });
        label.appendChild(btn);
      });
    },
  };

  /**
   * Find the nearest <pre> block that follows a "Sample Input"/"Sample Output"
   * label. Climbs from the matched element up through its block ancestors and
   * scans forward siblings (and their subtrees) for the first <pre>.
   */
  function findNextPre(from) {
    var node = from;
    var up = 0;
    while (node && node !== document.body && up < 6) {
      var sib = node.nextElementSibling;
      var across = 0;
      while (sib && across < 8) {
        if (sib.tagName === 'PRE') return sib;
        var inner = sib.querySelector('pre');
        if (inner) return inner;
        sib = sib.nextElementSibling;
        across++;
      }
      node = node.parentElement;
      up++;
    }
    return null;
  }

  // ==========================================================================
  // 9. Feature: Submit-page helper
  // ==========================================================================

  var SubmitHelper = {
    init: function () {
      var form = findSubmitForm();
      if (!form) return;

      var langSelect = form.querySelector('select[name="language"]');
      var codeArea = form.querySelector('textarea[name="code"]');

      // Restore / remember language.
      if (langSelect && Settings.get('rememberLanguage')) {
        var saved = String(Settings.get('language'));
        var options = $all('option', langSelect);
        var exists = options.some(function (o) { return o.value === saved; });
        if (exists) langSelect.value = saved;
      }
      if (langSelect) {
        langSelect.addEventListener('change', function () {
          Settings.set('language', langSelect.value);
          Settings.save();
        });
      }

      // Auto-fill code template once (only if empty).
      var template = Settings.get('codeTemplate');
      if (codeArea && template && !codeArea.value.trim()) {
        codeArea.value = template;
      }

      // Confirm before submit.
      if (Settings.get('submitConfirm')) {
        form.addEventListener('submit', function (e) {
          var info = getProblemInfo();
          var num = info.num || info.pid || '?';
          var ok = window.confirm(t('submit_confirm_text', { num: num }));
          if (!ok) e.preventDefault();
        });
      }
    },
  };

  function findSubmitForm() {
    var forms = $all('form');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].querySelector('textarea[name="code"]')) return forms[i];
    }
    return null;
  }

  // ==========================================================================
  // 10. Feature: Settings panel
  // ==========================================================================

  var PANEL_STYLE = [
    '#uvab-fab { position:fixed; right:18px; bottom:18px; z-index:2147483000; width:44px; height:44px; border-radius:50%; background:#0969da; color:#fff; border:none; font-size:20px; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,.3); }',
    '#uvab-fab:hover { background:#0550ae; }',
    '#uvab-panel { position:fixed; right:18px; bottom:72px; z-index:2147483001; width:320px; max-height:80vh; overflow:auto; background:#fff; color:#24292f; border:1px solid #d0d7de; border-radius:10px; box-shadow:0 8px 24px rgba(0,0,0,.2); font-size:13px; padding:14px; }',
    '#uvab-panel h3 { margin:0 0 10px; font-size:15px; }',
    '#uvab-panel label { display:flex; align-items:center; gap:8px; margin:6px 0; cursor:pointer; }',
    '#uvab-panel .uvab-row { margin:10px 0; }',
    '#uvab-panel select, #uvab-panel textarea { width:100%; box-sizing:border-box; padding:6px; border:1px solid #d0d7de; border-radius:6px; font-size:12px; }',
    '#uvab-panel textarea { min-height:80px; font-family:monospace; }',
    '#uvab-panel .uvab-actions { display:flex; gap:8px; margin-top:12px; }',
    '#uvab-panel button { padding:6px 12px; border:none; border-radius:6px; cursor:pointer; font-size:12px; }',
    '#uvab-panel .uvab-save { background:#0969da; color:#fff; }',
    '#uvab-panel .uvab-reset { background:#f6f8fa; color:#24292f; border:1px solid #d0d7de; }',
    '#uvab-panel .uvab-close { margin-left:auto; background:transparent; color:#57606a; font-size:16px; padding:0 4px; }',
    'html.uvab-dark #uvab-panel { background:#161b22; color:#c9d1d9; border-color:#30363d; }',
    'html.uvab-dark #uvab-panel select, html.uvab-dark #uvab-panel textarea { background:#0d1117; color:#c9d1d9; border-color:#30363d; }',
    'html.uvab-dark #uvab-panel .uvab-reset { background:#0d1117; color:#c9d1d9; border-color:#30363d; }',
  ].join('\n');

  var SettingsPanel = {
    _panel: null,
    init: function () {
      var fab = createEl('button', { id: 'uvab-fab', type: 'button', title: META.name }, '⚙');
      fab.addEventListener('click', function () { SettingsPanel.toggle(); });
      document.body.appendChild(fab);
      this.buildPanel();
    },
    buildPanel: function () {
      var panel = createEl('div', { id: 'uvab-panel' });
      panel.style.display = 'none';

      var header = createEl('div', { class: 'uvab-row', style: 'display:flex;align-items:center;' });
      header.appendChild(createEl('h3', null, t('settings_title')));
      var close = createEl('button', { class: 'uvab-close', type: 'button' }, '✕');
      close.addEventListener('click', function () { SettingsPanel.hide(); });
      header.appendChild(close);
      panel.appendChild(header);

      var self = this;
      var fields = [
        checkbox('darkMode', t('settings_dark')),
        checkbox('showToolbar', t('settings_toolbar')),
        checkbox('showUhuntStats', t('settings_stats')),
        checkbox('showSampleCopy', t('settings_sample')),
        checkbox('submitHelper', t('settings_submit_helper')),
        checkbox('rememberLanguage', t('settings_remember_lang')),
        checkbox('submitConfirm', t('settings_submit_confirm')),
      ];
      fields.forEach(function (f) { panel.appendChild(f); });

      // Language select
      var langRow = createEl('div', { class: 'uvab-row' });
      langRow.appendChild(createEl('div', null, t('settings_language')));
      var langSelect = createEl('select');
      Object.keys(UVA_LANGUAGES).forEach(function (v) {
        langSelect.appendChild(createEl('option', { value: v }, v + ' — ' + UVA_LANGUAGES[v]));
      });
      langSelect.value = String(Settings.get('language'));
      langRow.appendChild(langSelect);
      panel.appendChild(langRow);

      // Code template
      var tplRow = createEl('div', { class: 'uvab-row' });
      tplRow.appendChild(createEl('div', null, t('settings_template')));
      var tplArea = createEl('textarea', { spellcheck: 'false' }, Settings.get('codeTemplate'));
      tplRow.appendChild(tplArea);
      panel.appendChild(tplRow);

      // UI language
      var uiRow = createEl('div', { class: 'uvab-row' });
      uiRow.appendChild(createEl('div', null, t('settings_ui_lang')));
      var uiSelect = createEl('select');
      uiSelect.appendChild(createEl('option', { value: 'auto' }, t('settings_ui_lang_auto')));
      uiSelect.appendChild(createEl('option', { value: 'zh' }, '中文'));
      uiSelect.appendChild(createEl('option', { value: 'en' }, 'English'));
      uiSelect.value = Settings.get('uiLang');
      uiRow.appendChild(uiSelect);
      panel.appendChild(uiRow);

      var actions = createEl('div', { class: 'uvab-actions' });
      var saveBtn = createEl('button', { class: 'uvab-save', type: 'button' }, t('settings_save'));
      var resetBtn = createEl('button', { class: 'uvab-reset', type: 'button' }, t('settings_reset'));
      actions.appendChild(saveBtn);
      actions.appendChild(resetBtn);
      panel.appendChild(actions);

      saveBtn.addEventListener('click', function () {
        self.collect(panel, fields, langSelect, tplArea, uiSelect);
        Settings.save();
        self.refreshFeatures();
        saveBtn.textContent = t('settings_saved');
        setTimeout(function () { saveBtn.textContent = t('settings_save'); }, 1200);
      });
      resetBtn.addEventListener('click', function () {
        Settings.reset();
        SettingsPanel.hide();
        SettingsPanel.refreshFeatures();
        // Rebuild panel with defaults.
        var old = panel;
        SettingsPanel.buildPanel();
        if (old.parentNode) old.parentNode.replaceChild(SettingsPanel._panel, old);
        SettingsPanel._panel.style.display = 'block';
      });

      document.body.appendChild(panel);
      this._panel = panel;
    },
    collect: function (panel, fields, langSelect, tplArea, uiSelect) {
      fields.forEach(function (f) {
        var input = f.querySelector('input');
        Settings.set(input.getAttribute('data-key'), input.checked);
      });
      Settings.set('language', langSelect.value);
      Settings.set('codeTemplate', tplArea.value);
      Settings.set('uiLang', uiSelect.value);
    },
    toggle: function () {
      if (this._panel.style.display === 'none') this._panel.style.display = 'block';
      else this._panel.style.display = 'none';
    },
    hide: function () {
      if (this._panel) this._panel.style.display = 'none';
    },
    refreshFeatures: function () {
      DarkMode.apply();
      var info = getProblemInfo();
      // Toolbar
      var bar = $sel('#uvab-toolbar');
      if (bar) bar.style.display = Settings.get('showToolbar') ? '' : 'none';
      // Stats
      var stats = $sel('#uvab-stats');
      if (stats) stats.style.display = Settings.get('showUhuntStats') ? '' : 'none';
      if (stats && Settings.get('showUhuntStats') && !stats.dataset.loaded) {
        stats.dataset.loaded = '1';
        if (isProblemPage() && info.num) UHuntStats.init();
      }
      // Sample copy visibility
      $all('.uvab-copy-btn').forEach(function (b) {
        b.style.display = Settings.get('showSampleCopy') ? '' : 'none';
      });
    },
  };

  function checkbox(key, labelText) {
    var label = createEl('label');
    var input = createEl('input', { type: 'checkbox' });
    input.setAttribute('data-key', key);
    input.checked = !!Settings.get(key);
    label.appendChild(input);
    label.appendChild(createEl('span', null, labelText));
    return label;
  }

  // ==========================================================================
  // 11. Bootstrap
  // ==========================================================================

  function injectStyles() {
    var css = [
      DARK_CSS,
      TOOLBAR_STYLE,
      STATS_STYLE,
      SAMPLE_STYLE,
      PANEL_STYLE,
    ].join('\n');
    if (typeof GM_addStyle === 'function') {
      try { GM_addStyle(css); } catch (e) { addStyleFallback(css); }
    } else {
      addStyleFallback(css);
    }
  }

  function addStyleFallback(css) {
    var style = document.createElement('style');
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function registerMenu() {
    if (typeof GM_registerMenuCommand === 'function') {
      try {
        GM_registerMenuCommand('UVA Better: ' + t('settings_dark'), function () { DarkMode.toggle(); });
        GM_registerMenuCommand('UVA Better: ' + t('settings_title'), function () { SettingsPanel.toggle(); });
      } catch (e) { /* ignore */ }
    }
  }

  function main() {
    if (!isUvaPage()) return;
    Settings.load();
    injectStyles();

    if (isProblemPage()) {
      var info = getProblemInfo();
      if (Settings.get('showToolbar')) Toolbar.init();
      if (Settings.get('showSampleCopy')) SampleCopy.init();
      if (Settings.get('showUhuntStats') && info.num) UHuntStats.init();
    } else if (isSubmitPage()) {
      if (Settings.get('submitHelper')) SubmitHelper.init();
    }

    SettingsPanel.init();
    DarkMode.apply();
    registerMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
/*
MIT License

Copyright (c) 2026 Sky-Yun

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
