import { redirect } from "next/navigation";
import { db } from "@/lib/db";

import authOptions from "@/app/api/auth/[...nextauth]";
import { getServerSession } from "next-auth";
import CreateArtistry from "./_components/createArtistry";

interface Session {
  user?: {
    email: string;
  };
}

const CoursesPage = async () => {
  const session: Session | null = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return redirect("/");
  }

  const categories = await db.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  console.log(categories);

  return <CreateArtistry categories={categories} />;
};

export default CoursesPage;
