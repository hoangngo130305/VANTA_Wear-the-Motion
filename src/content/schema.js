/**
 * Describes every editable piece of site content for the admin "Content" screen.
 * The editor is generated from this tree, so adding a field here (and its default in defaults.js)
 * is all that is needed to make it editable.
 *   text  = single-line, English + Vietnamese      long = multi-line, English + Vietnamese
 *   plain = single value, not translated           image / color / number / bool / product / link
 *   list  = repeatable group (item: {…} for objects, of: 'product' for a list of plain values)
 */
import { tc } from '../i18n/index.js';

const text = (key, label, o = {}) => ({ key, label, type: 'text', ...o });
const long = (key, label, o = {}) => ({ key, label, type: 'long', ...o });
const plain = (key, label, o = {}) => ({ key, label, type: 'plain', ...o });
const image = (key, label, o = {}) => ({ key, label, type: 'image', ...o });
const color = (key, label) => ({ key, label, type: 'color' });
const number = (key, label, o = {}) => ({ key, label, type: 'number', ...o });
const bool = (key, label) => ({ key, label, type: 'bool' });
const product = (key, label) => ({ key, label, type: 'product' });
const link = (key, label) => ({ key, label, type: 'link' });
const list = (key, label, o) => ({ key, label, type: 'list', ...o });

const RICH = 'Use *word* for outlined style and a new line for a line break.';

export const GROUPS = [
  { id: 'brand', title: 'Brand & SEO' },
  { id: 'home', title: 'Home page' },
  { id: 'pages', title: 'Pages' },
  { id: 'site', title: 'Footer & contact' }
];

