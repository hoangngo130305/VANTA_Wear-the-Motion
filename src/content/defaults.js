/**
 * Default site content, written in both languages. The admin console (Content) edits a copy of this
 * tree that is stored in the database; anything the admin has not touched falls back to these values.
 * Conventions:  {en, vi} = translatable text · "*word*" = outlined emphasis · "\n" = line break
 *               "{free}" = free-shipping threshold · "{brand}" = brand name
 */
const L = (en, vi) => ({ en, vi });

export const DEFAULT_CONTENT = {
  brand: {
    name: 'VANTA',
    logo: '',
    tagline: L('Streetwear & sneakers built around movement. Designed in small batches.', 'Streetwear và sneaker xoay quanh chuyển động. Thiết kế theo từng lô nhỏ.')
  },

  seo: {
    title: L('{brand} — Wear the Motion', '{brand} — Mặc cùng chuyển động'),
    description: L('{brand} is a streetwear and sneaker label built around movement. Hover the rail, spin the orbit, try the look.', '{brand} là thương hiệu streetwear và sneaker xoay quanh chuyển động. Rê chuột vào giá treo, xoay vòng giày, thử phong cách.')
  },

  announce: {
    enabled: true,
    items: [
      { text: L('Free shipping over {free}', 'Miễn phí vận chuyển cho đơn từ {free}') },
      { text: L('New drop every Friday 19:00', 'Bộ sưu tập mới mỗi thứ Sáu lúc 19:00') },
      { text: L('30-day easy returns', 'Đổi trả dễ dàng trong 30 ngày') },
      { text: L('Limited runs · never restocked', 'Số lượng giới hạn · không bán lại') }
    ]
  },

  hero: {
    line1: L('Wear', 'Mặc'),
    line2: L('the *motion.*', 'cùng *chuyển động.*'),
    cta1: { label: L('Shop sneakers', 'Mua sneaker'), link: 'orbit' },
    cta2: { label: L('Explore apparel', 'Khám phá trang phục'), link: 'rail' },
    slides: [
      { product: 'royal', word: 'ROYAL', bg: '#1b38ff', fg: '#ffffff', dark: false, cx: '62%', cy: '70%', image: '',
        tag: L('Drop 07 — Now live', 'Bộ sưu tập 07 — Đã mở bán'),
        hotspots: [{ x: 66, y: 34, text: L('Padded collar', 'Cổ giày đệm êm') }, { x: 30, y: 74, text: L('Pivot-ready sole', 'Đế linh hoạt khi xoay') }] },
      { product: 'heat', word: 'HEAT', bg: '#ff4b1f', fg: '#ffffff', dark: false, cx: '40%', cy: '72%', image: '',
        tag: L('Drop 08 — Selling fast', 'Bộ sưu tập 08 — Bán rất chạy'),
        hotspots: [{ x: 58, y: 70, text: L('Visible air unit', 'Đệm khí lộ thiên') }, { x: 36, y: 28, text: L('Cocoa suede', 'Da lộn nâu cacao') }] },
      { product: 'panda', word: 'PANDA', bg: '#c9ff2f', fg: '#0c0c0d', dark: true, cx: '55%', cy: '64%', image: '',
        tag: L('Restocked — final run', 'Có hàng trở lại — đợt cuối'),
        hotspots: [{ x: 64, y: 38, text: L('Full-grain leather', 'Da nguyên tấm') }, { x: 28, y: 66, text: L('Cupsole grip', 'Đế cupsole bám tốt') }] },
      { product: 'terra', word: 'TERRA', bg: '#2a1d14', fg: '#f6e7d3', dark: false, cx: '48%', cy: '74%', image: '',
        tag: L('Drop 06 — Last sizes', 'Bộ sưu tập 06 — Những size cuối'),
        hotspots: [{ x: 50, y: 30, text: L('Strap overlay', 'Dây đai phủ ngoài') }, { x: 74, y: 64, text: L('Trail lugs', 'Gai đế địa hình') }] }
    ]
  },

  tickers: {
    a: [{ text: L('New season', 'Mùa mới') }, { text: L('No limits', 'Không giới hạn') }],
    b: [{ text: L('Built to move', 'Sinh ra để chuyển động') }, { text: L('Made to last', 'Làm ra để bền lâu') }]
  },

  rail: {
    eyebrow: L('The Rail', 'Giá treo'),
    title: L('Pull a piece\noff the *rail.*', 'Lấy một món\nkhỏi *giá treo.*'),
    lede: L('Heavyweight fleece, cut oversized. Hover to swing a piece open, click to take it off the hanger and spin it all the way around.', 'Nỉ dày dặn, form oversize. Rê chuột để món đồ đung đưa mở ra, bấm để lấy khỏi móc và xoay trọn 360°.')
  },

  orbit: { eyebrow: L('Orbit · sneakers', 'Orbit · sneaker') },

  runway: {
    eyebrow: L('Runway', 'Sàn diễn'),
    title: L('Try the\n*look.*', 'Thử\n*phong cách.*'),
    lede: L('Six looks, styled head to toe. Tap a figure to step into the line-up, then bag the whole look and save 10%.', 'Sáu phong cách phối từ đầu đến chân. Chạm vào người mẫu để xem từng set, rồi thêm cả set vào giỏ và giảm 10%.'),
    looks: [
      { name: L('Concrete', 'Bê tông'), image: 'img/m/look-1.webp', products: ['tide', 'ember', 'drift'] },
      { name: L('Morning Haze', 'Sương sớm'), image: 'img/m/look-2.webp', products: ['cloud', 'sage', 'panda'] },
      { name: L('Terracotta', 'Đất nung'), image: 'img/m/look-3.webp', products: ['ember', 'slate', 'terra'] },
      { name: L('Moss', 'Rêu xanh'), image: 'img/m/look-4.webp', products: ['sage', 'solar', 'court'] },
      { name: L('Blank Canvas', 'Toan trắng'), image: 'img/m/look-5.webp', products: ['cloud', 'ember', 'heat'] },
      { name: L('After Dark', 'Sau hoàng hôn'), image: 'img/m/look-6.webp', products: ['slate', 'tide', 'void'] }
    ]
  },

  story: {
    eyebrow: L('Story', 'Câu chuyện'),
    text: L('We make things that work better and last longer. Clean design, honest materials, and zero noise — obsessed with how clothes move with you.', 'Chúng tôi làm ra những món đồ hoạt động tốt hơn và bền hơn. Thiết kế tinh gọn, chất liệu trung thực, không ồn ào — ám ảnh với cách quần áo chuyển động cùng bạn.'),
    photo1: { image: 'img/c/dance-1.webp', alt: L('Dancers mid-move on a rooftop', 'Những vũ công đang biểu diễn trên sân thượng'), caption: L('Rooftop session, 06:40', 'Buổi tập trên sân thượng, 06:40') },
    photo2: { image: 'img/c/dance-2.webp', alt: L('Dancer crouching, laughing, surrounded by crew', 'Một vũ công ngồi xổm, cười, giữa vòng vây của cả nhóm'), caption: L('Warehouse cypher', 'Cypher trong nhà kho') },
    stats: [
      { value: 48, decimals: 0, suffix: '', label: L('Limited drops', 'Bộ sưu tập giới hạn') },
      { value: 12, decimals: 0, suffix: 'k', label: L('Pieces shipped', 'Sản phẩm đã giao') },
      { value: 30, decimals: 0, suffix: 'd', label: L('Free returns', 'Ngày đổi trả miễn phí') },
      { value: 4.9, decimals: 1, suffix: '', label: L('Average rating', 'Đánh giá trung bình') }
    ]
  },

  newsletter: { title: L('Get the drop\nbefore it *drops.*', 'Biết trước\nkhi bộ sưu tập *ra mắt.*') },

  footer: {
    socials: [{ label: 'Instagram', url: '#' }, { label: 'TikTok', url: '#' }, { label: 'YouTube', url: '#' }],
    copyright: L('© 2026 {brand}. All rights reserved.', '© 2026 {brand}. Bảo lưu mọi quyền.')
  },

  about: {
    eyebrow: L('About', 'Giới thiệu'),
    title: L('Obsessed with\nhow clothes *move.*', 'Ám ảnh với cách\nquần áo *chuyển động.*'),
    lede: L('{brand} is a streetwear and sneaker label designed around movement — started by a small crew who wanted clothes that keep up with a day that never sits still.', '{brand} là thương hiệu streetwear và sneaker xoay quanh chuyển động — khởi đầu từ một nhóm nhỏ muốn quần áo theo kịp một ngày không bao giờ đứng yên.'),
    image1: { image: 'img/c/dance-1.webp', alt: L('Dancers on a rooftop', 'Những vũ công trên sân thượng') },
    image2: { image: 'img/c/dance-2.webp', alt: L('Dancer mid-laugh in a warehouse', 'Một vũ công đang cười trong nhà kho') },
    stats: [
      { value: '2023', label: L('Founded', 'Thành lập') },
      { value: '48', label: L('Limited drops', 'Bộ sưu tập giới hạn') },
      { value: '12k', label: L('Pieces shipped', 'Sản phẩm đã giao') },
      { value: '4.9', label: L('Average rating', 'Đánh giá trung bình') }
    ],
    valuesTitle: L('What we *believe.*', 'Điều chúng tôi *tin tưởng.*'),
    values: [
      { title: L('Built to move', 'Sinh ra để chuyển động'), text: L('Every pattern is tested by dancers, skaters and commuters before it is cut. If it restricts you, it does not ship.', 'Mỗi mẫu đều được vũ công, người trượt ván và dân đi làm thử trước khi cắt may. Nếu nó cản trở bạn, nó sẽ không được bán.') },
      { title: L('Made to last', 'Làm ra để bền lâu'), text: L('Heavyweight fleece, honest materials, double-needle stitching. We would rather you buy once.', 'Nỉ dày dặn, chất liệu trung thực, đường may hai kim. Chúng tôi muốn bạn chỉ phải mua một lần.') },
      { title: L('Small batches', 'Lô nhỏ'), text: L('Limited runs, never restocked. Less waste, and a piece that is yours.', 'Số lượng giới hạn, không bán lại. Ít lãng phí hơn, và một món đồ thật sự của riêng bạn.') },
      { title: L('Zero noise', 'Không ồn ào'), text: L('Clean design, no logos shouting. The cut and the fabric do the talking.', 'Thiết kế tinh gọn, không logo phô trương. Phom dáng và chất vải tự lên tiếng.') }
    ],
    cta: {
      title: L('Try the\n*look.*', 'Thử\n*phong cách.*'),
      text: L('Six styled looks, ready to bag in one tap.', 'Sáu set đồ đã phối sẵn, thêm vào giỏ chỉ với một chạm.'),
      button: L('See the runway', 'Xem sàn diễn'), link: 'runway', image: 'img/m/look-6.webp'
    }
  },

  faq: {
    title: L('Good *questions.*', 'Những *câu hỏi hay.*'),
    lede: L('Shipping, returns, sizing and your account — answered.', 'Vận chuyển, đổi trả, kích cỡ và tài khoản — được giải đáp.'),
    items: [
      { q: L('How long does delivery take?', 'Giao hàng mất bao lâu?'), a: L('Standard delivery takes 2–4 working days within Vietnam and 7–12 days internationally. Express is next-day in Ho Chi Minh City and Ha Noi. Orders over {free} ship free (standard).', 'Giao tiêu chuẩn mất 2–4 ngày làm việc trong nước và 7–12 ngày quốc tế. Giao nhanh trong ngày hôm sau tại TP. Hồ Chí Minh và Hà Nội. Đơn từ {free} được miễn phí vận chuyển (tiêu chuẩn).') },
      { q: L('Can I return or exchange an item?', 'Tôi có thể đổi hoặc trả hàng không?'), a: L('Yes — within 30 days of delivery, unworn with tags attached. Start a return from your order page and we send a prepaid label. Refunds reach your original payment method in 3–5 working days.', 'Có — trong vòng 30 ngày kể từ khi nhận hàng, sản phẩm chưa mặc và còn nguyên thẻ. Hãy bắt đầu đổi trả từ trang đơn hàng, chúng tôi sẽ gửi nhãn trả hàng trả trước. Tiền hoàn về phương thức thanh toán ban đầu trong 3–5 ngày làm việc.') },
      { q: L('Which payment methods do you accept?', 'Các hình thức thanh toán nào được chấp nhận?'), a: L('Credit / debit cards, PayPal, MoMo, VNPay QR, bank transfer and cash on delivery. Card details are never stored by us.', 'Thẻ tín dụng / ghi nợ, PayPal, ví MoMo, VNPay QR, chuyển khoản ngân hàng và thanh toán khi nhận hàng. Chúng tôi không bao giờ lưu thông tin thẻ của bạn.') },
      { q: L('Do I need an account to order?', 'Tôi có cần tài khoản để đặt hàng không?'), a: L('You can browse and fill your bag as a guest. To check out you need a free account — it lets us track your order, save your addresses and handle returns.', 'Bạn có thể xem hàng và thêm vào giỏ với tư cách khách. Để thanh toán, bạn cần một tài khoản miễn phí — giúp chúng tôi theo dõi đơn hàng, lưu địa chỉ và xử lý đổi trả.') },
      { q: L('How do I find my size?', 'Làm sao để chọn đúng size?'), a: L('Open the size guide on any product page. Our pieces are cut oversized: if you are between sizes, take your usual size for the intended look and size down for a closer fit.', 'Hãy mở bảng size ở bất kỳ trang sản phẩm nào. Sản phẩm của chúng tôi có form oversize: nếu bạn phân vân giữa hai size, hãy chọn size quen thuộc để có dáng như ý, và chọn nhỏ hơn một size nếu muốn ôm hơn.') },
      { q: L('Are drops restocked?', 'Các bộ sưu tập có được bán lại không?'), a: L('Most drops are limited runs and are not restocked. Add a piece to your wishlist and we will tell you when something similar lands.', 'Phần lớn bộ sưu tập là số lượng giới hạn và không bán lại. Hãy thêm sản phẩm vào danh sách yêu thích, chúng tôi sẽ báo khi có món tương tự.') },
      { q: L('How do I track my order?', 'Làm sao để theo dõi đơn hàng?'), a: L('Sign in and open Account → Orders. Each order shows its live status timeline from "placed" to "delivered".', 'Đăng nhập và mở Tài khoản → Đơn hàng. Mỗi đơn hiển thị tiến trình trạng thái trực tiếp từ "đã đặt" đến "đã giao".') }
    ]
  },

  policies: {
    tabs: [
      { key: 'shipping', title: L('Shipping', 'Vận chuyển'), sections: [
        { h: L('Delivery times', 'Thời gian giao hàng'), p: L('Standard: 2–4 working days within Vietnam. Express: next day in Ho Chi Minh City and Ha Noi. International: 7–12 working days.', 'Tiêu chuẩn: 2–4 ngày làm việc trong nước. Nhanh: ngày hôm sau tại TP. Hồ Chí Minh và Hà Nội. Quốc tế: 7–12 ngày làm việc.') },
        { h: L('Costs', 'Chi phí'), p: L('Standard shipping is free on orders over {free} and with the FREESHIP code. Express shipping is charged at checkout.', 'Vận chuyển tiêu chuẩn miễn phí cho đơn từ {free} và khi dùng mã FREESHIP. Phí giao nhanh được tính khi thanh toán.') },
        { h: L('Tracking', 'Theo dõi đơn hàng'), p: L('Every order shows live status in Account → Orders from the moment it is placed until it is delivered.', 'Mỗi đơn hàng hiển thị trạng thái trực tiếp trong Tài khoản → Đơn hàng, từ lúc đặt cho đến khi được giao.') }
      ] },
      { key: 'returns', title: L('Returns & exchanges', 'Đổi trả'), sections: [
        { h: L('30-day returns', 'Đổi trả trong 30 ngày'), p: L('Return unworn items with tags within 30 days of delivery for a full refund to the original payment method.', 'Trả lại sản phẩm chưa mặc, còn nguyên thẻ trong vòng 30 ngày kể từ khi nhận để được hoàn tiền đầy đủ về phương thức thanh toán ban đầu.') },
        { h: L('How it works', 'Cách thực hiện'), p: L('Open the order in your account, choose the items, and we email a prepaid label. Refunds arrive 3–5 working days after we receive the parcel.', 'Mở đơn hàng trong tài khoản, chọn sản phẩm, chúng tôi sẽ email nhãn trả hàng trả trước. Tiền hoàn về sau 3–5 ngày làm việc kể từ khi chúng tôi nhận được kiện hàng.') },
        { h: L('Exceptions', 'Trường hợp ngoại lệ'), p: L('Final-sale items and gift cards cannot be returned. Sneakers must be tried on indoors.', 'Sản phẩm thanh lý cuối cùng và thẻ quà tặng không thể trả lại. Sneaker chỉ được thử trong nhà.') }
      ] },
      { key: 'privacy', title: L('Privacy', 'Quyền riêng tư'), sections: [
        { h: L('What we collect', 'Chúng tôi thu thập gì'), p: L('Account details, addresses and order history so we can deliver your order. We never store full card numbers.', 'Thông tin tài khoản, địa chỉ và lịch sử đơn hàng để có thể giao hàng cho bạn. Chúng tôi không bao giờ lưu đầy đủ số thẻ.') },
        { h: L('How we use it', 'Chúng tôi sử dụng ra sao'), p: L('To fulfil orders, provide support and — only if you opt in — send drop announcements. We do not sell your data.', 'Để xử lý đơn hàng, hỗ trợ khách hàng và — chỉ khi bạn đồng ý — gửi thông báo bộ sưu tập mới. Chúng tôi không bán dữ liệu của bạn.') },
        { h: L('Your rights', 'Quyền của bạn'), p: L('Ask us to export or delete your data at any time via the contact page.', 'Bạn có thể yêu cầu xuất hoặc xóa dữ liệu bất cứ lúc nào qua trang liên hệ.') }
      ] },
      { key: 'terms', title: L('Terms of service', 'Điều khoản dịch vụ'), sections: [
        { h: L('Using the store', 'Sử dụng cửa hàng'), p: L('By placing an order you confirm you are 16 or older and that the information you give is accurate.', 'Khi đặt hàng, bạn xác nhận mình từ 16 tuổi trở lên và thông tin cung cấp là chính xác.') },
        { h: L('Pricing & availability', 'Giá và tình trạng hàng'), p: L('We recalculate price and stock at checkout and may cancel an order if an item cannot be supplied.', 'Chúng tôi tính lại giá và tồn kho khi thanh toán và có thể hủy đơn nếu không thể cung cấp sản phẩm.') },
        { h: L('Demo notice', 'Lưu ý bản demo'), p: L('This storefront is a demonstration. Payments are simulated and no goods are shipped.', 'Cửa hàng này là bản trình diễn. Thanh toán chỉ là mô phỏng và không có hàng nào được giao.') }
      ] }
    ]
  },

  contact: {
    title: L('Say *hello.*', 'Hãy *chào chúng tôi.*'),
    lede: L('Questions about an order, sizing or a collab? We read everything.', 'Thắc mắc về đơn hàng, kích cỡ hay hợp tác? Chúng tôi đọc mọi tin nhắn.'),
    email: 'hello@vanta.example',
    address: L('12 Nguyen Hue, District 1\nHo Chi Minh City', '12 Nguyễn Huệ, Quận 1\nTP. Hồ Chí Minh'),
    hours: L('Mon–Sat · 09:00–19:00', 'Thứ Hai–Thứ Bảy · 09:00–19:00')
  },

  auth: {
    image: 'img/c/dance-1.webp',
    tagline: L('Wear the motion.', 'Mặc cùng chuyển động.'),
    sub: L('Members get first access to every Friday drop.', 'Thành viên được truy cập sớm mọi bộ sưu tập thứ Sáu.')
  }
};
