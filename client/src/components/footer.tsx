import { Link } from "wouter";
import { MapPin, Facebook, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">ServiLocal</span>
            </div>
            <p className="text-slate-300 mb-6 max-w-md">
              Conectando a la comunidad de Cúcuta con los mejores servicios locales. 
              Facilitamos el acceso a proveedores confiables y servicios de calidad.
            </p>
            <div className="flex space-x-4">
              <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Services Section */}
          <div>
            <h3 className="font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/services?category=hogar" className="hover:text-white transition-colors">
                  Hogar
                </Link>
              </li>
              <li>
                <Link href="/services?category=tecnologia" className="hover:text-white transition-colors">
                  Tecnología
                </Link>
              </li>
              <li>
                <Link href="/services?category=automotriz" className="hover:text-white transition-colors">
                  Automotriz
                </Link>
              </li>
              <li>
                <Link href="/services?category=belleza" className="hover:text-white transition-colors">
                  Belleza
                </Link>
              </li>
              <li>
                <Link href="/services?category=educacion" className="hover:text-white transition-colors">
                  Educación
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <Link href="/support" className="hover:text-white transition-colors">
                  Centro de Ayuda
                </Link>
              </li>
              <li>
                <Link href="/support#faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support#contact" className="hover:text-white transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/donations" className="hover:text-white transition-colors">
                  Donaciones
                </Link>
              </li>
              <li>
                <Link href="/suggestions" className="hover:text-white transition-colors">
                  Sugerencias
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-400">
            © 2024 ServiLocal. Todos los derechos reservados.
          </div>
          <div className="flex space-x-6 text-slate-400 mt-4 md:mt-0">
            <Link href="/legal/terms" className="hover:text-white transition-colors">
              Términos
            </Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">
              Privacidad
            </Link>
            <Link href="/legal/cookies" className="hover:text-white transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
