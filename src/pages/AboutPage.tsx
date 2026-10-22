import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (path: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="bg-white min-h-[100dvh] py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="border-b border-[#E5E5E5] pb-6 mb-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F7F4EE] border border-[#C2A77A]/30 text-[#1A1A1A] font-heading font-semibold text-xs tracking-[0.15em] uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C2A77A]" />
            <span>OUR STORY</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-[#1A1A1A]">
            THE YUSR STORY
          </h1>
          <p className="font-heading font-semibold text-sm sm:text-base text-[#C2A77A] uppercase tracking-wide mt-2">
            Rooted in Faith. Built on Struggles.
          </p>
        </div>

        {/* Content - Keeping the raw, emotional tone of the founder's story exactly as provided */}
        <div className="font-body text-[#1A1A1A] space-y-6 text-sm sm:text-base leading-relaxed">
          <p className="text-lg font-medium text-[#1A1A1A] leading-relaxed">
            Yusr (pronounced <span className="font-bold">Yoo-sr</span>) means "Ease" and "Aasani". But this brand wasn't built in a day of ease; it was built on years of struggle, learning, and the will to do better.
          </p>

          <p>
            My journey started at the age of 13 with POD (Print on Demand), dropshipping, and reselling. I’ve made my mistakes, and I don’t claim to be perfect. I am not a saint; I am just a flawed human, a "gunahgar," trying every day to be better and take a step towards my Deen.
          </p>

          <div className="p-6 bg-[#F9F9F9] border-l-4 border-[#C2A77A] my-6">
            <p className="font-heading font-semibold text-sm sm:text-base text-[#1A1A1A] uppercase leading-snug">
              "Looking around, I saw the streetwear culture becoming increasingly loud and vulgar. There was a massive void for a brand that felt premium, looked aggressive on the streets, yet stayed completely true to our Islamic identity and modesty."
            </p>
          </div>

          <p>
            I created Yusr Collection for the youth who want to express themselves without compromising their values. For the fighters, the gym bros, and the believers who carry their legacy with pride.
          </p>

          <p>
            Every piece we drop is made-to-order, crafted with heavyweight 240 GSM fabric and high-quality prints. We don't follow fast fashion; we create statements.
          </p>

          <p>
            We are not perfect, and neither are our clothes. But we are trying to build something that reminds us of who we are and who we belong to.
          </p>

          <div className="pt-6 border-t border-[#E5E5E5] text-center">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl uppercase tracking-wider text-[#1A1A1A]">
              WEAR YOUR IDENTITY. WEAR YOUR EASE.
            </h3>
            <p className="text-xs text-[#666666] font-heading uppercase tracking-widest mt-2">
              — FOUNDER, YUSR COLLECTION
            </p>

            <div className="mt-8">
              <button
                onClick={() => onNavigate('/shop')}
                className="min-h-[48px] px-8 py-3.5 bg-[#C2A77A] hover:bg-[#B39665] text-[#111111] font-heading font-bold text-xs sm:text-sm uppercase tracking-[0.05em] transition-all inline-flex items-center gap-2"
              >
                <span>EXPLORE THE COLLECTION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
