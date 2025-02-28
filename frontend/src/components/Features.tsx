// import { Badge } from "./ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// import image from "../assets/growth.png";
// import image3 from "../assets/reflecting.png";
// import image4 from "../assets/looking-ahead.png";
import { Cable, Home, PhoneCall, Smartphone, Tv, Wifi } from "lucide-react";


interface FeatureProps {
  title: string;
  description: string;
  price: string;
  icon:JSX.Element;
}

const features: FeatureProps[] = [
  {
    icon: <Wifi/>,
    title: "Internet",
    description:
      "High-speed fiber optic internet for seamless connectivity.",
    price: "Fast connections from $39.99/month",
  },
  {
    icon: <Smartphone/>,
    title: "Mobile",
    description:
      "Flexible mobile plans with nationwide coverage.",
    price: "Plans starting at $19.99/month",
  },
  {
    icon: <PhoneCall/>,
    title: "Landline",
    description:
      "Crystal-clear landline service for reliable communication.",
    price: "Affordable rates starting at $9.99/month",
  },
  {
    icon: <Tv/>,
    title: "TV",
    description:
      "Access to a wide range of channels and on-demand content.",
    price: "Plans from $29.99/month",
  },
  {
    icon: <Cable/>,
    title: "Cable TV",
    description:
      "Premium cable TV packages with HD quality.",
    price: "Packages starting at $49.99/month",
  },
  {
    icon: <Home/>,
    title: "Smart Home Services",
    description:
      "Enhance your home with smart devices and automation.",
    price: "Solutions from $59.99/month",
  },
];

// const featureList: string[] = [
//   "Dark/Light theme",
//   "Reviews",
//   "Features",
//   "Pricing",
//   "Contact form",
//   "Our team",
//   "Responsive design",
//   "Newsletter",
//   "Minimalist",
// ];

export const Features = () => {
  return (
    <section
      id="features"
      className="container py-24 sm:py-32 space-y-8"
    >
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        Many{" "}
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Great Services
        </span>
        <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
        Your one-stop shop for internet, moblie/landline service, and TV! For more info about service in your area, DM us or call 702-850-6149...We offer a wide range of utility services to make your move to a new home seamless and stress-free.
      </p>
      </h2>


      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ title, description, price, icon }: FeatureProps) => (
          <Card key={title}>
            <CardHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-black">
              {icon}
              </div>
            </CardHeader>
            <CardContent className="flex items-center justify-center" >
              <CardTitle>{title}</CardTitle>
            </CardContent>

            <CardContent className="text-center flex flex-col items-center justify-center">
              {description}
            </CardContent>

            <CardFooter className="flex items-center justify-center bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              {price}
            </CardFooter>

          </Card>
        ))}
      </div>
    </section>
  );
};
