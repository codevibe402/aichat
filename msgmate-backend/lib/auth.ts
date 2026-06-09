
import {prisma} from "./prisma"
import { auth } from "@clerk/nextjs/server";




  

export async function requireUser(req: Request) {
 
const { userId } = await auth();

if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { externalId: userId } });
 

  return user;
}


export async function registerUser(externalId: string) {
  return prisma.user.upsert({
    where: { externalId },
    update: {},
    create: { externalId, settings: { create: {} } }
  });
}
