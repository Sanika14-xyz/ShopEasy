import { useEffect, useMemo, useState } from 'react';
import {
  BrowserRouter,
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useSearchParams,
  useParams
} from 'react-router-dom';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
});

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    fetch('/api/products')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Catalog request failed (${response.status})`);
        }
        return response.json();
      })
      .then((items) => {
        if (active) {
          setProducts(items);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  function addToCart(product) {
    setCart((items) => {
      const existing = items.find((item) => item._id === product._id);
      if (existing) {
        return items.map((item) =>
          item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(productId, quantity) {
    setCart((items) => items
      .map((item) => item._id === productId ? { ...item, quantity } : item)
      .filter((item) => item.quantity > 0));
  }

  function removeFromCart(productId) {
    setCart((items) => items.filter((item) => item._id !== productId));
  }

  const pageContext = {
    products,
    status,
    cart,
    cartCount,
    addToCart,
    updateQuantity,
    removeFromCart
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<StoreLayout cartCount={cartCount} />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage {...pageContext} />} />
          <Route path="products/:productId" element={<ProductPage {...pageContext} />} />
          <Route path="cart" element={<CartPage {...pageContext} />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function StoreLayout({ cartCount }) {
  return (
    <>
      <header className="topbar">
        <Link className="brand" to="/" aria-label="ShopEasy home">
          <span className="brand-mark">s</span> ShopEasy
        </Link>
        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/search">Search</NavLink>
          <NavLink to="/about">Our story</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <Link className="cart-link" to="/cart">
          Your bag <span>{cartCount}</span>
        </Link>
      </header>
      <Outlet />
      <footer>
        <Link to="/">SHOP EASY, LIVE WELL</Link>
        <div className="footer-links">
          <Link to="/about">Our story</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <span>Designed for your everyday.</span>
      </footer>
    </>
  );
}

function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">WELCOME TO SHOP EASY</p>
          <h1>Good things,<br />made simple.</h1>
          <p className="hero-copy">A thoughtful little collection for everyday living. Find something useful, lovely, and just right for you.</p>
          <Link className="shop-button" to="/search">Find your next favorite <span>↘</span></Link>
        </div>
        <div className="hero-art" role="img" aria-label="A curated collection of everyday essentials">
          <div className="sun"></div>
          <div className="art-card art-card-back"></div>
          <div className="art-card art-card-front">
            <span>THE EVERYDAY EDIT</span>
            <strong>Made for<br />your kind<br />of day.</strong>
            <span className="art-sparkle">✳</span>
          </div>
          <span className="art-caption">01 / THE LITTLE THINGS</span>
        </div>
      </section>
      <section className="welcome-strip">
        <p className="eyebrow">A LITTLE LESS SEARCHING, A LITTLE MORE FINDING</p>
        <h2>Everyday favorites, all in one easy place.</h2>
        <p>Browse our collection or search for exactly what you have in mind.</p>
        <Link className="primary-button" to="/search">Explore the collection <span>→</span></Link>
      </section>
      <section className="welcome-notes" aria-label="The ShopEasy difference">
        <article><span>01</span><h2>Thoughtfully picked</h2><p>A small collection of useful things for your everyday.</p></article>
        <article><span>02</span><h2>Easy to explore</h2><p>Search by name, category, or what you need.</p></article>
        <article><span>03</span><h2>Made for real life</h2><p>Simple favorites that feel right at home.</p></article>
      </section>
    </main>
  );
}

function SearchPage({ products, status, addToCart }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredProducts = products.filter((product) => {
    const searchableText = `${product.name} ${product.description} ${product.category}`.toLocaleLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  function updateQuery(value) {
    if (value) {
      setSearchParams({ q: value }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  return (
    <main className="page-shell search-shell">
      <PageIntro eyebrow="FIND YOUR EVERYDAY FAVORITE" title="What are you looking for?" />
      <form className="search-form" role="search" onSubmit={(event) => event.preventDefault()}>
        <label htmlFor="product-search">Search products</label>
        <div className="search-control">
          <span aria-hidden="true">⌕</span>
          <input
            id="product-search"
            type="search"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Try “bag”, “home”, or “something cozy”"
            autoComplete="off"
          />
          {query && (
            <button type="button" className="clear-search" onClick={() => updateQuery('')}>Clear</button>
          )}
        </div>
        <p className="search-hint">Search by item name, category, or description.</p>
      </form>

      <section className="search-results">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{normalizedQuery ? 'YOUR SEARCH RESULTS' : 'A GOOD PLACE TO START'}</p>
            <h2>{normalizedQuery ? `${filteredProducts.length} ${filteredProducts.length === 1 ? 'find' : 'finds'}` : 'Everyday essentials'}</h2>
          </div>
          <p>{normalizedQuery ? `Searching for “${query.trim()}”` : 'Considered pieces. No overthinking required.'}</p>
        </div>

        {status === 'loading' && <p className="message">Finding the good stuff…</p>}
        {status === 'error' && (
          <p className="message error">We couldn't load the collection. Check that the API and database are running, then refresh.</p>
        )}
        {status === 'ready' && products.length === 0 && (
          <p className="message">Your collection is waiting for its first products.</p>
        )}
        {status === 'ready' && products.length > 0 && filteredProducts.length === 0 && (
          <div className="no-results">
            <span aria-hidden="true">✳</span>
            <h2>No matches just yet.</h2>
            <p>We don't see “{query.trim()}” in the collection, but you can ask us about it.</p>
            <Link className="primary-button" to={`/contact?item=${encodeURIComponent(query.trim())}`}>
              Ask us for this item <span>→</span>
            </Link>
          </div>
        )}
        {filteredProducts.length > 0 && (
          <div className="product-grid">
            {filteredProducts.map((product, index) => (
              <article className="product-card" key={product._id}>
                <Link
                  className={`product-image product-tone-${index % 3}`}
                  to={`/products/${product._id}`}
                  aria-label={`View ${product.name}`}
                >
                  <img src={product.image} alt={product.name} />
                  <span className="category">{product.category}</span>
                </Link>
                <div className="product-info">
                  <div>
                    <h3><Link to={`/products/${product._id}`}>{product.name}</Link></h3>
                    <p>{product.description}</p>
                  </div>
                  <div className="product-buy">
                    <strong>{money.format(product.price)}</strong>
                    <button type="button" onClick={() => addToCart(product)}>Add <span>+</span></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function ProductPage({ products, status, addToCart }) {
  const { productId } = useParams();
  const product = products.find((item) => item._id === productId);

  if (status === 'loading') return <main className="page-shell"><p className="message">Finding the good stuff…</p></main>;
  if (status === 'error') return <main className="page-shell"><p className="message error">We couldn't load this product. Please try again.</p></main>;
  if (!product) {
    return (
      <main className="page-shell">
        <PageIntro eyebrow="NOT FOUND" title="We couldn't find that item." />
        <Link className="text-link" to="/search">Back to the collection →</Link>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <Link className="back-link" to="/search">← Back to the collection</Link>
      <section className="product-detail">
        <div className="detail-image">
          <img src={product.image} alt={product.name} />
          <span className="category">{product.category}</span>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">A SHOP EASY FAVORITE</p>
          <h1>{product.name}</h1>
          <strong className="detail-price">{money.format(product.price)}</strong>
          <p>{product.description}</p>
          <p className="detail-note">Thoughtfully picked for everyday use. Simple, useful, and easy to love.</p>
          <button className="primary-button" type="button" onClick={() => addToCart(product)}>
            Add to your bag <span>+</span>
          </button>
          <p className="detail-footnote">Demo project: checkout and payments are not enabled.</p>
        </div>
      </section>
    </main>
  );
}

function CartPage({ cart, cartCount, updateQuantity, removeFromCart }) {
  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  return (
    <main className="page-shell">
      <PageIntro eyebrow="YOUR LITTLE COLLECTION" title={`Your bag (${cartCount})`} />
      {cart.length === 0 ? (
        <div className="empty-state">
          <p>Your bag is taking a little breather.</p>
          <Link className="primary-button" to="/search">Find something you love <span>→</span></Link>
        </div>
      ) : (
        <section className="cart-page">
          <div className="cart-list">
            {cart.map((item) => (
              <article className="cart-row" key={item._id}>
                <Link to={`/products/${item._id}`} className="cart-thumb">
                  <img src={item.image} alt="" />
                </Link>
                <div className="cart-item-copy">
                  <Link to={`/products/${item._id}`}><h2>{item.name}</h2></Link>
                  <p>{item.category}</p>
                  <button className="remove-button" type="button" onClick={() => removeFromCart(item._id)}>Remove</button>
                </div>
                <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
                  <span>{item.quantity}</span>
                  <button type="button" aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
                </div>
                <strong className="cart-row-price">{money.format(item.price * item.quantity)}</strong>
              </article>
            ))}
          </div>
          <aside className="cart-total-card">
            <p>Subtotal <strong>{money.format(cartTotal)}</strong></p>
            <small>Shipping and taxes are not included in this demo.</small>
            <button type="button" className="primary-button" disabled>Checkout coming soon</button>
            <Link className="text-link" to="/search">Continue shopping →</Link>
          </aside>
        </section>
      )}
    </main>
  );
}

function AboutPage() {
  return (
    <main className="page-shell">
      <PageIntro eyebrow="A LITTLE ABOUT US" title={<>Good things.<br />Less fuss.</>} />
      <section className="about-layout">
        <div className="about-art" aria-hidden="true"><span>✳</span><strong>THE<br />EVERYDAY<br />EDIT</strong></div>
        <div className="about-copy">
          <h2>We believe the everyday deserves a little extra thought.</h2>
          <p>ShopEasy began with a simple idea: finding useful, lovely things shouldn't feel complicated. We bring together a small, considered collection of everyday favorites, so you can spend less time searching and more time enjoying them.</p>
          <p>We're a demo shop built as part of a DevOps learning project. The products and cart help show how a real web application can be built, tested, and delivered step by step.</p>
          <Link className="text-link" to="/search">Explore the collection →</Link>
        </div>
      </section>
    </main>
  );
}

function ContactPage() {
  const [searchParams] = useSearchParams();
  const [sent, setSent] = useState(false);
  const requestedItem = searchParams.get('item')?.trim();

  function handleSubmit(event) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <main className="page-shell">
      <PageIntro eyebrow="WE'RE HERE FOR YOU" title="Say hello." />
      <section className="contact-layout">
        <div className="contact-copy">
          <h2>A question, an idea, or just a friendly hello?</h2>
          <p>We'd love to hear from you. Leave us a note and we'll be in touch.</p>
          <div className="contact-detail"><span>Email</span><a href="mailto:hello@shopeasy.example">hello@shopeasy.example</a></div>
          <div className="contact-detail"><span>Hours</span><p>Monday–Friday, 9am–5pm</p></div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          {sent ? (
            <div className="form-success" role="status">
              <span>✳</span>
              <h2>Thanks for saying hello.</h2>
              <p>This demo form doesn't send messages yet, but your form worked.</p>
              <button type="button" className="text-link" onClick={() => setSent(false)}>Send another message →</button>
            </div>
          ) : (
            <>
              <label htmlFor="contact-name">Your name</label>
              <input id="contact-name" name="name" autoComplete="name" required />
              <label htmlFor="contact-email">Email address</label>
              <input id="contact-email" name="email" type="email" autoComplete="email" required />
              <label htmlFor="contact-message">Your message</label>
              <textarea
                id="contact-message"
                name="message"
                rows="5"
                defaultValue={requestedItem ? `I'm looking for ${requestedItem}. Could you let me know if it is available?` : ''}
                required
              />
              <button className="primary-button" type="submit">Send your note <span>→</span></button>
              <small>This is a demo form and does not send or store your message.</small>
            </>
          )}
        </form>
      </section>
    </main>
  );
}

