import Navbar from '../../Components/customer/Common/Navbar';
import Footer from '../../Components/customer/Common/Footer';
import ReviewsSection from '../../Components/customer/Home/ReviewSection';
import HomeProductSection from '../../Components/customer/Home/HomeProductSection';
import HomeFairPriceSection from "../../Components/customer/Home/HomeFairPriceSection";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function CustomerHome() {
  const location = useLocation();

  // ✅ Scroll to footer if requested
  useEffect(() => {
    if (location.state?.scrollTo === "footer") {
      const footer = document.getElementById("footer-section");
      if (footer) {
        setTimeout(() => {
          footer.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  }, [location]);

  const brands = [
    "/TrustedLogos/logo1.png",
    "/TrustedLogos/logo2.png",
    "/TrustedLogos/logo3.png",
    "/TrustedLogos/logo4.png",
    "/TrustedLogos/logo5.png",
    "/TrustedLogos/logo6.png",
  ];
 

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <section className="relative bg-white flex flex-col items-center py-0 overflow-hidden min-h-[400px]">
        <div className="absolute left-0 bottom-0 h-[270px] w-[46%] md:w-[40%] bg-[#88946B] rounded-tl-2xl rounded-bl-2xl z-0"></div>
        <div className="absolute right-0 bottom-0 h-[270px] w-[46%] md:w-[40%] bg-[#88946B] rounded-tr-2xl rounded-br-2xl z-0"></div>

        <h1 className="relative z-10 pt-8 text-5xl md:text-6xl font-serif font-bold text-center leading-none mb-2">
          Buy Your Products.
        </h1>

        <div className="relative z-10 w-full flex justify-center pb-0 pt-2">
          <div className="bg-black overflow-hidden border-t-10 border-x-10 border-b-0 border-black w-[35vw] max-w-3xl min-w-[350px] rounded-t-xl rounded-b-none">
            <img
              src="/homepics/browseSection.png"
              alt="Product Display"
              className="block w-full h-80 md:h-80 object-cover rounded-t-xl rounded-b-none"
            />
          </div>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className="py-12 overflow-hidden">
        <div className="mb-6 text-xl text-gray-500 font-semibold pl-5">
          Trusted by:
        </div>
        <div className="relative w-full overflow-hidden">
          <div className="flex animate-scroll gap-16">
            {brands.concat(brands).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt="Brand logo"
                className="h-20 opacity-80 hover:opacity-100 transition-opacity duration-300"
              />
            ))}
          </div>
        </div>
      </section>

      <HomeProductSection />
      <HomeFairPriceSection />
      <ReviewsSection />

      <section className="py-12 flex flex-col items-center bg-white">
        <h2 className="text-3xl font-serif font-bold mb-4">Connect with us</h2>
        <p className="mb-6 text-gray-700 text-center max-w-lg">
          Schedule a quick call to learn how Axis can turn your regional data into a powerful advantage.
        </p>
        <button className="bg-[#586330] text-white px-8 py-3 rounded-full font-medium">
          Learn More &rarr;
        </button>
      </section>

      <Footer />
    </div>
  );
}
