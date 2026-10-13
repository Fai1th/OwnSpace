import { Navigation } from "@/components/navigation";
import { Pricing } from "@/components/pricing";
import { Footer } from "@/components/footer";
export const metadata = { title: "Pricing" };
export default function Page() {
  return (
    <>
      <Navigation />
      <main id="main">
        <Pricing standalone />
      </main>
      <Footer />
    </>
  );
}
