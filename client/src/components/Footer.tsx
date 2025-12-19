import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/logo.jpeg" alt="Saúde e Pilates" className="h-12 w-12 rounded-full object-cover" />
              <span className="text-lg font-semibold">Saúde e Pilates</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Transformando vidas através do Pilates com profissionais dedicados ao seu bem-estar.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about">
                  <a className="text-muted-foreground hover:text-primary transition-smooth">
                    Sobre Nós
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/plans">
                  <a className="text-muted-foreground hover:text-primary transition-smooth">
                    Planos
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/trial-class">
                  <a className="text-muted-foreground hover:text-primary transition-smooth">
                    Aula Experimental
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="text-muted-foreground hover:text-primary transition-smooth">
                    Contato
                  </a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4">Contato</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <a 
                  href="https://wa.me/5511930112640" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-smooth"
                >
                  (11) 93011-2640
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <a 
                  href="mailto:saudeeppilates@gmail.com"
                  className="text-muted-foreground hover:text-primary transition-smooth"
                >
                  saudeeppilates@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="font-semibold mb-4">Unidades</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  Rua Laurinda Cardoso Mello Freire, 261 - Vila Oliveira
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">
                  R. Kikuji Iwanami, 256 D - Vila Caputera
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Saúde e Pilates. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
