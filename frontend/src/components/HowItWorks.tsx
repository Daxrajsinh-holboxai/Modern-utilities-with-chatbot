import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlaneIcon, GiftIcon } from "../components/Icons";

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  // {
  //   icon: <MedalIcon />,
  //   title: "Accessibility",
  //   description:
  //     "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Illum quas provident cum",
  // },
  // {
  //   icon: <MapIcon />,
  //   title: "Community",
  //   description:
  //     "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Illum quas provident cum",
  // },
  {
    icon: <PlaneIcon />,
    title: "Smart Solutions",
    description:
      "Empowering communities with cutting-edge technology and reliable utility services, Modern Utilities is committed to enhancing everyday life through seamless connectivity and smart innovations.",
  },
  {
    icon: <GiftIcon />,
    title: "Sustainable Practices",
    description:
      "At Modern Utilities, we are committed to eco-friendly solutions that not only enhance your daily life but also contribute to a greener future. By investing in renewable energy sources, we strive to create a cleaner, more sustainable world.",
  },
];

export const HowItWorks = () => {
  return (
    <section
      id="howItWorks"
      className="container text-center py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold ">
        
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          Transforming Utilities{" "}
        </span>
        for a Modern World
      </h2>
      <p className="md:w-3/4 mx-auto mt-4 mb-8 text-xl text-muted-foreground">
      At Modern Utilities, we specialize in innovative solutions that enhance your daily life. Our commitment to sustainability and efficiency sets us apart in the utility sector.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {features.map(({ icon, title, description }: FeatureProps) => (
          <Card
            key={title}
            className="bg-muted/50"
          >
            <CardHeader>
              <CardTitle className="grid gap-4 place-items-center">
                {icon}
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>{description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