export const SCHEMA = [
  { id: 'brand', group: 'brand', title: 'Brand & logo', route: '/', desc: 'The name shown in the header, footer and browser tab, plus your logo image.', fields: [
    plain('name', 'Brand name'),
    image('logo', 'Logo image', { hint: 'Optional. Replaces the text logo in the header, sign-in page and footer. Transparent PNG/SVG works best.', max: 600, keepAlpha: true }),
    long('tagline', 'Tagline (footer)')
  ] },
  { id: 'seo', group: 'brand', title: 'Browser title & SEO', route: '/', desc: 'Used for the browser tab and search-engine description. {brand} is replaced by the brand name.', fields: [
    text('title', 'Page title'), long('description', 'Description')
  ] },
  { id: 'announce', group: 'brand', title: 'Announcement bar', route: '/', desc: 'The scrolling bar above the header. {free} is replaced by the free-shipping amount.', fields: [
    bool('enabled', 'Show the bar'),
    list('items', 'Messages', { fields: [text('text', 'Message')], itemLabel: i => tc(i.text) || 'Message' })
  ] },
  { id: 'hero', group: 'home', title: 'Hero banner', route: '/', desc: 'The big animated banner at the top of the home page.', fields: [
    text('line1', 'Headline — line 1', { hint: RICH }), text('line2', 'Headline — line 2', { hint: RICH }),
    { key: 'cta1', label: 'Primary button', type: 'group', fields: [text('label', 'Label'), link('link', 'Goes to')] },
    { key: 'cta2', label: 'Secondary button', type: 'group', fields: [text('label', 'Label'), link('link', 'Goes to')] },
    list('slides', 'Slides', { max: 8, itemLabel: s => s.word || 'Slide', fields: [
      product('product', 'Product shown'),
      plain('word', 'Giant background word'),
      image('image', 'Banner image (optional)', { hint: 'Leave empty to use the product photo. A transparent PNG/WebP works best.', max: 1600, keepAlpha: true }),
      text('tag', 'Small label'),
      color('bg', 'Background colour'), color('fg', 'Text colour'), bool('dark', 'Dark text on a light background'),
      plain('cx', 'Colour reveal origin X (e.g. 62%)'), plain('cy', 'Colour reveal origin Y (e.g. 70%)'),
      list('hotspots', 'Hotspots (labels on the image)', { max: 4, itemLabel: h => tc(h.text) || 'Hotspot', fields: [text('text', 'Label'), number('x', 'Position X (%)'), number('y', 'Position Y (%)')] })
    ] })
  ] },
  { id: 'tickers', group: 'home', title: 'Scrolling text bands', route: '/', desc: 'The two big marquee bands between sections.', fields: [
    list('a', 'Band 1 (lime)', { max: 4, fields: [text('text', 'Text')], itemLabel: i => tc(i.text) || 'Text' }),
    list('b', 'Band 2 (dark)', { max: 4, fields: [text('text', 'Text')], itemLabel: i => tc(i.text) || 'Text' })
  ] },
  { id: 'rail', group: 'home', title: 'Section: The Rail', route: '/', desc: 'Heading of the hanging-garments section.', fields: [
    text('eyebrow', 'Small label'), long('title', 'Title', { hint: RICH }), long('lede', 'Introduction')
  ] },
  { id: 'orbit', group: 'home', title: 'Section: Orbit', route: '/', desc: 'Heading of the sneaker wheel.', fields: [text('eyebrow', 'Small label')] },
  { id: 'runway', group: 'home', title: 'Section: Runway & looks', route: '/', desc: 'Heading and the styled looks (photo + pieces).', fields: [
    text('eyebrow', 'Small label'), long('title', 'Title', { hint: RICH }), long('lede', 'Introduction'),
    list('looks', 'Looks', { max: 8, itemLabel: l => tc(l.name) || 'Look', fields: [
      text('name', 'Look name'),
      image('image', 'Model photo', { hint: 'Full-length photo with a transparent background (9:16).', max: 1100, keepAlpha: true }),
      list('products', 'Products in this look', { of: 'product', max: 5, addLabel: 'Add product' })
    ] })
  ] },
  { id: 'story', group: 'home', title: 'Section: Story', route: '/', desc: 'Manifesto paragraph, two photos and the counters.', fields: [
    text('eyebrow', 'Small label'), long('text', 'Manifesto'),
    { key: 'photo1', label: 'Photo 1', type: 'group', fields: [image('image', 'Image', { max: 1400 }), text('alt', 'Description (alt text)'), text('caption', 'Caption')] },
    { key: 'photo2', label: 'Photo 2', type: 'group', fields: [image('image', 'Image', { max: 1400 }), text('alt', 'Description (alt text)'), text('caption', 'Caption')] },
    list('stats', 'Counters', { max: 4, itemLabel: s => `${s.value}${s.suffix || ''}`, fields: [number('value', 'Number'), number('decimals', 'Decimals'), plain('suffix', 'Suffix (k, d, +…)'), text('label', 'Label')] })
  ] },
  { id: 'newsletter', group: 'home', title: 'Newsletter', route: '/', desc: 'The sign-up band above the footer.', fields: [long('title', 'Title', { hint: RICH })] },
  { id: 'about', group: 'pages', title: 'About page', route: '/about', desc: 'Story, numbers and values.', fields: [
    text('eyebrow', 'Small label'), long('title', 'Title', { hint: RICH }), long('lede', 'Introduction'),
    { key: 'image1', label: 'Photo 1', type: 'group', fields: [image('image', 'Image', { max: 1400 }), text('alt', 'Description (alt text)')] },
    { key: 'image2', label: 'Photo 2', type: 'group', fields: [image('image', 'Image', { max: 1400 }), text('alt', 'Description (alt text)')] },
    list('stats', 'Numbers', { max: 4, itemLabel: s => s.value, fields: [plain('value', 'Value'), text('label', 'Label')] }),
    text('valuesTitle', 'Values heading', { hint: RICH }),
    list('values', 'Values', { max: 6, itemLabel: v => tc(v.title) || 'Value', fields: [text('title', 'Title'), long('text', 'Text')] }),
    { key: 'cta', label: 'Call-to-action band', type: 'group', fields: [long('title', 'Title', { hint: RICH }), text('text', 'Text'), text('button', 'Button label'), link('link', 'Goes to'), image('image', 'Image', { max: 1100, keepAlpha: true })] }
  ] },
  { id: 'faq', group: 'pages', title: 'FAQ page', route: '/faq', desc: 'Questions and answers. {free} = free-shipping amount.', fields: [
    long('title', 'Title', { hint: RICH }), text('lede', 'Introduction'),
    list('items', 'Questions', { itemLabel: i => tc(i.q) || 'Question', fields: [text('q', 'Question'), long('a', 'Answer')] })
  ] },
  { id: 'policies', group: 'pages', title: 'Policies', route: '/policies/shipping', desc: 'Shipping, returns, privacy, terms — each tab has titled sections.', fields: [
    list('tabs', 'Policy pages', { itemLabel: tb => tc(tb.title) || 'Policy', fields: [
      plain('key', 'URL key (letters, no spaces)'), text('title', 'Title'),
      list('sections', 'Sections', { itemLabel: s => tc(s.h) || 'Section', fields: [text('h', 'Heading'), long('p', 'Text')] })
    ] })
  ] },
  { id: 'contact', group: 'site', title: 'Contact page', route: '/contact', desc: 'Contact details shown beside the form.', fields: [
    long('title', 'Title', { hint: RICH }), text('lede', 'Introduction'), plain('email', 'Support email'), long('address', 'Studio address'), text('hours', 'Opening hours')
  ] },
  { id: 'footer', group: 'site', title: 'Footer', route: '/', desc: 'Social links and copyright. {brand} is replaced by the brand name.', fields: [
    list('socials', 'Social links', { max: 6, itemLabel: s => s.label, fields: [plain('label', 'Name'), plain('url', 'Link (https://…)')] }),
    text('copyright', 'Copyright line')
  ] },
  { id: 'auth', group: 'site', title: 'Sign-in page', route: '/login', desc: 'Picture and message beside the sign-in / register forms.', fields: [
    image('image', 'Side image', { max: 1600 }), text('tagline', 'Tagline'), text('sub', 'Sub-line')
  ] }
];

export const LINKS = [
  ['orbit', 'Home → Orbit (sneakers)'], ['rail', 'Home → The Rail (apparel)'], ['runway', 'Home → Runway (looks)'], ['story', 'Home → Story'],
  ['/shop', 'Shop page'], ['/about', 'About page'], ['/contact', 'Contact page'], ['/faq', 'FAQ page']
];
