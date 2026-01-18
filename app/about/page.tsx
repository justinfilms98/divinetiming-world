import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { createClient } from '@/lib/supabase/server';

export default async function AboutPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-[var(--text)] mb-12 text-center">
              About
            </h1>

            <div className="prose prose-invert max-w-none">
              <div className="text-[var(--text)]/90 text-lg leading-relaxed space-y-6">
                <p>
                  DIVINE:TIMING are a unique duo who integrate live percussion and vocals into their
                  performances, crafting powerful Afro and organic house music inspired by tribes,
                  religions and cultures from around the world.
                </p>
                <p>
                  Their mission is to reconnect people with their roots and to remind us that beyond
                  nationalities, languages and backgrounds, we are all one. The spiral they wear has
                  become the emblem of this message of unity and of a timeless connection to the
                  source of all things.
                </p>
                <p>
                  More than a conventional performance act, DIVINE:TIMING see their union as a
                  calling; two artists brought together by the universe to help heal the world
                  through music.
                </p>
                <p>
                  Born in the UK and raised in the Canary Islands, the duo have spent the past two
                  years building strong momentum: hosting their own events, nurturing a devoted
                  community they call their tribe, and producing original music that is now
                  receiving official releases.
                </p>
              </div>

              <div className="mt-12 pt-12 border-t border-[var(--accent)]/20">
                <h2 className="text-2xl font-bold text-[var(--text)] mb-6">Members</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-xl font-semibold text-[var(--accent)] mb-2">
                      {settings?.member_1_name || 'Liam Bongo'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-[var(--accent)] mb-2">
                      {settings?.member_2_name || 'Lex Laurence'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
