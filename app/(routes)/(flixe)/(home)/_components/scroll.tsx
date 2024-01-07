"use client";

import { useScroll, useTransform, motion } from "framer-motion";

import { users } from "./users";
import Image from "next/image";

export const ScrollCore = () => {
  const { scrollYProgress } = useScroll();

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="transform scale-[0.8] flex items-center justify-center relative mt-8">
      <div
        className="w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} />
        {/* <Card rotate={rotate} translate={translate} scale={scale} /> */}
      </div>
    </div>
  );
};

export const Header = ({ translate }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-6xl mx-auto text-center"
    >
      <h1 className="text-6xl font-semibold">
        Embark on the{" "}
        <span className="flixe-gradient text-7xl font-black px-1">
          Flixe
        </span>{" "}
        Odyssey <br />{" "}
        <span className="text-6xl font-bold mt-1 leading-none">
          Revolutionizing the Digital Expression
        </span>
      </h1>
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  translate,
}: {
  rotate: any;
  scale: any;
  translate: any;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate, // rotate in X-axis
        scale,
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 p-6 bg-card rounded-[30px] shadow-2xl"
    >
      <div className="bg-background h-full w-full rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 overflow-hidden p-4">
        {users.map((user, idx) => (
          <motion.div
            key={`user-${idx}`}
            className="bg-white rounded-md cursor-pointer relative"
            style={{ translateY: translate }}
            whileHover={{
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
            }}
          >
            <div className="absolute top-2 right-2 rounded-full text-xs font-bold bg-white px-2 py-1">
              {user.badge}
            </div>
            <Image
              src={user.image}
              alt="test"
              className="object-cover"
              width={150}
              height={50}
              layout="responsive"
            />
            <div className="p-4">
              <h1 className="font-semibold text-sm ">{user.name}</h1>
              <h2 className=" text-gray-500 text-xs ">{user.designation}</h2>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
