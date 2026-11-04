import { Fragment, useEffect, useState } from 'react';
import { HashRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { CatalogProvider, useCatalog } from './context/CatalogContext.jsx';
import { LangProvider, useLang } from './i18n/LangContext.jsx';
import { fillText } from './i18n/index.js';
import AdminContent from './pages/admin/Content.jsx';
import Categories from './pages/admin/Categories.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { StoreProvider, useStore } from './context/StoreContext.jsx';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import Progress from './components/Progress.jsx';
import Announce from './components/Announce.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Newsletter from './components/Newsletter.jsx';
import QuickView from './components/QuickView.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import SearchModal from './components/SearchModal.jsx';
import AuthPrompt from './components/AuthPrompt.jsx';
import Toast from './components/Toast.jsx';
import { RequireAdmin, RequireAuth } from './components/Guards.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import { Forgot, Login, Register } from './pages/Auth.jsx';
import { About, Contact, Faq, NotFound, Policies } from './pages/Content.jsx';
import { AccountLayout, Orders, Overview } from './pages/account/Account.jsx';
import OrderDetail from './pages/account/OrderDetail.jsx';
import { Addresses, Profile, Wishlist } from './pages/account/Settings.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Products from './pages/admin/Products.jsx';
import { AdminOrder, AdminOrders } from './pages/admin/Orders.jsx';
import { Coupons, Customers, Settings } from './pages/admin/Other.jsx';

/** new page → top (unless the navigation asked for a specific home section) */
function ScrollToTop() {
  const { pathname, state } = useLocation();
  useEffect(() => { if (!state?.scrollTo) window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname, state]);
  return null;
}

const AUTH_PATHS = ['/login', '/register', '/forgot'];

/** storefront chrome: announcement bar, header, newsletter, footer. Auth screens get a clean full-bleed layout. */
function SiteLayout() {
  const { pathname } = useLocation();
  const bare = AUTH_PATHS.includes(pathname);
  return (
    <>
      {!bare && <Announce />}
      {!bare && <Header />}
      <Outlet />
      {!bare && <Newsletter />}
      {!bare && <Footer />}
    </>
  );
}

function Shell() {
  const { anyOverlay } = useStore();
  const { lang } = useLang();
  const { content: { seo, brand } } = useCatalog();
  const { pathname } = useLocation();
  const [loaded, setLoaded] = useState(false);
  const [heroStarted, setHeroStarted] = useState(false);
  const admin = pathname.startsWith('/admin');

  useEffect(() => { document.body.classList.toggle('is-loading', !loaded); }, [loaded]);

  // browser tab title + meta description follow the language and the editable SEO content
  useEffect(() => {
    const vars = { brand: brand.name };
    document.title = fillText(seo.title, vars);
    document.querySelector('meta[name=description]')?.setAttribute('content', fillText(seo.description, vars));
  }, [lang, seo, brand.name, pathname]);
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => setHeroStarted(true), 450);
    return () => clearTimeout(t);
  }, [loaded]);

  return (
    <>
      <Preloader onDone={() => setLoaded(true)} />
      <Cursor resetKey={anyOverlay} off={admin} />
      <Progress />
      <ScrollToTop />

      <Fragment key={lang}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home started={heroStarted} />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:id" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<Faq />} />
          <Route path="policies" element={<Policies />} />
          <Route path="policies/:tab" element={<Policies />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot" element={<Forgot />} />

          <Route element={<RequireAuth reason="checkout" />}>
            <Route path="checkout" element={<Checkout />} />
          </Route>
          <Route element={<RequireAuth reason="account" />}>
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<Overview />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="addresses" element={<Addresses />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrder />} />
          <Route path="categories" element={<Categories />} />
          <Route path="products" element={<Products />} />
          <Route path="content" element={<AdminContent />} />
          <Route path="customers" element={<Customers />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>

      {!admin && <QuickView />}
      {!admin && <CartDrawer />}
      {!admin && <SearchModal />}
      <AuthPrompt />
      {!admin && <Toast />}
      </Fragment>
    </>
  );
}

export default function App() {
  return (
    <HashRouter>
      <LangProvider>
        <CatalogProvider>
          <AuthProvider>
            <StoreProvider><Shell /></StoreProvider>
          </AuthProvider>
        </CatalogProvider>
      </LangProvider>
    </HashRouter>
  );
}