const faqs = [
  {
    question: 'What is ShopEasy?',
    answer: 'ShopEasy is a small demo storefront made for a DevOps learning project. It includes a product catalog and a browser-based shopping cart.'
  },
  {
    question: 'Can I place a real order?',
    answer: 'Not yet. Checkout and payment processing are intentionally disabled in this learning project.'
  },
  {
    question: 'How do I add an item to my bag?',
    answer: 'Choose Add on a product card or open its detail page and select Add to your bag. You can update quantities or remove items from the bag page.'
  },
  {
    question: 'Will my bag stay after I close the page?',
    answer: 'The cart is currently kept in the app while it is open. It resets if you refresh the page or close your browser.'
  },
  {
    question: 'How can I get in touch?',
    answer: 'Use the contact page to see the demo form and contact details. The form currently shows a confirmation but does not send messages.'
  }
];

function FaqPage() {
  return (
    <main className="page-shell faq-shell">
      <PageIntro eyebrow="THE LITTLE DETAILS" title="A few good answers." />
      <section className="faq-list" aria-label="Frequently asked questions">
        {faqs.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>{item.question}<span aria-hidden="true">+</span></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </section>
      <p className="faq-contact">Still curious? <Link className="text-link" to="/contact">Talk to us →</Link></p>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="page-shell not-found">
      <PageIntro eyebrow="404 / A WRONG TURN" title="This page wandered off." />
      <Link className="primary-button" to="/">Back to ShopEasy <span>→</span></Link>
    </main>
  );
}

function PageIntro({ eyebrow, title }) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
    </div>
  );
}
