import { Lightbulb } from "lucide-react";


export const Footer = () => {
  return (
    <footer id="footer">
      <hr className="w-11/12 mx-auto" />

      <section className="container py-20 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-x-12 gap-y-8">
        <div className="col-span-full xl:col-span-4 space-y-4">
          <a
            rel="noreferrer noopener"
            href="/"
            className="font-bold text-xl flex"
          >
            <Lightbulb className="mx-2" />
            Modern Utilities
          </a>
          <div className="flex flex-col gap-2 ml-4">
            {/* <h3 className="font-semi-bold text-lg">Address</h3> */}
            <div className="opacity-60 hover:opacity-100">

              Downtown Summerlin <br/>
              Las Vegas, NV

            </div>
          </div>

        </div>

        {/* <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Address</h3>
          <div className="opacity-60 hover:opacity-100">
            
              3441 W Sahara Ave b7
              2Las Vegas, NV 89102
              United States
            
          </div>
        </div> */}

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">About</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#features"
              className="opacity-60 hover:opacity-100"
            >
              Features
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#testimonials"
              className="opacity-60 hover:opacity-100"
            >
              Testimonials
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#faq"
              className="opacity-60 hover:opacity-100"
            >
              FAQ
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-lg">Community</h3>
          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Youtube
            </a>
          </div>

          <div>
            <a
              rel="noreferrer noopener"
              href="#"
              className="opacity-60 hover:opacity-100"
            >
              Instagram
            </a>
          </div>
        </div>
      </section>

      <section className="container pb-14 text-center">
        <h3>
          &copy; 2025 Modern Utilities. All rights reserved.{" "}

        </h3>
      </section>
    </footer>
  );
};
