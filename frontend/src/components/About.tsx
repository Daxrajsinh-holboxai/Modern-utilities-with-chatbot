import { Statistics } from "./Statistics";
import pilot from "../assets/pilot.png";

export const About = () => {
  return (
    <section
      id="about"
      className="container py-24 sm:py-32"
    >
      <div className="bg-muted/50 border rounded-lg py-12">
        <div className="px-6 flex flex-col-reverse md:flex-row gap-8 md:gap-12">
          <img
            src={pilot}
            alt=""
            className="w-[300px] object-contain rounded-lg"
          />
          <div className="bg-green-0 flex flex-col justify-between">
            <div className="pb-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                  About{" "}
                </span>
                Modern Utilities
              </h2>
              <p className="text-xl text-muted-foreground mt-4">
              Modern Utilities is a disabled combat Army Veteran owned and operated small business founded and operational since September 2009. We have been funded by the Department of Veterans Affairs and maintain a high ranking on Google and Bing and many other search engines. We started out local in Las Vegas but have received many awards and recognition for our level of sales performance and professionalism that they have given us nationwide access to sell all of the service providers that we deal with such as Cox Communications, Centurylink, Quantum Fiber, Tmobile Home Internet, Directv, Spectrum Business VOIP.
              </p>
            </div>

            <Statistics />
          </div>
        </div>
      </div>
    </section>
  );
};
