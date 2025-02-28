import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import user1 from '../assets/user1.jpeg'
import user2 from '../assets/user2.jpeg'
import user3 from '../assets/user3.jpeg'
import user4 from '../assets/user4.jpeg'
import user5 from '../assets/user5.jpeg'
import user6 from '../assets/user6.jpeg'
import user7 from '../assets/user7.jpeg'
import user8 from '../assets/user8.jpeg'
import user9 from '../assets/user9.jpeg'

interface TestimonialProps {
  image: string;
  name: string;
  userName: string;
  comment: string;
}

const testimonials: TestimonialProps[] = [
  {
    image: user1,
    name: "Brite Ang3l",
    userName: "customer",
    comment: "Best place in Las Vegas to get Internet phone or cable TV service. I highly recommend speaking with Milan or Tom. Veteran owned and operated small business so I love supporting our soldiers.",
  },
  {
    image: user2,
    name: "preston howard",
    userName: "customer",
    comment:
      "Milan is a great employee and very helpful. He was able to assist me and everything that I needed. Also the lady that also assisted was an amazing service provider. I think you guys so much and I recommend a lot of people go to the service.",
  },

  {
    image: user3,
    name: "Harland Lee",
    userName: "customer",
    comment:
      "These guys are the best in the business, I promise you. They have ALL providers at the same location. Ask for Milan or Thom. They have been in the business since internet was invented. They know so much, it is unreal.",
  },
  {
    image: user4,
    name: "tae wells",
    userName: "customer",
    comment:
      "Milan is the Best he’s the 3Cs and the 3Ts cool, calm, collective and on time, task, and target he gets the job done. I never really experienced GREAT CUSTOMER SERVICE until I met him. I highly recommend.",
  },
  {
    image: user8,
    name: "Scotavo Agostino",
    userName: "customer",
    comment:
      "I lost my internet service due to a thunderstorm. I called Modern Utilities and they were very helpful, especially Milan. I was up and running with a new system in no time. The customer service was excellent. Milan definitely went the extra miles. Thanks for being so helpful.",
  },
  {
    image: user9,
    name: "Marcos Delucas",
    userName: "customer",
    comment:
      "I live in Maryland and needed a solution for internet service for my home and my business. I know this company is based in Las Vegas Nevada but they are licensed in all 50 states. I saw one of his YouTube videos and I was inclined.",
  },
  {
    image: user5,
    name: "Albert Avila",
    userName: "customer",
    comment:
      "Modern Utilities is where you want to bring your business to, nothing but professionalism and dedication coming from Milan. I brought my questions and concerns to him hoping that I receive the service we as consumers deserve.",
  },
  {
    image: user6,
    name: "S C",
    userName: "customer",
    comment:
      "Milan is amazing! He did an excellent job explaining everything with my elderly mother who is not savvy with technology. I would not hesitate to recommend this place to anyone.",
  },
  {
    image: user7,
    name: "Ryn",
    userName: "customer",
    comment:
      "Milan was awesome, I had a situation and he had me taken care of and on my way in a matter of minutes, and the modem I got worked perfectly. I will go through him for now on for all my CenturyLink needs and issues. Thank you so much.",
  },
];

export const Testimonials = () => {
  return (
    <section
      id="testimonials"
      className="container py-24 sm:py-32"
    >
      <h2 className="text-3xl md:text-4xl font-bold">
        Discover Why
        <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
          {" "}
          People Love{" "}
        </span>
        Us
      </h2>

      <p className="text-xl text-muted-foreground pt-4 pb-8">
        Here's the what people say about us
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 sm:block columns-2  lg:columns-3 lg:gap-6 mx-auto space-y-4 lg:space-y-6">
        {testimonials.map(
          ({ image, name, userName, comment }: TestimonialProps) => (
            <Card
              key={userName}
              className="max-w-md md:break-inside-avoid overflow-hidden"
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar>
                  <AvatarImage
                    alt=""
                    src={image}
                  />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <CardTitle className="text-lg">{name}</CardTitle>
                  <CardDescription>{userName}</CardDescription>
                </div>
              </CardHeader>

              <CardContent>{comment}</CardContent>
            </Card>
          )
        )}
      </div>
    </section>
  );
};
