import 'bootstrap/dist/css/bootstrap.min.css';
import '../app/globals.css';
import Link from 'next/link';


export default function Home() {
  return (
    <div className="container-fluid custom-background">
      <nav className="navbar navbar-expand-lg navbar-background">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <img
              src="https://ih1.redbubble.net/image.542370055.6839/st,small,507x507-pad,600x600,f8f8f8.jpg" alt="Logo" style={{width: "60px", height: "auto"}}
              className="d-inline-block align-text-top"
            />
          </Link>

          <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          >
          <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link href="/" className="nav-link active text-white">
                  Market
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/about" className="nav-link text-white">
                  Envanter
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/services" className="nav-link text-white">
                  Eşya Sat
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/contact" className="nav-link text-white">
                  Eşya Al
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/blog" className="nav-link text-white">
                  Açık Artırma
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/faq" className="nav-link text-white">
                  Yardım
                </Link>
              </li>

              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle text-white"
                  href="#"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Yardım
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li>
                    <Link href="/option1" className="dropdown-item">
                      Menü 1
                    </Link>
                  </li>
                  <li>
                    <Link href="/option2" className="dropdown-item">
                      Menü 2
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <Link href="/option3" className="dropdown-item">
                      Menü 3
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>

            <form className="d-flex me-2">
              <input
                className="form-control me-2"
                type="search"
                placeholder="Arama yap"
                aria-label="Search"
              />
            </form>

            <button className="btn btn-primary" type="button">
              Giriş Yap
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
